import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function QRScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const handleScan = ({ data }) => {
    if (scanned) return; // avoid double-firing on multiple frames
    setScanned(true);
    let scannedAccountNumber = data;
    let scannedName;

    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.accountNumber) {
        scannedAccountNumber = parsed.accountNumber;
        scannedName = parsed.name;
      }
    } catch (e) {
      // Not JSON — just use the raw text as the account number.
    }

    navigation.navigate('Transact', {
      scannedAccountNumber,
      scannedName,
    });
  };

  if (!permission) {
    // Permission state is still loading
    return <View style={styles.safe} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={48} color="#9B98C4" />
          <Text style={styles.permissionText}>
            Camera access is needed to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="phone-portrait-outline" size={48} color="#9B98C4" />
          <Text style={styles.permissionText}>
            QR scanning requires the Expo Go app on a physical phone. The browser can display this screen, but it cannot reliably scan with Expo Camera.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => navigation.goBack()}>
            <Text style={styles.permissionButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        active
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
        onMountError={(event) => setCameraError(event.message || 'The camera could not be opened.')}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="white" />
        </TouchableOpacity>

        <View style={styles.frameWrap}>
          <View style={styles.frame} />
          <Text style={styles.hint}>Align the QR code within the frame</Text>
          {!!cameraError && <Text style={styles.cameraError}>{cameraError}</Text>}
        </View>

        {scanned && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Text style={styles.rescanText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1, width: '100%' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  permissionText: {
    color: '#2C2C3A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4B3FE4',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  permissionButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  backLink: { color: '#4B3FE4', fontSize: 13, marginTop: 20 },

  overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'space-between',
},
  closeButton: {
    alignSelf: 'flex-end',
    margin: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },
  frameWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  hint: { color: 'white', fontSize: 13, marginTop: 16 },
  cameraError: { color: '#FFB4AB', fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 32 },
  rescanButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  rescanText: { color: '#1a1a2e', fontWeight: '600' },
});