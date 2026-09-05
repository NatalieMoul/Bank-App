import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';

function maskedCardNumber(accountNumber) {
  const digits = (accountNumber || '')
    .replace(/\D/g, '')
    .padEnd(16, '0')
    .slice(0, 16);

  return `${digits.slice(0, 4)}  ••••  ••••  ${digits.slice(-4)}`;
}

export default function CardScreen({ navigation }) {
  const {
    account,
    createCard,
    updateCardStatus,
    updateCardLimit,
    deleteCard,
  } = useAuth();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Spending limit popup
  const [limitCard, setLimitCard] = useState(null);
  const [limitInput, setLimitInput] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  // General confirmation / message popup
  const [popup, setPopup] = useState({
    visible: false,
    type: '',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    loading: false,
  });

  const displayName = account?.fullName || account?.username;

  useEffect(() => {
    if (!account) return undefined;

    let mounted = true;

    Bank.getCards().then(async result => {
      let loadedCards = result.cards || [];

      if (result.success && loadedCards.length === 0) {
        const initialCard = await Bank.createCard(account, 'Primary Card');

        if (initialCard.success && initialCard.card) {
          loadedCards = [initialCard.card];
        }
      }

      if (mounted) {
        setCards(loadedCards);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [account]);

  if (!account) return null;

  // --------------------------------------------------
  // CUSTOM POPUP
  // --------------------------------------------------

  const closePopup = () => {
    if (popup.loading) return;

    setPopup({
      visible: false,
      type: '',
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      loading: false,
    });
  };

  const showPopup = ({
    type,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
  }) => {
    setPopup({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      loading: false,
    });
  };

  const showResultPopup = (success, title, message) => {
    setPopup({
      visible: true,
      type: success ? 'success' : 'error',
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: closePopup,
      loading: false,
    });
  };

  const handlePopupConfirm = async () => {
    if (!popup.onConfirm || popup.loading) return;

    setPopup(current => ({
      ...current,
      loading: true,
    }));

    await popup.onConfirm();
  };

  // --------------------------------------------------
  // ADD CARD
  // --------------------------------------------------

  const addCard = async () => {
    setAdding(true);

    const result = await createCard(
      account,
      `Additional Card ${cards.length + 1}`
    );

    setAdding(false);

    if (result.success && result.card) {
      setCards(currentCards => [result.card, ...currentCards]);

      showResultPopup(
        true,
        'Card added',
        'Your new additional card has been created successfully.'
      );
    } else {
      showResultPopup(
        false,
        'Unable to add card',
        result.message || 'Something went wrong.'
      );
    }
  };

  const confirmAddCard = () => {
    showPopup({
      type: 'add',
      title: 'Add card',
      message:
        'Create a new additional card for this account?',
      confirmText: 'Add card',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setPopup(current => ({
          ...current,
          loading: true,
        }));

        setAdding(true);

        const result = await createCard(
          account,
          `Additional Card ${cards.length + 1}`
        );

        setAdding(false);

        if (result.success && result.card) {
          setCards(currentCards => [result.card, ...currentCards]);

          setPopup({
            visible: true,
            type: 'success',
            title: 'Card added',
            message:
              'Your new additional card has been created successfully.',
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        } else {
          setPopup({
            visible: true,
            type: 'error',
            title: 'Unable to add card',
            message: result.message || 'Something went wrong.',
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        }
      },
    });
  };

  // --------------------------------------------------
  // FREEZE / UNFREEZE CARD
  // --------------------------------------------------

  const toggleCardStatus = card => {
    const isCurrentlyActive = card.status === 'active';
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';

    const action = isCurrentlyActive ? 'freeze' : 'unfreeze';
    const actionTitle =
      action.charAt(0).toUpperCase() + action.slice(1);

    showPopup({
      type: action,
      title: `${actionTitle} card`,
      message: `Are you sure you want to ${action} this card?`,
      confirmText: actionTitle,
      cancelText: 'Cancel',
      onConfirm: async () => {
        const result = await updateCardStatus(card.id, nextStatus);

        if (result.success) {
          setCards(currentCards =>
            currentCards.map(currentCard =>
              currentCard.id === card.id
                ? { ...currentCard, ...result.card }
                : currentCard
            )
          );

          setPopup({
            visible: true,
            type: 'success',
            title: 'Card updated',
            message:
              result.message ||
              `Your card has been ${action === 'freeze' ? 'frozen' : 'unfrozen'}.`,
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        } else {
          setPopup({
            visible: true,
            type: 'error',
            title: 'Unable to update card',
            message: result.message || 'Something went wrong.',
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        }
      },
    });
  };

  // --------------------------------------------------
  // SPENDING LIMIT
  // --------------------------------------------------

  const openLimitModal = card => {
    setLimitCard(card);
    setLimitInput(String(Number(card.daily_limit ?? 0)));
  };

  const closeLimitModal = () => {
    if (savingLimit) return;

    setLimitCard(null);
    setLimitInput('');
  };

  const saveLimit = async () => {
    const amount = Number(limitInput);

    if (!limitCard || !Number.isFinite(amount) || amount <= 0) {
      showResultPopup(
        false,
        'Invalid amount',
        'Enter a spending limit greater than zero.'
      );
      return;
    }

    setSavingLimit(true);

    const result = await updateCardLimit(limitCard.id, amount);

    setSavingLimit(false);

    if (result.success && result.card) {
      setCards(currentCards =>
        currentCards.map(currentCard =>
          currentCard.id === limitCard.id
            ? { ...currentCard, ...result.card }
            : currentCard
        )
      );

      setLimitCard(null);
      setLimitInput('');

      showResultPopup(
        true,
        'Limit updated',
        'The daily spending limit has been updated successfully.'
      );
    } else {
      showResultPopup(
        false,
        'Unable to update limit',
        result.message || 'Something went wrong.'
      );
    }
  };

  // --------------------------------------------------
  // DELETE CARD
  // --------------------------------------------------

  const confirmDeleteCard = card => {
    showPopup({
      type: 'delete',
      title: 'Delete card',
      message:
        'Are you sure you want to permanently delete this card? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const result = await deleteCard(card.id);

        if (result.success) {
          setCards(currentCards =>
            currentCards.filter(
              currentCard => currentCard.id !== card.id
            )
          );

          setPopup({
            visible: true,
            type: 'success',
            title: 'Card deleted',
            message:
              result.message ||
              'The card has been deleted successfully.',
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        } else {
          setPopup({
            visible: true,
            type: 'error',
            title: 'Unable to delete card',
            message: result.message || 'Something went wrong.',
            confirmText: 'OK',
            cancelText: '',
            onConfirm: closePopup,
            loading: false,
          });
        }
      },
    });
  };

  // --------------------------------------------------
  // POPUP ICON
  // --------------------------------------------------

  const getPopupIcon = () => {
    if (popup.type === 'delete') {
      return 'trash-outline';
    }

    if (popup.type === 'freeze') {
      return 'lock-closed-outline';
    }

    if (popup.type === 'unfreeze') {
      return 'lock-open-outline';
    }

    if (popup.type === 'add') {
      return 'card-outline';
    }

    if (popup.type === 'success') {
      return 'checkmark-circle-outline';
    }

    if (popup.type === 'error') {
      return 'alert-circle-outline';
    }

    return 'information-circle-outline';
  };

  const getPopupIconStyle = () => {
    if (popup.type === 'delete' || popup.type === 'error') {
      return styles.popupIconDanger;
    }

    if (popup.type === 'success') {
      return styles.popupIconSuccess;
    }

    return styles.popupIconDefault;
  };

  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color="#1a1a2e"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Card</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <Text style={styles.emptyText}>
            Loading cards...
          </Text>
        ) : cards.length === 0 ? (
          <Text style={styles.emptyText}>
            No cards yet.
          </Text>
        ) : (
          cards.map(card => (
            <View style={styles.card} key={card.id}>
              <View style={styles.cardBubble} />

              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>
                    {card.cardholder_name || displayName}
                  </Text>

                  <Text style={styles.cardTier}>
                    {card.card_name}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => openLimitModal(card)}
                  hitSlop={{
                    top: 8,
                    bottom: 8,
                    left: 8,
                    right: 8,
                  }}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardNumber}>
                    {card.masked_card_number ||
                      `**** **** **** ${card.last_four}`}
                  </Text>

                  <Text style={styles.cardBalance}>
                    $
                    {Number(
                      card.card_name === 'Primary Card'
                        ? (
                            card.account?.balance ??
                            account.balance ??
                            0
                          )
                        : (card.balance ?? 0)
                    ).toFixed(2)}
                  </Text>

                  <Text style={styles.cardLimit}>
                    Daily limit: $
                    {Number(
                      card.daily_limit ?? 0
                    ).toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.visaText}>
                  VISA
                </Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardAction}
                  onPress={() => toggleCardStatus(card)}
                >
                  <Text style={styles.cardActionText}>
                    {card.status === 'active'
                      ? 'Freeze card'
                      : 'Unfreeze card'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cardAction,
                    styles.deleteAction,
                  ]}
                  onPress={() =>
                    confirmDeleteCard(card)
                  }
                >
                  <Text
                    style={[
                      styles.cardActionText,
                      styles.deleteActionText,
                    ]}
                  >
                    Delete card
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={confirmAddCard}
          disabled={adding}
        >
          <Text style={styles.addButtonText}>
            {adding ? 'Adding...' : 'Add card'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --------------------------------------------- */}
      {/* SPENDING LIMIT MODAL */}
      {/* --------------------------------------------- */}

      <Modal
        visible={!!limitCard}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeLimitModal}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Ionicons
                  name="settings-outline"
                  size={26}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.modalTitle}>
                Spending limit
              </Text>

              <Text style={styles.modalMessage}>
                Set a daily spending limit for{' '}
                {limitCard?.card_name}. Once you hit it,
                this card can't spend any more until the
                next day.
              </Text>

              <TextInput
                style={styles.limitInput}
                value={limitInput}
                onChangeText={setLimitInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#A9A6C4"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeLimitModal}
                  disabled={savingLimit}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={saveLimit}
                  disabled={savingLimit}
                >
                  <Text style={styles.confirmButtonText}>
                    {savingLimit ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* --------------------------------------------- */}
      {/* ADD / FREEZE / DELETE / RESULT MODAL */}
      {/* --------------------------------------------- */}

      <Modal
        visible={popup.visible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closePopup}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>

              <View
                style={[
                  styles.popupIconCircle,
                  getPopupIconStyle(),
                ]}
              >
                <Ionicons
                  name={getPopupIcon()}
                  size={28}
                  color={
                    popup.type === 'delete' ||
                    popup.type === 'error'
                      ? '#F0507A'
                      : popup.type === 'success'
                        ? '#2E9D68'
                        : PURPLE
                  }
                />
              </View>

              <Text style={styles.modalTitle}>
                {popup.title}
              </Text>

              <Text style={styles.modalMessage}>
                {popup.message}
              </Text>

              <View style={styles.modalActions}>
                {popup.cancelText ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closePopup}
                    disabled={popup.loading}
                  >
                    <Text style={styles.cancelButtonText}>
                      {popup.cancelText}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    popup.type === 'delete' &&
                      styles.deleteConfirmButton,
                  ]}
                  onPress={handlePopupConfirm}
                  disabled={popup.loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {popup.loading
                      ? 'Please wait...'
                      : popup.confirmText}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'white',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  card: {
    borderRadius: 20,
    backgroundColor: '#1C1B54',
    padding: 20,
    overflow: 'hidden',
    minHeight: 190,
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  cardBubble: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3E7BFA',
    opacity: 0.9,
  },

  cardName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },

  cardTier: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 20,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },

  cardNumber: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },

  cardBalance: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },

  cardLimit: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
  },

  visaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  cardAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  cardActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  deleteAction: {
    borderColor: '#F0507A',
  },

  deleteActionText: {
    color: '#F8A4B9',
  },

  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },

  addButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // ---------------------------------------------
  // MODALS
  // ---------------------------------------------

  modalRoot: {
    flex: 1,
  },

  modalBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(20, 18, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
  },

  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  popupIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  popupIconDefault: {
    backgroundColor: '#EFEEFF',
  },

  popupIconSuccess: {
    backgroundColor: '#E8F7F0',
  },

  popupIconDanger: {
    backgroundColor: '#FDECEF',
  },

  modalTitle: {
    color: '#1A1A2E',
    fontSize: 20,
    fontWeight: '700',
  },

  modalMessage: {
    color: '#6F6C8F',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 19,
  },

  limitInput: {
    borderWidth: 1,
    borderColor: '#E3E1F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A2E',
    marginTop: 16,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  cancelButtonText: {
    color: '#6F6C8F',
    fontWeight: '600',
  },

  confirmButton: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  deleteConfirmButton: {
    backgroundColor: '#F0507A',
  },

  confirmButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});