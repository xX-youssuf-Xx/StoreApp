import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Modal, ActivityIndicator } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { showMessage } from 'react-native-flash-message';

interface QrReaderProps {
  isVisible: boolean;
  onClose: () => void;
  onScan: (data: string[]) => void;
  continuousScan: boolean;
}

const QrReader: React.FC<QrReaderProps> = ({ isVisible, onClose, onScan, continuousScan }) => {
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
            title: "QR Scanner Camera Permission",
            message: "This app needs access to your camera to scan QR codes.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
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
      showMessage({
        message: 'Success',
        description: 'QR code scanned successfully',
        type: 'success',
        duration: 2000,
        floating: true,
        autoHide: true,
      });
      setScanning(false);
      if (!continuousScan) {
        onScan([event.data]);
        onClose();
      }
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
    onClose();
  };

  const renderCamera = () => {
    if (hasPermission === false) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.text}>Camera permission not granted.</Text>
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!cameraReady) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.text}>Loading camera...</Text>
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
          <Text style={styles.scanningText}>
            {scanning ? 'Scanning...' : 'Press "Scan" to start'}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Icon name={flashOn ? "flash-on" : "flash-off"} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, scanning ? styles.buttonDisabled : null]} 
            onPress={startScanning}
            disabled={scanning}
          >
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          {continuousScan && (
            <TouchableOpacity style={styles.button} onPress={endScanning}>
              <Text style={styles.buttonText}>End</Text>
            </TouchableOpacity>
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
            <Icon name="close" size={24} color="#FFFFFF" />
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
    elevation: 1, // Add this line
  },
  preview: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    elevation: 2, // Increase this value
    padding: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    elevation: 2, // Add this line
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconButton: {
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanningText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },
});

export default QrReader;