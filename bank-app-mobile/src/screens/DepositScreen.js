import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';
const GRAY_TEXT = '#9B98C4';

export default function DepositScreen({ navigation }) {
  const { account, deposit } = useAuth();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitDeposit = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setMessage('Enter a valid amount greater than zero.');
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    const result = await deposit(numericAmount, note.trim() || undefined);
    setSubmitting(false);
    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      setAmount('');
      setNote('');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Deposit</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.balancePanel}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balance}>${Number(account?.balance || 0).toFixed(2)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Add money to your account</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor={GRAY_TEXT}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={GRAY_TEXT}
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submitDeposit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>{submitting ? 'Processing...' : 'Confirm deposit'}</Text>
          </TouchableOpacity>

          {!!message && (
            <Text style={[styles.message, success ? styles.success : styles.error]}>{message}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  page: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: { color: '#1a1a2e', fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 24 },
  balancePanel: {
    backgroundColor: PURPLE,
    borderRadius: 18,
    padding: 22,
    marginBottom: 30,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  balance: { color: 'white', fontSize: 30, fontWeight: '700', marginTop: 8 },
  sectionTitle: { color: '#1a1a2e', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E7E4FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '700' },
  message: { textAlign: 'center', marginTop: 18, fontSize: 14 },
  success: { color: '#168B72' },
  error: { color: '#D63D62' },
});