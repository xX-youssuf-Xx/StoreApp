import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, I18nManager } from 'react-native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { createProduct } from '../utils/inventory';

// Force RTL layout
I18nManager.forceRTL(true);


interface CreateProductProps {
  closeModal: () => void;
  reloadProducts: () => void;
}

const CreateProduct: React.FC<CreateProductProps> = ({ closeModal, reloadProducts }) => {
  const [productName, setProductName] = useState('');
  const [isStatic, setIsStatic] = useState(false);
  const [isQrable, setIsQrable] = useState(false);
  const [boxWeight, setBoxWeight] = useState('0');

  const { db } = useFirebase();

  const handleCreate = async () => {
    try {
      const key = await createProduct(
        db!,
        productName,
        isStatic,
        isQrable,
        Number(boxWeight),
      );
      if (key) {
        console.log(key);
        showMessage({
          message: 'نجاح',
          description: 'تم إنشاء المنتج بنجاح',
          type: 'success',
          duration: 3000,
          floating: true,
          autoHide: true,
        });
        reloadProducts();
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
            description: 'حدث خطأ أثناء إنشاء المنتج',
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
      <Text style={styles.title}>إنشاء منتج جديد</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>اسم المنتج:</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسم المنتج"
          placeholderTextColor="#999"
          value={productName}
          onChangeText={setProductName}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>ثابت:</Text>
        <Switch value={isStatic} onValueChange={setIsStatic} />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>قابل للمسح الضوئي:</Text>
        <Switch value={isQrable} onValueChange={setIsQrable} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>وزن الصندوق:</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل وزن الصندوق"
          placeholderTextColor="#999"
          value={boxWeight}
          onChangeText={setBoxWeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>إنشاء منتج</Text>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
    color: 'black',
    textAlign: 'right',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateProduct;