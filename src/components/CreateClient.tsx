import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import {createClient} from '../utils/clitent';

interface CreateClientProps {
  closeModal: () => void;
  reloadClients: () => void;
}

const CreateClient: React.FC<CreateClientProps> = ({ closeModal, reloadClients }) => {
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { db } = useFirebase();

  const handleCreate = async () => {
    try {
      const key = await createClient(db!, clientName, phoneNumber);
      if (key) {
        console.log(key);
        showMessage({
          message: 'نجاح',
          description: 'تم إنشاء العميل بنجاح',
          type: 'success',
          duration: 3000,
          floating: true,
          autoHide: true,
        });
        reloadClients();
        closeModal();
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'خطأ',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          showMessage({
            message: 'خطأ',
            description: 'حدث خطأ أثناء إنشاء العميل',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>إنشاء عميل جديد</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>اسم العميل:</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسم العميل"
          placeholderTextColor="#999"
          value={clientName}
          onChangeText={setClientName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>رقم الهاتف:</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل رقم الهاتف"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>إنشاء عميل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeModal}>
          <Text style={styles.buttonText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'left',
    color: '#003366',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#003366',
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#4DA6FF',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    color: '#003366',
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 14,
    borderRadius: 8,
    flex: 0.48,
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateClient;