import React, { useState, useEffect } from 'react';
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

const SERVICE_PROVIDERS = [
  'Smart',
  'Cellcard',
  'Metfone'
];

export default function MobileTopUpScreen({ navigation }) {
  const { account, payment } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(
    account?.username || ''
  );

  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState(
    SERVICE_PROVIDERS[0]
  );

  const [providersVisible, setProvidersVisible] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (account?.username) {
      setPhoneNumber(account.username);
    }
  }, [account]);

  const submitTopUp = async () => {
    Keyboard.dismiss();

    if (!phoneNumber.trim()) {
      Alert.alert(
        'Phone number required',
        'Enter the number you want to top up.'
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      Alert.alert(
        'Amount required',
        'Enter a valid top-up amount.'
      );
      return;
    }

    const result = await payment(
      `${provider} Mobile Top Up`,
      phoneNumber.trim(),
      Number(amount)
    );

    if (result.success) {
      setSuccessMessage(
        `${provider} top up of $${Number(amount).toFixed(2)} was completed successfully.`
      );

      setSuccessVisible(true);
    } else {
      Alert.alert(
        'Top up failed',
        result.message || 'Unable to complete top up.'
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#1A1A2E"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Mobile top up
            </Text>

            <View style={styles.backButton} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="phone-portrait-outline"
                size={34}
                color={PURPLE}
              />
            </View>

            <Text style={styles.title}>
              Top up mobile
            </Text>

            <Text style={styles.subtitle}>
              Enter the number and amount you want to top up.
            </Text>

            <Text style={styles.label}>
              Mobile number
            </Text>

            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              Service provider
            </Text>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() =>
                setProvidersVisible(!providersVisible)
              }
              accessibilityRole="button"
              accessibilityLabel="Select service provider"
            >
              <Text style={styles.dropdownValue}>
                {provider}
              </Text>

              <Ionicons
                name={
                  providersVisible
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color="#7A7A8C"
              />
            </TouchableOpacity>

            {providersVisible && (
              <View style={styles.dropdownOptions}>
                {SERVICE_PROVIDERS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setProvider(option);
                      setProvidersVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>
                      {option}
                    </Text>

                    {provider === option && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={PURPLE}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

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

            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitTopUp}
            >
              <Text style={styles.submitButtonText}>
                Continue
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E'
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 28
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

  dropdownButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    paddingHorizontal: 16
  },

  dropdownValue: {
    color: '#2C2C3A',
    fontSize: 16
  },

  dropdownOptions: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E4F0',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden'
  },

  dropdownOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5'
  },

  dropdownOptionText: {
    color: '#2C2C3A',
    fontSize: 15
  },

  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28
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