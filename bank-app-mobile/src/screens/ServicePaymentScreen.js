import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';

export default function ServicePaymentScreen({
  navigation,
  route
}) {
  const { account, payment } = useAuth();

  const {
    title = 'Payment',
    subtitle = 'Enter your payment details.'
  } = route.params || {};

  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const submitPayment = async () => {
    Keyboard.dismiss();

    if (!reference.trim()) {
      Alert.alert(
        'Details required',
        'Enter your account or reference number.'
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      Alert.alert(
        'Amount required',
        'Enter a valid payment amount.'
      );
      return;
    }

    setSaving(true);

    const result = await payment(
      title,
      reference.trim(),
      Number(amount)
    );

    setSaving(false);

    if (result.success) {
      setSuccessMessage(
        `${title} payment of $${Number(amount).toFixed(2)} was completed successfully.`
      );

      setSuccessVisible(true);
    } else {
      Alert.alert(
        'Payment failed',
        result.message || 'Unable to complete payment.'
      );
    }
  };

  const closeSuccessPopup = () => {
    setSuccessVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top']}
    >
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#1A1A2E"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {title}
            </Text>

            <View style={styles.backButton} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* ICON */}
            <View style={styles.iconCircle}>
              <Ionicons
                name="receipt-outline"
                size={34}
                color={PURPLE}
              />
            </View>

            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.subtitle}>
              {subtitle}
            </Text>

            {/* REFERENCE */}
            <Text style={styles.label}>
              Account or reference number
            </Text>

            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="Enter account or reference number"
              autoCapitalize="none"
            />

            {/* AMOUNT */}
            <Text style={styles.label}>
              Amount
            </Text>

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={`Amount (${account?.currency || 'USD'})`}
              keyboardType="decimal-pad"
            />

            {/* PAY BUTTON */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                saving && styles.disabledButton
              ]}
              onPress={submitPayment}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>
                {saving ? 'Paying...' : 'Pay now'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* SUCCESS POPUP */}
          <Modal
            visible={successVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeSuccessPopup}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.successPopup}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="checkmark"
                    size={34}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.successTitle}>
                  Payment Successful
                </Text>

                <Text style={styles.successText}>
                  {successMessage}
                </Text>

                <TouchableOpacity
                  style={styles.successButton}
                  onPress={closeSuccessPopup}
                >
                  <Text style={styles.successButtonText}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'white'
  },

  container: {
    flex: 1
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12
  },

  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },

  headerTitle: {
    maxWidth: '75%',
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A2E'
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E7E4FB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },

  title: {
    color: '#1A1A2E',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18
  },

  subtitle: {
    color: '#7A7A8C',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28
  },

  label: {
    color: '#2C2C3A',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 7
  },

  input: {
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#2C2C3A',
    fontSize: 16
  },

  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28
  },

  disabledButton: {
    opacity: 0.6
  },

  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },

  // ---------------------------------------------
  // SUCCESS POPUP
  // ---------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },

  successPopup: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center'
  },

  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4B3FE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },

  successTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 10
  },

  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7A7A8C',
    textAlign: 'center',
    marginBottom: 24
  },

  successButton: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },

  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  }
});