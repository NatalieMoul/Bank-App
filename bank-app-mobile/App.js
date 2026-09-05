import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import DepositScreen from './src/screens/DepositScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AccountScreen from './src/screens/AccountScreen';
import TransactionReportScreen from './src/screens/TransactionReportScreen';
import AppInformationScreen from './src/screens/AppInformationScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';
import QRScanScreen from './src/screens/QRScanScreen';
import CardScreen from './src/screens/CardScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import MobileTopUpScreen from './src/screens/MobileTopUpScreen';
import ServicePaymentScreen from './src/screens/ServicePaymentScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import MaintenanceModal from './src/components/MaintenanceModal';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { account, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {account ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Transact" component={TransactionsScreen} />
          <Stack.Screen name="Deposit" component={DepositScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen name="TransactionReport" component={TransactionReportScreen} />
          <Stack.Screen name="AppInformation" component={AppInformationScreen} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="QRScan" component={QRScanScreen} />
          <Stack.Screen name="Card" component={CardScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="MobileTopUp" component={MobileTopUpScreen} />
          <Stack.Screen name="ServicePayment" component={ServicePaymentScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
        <MaintenanceModal />
      </NavigationContainer>
    </AuthProvider>
  );
}