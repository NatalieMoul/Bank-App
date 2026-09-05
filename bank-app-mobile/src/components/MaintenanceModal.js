import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Shown whenever maintenance mode is on and the user is logged in. The user
// stays logged in — this just explains why services (transfers, deposits,
// cards, etc) aren't working right now.
export default function MaintenanceModal() {
  const { maintenanceMessage, setMaintenanceMessage } = useAuth();

  return (
    <Modal
      visible={!!maintenanceMessage}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => setMaintenanceMessage('')}
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct" size={28} color="#B8860B" />
            </View>
            <Text style={styles.modalTitle}>Under Maintenance</Text>
            <Text style={styles.modalMessage}>
              {maintenanceMessage || 'The app is currently under maintenance. Some services are temporarily unavailable.'}
            </Text>
            <Text style={styles.modalSubMessage}>
              You're still logged in — you can browse the app, but actions like transfers, deposits, and card changes are paused until maintenance ends.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={() => setMaintenanceMessage('')}>
                <Text style={styles.confirmButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { color: '#1A1A2E', fontSize: 20, fontWeight: '700' },
  modalMessage: { color: '#1A1A2E', fontSize: 14, marginTop: 10, lineHeight: 20 },
  modalSubMessage: { color: '#6F6C8F', fontSize: 13, marginTop: 10, lineHeight: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 22 },
  confirmButton: { backgroundColor: '#4B3FE4', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 },
  confirmButtonText: { color: 'white', fontWeight: '700' },
});
