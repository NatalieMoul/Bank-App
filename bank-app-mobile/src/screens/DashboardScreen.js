import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Bank from '../services/BankService';

const PURPLE = '#4B3FE4';

function maskedCardNumber(accountNumber) {
  const digits = (accountNumber || '').replace(/\D/g, '').padEnd(16, '0').slice(0, 16);
  return `${digits.slice(0, 4)}  ••••  ••••  ${digits.slice(-4)}`;
}

const GRID_ITEMS = [
  { key: 'account', label: 'Account', icon: <Ionicons name="wallet" size={26} color="#4B3FE4" />, target: 'Account' },
  { key: 'deposit', label: 'Deposit', icon: <Ionicons name="add-circle" size={26} color="#2FC9A8" />, target: 'Deposit' },
  { key: 'transfer', label: 'Transfer', icon: <Ionicons name="swap-horizontal" size={26} color="#F0507A" />, target: 'Transact' },
  { key: 'card', label: 'Card', icon: <Ionicons name="card" size={26} color="#3E7BFA" />, target: 'Card' },
  { key: 'qr', label: 'QR Scan', icon: <Ionicons name="qr-code" size={26} color="#F5A623" />, target: 'QRScan' },
  { key: 'payment', label: 'Payment', icon: <Ionicons name="receipt" size={26} color="#2FC9A8" />, target: 'Payment' },
];

export default function DashboardScreen({ navigation }) {
  const { account, logout } = useAuth();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    Bank.getNotifications().then(result => {
      if (mounted) {
        setUnreadNotifications(result.notifications.filter(notification => !notification.is_read).length);
      }
    });

    return () => {
      mounted = false;
    };
  }, []));

  if (!account) return null;

  const displayName = account.fullName || account.username;
  const initials = (displayName || '?').slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.greeting}>Hi, {displayName}</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellWrap}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={23} color="white" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellWrap} onPress={() => navigation.navigate('QRCode')}>
            <Ionicons name="qr-code" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.cardStackWrap}>
          <View style={styles.cardShadowLayer} />
          <View style={styles.card}>
            <View style={styles.cardBubble} />
            <Text style={styles.cardName}>{displayName}</Text>
            <Text style={styles.cardTier}>Platinium</Text>


            <View style={styles.cardNumberRow}>
              <Text style={styles.cardNumber}>{maskedCardNumber(account.accountNumber)}</Text>
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.cvvRow}>
                <Text style={styles.cvvText}>
                  {showCardDetails ? '3 9 4' : '* * * * * * *'}
                </Text>
                <TouchableOpacity onPress={() => setShowCardDetails(!showCardDetails)}>
                  <Ionicons
                    name={showCardDetails ? 'eye-off' : 'eye'}
                    size={16}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.visaText}>VISA</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {GRID_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.gridItem, index % 3 !== 2 && styles.gridItemSpacer]}
              onPress={() => item.target && navigation.navigate(item.target)}
            >
              {item.icon}
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = '100%';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    backgroundColor: PURPLE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  greeting: { color: 'white', fontSize: 17, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellWrap: { padding: 4, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#F0507A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F0507A',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },

  body: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 20,
  },

  cardStackWrap: { marginBottom: 28 },
  cardShadowLayer: {
    position: 'absolute',
    bottom: -10,
    left: 16,
    right: 16,
    height: 24,
    backgroundColor: '#F0507A',
    borderRadius: 18,
    opacity: 0.85,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: '#1C1B54',
    padding: 20,
    overflow: 'hidden',
    minHeight: 190,
    justifyContent: 'space-between',
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
  cardName: { color: 'white', fontSize: 22, fontWeight: '700' },
  cardTier: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 20 },
  cardNumberRow: { marginTop: 6 },
  cardNumber: { color: 'white', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cvvRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cvvText: { color: 'white', fontSize: 13, letterSpacing: 1 },
  visaText: { color: 'white', fontSize: 18, fontWeight: '800', fontStyle: 'italic' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItemSpacer: {
    marginRight: '3.5%',
  },
  gridItem: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridLabel: {
    fontSize: 12,
    color: '#4A4A5A',
    marginTop: 10,
    textAlign: 'center',
  },
});