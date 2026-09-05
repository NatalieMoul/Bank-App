import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';
const LIGHT_PURPLE = '#E7E4FB';
const GRAY_TEXT = '#9B98C4';
const DISABLED_BG = '#E9E8F3';
const DISABLED_TEXT = '#B4B2CC';

export default function LoginScreen() {
  const { login, register, forcedStatus, setForcedStatus } = useAuth();
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
    const [blockedStatus, setBlockedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (forcedStatus) {
      setBlockedStatus(forcedStatus);
      setScreen('signin');
      setForcedStatus('');
    }
  }, [forcedStatus, setForcedStatus]);

  const goTo = (next) => {
    setError('');
    setBlockedStatus('');
    setScreen(next);
  };

  const submitSignIn = async () => {
    setError('');
    setSubmitting(true);
    const result = await login(fullName.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message);
      setBlockedStatus(result.accountStatus || '');
    }
  };

  const submitSignUp = async () => {
    setError('');
    if (!fullName || !email || !phoneNumber || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions.');
      return;
    }
    setSubmitting(true);
    const result = await register(fullName.trim(), email.trim(), phoneNumber.trim(), password);
    setSubmitting(false);
    if (!result.success) setError(result.message);
  };

  // ---------- Welcome screen ----------
  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.welcomeWrap} edges={['top']}>
        <Text style={styles.welcomeTitle}>Welcome</Text>

        <View style={styles.welcomeButtons}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => goTo('signin')}>
            <Text style={styles.outlineButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => goTo('signup')}>
            <Text style={styles.outlineButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Sign In / Sign Up screen ----------
  const isSignIn = screen === 'signin';
  const canSubmit = isSignIn
    ? fullName.length > 0 && password.length > 0 && !submitting
    : fullName.length > 0 && email.length > 0 && phoneNumber.length > 0 && password.length > 0 && agreedToTerms && !submitting;

  return (
    <SafeAreaView style={styles.formSafe} edges={['top']}>
      <KeyboardAvoidingView style={styles.formWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => goTo('welcome')}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>{isSignIn ? 'Sign in' : 'Sign up'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
        <Text style={styles.cardTitle}>{isSignIn ? 'Welcome Back' : 'Welcome to us,'}</Text>
        <Text style={styles.cardSubtitle}>
          {isSignIn ? 'Hello there, sign in to continue' : 'Hello there, create New account'}
        </Text>

        <View style={styles.decorativeWrap}>
          <View style={styles.decorativeCircle}>
            {isSignIn ? (
              <Ionicons name="lock-closed" size={34} color={PURPLE} />
            ) : (
              <View style={styles.phoneBadge}>
                <Ionicons name="person" size={20} color="white" />
              </View>
            )}
          </View>
          <View style={[styles.dot, styles.dotBlue]} />
          <View style={[styles.dot, styles.dotPink]} />
          <View style={[styles.dot, styles.dotTeal]} />
          <View style={[styles.dot, styles.dotOrange]} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={GRAY_TEXT}
          value={fullName}
          onChangeText={setFullName}
        />

        {!isSignIn && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={GRAY_TEXT}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}

        {!isSignIn && (
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={GRAY_TEXT}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        )}

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={GRAY_TEXT}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={GRAY_TEXT} />
          </TouchableOpacity>
        </View>

        {isSignIn && (
          <Text style={styles.forgotText}>Forgot your password?</Text>
        )}

        {!isSignIn && (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={styles.checkboxText}>
              By creating an account you agree to our{' '}
              <Text style={styles.checkboxLink}>Term and Conditions</Text>
            </Text>
          </TouchableOpacity>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!blockedStatus && (
          <TouchableOpacity
            style={styles.contactBankButton}
            onPress={() => Linking.openURL('tel:19008989')}
          >
            <Ionicons name="call-outline" size={18} color={PURPLE} />
            <Text style={styles.contactBankText}>Contact the bank for more information</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={!!blockedStatus}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          onRequestClose={() => setBlockedStatus('')}
        >
          <View style={styles.statusModalRoot}>
            <View style={styles.statusModalBackdrop}>
              <View style={[
                styles.statusModalCard,
                blockedStatus === 'banned' ? styles.bannedModalCard : styles.suspendedModalCard,
              ]}>
                <Ionicons
                  name={blockedStatus === 'banned' ? 'ban-outline' : 'warning-outline'}
                  size={34}
                  color="white"
                />
                <Text style={styles.statusModalTitle}>
                  {blockedStatus === 'banned' ? 'Account banned' : 'Account suspended'}
                </Text>
                <Text style={styles.statusModalMessage}>
                  {error || 'Please contact the bank for more information.'}
                </Text>
                <TouchableOpacity
                  style={styles.statusModalButton}
                  onPress={() => setBlockedStatus('')}
                >
                  <Text style={styles.statusModalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={isSignIn ? submitSignIn : submitSignUp}
          disabled={!canSubmit}
        >
          <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>
            {submitting ? 'Please wait...' : isSignIn ? 'Sign in' : 'Sign up'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isSignIn ? "Don't have an account? " : 'Have an account? '}
          <Text style={styles.switchLink} onPress={() => goTo(isSignIn ? 'signup' : 'signin')}>
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeWrap: {
    flex: 1,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeTitle: { color: 'white', fontSize: 26, fontWeight: '700', marginBottom: 60 },
  welcomeButtons: { width: '80%', alignSelf: 'center', gap: 16, position: 'absolute', bottom: 80 },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: 'white',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  formSafe: { flex: 1, backgroundColor: PURPLE },
  formWrap: { flex: 1, backgroundColor: PURPLE },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formHeaderTitle: { color: 'white', fontSize: 17, fontWeight: '600' },

  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: 580,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: PURPLE },
  cardSubtitle: { fontSize: 13, color: '#7A7A8C', marginTop: 4 },

  decorativeWrap: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBadge: {
    width: 40,
    height: 60,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dotBlue: { backgroundColor: '#3E7BFA', top: 4, left: 20 },
  dotPink: { backgroundColor: '#F0507A', top: 8, right: 4 },
  dotTeal: { backgroundColor: '#2FC9A8', top: 78, left: 0 },
  dotOrange: { backgroundColor: '#F5A623', bottom: 10, left: 26 },

  input: {
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C2C3A',
    marginTop: 14,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5FA',
    borderRadius: 14,
    marginTop: 14,
    paddingRight: 16,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2C2C3A' },
  eyeButton: { padding: 4 },
  forgotText: { alignSelf: 'flex-end', color: GRAY_TEXT, fontSize: 12, marginTop: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CFCDE8',
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: PURPLE, borderColor: PURPLE },
  checkboxText: { flex: 1, fontSize: 12, color: '#7A7A8C', lineHeight: 17 },
  checkboxLink: { color: PURPLE, fontWeight: '600' },
  error: { color: '#c0392b', fontSize: 13, marginTop: 14 },
  contactBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
  },
  contactBankText: { color: PURPLE, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  statusModalRoot: { flex: 1 },
  statusModalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(20, 18, 40, 0.55)',
  },
  statusModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  suspendedModalCard: { backgroundColor: '#F5A623' },
  bannedModalCard: { backgroundColor: '#F0507A' },
  statusModalTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginTop: 10 },
  statusModalMessage: { color: 'white', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  statusModalButton: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 11, marginTop: 20 },
  statusModalButtonText: { color: '#3A3855', fontWeight: '700' },
  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { backgroundColor: DISABLED_BG },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  submitButtonTextDisabled: { color: DISABLED_TEXT },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7A7A8C' },
  switchLink: { color: PURPLE, fontWeight: '600' },
});