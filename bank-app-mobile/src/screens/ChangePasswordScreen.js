import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';
const GRAY_TEXT = '#9B98C4';
const DISABLED_BG = '#E9E8F3';
const DISABLED_TEXT = '#B4B2CC';

export default function ChangePasswordScreen({ navigation }) {
  const { updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !submitting;

  const submit = async () => {
    setMessage('');
    setSuccess(null);

    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters.');
      setSuccess(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(currentPassword, newPassword);
    setSubmitting(false);

    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={GRAY_TEXT}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={GRAY_TEXT}
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor={GRAY_TEXT}
          />

          {!!message && (
            <Text style={[styles.feedback, success ? styles.success : styles.error]}>{message}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={submit}
            disabled={!canSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 18 },
  input: {
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C2C3A',
    marginTop: 6,
  },
  feedback: { marginTop: 16, fontSize: 13 },
  success: { color: '#2e7d32' },
  error: { color: '#c0392b' },
  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { backgroundColor: DISABLED_BG },
  submitText: { color: 'white', fontSize: 16, fontWeight: '600' },
  submitTextDisabled: { color: DISABLED_TEXT },
});
