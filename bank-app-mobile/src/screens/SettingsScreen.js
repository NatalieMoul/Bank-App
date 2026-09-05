import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#4B3FE4';

const ROWS = [
  { key: 'password', label: 'Password', target: 'ChangePasswordScreen' },
  { key: 'appinfo', label: 'App information', target: 'AppInformation' },
  { key: 'customercare', label: 'Customer care', value: '1900 8989', target: null },
];

export default function SettingsScreen({ navigation }) {
  const { account, logout } = useAuth();
  const [logoutVisible, setLogoutVisible] = React.useState(false);

  const displayName = account?.fullName || account?.username;
  const initials = (displayName || '?').slice(0, 1).toUpperCase();

  const confirmLogout = () => {
    setLogoutVisible(true);
  };

  const completeLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setting</Text>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.name}>{displayName}</Text>

        <View style={styles.list}>
          {ROWS.map(row => (
            <TouchableOpacity
              key={row.key}
              style={styles.row}
              activeOpacity={row.target ? 0.6 : 1}
              onPress={() => row.target && navigation.navigate(row.target)}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.value ? (
                <Text style={styles.rowValue}>{row.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#C7C5DE" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.row} onPress={confirmLogout}>
            <Text style={[styles.rowLabel, styles.logoutLabel]}>Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#F0507A" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Log out?</Text>
              <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={completeLogout}>
                  <Text style={styles.confirmButtonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: PURPLE,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  headerTitle: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    height: 40,
    lineHeight: 40,
    textAlign: 'center',
    zIndex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  avatarWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: -40,
    zIndex: 2,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: PURPLE,
  },
  avatarText: {
    color: PURPLE,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  body: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  name: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: PURPLE,
    marginBottom: 24,
  },

  list: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  rowLabel: { fontSize: 15, color: '#2C2C3A', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#B4B2CC' },
  logoutLabel: { color: '#F0507A' },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(20, 18, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
  },
  modalTitle: { color: '#1A1A2E', fontSize: 20, fontWeight: '700' },
  modalMessage: { color: '#6F6C8F', fontSize: 14, marginTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 11 },
  cancelButtonText: { color: '#6F6C8F', fontWeight: '600' },
  confirmButton: { backgroundColor: '#F0507A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  confirmButtonText: { color: 'white', fontWeight: '700' },
});