import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
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

type WeightUnit = 'kg' | 'lb';

interface ItemData {
  weight: string;
  qrString: string;
  unit: WeightUnit;
}

const CreateItem: React.FC<CreateItemProps> = ({ closeModal, reloadProducts, productName }) => {
  const [boughtPrice, setBoughtPrice] = useState('');
  const [items, setItems] = useState<ItemData[]>([{ weight: '', qrString: '', unit: 'lb' }]);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [currentScanningIndex, setCurrentScanningIndex] = useState<number | null>(null);
  const [startIndex, setStartIndex] = useState('');
  const [endIntegerIndex, setEndIntegerIndex] = useState('');
  const [endDecimalIndex, setEndDecimalIndex] = useState('');
  const { db } = useFirebase();
  const [defaultUnit, setDefaultUnit] = useState('lb');

  const formatNumber = (num: number): string => {
    return (Math.floor(num * 10000) / 10000).toString();
  };

  const convertWeight = (value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'lb' && toUnit === 'kg') {
      return value * 0.455;
    }
    // kg to lb 
    return value * (1 / 0.455); 
  };

  const addItem = () => {
    setItems([...items, { weight: '', qrString: '', unit: 'lb' }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof ItemData, value: string | WeightUnit) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };

    if (field === 'unit') {
      // Type guard to ensure value is WeightUnit
      if (value === 'kg' || value === 'lb') {
        const currentWeight = parseFloat(currentItem.weight);
        if (!isNaN(currentWeight)) {
          const convertedWeight = convertWeight(
            currentWeight,
            currentItem.unit,
            value
          );
          currentItem.weight = convertedWeight.toFixed(2);
        }
        currentItem.unit = value;
      }
    } else if (field === 'weight' || field === 'qrString') {
      // Handle string fields
      currentItem[field] = value as string;
    }

    newItems[index] = currentItem;
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
    const weightInKgs = convertWeight(weightInLbs, 'lb', 'kg');
    
    return weightInKgs.toFixed(2);
  };

  const recalculateWeights = () => {
    const newItems = items.map(item => ({
      ...item,
      weight: item.qrString ? calculateWeight(item.qrString) : item.weight
    }));
    setItems(newItems);
  };

  useEffect(() => {
    recalculateWeights();
  }, [startIndex, endIntegerIndex, endDecimalIndex]);

  const formatNumberTo4Decimals = (num: number): string => {
    let numStr = num.toString();
    const parts = numStr.split('.');
    if (parts.length === 1) parts.push('0000');
    if (parts[1].length < 4) {
      parts[1] = parts[1].padEnd(4, '0');
    } else if (parts[1].length > 4) {
      parts[1] = parts[1].substring(0, 4);
    }
    return parts.join('.');
  };

  const handleQrScan = (scannedData: string[]) => {
    if (currentScanningIndex !== null) {
      // Single item scan
      const newItems = [...items];
      const qrString = scannedData[0];
      
      if (!qrString) return;
      
      const weight = extractWeightFromQr(qrString);
      newItems[currentScanningIndex] = {
        weight: formatNumberTo4Decimals(weight),
        qrString: qrString,
        unit: 'lb' // Keep as lb
      };
      
      setItems(newItems);
      setIsQrScannerVisible(false);
      setCurrentScanningIndex(null);
    } else {
      // Multiple items scan - only add new items
      const newScannedItems = scannedData.map(qrString => ({
        weight: formatNumberTo4Decimals(extractWeightFromQr(qrString)),
        qrString: qrString,
        unit: 'lb' as WeightUnit
      }));
      
      setItems(newScannedItems);
      setIsQrScannerVisible(false);
    }
  };

  const extractWeightFromQr = (qrString: string): number => {
    if (!qrString || !startIndex || !endIntegerIndex || !endDecimalIndex) return 0;
  
    const start = parseInt(startIndex) - 1;
    const middle = parseInt(endIntegerIndex);
    const end = parseInt(endDecimalIndex);
  
    if (isNaN(start) || isNaN(middle) || isNaN(end)) return 0;
  
    const integerPart = qrString.substring(start, middle);
    const decimalPart = qrString.substring(middle, end);
    return parseFloat(`${integerPart}.${decimalPart}`);
  };

  const validateItem = (item: ItemData): boolean => {
    if (item.qrString) {
      return !!item.weight;
    }
    return !!item.weight && !isNaN(parseFloat(item.weight));
  };

  const getWeightInKg = (item: ItemData): number => {
    const weight = parseFloat(item.weight);
    if (isNaN(weight)) return 0;
    // Only convert if unit is lb
    if (item.unit === 'lb') {
      return weight * 0.455;
    }
    return weight;
  };

  const handleImport = async () => {
    try {
      if (!boughtPrice || isNaN(parseFloat(boughtPrice))) {
        throw new Error('الرجاء إدخال سعر شراء صحيح');
      }

      for (const item of items) {
        if (!validateItem(item)) {
          throw new Error('الرجاء إدخال وزن صحيح لجميع العناصر');
        }

        // Convert weight to kg only when sending to Firebase
        const weightInKg = getWeightInKg(item);
        
        await createItems(
          db!,
          productName,
          parseFloat(boughtPrice),
          parseFloat(formatNumberTo4Decimals(weightInKg)),
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
      let errorMessage = 'حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_CREATING_ERROR) {
          errorMessage = 'خطأ في إنشاء العنصر';
        }
      }

      showMessage({
        message: 'خطأ',
        description: errorMessage,
        type: 'danger',
        duration: 3000,
        floating: true,
        autoHide: true,
      });
    }
  };

  const handleWeightChange = (index: number, value: string) => {
    const newItems = [...items];
    const weight = parseFloat(value);
    
    if (!isNaN(weight)) {
      newItems[index].weight = value;
    } else {
      newItems[index].weight = '';
    }
    
    setItems(newItems);
  };
  
  const handleUnitChange = (index: number, unit: WeightUnit) => {
    const newItems = [...items];
    const currentWeight = parseFloat(newItems[index].weight);
    
    if (!isNaN(currentWeight)) {
      if (unit === 'kg' && newItems[index].unit === 'lb') {
        newItems[index].weight = formatNumber(convertWeight(currentWeight, 'lb', 'kg'));
      } else if (unit === 'lb' && newItems[index].unit === 'kg') {
        newItems[index].weight = formatNumber(convertWeight(currentWeight, 'kg', 'lb'));
      }
    }
    
    newItems[index].unit = unit;
    setItems(newItems);
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
          style={[styles.itemInput, { flex: 2 }]}
          placeholder="الوزن"
          placeholderTextColor="#999"
          value={item.weight}
          onChangeText={(value) => handleWeightChange(index, value)}
          keyboardType="numeric"
          editable={!item.qrString}
        />
        <View style={styles.unitSelector}>
          <TouchableOpacity 
            style={[
              styles.unitOption,
              item.unit === 'kg' && styles.selectedUnit
            ]}
            onPress={() => handleUnitChange(index, 'kg')}
          >
            <Text style={[
              styles.unitText,
              item.unit === 'kg' && styles.selectedUnitText
            ]}>kg</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.unitOption,
              item.unit === 'lb' && styles.selectedUnit
            ]}
            onPress={() => handleUnitChange(index, 'lb')}
          >
            <Text style={[
              styles.unitText,
              item.unit === 'lb' && styles.selectedUnitText
            ]}>lb</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[
            styles.qrButton,
            item.unit === 'kg' && styles.disabledQrButton
          ]}
          onPress={() => {
            if (item.unit !== 'kg') {
              setCurrentScanningIndex(index);
              setIsQrScannerVisible(true);
            }
          }}
          disabled={item.unit === 'kg'}
        >
          <Icon 
            name="qr-code-scanner" 
            size={24} 
            color={item.unit === 'kg' ? '#ccc' : item.qrString ? '#999' : '#000'} 
          />
        </TouchableOpacity>
      </View>
      {item.qrString && (
        <Text style={styles.qrText}>رمز QR: {item.qrString}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
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

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => {
            setCurrentScanningIndex(null);
            setIsQrScannerVisible(true);
          }}
        >
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
  unitSelector: {
    flexDirection: 'row-reverse',
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  selectedUnit: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    color: '#000',
    fontSize: 14,
  },
  selectedUnitText: {
    color: '#fff',
  },
  itemInput: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color:'black'
  },
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bottomButtonsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    marginLeft: 18,
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
  disabledQrButton: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5
  },
});

export default CreateItem;