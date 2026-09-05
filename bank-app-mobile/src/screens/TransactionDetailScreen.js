import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';

export default function TransactionDetailScreen({ navigation, route }) {
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const transactionId = route?.params?.transactionId;
    const reference = route?.params?.reference;

    const fetchResult = transactionId
      ? Bank.getTransactionDetail(transactionId)
      : reference
        ? Bank.getTransactionDetailByReference(reference)
        : Promise.resolve({ success: false, message: 'No transaction specified.' });

    fetchResult.then(result => {
      if (result.success) setTransaction(result.transaction);
      else setError(result.message);
    });
  }, [route?.params?.transactionId, route?.params?.reference]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !transaction ? (
        <Text style={styles.empty}>Loading transaction...</Text>
      ) : (
        <View style={styles.content}>
          <View style={styles.amountPanel}>
            <Text style={styles.type}>
              {transaction.type === 'transfer' && transaction.metadata?.from_account ? 'RECEIVE' : transaction.type.toUpperCase()}
            </Text>
            <Text style={styles.amount}>${Number(transaction.amount).toFixed(2)}</Text>
            <Text style={styles.status}>{transaction.status}</Text>
          </View>
          <View style={styles.details}>
            <Detail label="Reference" value={transaction.reference} />
            <Detail label="Description" value={transaction.description || 'None'} />
            <Detail label="Currency" value={transaction.currency} />
            <Detail label="Date" value={new Date(transaction.created_at).toLocaleString()} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  headerSpacer: { width: 26 },
  content: { padding: 20 },
  amountPanel: { backgroundColor: PURPLE, borderRadius: 18, padding: 24, alignItems: 'center' },
  type: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  amount: { color: 'white', fontSize: 32, fontWeight: '700', marginTop: 8 },
  status: { color: 'white', fontSize: 13, marginTop: 8, textTransform: 'capitalize' },
  details: { marginTop: 24 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  label: { color: '#9B98C4', fontSize: 13 },
  value: { color: '#1a1a2e', fontSize: 13, maxWidth: '65%', textAlign: 'right' },
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
  error: { color: '#C0392B', textAlign: 'center', marginTop: 32 },
});