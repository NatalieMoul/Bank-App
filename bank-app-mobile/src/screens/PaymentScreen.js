import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#4B3FE4';

// Swap these placeholder illustrations for your own images from /assets.
// e.g. image: require('../../assets/payment/mobile-top-up.png')
const PAYMENT_ITEMS = [
  {
    key: 'mobile',
    title: 'Mobile top up',
    subtitle: 'Top Up Instant',
    image: require('../../assets/payments/mobile-topup.png'),
  },
  {
    key: 'internet',
    title: 'Internet & TV',
    subtitle: 'Pay For Internet and TV Services',
    image: require('../../assets/payments/internetandtv.png'),
  },
  {
    key: 'utilities',
    title: 'Utilities',
    subtitle: 'Pay For Waste, Water and Electricity bills.',
    image: require('../../assets/payments/utilities.png'),
  },
  {
    key: 'government',
    title: 'Government Services',
    subtitle: 'Pay Taxes, fees, and public charge.',
    image: require('../../assets/payments/governmentservices.png'),
  },
];

export default function PaymentScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}>
        {PAYMENT_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              if (item.key === 'mobile') {
                navigation.navigate('MobileTopUp');
              } else {
                navigation.navigate('ServicePayment', {
                  title: item.title,
                  subtitle: item.subtitle,
                });
              }
            }}
          >
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>

            {item.image ? (
              <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="image-outline" size={22} color="#C7C7D6" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTextWrap: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#8B8B9E', lineHeight: 18 },

  cardImage: { width: 90, height: 70 },
  cardImagePlaceholder: {
    width: 90,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});