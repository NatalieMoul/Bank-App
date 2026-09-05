import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';

export default function QRCodeScreen({ navigation }) {
  const { account } = useAuth();

  if (!account) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{account.fullName || account.username}</Text>
        <Text style={styles.subtitle}>Scan to send money to this account</Text>

        <View style={styles.qrWrap}>
          <QRCode
            value={JSON.stringify({
              accountNumber: account.accountNumber,
              name: account.fullName || account.username,
            })}
            size={220}
            color="#1a1a2e"
            backgroundColor="white"
          />
        </View>

        <Text style={styles.accountNumberLabel}>Account Number</Text>
        <Text style={styles.accountNumber}>{account.accountNumber}</Text>
      </View>
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
  body: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 24 },
  name: { fontSize: 20, fontWeight: '700', color: PURPLE },
  subtitle: { fontSize: 13, color: '#9B98C4', marginTop: 4, marginBottom: 32 },
  qrWrap: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F7F7FB',
    borderWidth: 1,
    borderColor: '#E0DEF0',
  },
  accountNumberLabel: { fontSize: 12, color: '#9B98C4', marginTop: 28 },
  accountNumber: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 4, letterSpacing: 1 },
});