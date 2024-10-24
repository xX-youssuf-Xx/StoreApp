import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useFirebase } from '../context/FirebaseContext';
import { getAllProducts, getProduct } from '../utils/inventory';
import { createReceiptHelper } from '../utils/receipts';
import { showMessage } from 'react-native-flash-message';
import { formatDate } from '../utils/dateFormatter';
import { Picker } from '@react-native-picker/picker';
import { ReceiptProduct } from '../utils/types';

interface Props {
  clientId: string;
  onClose: () => void;
  refresh: () => void;
}

interface Product {
  name: string;
  itemCount: number;
  items: Record<string, any>;
  isStatic: boolean;
  isQrable: boolean;
  boxWeight: number;
}

interface SelectedItem {
  id: string;
  weight: number;
}

const CreateReceipt: React.FC<Props> = ({ clientId, onClose, refresh }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<any[]>([]);
  const [moneyPaid, setMoneyPaid] = useState('');
  const [receipt, setReceipt] = useState<{
    client?: string;
    products?: Record<string, ReceiptProduct>;
  }>({});
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [currentSellPrice, setCurrentSellPrice] = useState('');
  const { db } = useFirebase();

  useEffect(() => {
    if (db) {
      getInventory();
    }
  }, [db]);

  const getInventory = async () => {
    try {
      if (!db) throw new Error('Firebase database is not initialized');
      const fetchedProducts = await getAllProducts(db);
      if (fetchedProducts) {
        const formattedProducts = Object.entries(fetchedProducts).map(
          ([name, data]: [string, any]) => ({
            name,
            itemCount: Object.keys(data.items || {}).length,
            items: data.items,
            isStatic: data.isStatic,
            isQrable: data.isQrable,
            boxWeight: data.boxWeight,
          })
        );
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to fetch inventory. Please try again later.');
    }
  };

  const resetModalState = () => {
    setSelectedItems([]);
    setCurrentSellPrice('');
    setProductItems([]);
  };

  const handleProductSelect = async (productName: string) => {
    resetModalState();
    const product = products.find(p => p.name === productName);
    if (!product) return;

    setSelectedProduct(product);
    try {
      if (!db) throw new Error('Firebase database is not initialized');
      const fetchedProduct = await getProduct(db, product.name);
      if (fetchedProduct) {
        if (!fetchedProduct.items || Object.keys(fetchedProduct.items).length === 0) {
          Alert.alert('No Items', 'This product has no items available.');
          setProductItems([]);
          return;
        }
        const formattedItems = Object.entries(fetchedProduct.items).map(
          ([id, item]: [string, any], index) => ({
            id,
            ...item,
            displayName: `القطعة ${getArabicNumeral(index + 1)}`,
          })
        );
        setProductItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Error', 'Failed to fetch product details. Please try again.');
    }
  };

  const getArabicNumeral = (num: number): string => {
    const arabicNumerals = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
    return arabicNumerals[num - 1] || num.toString();
  };

  const handleItemSelect = (item: any) => {
    const existingItem = selectedItems.find((i) => i.id === item.id);
    if (!existingItem) {
      setSelectedItems([...selectedItems, { id: item.id, weight: 0 }]);
    }
  };

  const handleUpdateItemWeight = (itemId: string, weight: string) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.id === itemId ? { ...item, weight: parseFloat(weight) || 0 } : item
      )
    );
  };

  const handleAddToReceipt = () => {
    if (!selectedProduct || selectedItems.length === 0 || !currentSellPrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const items: Record<string, number> = {};
    selectedItems.forEach((item) => {
      if (item.weight > 0) {
        items[item.id] = item.weight;
      }
    });

    setReceipt({
      ...receipt,
      client: clientId,
      products: {
        ...receipt.products,
        [selectedProduct.name]: {
          sellPrice: parseFloat(currentSellPrice),
          items,
        },
      },
    });

    resetModalState();
    setSelectedProduct(null);
    setIsAddModalVisible(false);
  };

  const generatePDF = async () => {
    try {
      if (!receipt.products) throw new Error('No products in receipt');

      let totalAmount = 0;
      const productsHTML = Object.entries(receipt.products)
        .map(([productName, product]) => {
          const totalWeight = Object.values(product.items).reduce((sum, weight) => sum + weight, 0);
          const productTotal = totalWeight * product.sellPrice;
          totalAmount += productTotal;

          const itemsList = Object.entries(product.items)
            .map(([itemId, weight]) => `
              <tr>
                <td>${itemId}</td>
                <td>${weight} kg</td>
                <td>${product.sellPrice} ج.م/kg</td>
                <td>${(weight * product.sellPrice).toFixed(2)} ج.م</td>
              </tr>
            `)
            .join('');

          return `
            <div class="product-section">
              <h3>${productName}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Weight</th>
                    <th>Price per kg</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </div>
          `;
        })
        .join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .header { text-align: center; margin-bottom: 20px; }
              .footer { margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Receipt</h1>
              <p>Date: ${formatDate(new Date())}</p>
            </div>
            ${productsHTML}
            <div class="footer">
              <h3>Total Amount: ${totalAmount.toFixed(2)} ج.م</h3>
              <h3>Money Paid: ${moneyPaid} ج.م</h3>
              <h3>Balance: ${(totalAmount - parseFloat(moneyPaid)).toFixed(2)} ج.م</h3>
            </div>
          </body>
        </html>
      `;

      const options = {
        html,
        fileName: `receipt_${Date.now()}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      return file.filePath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleRemoveProduct = (productName: string) => {
    const updatedProducts = { ...receipt.products };
    delete updatedProducts[productName];
    setReceipt({ ...receipt, products: updatedProducts });
  };

  const calculateTotal = (product: ReceiptProduct) => {
    const totalWeight = Object.values(product.items).reduce((sum, weight) => sum + weight, 0);
    return (totalWeight * product.sellPrice).toFixed(2);
  };

  const handleSaveReceipt = async () => {
    try {
      if (!receipt.products || Object.keys(receipt.products).length === 0) {
        Alert.alert('Error', 'Please add at least one product');
        return;
      }

      const pdfPath = await generatePDF();
      if (!pdfPath) {
        throw new Error('Failed to generate PDF');
      }
      await createReceiptHelper(
        db!,
        clientId,
        parseFloat(moneyPaid),
        pdfPath,
        (bytesTransferred: number, totalBytes: number) => {
          console.log(`Uploaded ${bytesTransferred} of ${totalBytes} bytes`);
        },
        receipt.products
      );

      showMessage({
        message: 'Success',
        description: 'Receipt created successfully',
        type: 'success',
        duration: 3000,
        floating: true,
      });

      refresh();
      onClose();
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    }
  };

  // Render functions
 const renderAddItemModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddModalVisible}
      onRequestClose={() => {
        resetModalState();
        setIsAddModalVisible(false);
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>إضافة منتج</Text>

          <View style={styles.productSelector}>
            <Text style={styles.sectionTitle}>اختر المنتج:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedProduct?.name || ''}
                onValueChange={handleProductSelect}
                style={styles.picker}
              >
                <Picker.Item label="اختر منتج" value="" />
                {products.map((product) => (
                  <Picker.Item
                    key={product.name}
                    label={product.name}
                    value={product.name}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {selectedProduct && productItems.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>القطع المتاحة:</Text>
              <ScrollView style={styles.itemsContainer}>
                <View style={styles.itemsGrid}>
                  {productItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemCard,
                        selectedItems.find(i => i.id === item.id) && styles.selectedItemCard
                      ]}
                      onPress={() => handleItemSelect(item)}
                    >
                      <Text style={styles.itemName}>{item.displayName}</Text>
                      <Text style={styles.itemWeight}>الوزن: {item.weight} كجم</Text>
                      <Text style={styles.itemPrice}>السعر: {item.boughtPrice} ج.م/كجم</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {selectedItems.length > 0 && (
                <View style={styles.selectedItemsSection}>
                  <Text style={styles.sectionTitle}>القطع المختارة:</Text>
                  {selectedItems.map((item) => {
                    const originalItem = productItems.find(i => i.id === item.id);
                    return (
                      <View key={item.id} style={styles.selectedItemContainer}>
                        <Text style={styles.selectedItemName}>
                          {originalItem?.displayName}
                        </Text>
                        <TextInput
                          style={styles.weightInput}
                          placeholder="الوزن (كجم)"
                          keyboardType="numeric"
                          value={item.weight.toString()}
                          onChangeText={(text) => handleUpdateItemWeight(item.id, text)}
                        />
                      </View>
                    );
                  })}
                  
                  <TextInput
                    style={styles.priceInput}
                    placeholder="سعر البيع (ج.م/كجم)"
                    keyboardType="numeric"
                    value={currentSellPrice}
                    onChangeText={setCurrentSellPrice}
                  />
                </View>
              )}
            </>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => {
                resetModalState();
                setIsAddModalVisible(false);
              }}
            >
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.addButton]}
              onPress={handleAddToReceipt}
            >
              <Text style={styles.buttonText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


 return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.headerText}>إنشاء فاتورة</Text>

        <TouchableOpacity 
          style={styles.addProductButton} 
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.addProductButtonText}>إضافة منتج</Text>
        </TouchableOpacity>

        {receipt.products && Object.entries(receipt.products).map(([productName, product]) => (
          <View key={productName} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{productName}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveProduct(productName)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.productPrice}>
              سعر البيع: {product.sellPrice} ج.م/كجم
            </Text>
            <Text style={styles.productTotal}>
              الإجمالي: {calculateTotal(product)} ج.م
            </Text>
            
            <View style={styles.itemsList}>
              {Object.entries(product.items).map(([itemId, weight], index) => (
                <Text key={itemId} style={styles.itemText}>
                  القطعة {getArabicNumeral(index + 1)}: {weight} كجم
                </Text>
              ))}
            </View>
          </View>
        ))}

        <TextInput
          style={styles.moneyInput}
          placeholder="المبلغ المدفوع (ج.م)"
          keyboardType="numeric"
          value={moneyPaid}
          onChangeText={setMoneyPaid}
          placeholderTextColor="#666"
        />

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveReceipt}
        >
          <Text style={styles.buttonText}>حفظ الفاتورة</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderAddItemModal()}
    </View>
  );
};




const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 20,
  },
  addProductButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addProductButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 24,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
    color: '#1e40af',
    marginBottom: 4,
  },
  productTotal: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 8,
  },
  itemsList: {
    marginTop: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  moneyInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    color: '#0f172a',
  },
  itemsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedItemCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#334155',
  },
  selectedItemsSection: {
    marginTop: 16,
  },
  selectedItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedItemName: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  weightInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 8,
    width: 100,
    textAlign: 'right',
    color: '#0f172a',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    fontSize: 16,
    textAlign: 'right',
    color: '#0f172a',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  footerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  addButton: {
    backgroundColor: '#2563eb',
  },
  productSelector: {
    marginBottom: 16,
  },
});

export default CreateReceipt;