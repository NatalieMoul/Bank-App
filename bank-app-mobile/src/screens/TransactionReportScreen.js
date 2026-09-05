import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';

export default function TransactionReportScreen({ navigation, route }) {
  const { account: currentAccount, transactions, refreshTransactions } = useAuth();
  const selected = route?.params?.account || currentAccount;

  useFocusEffect(
    useCallback(() => {
      if (selected) refreshTransactions(selected);
    }, [selected, refreshTransactions])
  );

  if (!selected) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Report</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Account {selected?.id} · {selected?.accountNumber || selected?.account_number}</Text>
        <Text style={styles.summaryBalance}>${Number(selected?.balance || 0).toFixed(2)}</Text>
      </View>

      <FlatList
        style={styles.list}
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.type,
                  (item.type === 'WITHDRAWAL' || item.type === 'PAYMENT' || item.type === 'WITHDRAW' || item.type === 'TRANSFER' || item.type === 'TRANSFER_OUT') && styles.negative,
                ]}
              >
                {item.type === 'TRANSFER_IN' ? 'RECEIVE' : item.type.replace('_', ' ')}
              </Text>
              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
              <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  summary: {
    backgroundColor: '#F7F7FB',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: { fontSize: 12, color: '#9B98C4' },
  summaryBalance: { fontSize: 22, fontWeight: '700', color: PURPLE, marginTop: 4 },
  list: { flex: 1 },
  empty: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  type: { fontWeight: '700', color: '#2e7d32', fontSize: 13 },
  negative: { color: '#c0392b' },
  note: { color: '#888', fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700', fontSize: 14, color: '#1a1a2e' },
  time: { color: '#aaa', fontSize: 11, marginTop: 2 },
});
