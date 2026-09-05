import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';

function iconForType(type) {
  if (type === 'deposit') return 'arrow-down-circle';
  if (type === 'withdrawal') return 'arrow-up-circle';
  if (type === 'transfer') return 'swap-horizontal';
  if (type === 'transaction' || type === 'card_expense') return 'card-outline';
  return 'notifications-outline';
}

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    const result = await Bank.getNotifications();
    setNotifications(result.notifications);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    const result = await Bank.markNotificationsRead();
    if (result.success) {
      setNotifications(current => current.map(notification => ({ ...notification, is_read: true })));
    }
  };

  const openNotification = async notification => {
    if (!notification.is_read) {
      await Bank.markNotificationRead(notification.id);
      setNotifications(current => current.map(currentNotification => (
        currentNotification.id === notification.id
          ? { ...currentNotification, is_read: true }
          : currentNotification
      )));
    }

    const transactionId = notification.data?.transaction_id;
    const reference = notification.data?.reference;

    if (transactionId) {
      navigation.navigate('TransactionDetail', { transactionId });
    } else if (reference) {
      navigation.navigate('TransactionDetail', { reference });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} accessibilityLabel="Mark all notifications as read">
          <Ionicons name="checkmark-done-outline" size={23} color={PURPLE} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading notifications...</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, !item.is_read && styles.unreadRow]}
              onPress={() => openNotification(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={iconForType(item.type)} size={22} color={PURPLE} />
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  unreadRow: { backgroundColor: '#FAF9FF' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7E4FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { color: '#1a1a2e', fontSize: 15, fontWeight: '700' },
  message: { color: '#5F5D75', fontSize: 13, lineHeight: 19, marginTop: 4 },
  time: { color: '#9B98C4', fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F0507A', marginTop: 5 },
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
});
