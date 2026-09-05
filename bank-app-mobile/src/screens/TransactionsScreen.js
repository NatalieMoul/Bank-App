import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';
const GRAY_TEXT = '#9B98C4';
const DISABLED_BG = '#E9E8F3';
const DISABLED_TEXT = '#B4B2CC';

const TRANSFER_CATEGORIES = [
  {
    key: 'other',
    label: 'Transfer to\nother account',
    icon: 'card',
  },
  {
    key: 'same_bank',
    label: 'Transfer to\nthe same bank',
    icon: 'person',
  },
  {
    key: 'other_bank',
    label: 'Transfer to\nanother bank',
    icon: 'business',
  },
];

export default function TransactionsScreen({
  navigation,
  route,
}) {
  const {
    account,
    accounts: contextAccounts,
    transfer,
  } = useAuth();

  // --------------------------------------------------
  // ACCOUNTS
  // --------------------------------------------------

  const [accounts, setAccounts] = useState(
    contextAccounts || []
  );

  const [selectedAccount, setSelectedAccount] =
    useState(account);

  const [accountOpen, setAccountOpen] =
    useState(false);

  // --------------------------------------------------
  // CARDS
  // --------------------------------------------------

  const [cards, setCards] = useState([]);

  // This is ONLY the Primary Card belonging
  // to the currently selected account.
  const [primaryCard, setPrimaryCard] =
    useState(null);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const [transferCategory, setTransferCategory] =
    useState('other');

  const [recipientName, setRecipientName] =
    useState('');

  const [toAccountNumber, setToAccountNumber] =
    useState('');

  const [transferAmount, setTransferAmount] =
    useState('');

  const [content, setContent] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [success, setSuccess] =
    useState(null);

  // --------------------------------------------------
  // Keep accounts from AuthContext updated
  // --------------------------------------------------

  useEffect(() => {
    if (contextAccounts) {
      setAccounts(contextAccounts);
    }
  }, [contextAccounts]);

  // --------------------------------------------------
  // Keep selected account synchronized
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedAccount && account) {
      setSelectedAccount(account);
    }
  }, [
    account,
    selectedAccount,
  ]);

  // --------------------------------------------------
  // Load accounts
  // --------------------------------------------------

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const result =
        await Bank.getAccounts();

      if (result.success) {
        const activeAccounts =
          (result.accounts || []).filter(
            item =>
              item.status !== 'closed'
          );

        setAccounts(activeAccounts);

        // Keep current selected account
        if (
          selectedAccount
        ) {
          const updatedSelected =
            activeAccounts.find(
              item =>
                Number(item.id) ===
                Number(selectedAccount.id)
            );

          if (updatedSelected) {
            setSelectedAccount({
              ...updatedSelected,
              accountNumber:
                updatedSelected.account_number,
              balance:
                Number(
                  updatedSelected.balance
                ),
            });
          }
        }

        // If nothing selected, use first account
        if (
          !selectedAccount &&
          activeAccounts.length > 0
        ) {
          const firstAccount =
            activeAccounts[0];

          setSelectedAccount({
            ...firstAccount,
            accountNumber:
              firstAccount.account_number,
            balance:
              Number(firstAccount.balance),
          });
        }
      }
    } catch (error) {
      console.log(
        'Failed to load accounts:',
        error
      );
    }
  };

  // --------------------------------------------------
  // Load cards
  // --------------------------------------------------

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const result =
        await Bank.getCards();

      if (result.success) {
        const activeCards =
          (result.cards || []).filter(
            card =>
              card.status === 'active'
          );

        setCards(activeCards);
      }
    } catch (error) {
      console.log(
        'Failed to load cards:',
        error
      );
    }
  };

  // --------------------------------------------------
  // IMPORTANT CARD LOGIC
  //
  // Find ONLY the Primary Card belonging
  // to the selected account.
  //
  // Additional Cards are completely ignored.
  // --------------------------------------------------

  useEffect(() => {
    if (
      !selectedAccount ||
      cards.length === 0
    ) {
      setPrimaryCard(null);
      return;
    }

    const accountPrimaryCard =
      cards.find(card => {
        const cardAccountId =
          card.account_id ||
          card.account?.id;

        return (
          Number(cardAccountId) ===
            Number(selectedAccount.id) &&
          card.card_name ===
            'Primary Card' &&
          card.status === 'active'
        );
      });

    setPrimaryCard(
      accountPrimaryCard || null
    );
  }, [
    selectedAccount,
    cards,
  ]);

  // --------------------------------------------------
  // QR scanner
  // --------------------------------------------------

  useEffect(() => {
    if (
      route?.params?.scannedAccountNumber
    ) {
      setToAccountNumber(
        route.params.scannedAccountNumber
      );
    }

    if (
      route?.params?.scannedName
    ) {
      setRecipientName(
        route.params.scannedName
      );
    }
  }, [
    route?.params?.scannedAccountNumber,
    route?.params?.scannedName,
  ]);

  // --------------------------------------------------
  // Can submit?
  // --------------------------------------------------

  const transferCanSubmit =
    toAccountNumber.trim().length > 0 &&
    parseFloat(transferAmount) > 0 &&
    !!selectedAccount &&
    !!primaryCard;

  // --------------------------------------------------
  // Submit transfer
  // --------------------------------------------------

  const submitTransfer = async () => {
    const numAmount =
      parseFloat(transferAmount);

    if (!toAccountNumber.trim()) {
      setMessage(
        'Enter a recipient account number.'
      );
      setSuccess(false);
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setMessage(
        'Enter a valid amount.'
      );
      setSuccess(false);
      return;
    }

    if (!selectedAccount) {
      setMessage(
        'Please select an account.'
      );
      setSuccess(false);
      return;
    }

    // Make sure the selected account has
    // its own Primary Card.
    if (!primaryCard) {
      setMessage(
        'This account does not have an active Primary Card.'
      );
      setSuccess(false);
      return;
    }

    setMessage('');
    setSuccess(null);

    try {
      console.log(
        'TRANSFER ACCOUNT:',
        selectedAccount.id
      );

      console.log(
        'TRANSFER PRIMARY CARD:',
        primaryCard.id
      );

      console.log(
        'TRANSFER PRIMARY CARD LIMIT:',
        primaryCard.daily_limit
      );

      const result =
        await transfer(
          toAccountNumber.trim(),
          numAmount,
          content || undefined,
          selectedAccount,
          primaryCard.id
        );

      setMessage(
        result.message ||
        'Transfer completed.'
      );

      setSuccess(result.success);

      if (result.success) {
        setRecipientName('');
        setToAccountNumber('');
        setTransferAmount('');
        setContent('');

        // Refresh account balances
        await loadAccounts();
        await loadCards();
      }
    } catch (error) {
      setMessage(
        error?.message ||
        'Transfer failed.'
      );

      setSuccess(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.page
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#1a1a2e"
            />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            Transfer
          </Text>

          <View
            style={{ width: 24 }}
          />
        </View>

        {/* =========================================
            ACCOUNT SELECTOR
            ========================================= */}

        <TouchableOpacity
          style={styles.cardSelector}
          onPress={() =>
            setAccountOpen(
              !accountOpen
            )
          }
          activeOpacity={0.8}
        >
          <View
            style={{ flex: 1 }}
          >

            <Text
              style={
                styles.cardSelectorText
              }
            >
              {selectedAccount
                ? `${
                    selectedAccount.account_type
                      ? selectedAccount
                          .account_type
                          .charAt(0)
                          .toUpperCase() +
                        selectedAccount
                          .account_type
                          .slice(1)
                      : 'Account'
                  } •••• ${String(
                    selectedAccount.accountNumber ||
                    selectedAccount.account_number ||
                    ''
                  ).slice(-4)}`
                : 'Choose account'}
            </Text>

            {selectedAccount && (
              <>
                <Text
                  style={
                    styles.smallSelectorText
                  }
                >
                  {selectedAccount.account_type
                    ? selectedAccount
                        .account_type
                        .charAt(0)
                        .toUpperCase() +
                      selectedAccount
                        .account_type
                        .slice(1) +
                      ' Account'
                    : 'Bank Account'}
                </Text>

                <Text
                  style={
                    styles.balanceText
                  }
                >
                  Balance: $
                  {Number(
                    selectedAccount.balance ||
                    0
                  ).toFixed(2)}
                </Text>
              </>
            )}

          </View>

          <Ionicons
            name={
              accountOpen
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={18}
            color={GRAY_TEXT}
          />
        </TouchableOpacity>

        {/* =========================================
            ACCOUNT OPTIONS
            ========================================= */}

        {accountOpen &&
          (accounts || [])
            .filter(
              item =>
                item.status !==
                'closed'
            )
            .map(
              (item, index) => {

                const normalized = {
                  ...item,
                  accountNumber:
                    item.account_number ||
                    item.accountNumber,
                  balance:
                    Number(
                      item.balance || 0
                    ),
                };

                const accountType =
                  normalized.account_type
                    ? normalized
                        .account_type
                        .charAt(0)
                        .toUpperCase() +
                      normalized
                        .account_type
                        .slice(1)
                    : `Account ${
                        index + 1
                      }`;

                return (
                  <TouchableOpacity
                    key={
                      normalized.id
                    }
                    style={
                      styles.accountOption
                    }
                    onPress={() => {

                      setSelectedAccount(
                        normalized
                      );

                      setAccountOpen(
                        false
                      );

                      setMessage('');
                      setSuccess(null);
                    }}
                  >

                    <View>

                      <Text
                        style={
                          styles.accountOptionTitle
                        }
                      >
                        {accountType}{' '}
                        Account
                      </Text>

                      <Text
                        style={
                          styles.accountOptionNumber
                        }
                      >
                        ••••{' '}
                        {String(
                          normalized.accountNumber ||
                          ''
                        ).slice(-4)}
                      </Text>

                    </View>

                    <Text
                      style={
                        styles.accountOptionBalance
                      }
                    >
                      Balance $
                      {Number(
                        normalized.balance ||
                        0
                      ).toFixed(2)}
                    </Text>

                  </TouchableOpacity>
                );
              }
            )}

        {/* =========================================
            PAYMENT CARD INFORMATION
            ========================================= */}

        {selectedAccount && (
          <View
            style={
              styles.primaryCardBox
            }
          >

            <View
              style={
                styles.primaryCardHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.primaryCardTitle
                  }
                >
                  Payment Card
                </Text>

                <Text
                  style={
                    styles.primaryCardName
                  }
                >
                  {primaryCard
                    ? primaryCard.card_name
                    : 'No Primary Card'}
                </Text>
              </View>

              <Ionicons
                name="card-outline"
                size={25}
                color={PURPLE}
              />
            </View>

            {primaryCard ? (
              <>
                <Text
                  style={
                    styles.primaryCardNumber
                  }
                >
                  ••••{' '}
                  {String(
                    primaryCard.card_number ||
                    primaryCard.last_four ||
                    ''
                  ).slice(-4)}
                </Text>

                <View
                  style={
                    styles.primaryCardInfo
                  }
                >

                  <View>
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Account Balance
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      $
                      {Number(
                        selectedAccount.balance ||
                        0
                      ).toFixed(2)}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Daily Limit
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      $
                      {Number(
                        primaryCard.daily_limit ||
                        0
                      ).toFixed(2)}
                    </Text>
                  </View>

                </View>

                <Text
                  style={
                    styles.primaryCardNote
                  }
                >
                  Your Primary Card controls
                  the daily spending limit.
                  Additional cards are not
                  used for this transfer.
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.noCardText
                }
              >
                This account does not have
                an active Primary Card.
              </Text>
            )}

          </View>
        )}

        {/* =========================================
            TRANSACTION TYPE
            ========================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Choose transaction
        </Text>

        <View
          style={styles.categoryRow}
        >
          {TRANSFER_CATEGORIES.map(
            cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryTile,
                  transferCategory ===
                    cat.key &&
                    styles.categoryTileActive,
                ]}
                onPress={() =>
                  setTransferCategory(
                    cat.key
                  )
                }
              >

                <Ionicons
                  name={cat.icon}
                  size={22}
                  color={
                    transferCategory ===
                    cat.key
                      ? 'white'
                      : '#9B98C4'
                  }
                />

                <Text
                  style={[
                    styles.categoryLabel,
                    transferCategory ===
                      cat.key &&
                      styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>

              </TouchableOpacity>
            )
          )}
        </View>

        {/* =========================================
            FORM
            ========================================= */}

        <View style={styles.form}>

          <TextInput
            style={styles.formInput}
            value={recipientName}
            onChangeText={
              setRecipientName
            }
            placeholder="Name"
            placeholderTextColor={
              GRAY_TEXT
            }
          />

          <TextInput
            style={styles.formInput}
            value={toAccountNumber}
            onChangeText={
              setToAccountNumber
            }
            placeholder="Account number"
            placeholderTextColor={
              GRAY_TEXT
            }
            autoCapitalize="none"
          />

          <TextInput
            style={styles.formInput}
            value={transferAmount}
            onChangeText={
              setTransferAmount
            }
            placeholder="Amount"
            placeholderTextColor={
              GRAY_TEXT
            }
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.formInput}
            value={content}
            onChangeText={setContent}
            placeholder="Content"
            placeholderTextColor={
              GRAY_TEXT
            }
          />

          {/* CONFIRM */}

          <TouchableOpacity
            style={[
              styles.submitButton,
              !transferCanSubmit &&
                styles.submitButtonDisabled,
            ]}
            onPress={
              submitTransfer
            }
            disabled={
              !transferCanSubmit
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.submitText,
                !transferCanSubmit &&
                  styles.submitTextDisabled,
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>

        </View>

        {/* =========================================
            MESSAGE
            ========================================= */}

        {!!message && (
          <Text
            style={[
              styles.feedback,
              success
                ? styles.success
                : styles.error,
            ]}
          >
            {message}
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  page: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  // -----------------------------------------------
  // ACCOUNT SELECTOR
  // -----------------------------------------------

  cardSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0DEF0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },

  cardSelectorText: {
    fontSize: 16,
    color: '#2C2C3A',
    fontWeight: '700',
  },

  smallSelectorText: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 5,
  },

  balanceText: {
    color: PURPLE,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 7,
  },

  // -----------------------------------------------
  // ACCOUNT OPTIONS
  // -----------------------------------------------

  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0DEF0',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    backgroundColor: '#FAFAFD',
  },

  accountOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C2C3A',
  },

  accountOptionNumber: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 4,
  },

  accountOptionBalance: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '700',
  },

  // -----------------------------------------------
  // PRIMARY CARD
  // -----------------------------------------------

  primaryCardBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F7F6FC',
    borderWidth: 1,
    borderColor: '#E0DEF0',
  },

  primaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  primaryCardTitle: {
    fontSize: 12,
    color: GRAY_TEXT,
    fontWeight: '600',
  },

  primaryCardName: {
    fontSize: 16,
    color: '#2C2C3A',
    fontWeight: '700',
    marginTop: 3,
  },

  primaryCardNumber: {
    fontSize: 13,
    color: '#77748F',
    marginTop: 12,
  },

  primaryCardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  infoLabel: {
    fontSize: 11,
    color: GRAY_TEXT,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: PURPLE,
    marginTop: 3,
  },

  primaryCardNote: {
    fontSize: 11,
    color: GRAY_TEXT,
    marginTop: 12,
    lineHeight: 16,
  },

  noCardText: {
    fontSize: 12,
    color: '#C0392B',
    marginTop: 10,
  },

  // -----------------------------------------------
  // TRANSACTION
  // -----------------------------------------------

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 10,
  },

  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },

  categoryTile: {
    flex: 1,
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  categoryTileActive: {
    backgroundColor: PURPLE,
  },

  categoryLabel: {
    fontSize: 11,
    color: '#9B98C4',
    textAlign: 'center',
    marginTop: 8,
  },

  categoryLabelActive: {
    color: 'white',
  },

  // -----------------------------------------------
  // FORM
  // -----------------------------------------------

  form: {
    marginTop: 24,
  },

  formInput: {
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C2C3A',
    marginBottom: 14,
  },

  // -----------------------------------------------
  // BUTTON
  // -----------------------------------------------

  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  submitButtonDisabled: {
    backgroundColor: DISABLED_BG,
  },

  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  submitTextDisabled: {
    color: DISABLED_TEXT,
  },

  // -----------------------------------------------
  // MESSAGE
  // -----------------------------------------------

  feedback: {
    marginTop: 16,
    fontSize: 13,
  },

  success: {
    color: '#2e7d32',
  },

  error: {
    color: '#c0392b',
  },
});