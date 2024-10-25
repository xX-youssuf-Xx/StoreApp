import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { createItems } from '../utils/inventory';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QrReader from './QrReader';

interface CreateItemProps {
  closeModal: () => void;
  reloadProducts: () => void;
  productName: string;
}

interface ItemData {
  weight: string;
  qrString: string;
}

const CreateItem: React.FC<CreateItemProps> = ({ closeModal, reloadProducts, productName }) => {
  const [boughtPrice, setBoughtPrice] = useState('');
  const [items, setItems] = useState<ItemData[]>([{ weight: '', qrString: '' }]);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [currentScanningIndex, setCurrentScanningIndex] = useState<number | null>(null);
  const [startIndex, setStartIndex] = useState('');
  const [endIntegerIndex, setEndIntegerIndex] = useState('');
  const [endDecimalIndex, setEndDecimalIndex] = useState('');
  const { db } = useFirebase();

  const addItem = () => {
    setItems([...items, { weight: '', qrString: '' }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof ItemData, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateWeight = (qrString: string): string => {
    if (!qrString || !startIndex || !endIntegerIndex || !endDecimalIndex) return '';
  
    const start = parseInt(startIndex) - 1;
    const middle = parseInt(endIntegerIndex);
    const end = parseInt(endDecimalIndex);
  
    if (isNaN(start) || isNaN(middle) || isNaN(end)) return '';
  
    const integerPart = qrString.substring(start, middle);
    const decimalPart = qrString.substring(middle, end);
    const weightInLbs = parseFloat(`${integerPart}.${decimalPart}`);
    const weightInKgs = (weightInLbs * 0.455).toFixed(2);
    
    return weightInKgs;
  };

  const recalculateWeights = () => {
    const newItems = items.map(item => ({
      ...item,
      weight: calculateWeight(item.qrString)
    }));
    setItems(newItems);
  };

  useEffect(() => {
    recalculateWeights();
  }, [startIndex, endIntegerIndex, endDecimalIndex]);

  const handleQrScan = (scannedData: string[]) => {
    if (currentScanningIndex !== null) {
      // Single item scan
      const newItems = [...items];
      newItems[currentScanningIndex].qrString = scannedData[0];
      newItems[currentScanningIndex].weight = calculateWeight(scannedData[0]);
      setItems(newItems);
      setIsQrScannerVisible(false);
      setCurrentScanningIndex(null);
    } else {
      // Multiple items scan
      const newItems = scannedData.map(qrString => ({
        weight: calculateWeight(qrString),
        qrString
      }));
      setItems([...items, ...newItems]);
    }
    showMessage({
      message: 'نجاح',
      description: `تم مسح ${scannedData.length} عنصر بنجاح`,
      type: 'success',
      duration: 2000,
      floating: true,
      autoHide: true,
    });
  };

  const handleImport = async () => {
    try {
      for (const item of items) {
        if (!item.weight || !item.qrString) {
          throw new Error('بيانات الوزن أو رمز QR غير صالحة');
        }

        await createItems(
          db!,
          productName,
          parseFloat(boughtPrice),
          parseFloat(item.weight),
          item.qrString
        );
      }

      showMessage({
        message: 'نجاح',
        description: 'تم استيراد العناصر بنجاح',
        type: 'success',
        duration: 3000,
        floating: true,
        autoHide: true,
      });

      reloadProducts();
      closeModal();
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'خطأ',
            description: 'حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          showMessage({
            message: 'خطأ',
            description: 'خطأ في إنشاء العنصر',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else {
          console.error('حدث خطأ برمز:', error.code);
        }
      } else {
        console.error('حدث خطأ غير متوقع:', error);
      }
    }
  };

  const renderItem = ({ item, index }: { item: ItemData; index: number }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
          <Icon name="close" size={24} color="#FF0000" />
        </TouchableOpacity>
        <Text style={styles.itemTitle}>العنصر {index + 1}</Text>
      </View>
      <View style={styles.itemInputContainer}>
        <TextInput
          style={styles.itemInput}
          placeholder="الوزن"
          placeholderTextColor="#999"
          value={item.weight}
          onChangeText={(value) => updateItem(index, 'weight', value)}
          keyboardType="numeric"
        />
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => {
            setCurrentScanningIndex(index);
            setIsQrScannerVisible(true);
          }}
        >
          <Icon name="qr-code-scanner" size={24} color={item.qrString ? '#999' : '#000'} />
        </TouchableOpacity>
      </View>
      {item.qrString && (
        <Text style={styles.qrText}>رمز QR: {item.qrString}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>استيراد عناصر جديدة: {productName}</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>سعر الشراء:</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل سعر الشراء"
            placeholderTextColor="#999"
            value={boughtPrice}
            onChangeText={setBoughtPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.weightInputContainer}>
          <TextInput
            style={styles.weightInput}
            placeholder="بداية الجزء الصحيح"
            placeholderTextColor="#999"
            value={startIndex}
            onChangeText={setStartIndex}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.weightInput}
            placeholder="نهاية الجزء الصحيح"
            placeholderTextColor="#999"
            value={endIntegerIndex}
            onChangeText={setEndIntegerIndex}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.weightInput}
            placeholder="نهاية الجزء العشري"
            placeholderTextColor="#999"
            value={endDecimalIndex}
            onChangeText={setEndDecimalIndex}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={() => {
          setCurrentScanningIndex(null);
          setIsQrScannerVisible(true);
        }}>
          <Icon name="qr-code-scanner" size={24} color="#fff" />
          <Text style={styles.buttonText}>مسح رموز QR متعددة</Text>
        </TouchableOpacity>

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      </ScrollView>

      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.buttonText}>إضافة عنصر</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Text style={styles.buttonText}>اضافة العناصر</Text>
        </TouchableOpacity>
      </View>

      <QrReader
        isVisible={isQrScannerVisible}
        onClose={() => setIsQrScannerVisible(false)}
        onScan={handleQrScan}
        continuousScan={currentScanningIndex === null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    color: '#333',
    fontSize: 14,
    textAlign: 'right',
  },
  weightInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    marginHorizontal: 4,
    color: '#333',
    fontSize: 14,
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  itemInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    marginRight: 8,
    color: '#333',
    fontSize: 14,
    textAlign: 'right',
  },
  qrButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  qrText: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  scanButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  importButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default CreateItem;