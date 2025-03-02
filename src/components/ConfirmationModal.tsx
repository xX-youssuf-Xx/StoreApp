import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  itemType: 'clients' | 'products' | 'items'; // Add more types as needed
  count: number;
}

const ConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  itemType,
  count,
}: ConfirmationModalProps) => {
  const getItemTypeText = () => {
    switch (itemType) {
      case 'clients':
        return count === 1 ? 'عميل' : 'عملاء';
      case 'products':
        return count === 1 ? 'منتج' : 'منتجات';
      case 'items':
        return count === 1 ? 'عنصر' : 'عناصر';
      default:
        return 'عناصر';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>
            {`هل أنت متأكد من حذف ${count} ${getItemTypeText()}؟`}
          </Text>
          <Text style={styles.warningText}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.buttonText}>حذف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const {width} = Dimensions.get('window');
const modalWidth = width * 0.85;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: modalWidth,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  warningText: {
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    minWidth: modalWidth * 0.35,
    marginHorizontal: 8,
  },
  confirmButton: {
    backgroundColor: '#FF4444',
  },
  cancelButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ConfirmationModal;