import { apiRequest, setToken, clearToken, getToken } from './api';

// ---------- Helpers ----------

// Turns the API's separate `user` and `account` objects
// into the single shape the rest of the app expects.
function toAppAccount(user, account) {
  if (!account) return null;

  return {
    id: account.id,
    accountNumber: account.account_number,
    balance: Number(account.balance),
    currency: account.currency,
    status: account.status,
    fullName: user?.name,
    username: user?.phone,
    email: user?.email,
  };
}

// Picks the primary account the same way the backend does:
// the oldest non-closed account.
function pickPrimaryAccount(accounts) {
  return (
    accounts
      .filter(a => a.status !== 'closed')
      .sort((a, b) => a.id - b.id)[0] || null
  );
}

// ---------- Accounts ----------

export async function getAccounts() {
  try {
    const data = await apiRequest('/accounts');

    return {
      success: true,
      accounts: data.accounts || [],
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
      accounts: [],
    };
  }
}

export async function createAccount(
  accountType = 'savings',
  currency = 'USD'
) {
  try {
    const data = await apiRequest('/accounts', {
      method: 'POST',
      body: {
        account_type: accountType,
        currency,
      },
    });

    return {
      success: true,
      message: data.message || 'Account created successfully.',
      account: data.account,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Session ----------

export async function seedDemoData() {
  // Demo data now lives in Laravel database.
}

export async function restoreSession() {
  const token = await getToken();

  if (!token) return null;

  try {
    const meData = await apiRequest('/auth/me');
    const accountsData = await apiRequest('/accounts');

    const primary = pickPrimaryAccount(
      accountsData.accounts || []
    );

    return toAppAccount(meData.user, primary);
  } catch (e) {
    await clearToken();
    return null;
  }
}

export async function login(name, password) {
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        name,
        password,
      },
    });

    await setToken(data.token);

    const accountsData = await apiRequest('/accounts');

    const primary = pickPrimaryAccount(
      accountsData.accounts || []
    );

    return {
      success: true,
      account: toAppAccount(data.user, primary),
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
      accountStatus: e.accountStatus,
    };
  }
}

export async function register(
  name,
  email,
  phone,
  password
) {
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name,
        email,
        phone,
        password,
        password_confirmation: password,
      },
    });

    await setToken(data.token);

    const accountsData = await apiRequest('/accounts');

    const primary = pickPrimaryAccount(
      accountsData.accounts || []
    );

    return {
      success: true,
      account: toAppAccount(data.user, primary),
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (e) {
    // Ignore logout API errors.
  }

  await clearToken();
}

export async function updatePassword(
  currentPassword,
  newPassword
) {
  try {
    await apiRequest('/auth/update-password', {
      method: 'POST',
      body: {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Cards ----------

export async function createCard(
  account,
  cardName = 'Additional Card',
  dailyLimit = 1000
) {
  if (!account?.id) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  try {
    const data = await apiRequest('/cards', {
      method: 'POST',
      body: {
        account_id: account.id,
        card_name: cardName,
        cardholder_name:
          account.fullName || account.username,
        daily_limit: dailyLimit,
        currency: account.currency || 'USD',
      },
    });

    return {
      success: true,
      message:
        data.message || 'Card added successfully.',
      card: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getCards() {
  try {
    const data = await apiRequest('/cards');

    return {
      success: true,
      cards: data.data || [],
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
      cards: [],
    };
  }
}

export async function updateCardLimit(
  cardId,
  dailyLimit
) {
  try {
    const data = await apiRequest(
      `/cards/${cardId}`,
      {
        method: 'PUT',
        body: {
          daily_limit: dailyLimit,
        },
      }
    );

    return {
      success: true,
      message:
        data.message || 'Spending limit updated.',
      card: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function updateCardStatus(
  cardId,
  status
) {
  try {
    const data = await apiRequest(
      `/cards/${cardId}/status`,
      {
        method: 'PATCH',
        body: {
          status,
        },
      }
    );

    return {
      success: true,
      message:
        data.message || 'Card status updated.',
      card: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function deleteCard(cardId) {
  try {
    const data = await apiRequest(
      `/cards/${cardId}`,
      {
        method: 'DELETE',
      }
    );

    return {
      success: true,
      message:
        data.message || 'Card deleted successfully.',
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Notifications ----------

export async function getNotifications() {
  try {
    const data = await apiRequest(
      '/notifications?limit=50'
    );

    return {
      success: true,
      notifications: data.data || [],
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
      notifications: [],
    };
  }
}

export async function markNotificationsRead() {
  try {
    const data = await apiRequest(
      '/notifications/mark-all-read',
      {
        method: 'POST',
      }
    );

    return {
      success: true,
      message: data.message,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function markNotificationRead(
  notificationId
) {
  try {
    const data = await apiRequest(
      `/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
      }
    );

    return {
      success: true,
      notification: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Transaction Details ----------

export async function getTransactionDetailByReference(
  reference
) {
  try {
    const data = await apiRequest(
      `/transactions/reference/${encodeURIComponent(
        reference
      )}`
    );

    return {
      success: true,
      transaction: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getTransactionDetail(
  transactionId
) {
  try {
    const data = await apiRequest(
      `/transactions/${transactionId}`
    );

    return {
      success: true,
      transaction: data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Account ----------

export async function closeAccount(accountId) {
  if (!accountId) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  try {
    const data = await apiRequest(
      `/accounts/${accountId}/close`,
      {
        method: 'POST',
      }
    );

    return {
      success: true,
      message:
        data.message || 'Account closed successfully.',
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Bill / Service Payments ----------

export async function payService(
  account,
  service,
  reference,
  amount
) {
  if (!account?.id) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    return {
      success: false,
      message: 'Amount must be greater than zero.',
    };
  }

  try {
    const data = await apiRequest('/payments', {
      method: 'POST',
      body: {
        account_id: account.id,
        service,
        reference: String(reference || '').trim(),
        amount: numericAmount,
      },
    });

    return {
      success: true,
      message:
        data.message || 'Payment successful.',
      account: {
        ...account,
        balance: Number(data.new_balance),
      },
      transaction:
        data.transaction || data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function mobileTopUp(
  account,
  provider,
  phoneNumber,
  amount
) {
  if (!account?.id) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    return {
      success: false,
      message: 'Amount must be greater than zero.',
    };
  }

  try {
    const data = await apiRequest('/payments', {
      method: 'POST',
      body: {
        account_id: account.id,
        service: 'Mobile Top Up',
        provider,
        reference: String(phoneNumber || '').trim(),
        amount: numericAmount,
      },
    });

    return {
      success: true,
      message:
        data.message || 'Mobile top up successful.',
      account: {
        ...account,
        balance: Number(data.new_balance),
      },
      transaction:
        data.transaction || data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Transactions ----------

export async function getTransactions(accountId) {
  if (!accountId) return [];

  try {
    const data = await apiRequest(
      `/accounts/${accountId}/transactions`
    );

    const list =
      data.transactions ||
      data.data ||
      [];

    return list.map(t => ({
      id: String(t.id),

      type:
        t.type === 'transfer'
          ? (
              t.metadata?.from_account
                ? 'TRANSFER_IN'
                : 'TRANSFER'
            )
          : String(
              t.type || ''
            ).toUpperCase(),

      amount: Number(t.amount),
      note: t.description,
      timestamp: t.created_at,

      balanceAfter:
        t.balance_after != null
          ? Number(t.balance_after)
          : null,
    }));
  } catch (e) {
    console.log(
      'Failed to load account transactions:',
      e.message
    );

    return [];
  }
}

// ---------- Deposit ----------

export async function deposit(
  account,
  amount,
  note
) {
  if (!account?.id) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      message: 'Amount must be greater than zero.',
    };
  }

  try {
    const data = await apiRequest(
      `/accounts/${account.id}/transactions/deposit`,
      {
        method: 'POST',
        body: {
          amount,
          description: note,
        },
      }
    );

    return {
      success: true,
      message: `Deposited $${amount.toFixed(2)}.`,
      account: {
        ...account,
        balance: Number(data.new_balance),
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Withdraw ----------

export async function withdraw(
  account,
  amount,
  note
) {
  if (!account?.id) {
    return {
      success: false,
      message: 'No account found.',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      message: 'Amount must be greater than zero.',
    };
  }

  try {
    const data = await apiRequest(
      `/accounts/${account.id}/transactions/withdraw`,
      {
        method: 'POST',
        body: {
          amount,
          description: note,
        },
      }
    );

    return {
      success: true,
      message: `Withdrew $${amount.toFixed(2)}.`,
      account: {
        ...account,
        balance: Number(data.new_balance),
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}

// ---------- Transfer ----------

export async function transfer(
  account,
  toAccountNumber,
  amount,
  note,
  sourceAccountId = null,
  cardId = null
) {
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    return {
      success: false,
      message: 'Amount must be greater than zero.',
    };
  }

  // A transfer must use an active card.
  if (!cardId) {
    return {
      success: false,
      message: 'Please select an active card.',
    };
  }

  if (!toAccountNumber) {
    return {
      success: false,
      message: 'Please enter a recipient account number.',
    };
  }

  try {
    const data = await apiRequest('/transfers', {
      method: 'POST',

      body: {
        account_id:
          sourceAccountId || account?.id,

        // IMPORTANT:
        // This is what connects the transfer
        // to the selected card's daily limit.
        card_id: cardId,

        to_account: toAccountNumber,
        amount: numericAmount,

        currency:
          account?.currency || 'USD',

        description: note,
      },
    });

    const recipientName =
      data.data?.recipient_name;

    return {
      success: true,

      message:
        data.message ||
        `Transferred $${numericAmount.toFixed(
          2
        )} to ${
          recipientName ||
          toAccountNumber
        }.`,

      account: {
        ...account,
        balance: Number(
          data.data.new_balance
        ),
      },

      transaction:
        data.data?.transaction ||
        data.transaction ||
        data.data,
    };
  } catch (e) {
    return {
      success: false,
      message: e.message,
    };
  }
}