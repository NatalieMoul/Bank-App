import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Bank from '../services/BankService';
import { apiRequest, setAccountStatusHandler, setMaintenanceHandler, setDeletedAccountHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forcedStatus, setForcedStatus] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  // Prevents the background poll (every 3s) from re-opening the popup the
  // moment it's dismissed. It's allowed to notify once per "maintenance
  // turns on" event; it resets once maintenance turns back off.
  const maintenancePolledRef = useRef(false);

useEffect(() => {
  setAccountStatusHandler((status) => {
    setForcedStatus(status);
    setAccount(null);
    setAccounts([]);
    setTransactions([]);
  });

  setMaintenanceHandler((message) => {
    setMaintenanceMessage(
      message ||
      'The app is currently under maintenance. Some services are temporarily unavailable.'
    );
  });

  setDeletedAccountHandler(() => {
    setForcedStatus('deleted');
    setAccount(null);
    setAccounts([]);
    setTransactions([]);
    setMaintenanceMessage('');
  });

  return () => {
    setAccountStatusHandler(null);
    setMaintenanceHandler(null);
    setDeletedAccountHandler(null);
  };
}, []);

  useEffect(() => {
    if (!account) return undefined;

    const statusCheck = setInterval(async () => {
      try {
        const result = await apiRequest('/auth/me');
        if (result?.maintenance_mode) {
          if (!maintenancePolledRef.current) {
            maintenancePolledRef.current = true;
            setMaintenanceMessage((current) => current || 'The app is currently under maintenance. Some services are temporarily unavailable.');
          }
        } else {
          // Maintenance is off again — allow the next time it turns on to notify once more.
          maintenancePolledRef.current = false;
        }
      } catch (error) {
        // Account-status failures are handled by the API status handler above.
        // Network failures should not log the user out automatically.
      }
    }, 3000);

    return () => clearInterval(statusCheck);
  }, [account]);

  const refreshTransactions = useCallback(async (acc) => {
    if (!acc) {
      setTransactions([]);
      return;
    }
    const txns = await Bank.getTransactions(acc.id);
    setTransactions(txns);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Bank.seedDemoData();
        const restored = await Bank.restoreSession();
        setAccount(restored);
        await refreshTransactions(restored);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshTransactions]);

  const login = async (email, password) => {
    const result = await Bank.login(email, password);
    if (result.success) {
      setForcedStatus('');
      setMaintenanceMessage('');
      maintenancePolledRef.current = false;
      setAccount(result.account);
      await refreshTransactions(result.account);
    }
    return result;
  };

  const register = async (name, email, phone, password) => {
    const result = await Bank.register(name, email, phone, password);
    if (result.success) {
      setAccount(result.account);
      await refreshTransactions(result.account);
    }
    return result;
  };

  const logout = async () => {
    await Bank.logout();
    setAccount(null);
    setTransactions([]);
    setForcedStatus('');
    setMaintenanceMessage('');
    maintenancePolledRef.current = false;
  };

const createAccount = async (accountType = 'savings', currency = 'USD') => {
  const result = await Bank.createAccount(accountType, currency);

  if (result.success) {
    const accountList = await Bank.getAccounts();
    setAccounts(
      (accountList.accounts || []).filter(
        item => item.status !== 'closed'
      )
    );
  }

  return result;
};

const closeAccount = async accountId => {
  const result = await Bank.closeAccount(accountId);

  if (result.success) {
    const accountList = await Bank.getAccounts();

    const activeAccounts = (accountList.accounts || []).filter(
      item => item.status !== 'closed'
    );

    setAccounts(activeAccounts);

    if (String(account?.id) === String(accountId)) {
      const next = activeAccounts[0] || null;

      if (next) {
        setAccount({
          id: next.id,
          accountNumber: next.account_number,
          balance: Number(next.balance),
          currency: next.currency,
          status: next.status,
          fullName: account?.fullName,
          username: account?.username,
          email: account?.email,
        });

        await refreshTransactions({
          id: next.id,
        });
      } else {
        setAccount(null);
        setTransactions([]);
      }
    }
  }

  return result;
};
  
  const deposit = async (amount, note) => {
    const result = await Bank.deposit(account, amount, note);
    if (result.success) {
      setAccount(result.account);
      await refreshTransactions(result.account);
    }
    return result;
  };

  const withdraw = async (amount, note) => {
    const result = await Bank.withdraw(account, amount, note);
    if (result.success) {
      setAccount(result.account);
      await refreshTransactions(result.account);
    }
    return result;
  };
const transfer = async (
  toAccountNumber,
  amount,
  note,
  sourceAccount,
  cardId
) => {
  const source = sourceAccount || account;

  const result = await Bank.transfer(
    source,
    toAccountNumber,
    amount,
    note,
    source?.id,
    cardId
  );

  if (result.success) {
    setAccount(result.account);

    const accountList = await Bank.getAccounts();
    setAccounts(accountList.accounts || []);

    await refreshTransactions(result.account);
  }

  return result;
};

  const payment = async (service, reference, amount) => {
  const result = await Bank.payService(
    account,
    service,
    reference,
    amount
  );

  if (result.success) {
    setAccount(result.account);

    const accountList = await Bank.getAccounts();
    setAccounts(accountList.accounts || []);

    await refreshTransactions(result.account);
  }

  return result;
};

  const updatePassword = async (currentPassword, newPassword) => {
    return Bank.updatePassword(currentPassword, newPassword);
  };

  const createCard = async () => {
    return Bank.createCard(account);
  };

  const updateCardStatus = async (cardId, status) => {
    return Bank.updateCardStatus(cardId, status);
  };

  const updateCardLimit = async (cardId, dailyLimit) => {
    return Bank.updateCardLimit(cardId, dailyLimit);
  };

  const deleteCard = async cardId => {
    return Bank.deleteCard(cardId);
  };

  return (
    <AuthContext.Provider
      value={{
        account,
        accounts,
        transactions,
        loading,
        forcedStatus,
        setForcedStatus,
        maintenanceMessage,
        setMaintenanceMessage,
        refreshTransactions,
        login,
        register,
        logout,
        deposit,
        withdraw,
        transfer,
        payment,
        updatePassword,
        createCard,
        updateCardStatus,
        updateCardLimit,
        deleteCard,
        createAccount,
        closeAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
