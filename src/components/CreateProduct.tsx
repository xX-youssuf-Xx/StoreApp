import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, I18nManager } from 'react-native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { createProduct } from '../utils/inventory';



interface CreateProductProps {
  closeModal: () => void;
  reloadProducts: () => void;
}

const CreateProduct: React.FC<CreateProductProps> = ({ closeModal, reloadProducts }) => {
  const [productName, setProductName] = useState('');
  const [isStatic, setIsStatic] = useState(false);
  const [isQrable, setIsQrable] = useState(false);
  const [isKgInTable, setIsKgInTable] = useState(false);
  const [boxWeight, setBoxWeight] = useState('0');

  const { db } = useFirebase();

  // Update isKgInTable when isStatic changes
  const handleStaticChange = (value: boolean) => {
    setIsStatic(value);
    if (value) {
      setIsKgInTable(false);
    }
  };

  const handleCreate = async () => {
    try {
      const key = await createProduct(
        db!,
        productName,
        isStatic,
        isQrable,
        Number(boxWeight),
        isKgInTable, // Add new parameter
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
      
      <View style={styles.formCard}>
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
          <Switch
            value={isStatic}
            onValueChange={handleStaticChange}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isStatic ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>قابل للمسح الضوئي:</Text>
          <Switch
            value={isQrable}
            onValueChange={setIsQrable}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isQrable ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {!isStatic && (
          <View style={styles.switchContainer}>
            <Text style={styles.label}>الوحدة كيلو فالجدول:</Text>
            <Switch
              value={isKgInTable}
              onValueChange={setIsKgInTable}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isKgInTable ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>وزن العبوة:</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل وزن العبوة"
            placeholderTextColor="#999"
            value={boxWeight}
            onChangeText={setBoxWeight}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={handleCreate}
        >
          <Text style={styles.buttonText}>إنشاء منتج</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={closeModal}
        >
          <Text style={styles.buttonText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    color: '#2c3e50',
    textAlign: 'right',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
  },
  createButton: {
    backgroundColor: '#007AFF',
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