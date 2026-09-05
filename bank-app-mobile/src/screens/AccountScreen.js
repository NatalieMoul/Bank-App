import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';

export default function AccountScreen({ navigation }) {
  const {
    account,
    accounts: contextAccounts,
    createAccount,
    closeAccount
  } = useAuth();

  const [accounts, setAccounts] = useState(contextAccounts || []);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [menuAccount, setMenuAccount] = useState(null);

  // First close-account popup
  const [closeAccountModal, setCloseAccountModal] = useState(null);

  // Second popup when account still has money
  const [moneyAccountModal, setMoneyAccountModal] = useState(null);

  const [closingAccount, setClosingAccount] = useState(false);

  useEffect(() => {
    setAccounts(contextAccounts || []);
  }, [contextAccounts]);

  useEffect(() => {
    Bank.getAccounts().then(result => {
      if (result.success) {
        setAccounts(result.accounts);
      }
    });
  }, []);

  if (!account && !accounts.length) {
    return null;
  }

  const displayAccounts = accounts.length
    ? accounts
    : [account].filter(Boolean).map(a => ({
        id: a.id,
        account_number: a.accountNumber,
        balance: a.balance,
        currency: a.currency,
        status: a.status
      }));

  // Open the first custom popup for EVERY account
  const handleClose = selected => {
    setMenuAccount(null);
    setCloseAccountModal(selected);
  };

  // Confirm closing the account
  const confirmCloseAccount = async () => {
    if (!closeAccountModal || closingAccount) {
      return;
    }

    const balance = Number(closeAccountModal.balance || 0);

    // If account still has money, show the second custom popup
    if (balance !== 0) {
      const selectedAccount = closeAccountModal;

      setCloseAccountModal(null);
      setMoneyAccountModal(selectedAccount);

      return;
    }

    // Account has $0, so continue with closing
    setClosingAccount(true);

    try {
      const result = await closeAccount(closeAccountModal.id);

      if (!result.success) {
        setCloseAccountModal(null);
        setClosingAccount(false);

        Alert.alert(
          'Unable to close account',
          result.message || 'Please try again.'
        );

        return;
      }

      setAccounts(current =>
        current.filter(
          item =>
            String(item.id) !== String(closeAccountModal.id)
        )
      );

      setCloseAccountModal(null);
      setClosingAccount(false);

      Alert.alert(
        'Account closed',
        'The account has been closed successfully.'
      );
    } catch (error) {
      setCloseAccountModal(null);
      setClosingAccount(false);

      Alert.alert(
        'Unable to close account',
        error?.message || 'Please try again.'
      );
    }
  };

  const addAnother = () => {
    setAddOpen(true);
  };

  const createNew = async type => {
    setLoading(true);

    const result = await createAccount(type, 'USD');

    setLoading(false);
    setAddOpen(false);

    if (!result.success) {
      Alert.alert(
        'Unable to add account',
        result.message
      );
    } else {
      Alert.alert(
        'Account added',
        'Your new account has been created successfully.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#1a1a2e"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Account
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {/* ACCOUNT LIST */}
      <ScrollView
        contentContainerStyle={styles.body}
      >
        <Text style={styles.name}>
          {account?.fullName || account?.username}
        </Text>

        {displayAccounts.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate(
                'TransactionReport',
                {
                  account: {
                    ...item,
                    accountNumber: item.account_number,
                    balance: Number(item.balance || 0)
                  }
                }
              )
            }
            activeOpacity={0.8}
          >

            {/* TOP ROW */}
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>
                Account {index + 1}
              </Text>

              <View style={styles.cardTopRight}>
                <Text style={styles.cardNumber}>
                  {item.account_number}
                </Text>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={event => {
                    event.stopPropagation();
                    setMenuAccount(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#6F6B91"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* BALANCE ROW */}
            <View style={styles.cardRow}>
              <Text style={styles.cardSubLabel}>
                Available balance
              </Text>

              <Text style={styles.cardBalance}>
                ${Number(item.balance || 0).toFixed(2)}
              </Text>
            </View>

          </TouchableOpacity>
        ))}

        {/* ADD ACCOUNT */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addAnother}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={21}
            color={PURPLE}
          />

          <Text style={styles.addText}>
            Add another account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===================================================== */}
      {/* ACCOUNT OPTIONS MENU */}
      {/* ===================================================== */}

      <Modal
        visible={!!menuAccount}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMenuAccount(null)
        }
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuAccount(null)}
        >
          <View style={styles.menuCard}>

            <Text style={styles.menuTitle}>
              Account options
            </Text>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() =>
                handleClose(menuAccount)
              }
            >
              <Ionicons
                name="close-circle-outline"
                size={21}
                color="#D33A3A"
              />

              <Text style={styles.closeOptionText}>
                Close account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() =>
                setMenuAccount(null)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================================================== */}
      {/* FIRST CLOSE ACCOUNT POPUP */}
      {/* ===================================================== */}

      <Modal
        visible={!!closeAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!closingAccount) {
            setCloseAccountModal(null);
          }
        }}
      >
        <View style={styles.closeModalOverlay}>

          <View style={styles.closeModalCard}>

            <Text style={styles.closeModalTitle}>
              Close account?
            </Text>

            <Text style={styles.closeModalText}>
              Are you sure you want to close this account?
            </Text>

            <View style={styles.closeModalButtons}>

              {/* CANCEL */}
              <TouchableOpacity
                style={styles.closeCancelButton}
                disabled={closingAccount}
                onPress={() =>
                  setCloseAccountModal(null)
                }
              >
                <Text style={styles.closeCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* CLOSE ACCOUNT */}
              <TouchableOpacity
                style={[
                  styles.closeConfirmButton,
                  closingAccount && {
                    opacity: 0.6
                  }
                ]}
                disabled={closingAccount}
                onPress={confirmCloseAccount}
              >
                <Text style={styles.closeConfirmText}>
                  {closingAccount
                    ? 'Closing...'
                    : 'Close Account'}
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>
      </Modal>

      {/* ===================================================== */}
      {/* SECOND POPUP - ACCOUNT STILL HAS MONEY */}
      {/* ===================================================== */}

      <Modal
        visible={!!moneyAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMoneyAccountModal(null)
        }
      >
        <View style={styles.closeModalOverlay}>

          <View style={styles.closeModalCard}>

            <Text style={styles.closeModalTitle}>
              Cannot close account
            </Text>

            <Text style={styles.closeModalText}>
              This account still has money in it. Please
              withdraw or transfer the remaining balance
              before closing the account.
            </Text>

            <View style={styles.closeModalButtons}>

              {/* CANCEL */}
              <TouchableOpacity
                style={styles.closeCancelButton}
                onPress={() =>
                  setMoneyAccountModal(null)
                }
              >
                <Text style={styles.closeCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* OK */}
              <TouchableOpacity
                style={styles.closeConfirmButton}
                onPress={() =>
                  setMoneyAccountModal(null)
                }
              >
                <Text style={styles.closeConfirmText}>
                  OK
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>
      </Modal>

      {/* ===================================================== */}
      {/* ADD ACCOUNT POPUP */}
      {/* ===================================================== */}

      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setAddOpen(false)
        }
      >
        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>
              Add another account?
            </Text>

            <Text style={styles.modalText}>
              Choose the type of account you want to create.
            </Text>

            <TouchableOpacity
              style={styles.typeButton}
              disabled={loading}
              onPress={() =>
                createNew('savings')
              }
            >
              <Text style={styles.typeText}>
                Savings account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              disabled={loading}
              onPress={() =>
                createNew('checking')
              }
            >
              <Text style={styles.typeText}>
                Checking account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                setAddOpen(false)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: 'white'
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e'
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40
  },

  name: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: PURPLE,
    marginBottom: 32
  },

  card: {
    backgroundColor: '#F7F7FB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },

  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e'
  },

  cardNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e'
  },

  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: 20
  },

  menuCard: {
    width: 210,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 9
  },

  closeOptionText: {
    color: '#D33A3A',
    fontWeight: '700'
  },

  menuCancel: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },

  cardSubLabel: {
    fontSize: 13,
    color: '#9B98C4',
    marginTop: 2
  },

  cardBalance: {
    fontSize: 14,
    fontWeight: '700',
    color: PURPLE,
    marginTop: 2
  },

  addButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DEDCEC',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },

  addText: {
    color: PURPLE,
    fontWeight: '700',
    fontSize: 14
  },

  /* ===================================================== */
  /* CLOSE ACCOUNT POPUPS */
  /* ===================================================== */

  closeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },

  closeModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20
  },

  closeModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8
  },

  closeModalText: {
    fontSize: 13,
    color: '#9B98C4',
    lineHeight: 20,
    marginBottom: 20
  },

  closeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10
  },

  closeCancelButton: {
    borderWidth: 2,
    borderColor: '#1A1A2E',
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 15,
    minWidth: 68,
    alignItems: 'center'
  },

  closeCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D89AE'
  },

  closeConfirmButton: {
    backgroundColor: '#F34F70',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 76,
    alignItems: 'center'
  },

  closeConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white'
  },

  /* ===================================================== */
  /* ADD ACCOUNT POPUP */
  /* ===================================================== */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24
  },

  modalCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 22
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8
  },

  modalText: {
    color: '#6F6B91',
    marginBottom: 18
  },

  typeButton: {
    backgroundColor: '#F1F0FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center'
  },

  typeText: {
    color: PURPLE,
    fontWeight: '700'
  },

  cancelButton: {
    padding: 14,
    alignItems: 'center'
  },

  cancelText: {
    color: '#666',
    fontWeight: '600'
  }

});