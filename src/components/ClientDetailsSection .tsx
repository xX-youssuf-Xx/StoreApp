import React, { useState } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

const ClientDetailsSection = ({ client, onResetBalance }: { client: any, onResetBalance: (clientId: number) => void }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleResetBalance = () => {
    onResetBalance(client.id);
    setShowConfirmation(false);
  };

  return (
    <>
      <View style={styles.clientSummary}>
        {/* Top Row: Balance (left) | Client Name (right) */}
        <View style={styles.row}>
          <Text style={styles.clientBalance}>{client.balance} ج.م</Text>
          <Text style={styles.clientName}>{client.name}</Text>
        </View>

        {/* Bottom Row: Reset Button (left) | Client Number (right) */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={() => setShowConfirmation(true)}
          >
            <Text style={styles.resetButtonText}>تصفير الحساب</Text>
          </TouchableOpacity>
          <Text style={styles.clientNumber}>{client.number}</Text>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal 
        isVisible={showConfirmation} 
        onBackdropPress={() => setShowConfirmation(false)}
        backdropOpacity={0.4}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={300}
        animationOutTiming={300}
        backdropTransitionInTiming={300}
        backdropTransitionOutTiming={300}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>تأكيد تصفير الحساب</Text>
          <Text style={styles.modalMessage}>هل أنت متأكد من تصفير حساب {client.name}؟</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleResetBalance}>
              <Text style={styles.confirmButtonText}>تأكيد</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmation(false)}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  clientSummary: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  clientBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'left',
  },
  clientNumber: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  resetButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  resetButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    color: '#4a4a4a',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 12,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
});

export default ClientDetailsSection;
