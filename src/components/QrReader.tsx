import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Modal, ActivityIndicator } from 'react-native';
import { RNCamera } from 'react-native-camera';

interface QrReaderProps {
  isVisible: boolean;
  onClose: () => void;
  onScan: (data: string[]) => void;
}

const QrReader: React.FC<QrReaderProps> = ({ isVisible, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const cameraRef = useRef<RNCamera | null>(null);
  const cameraReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      requestCameraPermission();
    }
    return () => {
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && hasPermission) {
      setCameraReady(false);
      cameraReadyTimeoutRef.current = setTimeout(() => {
        setCameraReady(true);
      }, 500);
    }
  }, [isVisible, hasPermission]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "طلب إذن الكاميرا",
            message: "هذا التطبيق يحتاج إلى الوصول إلى الكاميرا لمسح رموز QR.",
            buttonNeutral: "اسألني لاحقًا",
            buttonNegative: "إلغاء",
            buttonPositive: "موافق"
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    }
  };

  const handleBarCodeRead = (event: { data: string }) => {
    if (scanning) {
      setScannedData(prevData => [...prevData, event.data]);
      onScan([...scannedData, event.data]);
      setScanning(false);
    }
  };

  const handleCameraReady = () => {
    if (cameraReadyTimeoutRef.current) {
      clearTimeout(cameraReadyTimeoutRef.current);
    }
    setCameraReady(true);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const startScanning = () => {
    setScanning(true);
  };

  const endScanning = () => {
    setScanning(false);
    onScan(scannedData);
  };

  const scanAnother = () => {
    setScanning(true);
  };

  const renderCamera = () => {
    if (hasPermission === false) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.text}>لم يتم منح إذن الكاميرا.</Text>
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>طلب الإذن</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!cameraReady) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.text}>جارِ تحميل الكاميرا...</Text>
        </View>
      );
    }

    return (
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        onBarCodeRead={handleBarCodeRead}
        captureAudio={false}
        onCameraReady={handleCameraReady}
        flashMode={flashOn ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
      >
        <View style={styles.overlayContent}>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Text style={styles.buttonText}>{flashOn ? "إطفاء الفلاش" : "تشغيل الفلاش"}</Text>
          </TouchableOpacity>
          {scanning ? (
            <>
              <Text style={styles.text}>جارِ المسح...</Text>
              <TouchableOpacity style={styles.button} onPress={endScanning}>
                <Text style={styles.buttonText}>إنهاء المسح</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={startScanning}>
                <Text style={styles.buttonText}>بدء المسح</Text>
              </TouchableOpacity>
              {scannedData.length > 0 && (
                <TouchableOpacity style={styles.button} onPress={scanAnother}>
                  <Text style={styles.buttonText}>مسح آخر</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </RNCamera>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {renderCamera()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  flashButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'absolute',
    top: 20,
    left: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default QrReader;