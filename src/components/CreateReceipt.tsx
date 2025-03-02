import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {useFirebase} from '../context/FirebaseContext';
import {getAllProducts, getProduct} from '../utils/inventory';
import {createReceiptHelper} from '../utils/receipts';
import {showMessage} from 'react-native-flash-message';
import {formatDate} from '../utils/dateFormatter';
import {Picker} from '@react-native-picker/picker';
import {ReceiptProduct} from '../utils/types';
import QrReader from './QrReader';

interface Props {
  clientId: string;
  clientName: String | null;
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

const CreateReceipt: React.FC<Props> = ({
  clientId,
  clientName,
  onClose,
  refresh,
}) => {
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
  const {db} = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [boxCount, setBoxCount] = useState<Record<string, string>>({});
  const [weightSearch, setWeightSearch] = useState('');
  const [productOrder, setProductOrder] = useState<string[]>([]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          }),
        );
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert(
        'Error',
        'Failed to fetch inventory. Please try again later.',
      );
    }
  };

  const resetModalState = () => {
    setSelectedItems([]);
    setCurrentSellPrice('');
    setProductItems([]);
  };

  // Update the handleProductSelect function to sort items by order
  const handleProductSelect = async (productName: string) => {
    resetModalState();
    const product = products.find(p => p.name === productName);
    if (!product) return;

    setSelectedProduct(product);
    try {
      if (!db) throw new Error('Firebase database is not initialized');
      const fetchedProduct = await getProduct(db, product.name);
      if (fetchedProduct) {
        if (
          !fetchedProduct.items ||
          Object.keys(fetchedProduct.items).length === 0
        ) {
          Alert.alert('No Items', 'This product has no items available.');
          setProductItems([]);
          return;
        }

        const formattedItems = Object.entries(fetchedProduct.items)
          .map(([id, item]: [string, any], index) => ({
            id,
            ...item,
            displayName: `القطعة ${getArabicNumeral(index + 1)}`,
          }))
          .filter(item => item.weight > 0);

        // Sort items by order property
        const sortedItems = formattedItems.sort((a, b) => {
          // Items with order property come first
          if (a.order !== undefined && b.order === undefined) return -1;
          if (a.order === undefined && b.order !== undefined) return 1;
          // If both have order, sort by order value
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // If neither has order, maintain original order
          return 0;
        });

        setProductItems(sortedItems);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert(
        'Error',
        'Failed to fetch product details. Please try again.',
      );
    }
  };

  const getArabicNumeral = (num: number): string => {
    const arabicNumerals = [
      'الأولى',
      'الثانية',
      'الثالثة',
      'الرابعة',
      'الخامسة',
      'السادسة',
      'السابعة',
      'الثامنة',
      'التاسعة',
      'العاشرة',
    ];
    return arabicNumerals[num - 1] || num.toString();
  };

  const handleItemSelect = (item: any) => {
    const existingItem = selectedItems.find(i => i.id === item.id);
    if (!existingItem) {
      setSelectedItems([
        ...selectedItems,
        {
          id: item.id,
          weight: item.weight, // Use the full weight
        },
      ]);
    }
  };

  // Modify handleAddToReceipt function
  const handleAddToReceipt = () => {
    if (!selectedProduct || selectedItems.length === 0 || !currentSellPrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Sort selected items by their original order in productItems
    const sortedSelectedItems = [...selectedItems].sort((a, b) => {
      const itemA = productItems.find(item => item.id === a.id);
      const itemB = productItems.find(item => item.id === b.id);

      if (!itemA || !itemB) return 0;
      return (itemA.order || 0) - (itemB.order || 0);
    });

    const items: Record<string, number> = {};
    sortedSelectedItems.forEach(item => {
      if (item.weight > 0) {
        items[item.id] = item.weight;
      }
    });

    const productKey = selectedProduct.name;

    // Calculate next Pnumber
    const currentProducts = receipt.products || {};
    const nextPnumber = Object.keys(currentProducts).length + 1;

    // Update productOrder state
    setProductOrder(prev => {
      const newOrder = prev.filter(key => key !== productKey);
      return [...newOrder, productKey];
    });

    setReceipt({
      ...receipt,
      client: clientId,
      products: {
        ...receipt.products,
        [productKey]: {
          sellPrice: parseFloat(currentSellPrice),
          items,
          Pnumber: nextPnumber, // Add the Pnumber property
        },
      },
    });

    resetModalState();
    setSelectedProduct(null);
    setIsAddModalVisible(false);
  };

  const handleRemoveProduct = (productName: string) => {
    const updatedProducts = {...receipt.products};
    delete updatedProducts[productName];

    // Reorder remaining products
    Object.values(updatedProducts).forEach((product, index) => {
      product.Pnumber = index + 1;
    });

    setReceipt({...receipt, products: updatedProducts});
  };

  // Add a helper function for rounding
  const roundToTwoDecimals = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // Update the calculateTotal function
  const calculateTotal = (product: ReceiptProduct) => {
    const totalWeight = Object.values(product.items).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    return roundToTwoDecimals(totalWeight * product.sellPrice).toFixed(2);
  };

  const handleSaveReceipt = async () => {
    try {
      // If there are no products, create a dummy product with zero values
      if (!receipt.products || Object.keys(receipt.products).length === 0) {
        setReceipt({
          ...receipt,
          client: clientId,
          products: {
            'تعديل رصيد': {
              sellPrice: 0,
              totalWeight: 0,
              Pnumber: 1, // Add Pnumber
              items: {'تعديل رصيد': 0},
            },
          },
        });
      }

      const finalMoneyPaid = moneyPaid === '' ? '0' : moneyPaid;

      await createReceiptHelper(
        db!,
        clientId,
        parseFloat(finalMoneyPaid),
        'pdfPath',
        (bytesTransferred: number, totalBytes: number) => {
          console.log(`Uploaded ${bytesTransferred} of ${totalBytes} bytes`);
        },
        receipt.products || {
          'تعديل رصيد': {
            sellPrice: 0,
            totalWeight: 0,
            Pnumber: 1, // Add Pnumber
            items: {'تعديل رصيد': 0},
          },
        },
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

  const handleQrScan = (scannedData: string[]) => {
    if (scannedData.length > 0) {
      const scannedQr = scannedData[0];
      const matchingItem = productItems.find(
        item => item.qrString === scannedQr && item.weight > 0,
      );

      if (matchingItem) {
        handleItemSelect(matchingItem);
        showMessage({
          message: 'نجاح',
          description: 'تم العثور على المنتج وإضافته',
          type: 'success',
          duration: 2000,
          floating: true,
        });
      } else {
        showMessage({
          message: 'خطأ',
          description: 'لم يتم العثور على المنتج',
          type: 'danger',
          duration: 2000,
          floating: true,
        });
      }
    }
  };

  // Render functions
  const renderProductSelector = () => (
    <View style={styles.productSelector}>
      <Text style={styles.sectionTitle}>اختر المنتج:</Text>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن منتج"
            placeholderTextColor="#000000"
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              setIsDropdownVisible(true);
            }}
            onFocus={() => setIsDropdownVisible(true)}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setIsQrScannerVisible(true)}>
            <Icon name="qr-code-scanner" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {isDropdownVisible && searchQuery.length > 0 && (
          <View style={styles.dropdownContainer}>
            <ScrollView
              style={styles.dropdown}
              keyboardShouldPersistTaps="handled">
              {filteredProducts.map(product => (
                <TouchableOpacity
                  key={product.name}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleProductSelect(product.name);
                    setSearchQuery(product.name);
                    setIsDropdownVisible(false);
                  }}>
                  <Text style={styles.dropdownItemText}>{product.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderAddItemModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddModalVisible}
      onRequestClose={() => {
        resetModalState();
        setIsAddModalVisible(false);
      }}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>إضافة منتج</Text>
          {renderProductSelector()}

          {!selectedProduct?.isStatic && (
            <TextInput
              style={styles.input}
              placeholder="بحث بالوزن (lb)"
              placeholderTextColor={'#000'}
              keyboardType="numeric"
              value={weightSearch}
              onChangeText={text => {
                setWeightSearch(text);
                const searchWeight = parseFloat(text);
                if (!isNaN(searchWeight)) {
                  const sortedItems = [...productItems].sort((a, b) => {
                    const aLbs = a.weight / 0.455;
                    const bLbs = b.weight / 0.455;
                    return (
                      Math.abs(aLbs - searchWeight) -
                      Math.abs(bLbs - searchWeight)
                    );
                  });
                  setProductItems(sortedItems);
                }
              }}
            />
          )}
          {selectedProduct && productItems.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>القطع المتاحة:</Text>
              <ScrollView style={styles.itemsContainer}>
                <View style={styles.itemsGrid}>
                  {productItems.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemCard,
                        selectedItems.find(i => i.id === item.id) &&
                          styles.selectedItemCard,
                      ]}
                      onPress={() => handleItemSelect(item)}>
                      {/* <Text style={styles.itemName}>{item.displayName}</Text> */}
                      {selectedProduct.isStatic ? (
                        <>
                          <Text style={styles.itemWeight}>
                            عدد العبوات:{' '}
                            {Math.floor(
                              item.weight / selectedProduct.boxWeight,
                            )}
                          </Text>
                          <Text style={styles.itemPrice}>
                            السعر: {item.boughtPrice} ج.م
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.itemWeight}>
                          الوزن: {(item.weight / 0.455).toFixed(2)} lb
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <View style={styles.selectedItemsWrapper}>
            <Text style={styles.sectionTitle}>القطع المختارة:</Text>
            <ScrollView style={styles.selectedItemsScroll}>
              <View style={styles.selectedItemsContainer}>
                {selectedItems.map(item => {
                  const originalItem = productItems.find(i => i.id === item.id);
                  const product = selectedProduct; // We already have the selected product
                  return (
                    <View key={item.id} style={styles.selectedItemBadge}>
                      <View style={styles.badgeMain}>
                        <Text style={styles.badgeText}>
                          {originalItem?.displayName}
                        </Text>
                        {product?.isStatic ? (
                          <View style={styles.boxCountContainer}>
                            <TextInput
                              style={styles.boxCountInput}
                              placeholder="عدد العبوات"
                              placeholderTextColor="#999"
                              keyboardType="numeric"
                              value={boxCount[item.id] || ''}
                              onChangeText={value => {
                                const numBoxes = parseInt(value) || 0;
                                setBoxCount(prev => ({
                                  ...prev,
                                  [item.id]: value,
                                }));
                                setSelectedItems(prev =>
                                  prev.map(si =>
                                    si.id === item.id
                                      ? {
                                          ...si,
                                          weight:
                                            numBoxes *
                                            (product?.boxWeight || 0),
                                        }
                                      : si,
                                  ),
                                );
                              }}
                            />
                            <Text style={styles.boxLabel}>عبوة</Text>
                          </View>
                        ) : (
                          <Text style={styles.weightText}>
                            {(item.weight / 0.455).toFixed(2)} lb
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          setSelectedItems(prev =>
                            prev.filter(si => si.id !== item.id),
                          );
                          setBoxCount(prev => {
                            const newBoxCount = {...prev};
                            delete newBoxCount[item.id];
                            return newBoxCount;
                          });
                        }}>
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholderTextColor={'#000'}
              placeholder="سعر البيع"
              keyboardType="numeric"
              value={currentSellPrice}
              onChangeText={setCurrentSellPrice}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => {
                resetModalState();
                setIsAddModalVisible(false);
              }}>
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.addButton]}
              onPress={handleAddToReceipt}>
              <Text style={styles.buttonText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.headerText}>إنشاء فاتورة</Text>

        {receipt.products &&
          Object.entries(receipt.products)
            .sort(([, a], [, b]) => a.Pnumber - b.Pnumber)
            .map(([productKey, product]) => {
              return (
                <View key={productKey} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{productKey}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveProduct(productKey)}>
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
                    {Object.entries(product.items).map(
                      ([itemId, weight], index) => (
                        <Text key={itemId} style={styles.itemText}>
                          القطعة {getArabicNumeral(index + 1)}: {weight} كجم
                        </Text>
                      ),
                    )}
                  </View>
                </View>
              );
            })}

        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => setIsAddModalVisible(true)}>
          <Text style={styles.addProductButtonText}>إضافة منتج</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.moneyInput}
          placeholder="0"
          keyboardType="decimal-pad"
          value={moneyPaid}
          onChangeText={text => {
            // Allow negative sign, digits, and one decimal point
            if (/^-?\d*\.?\d*$/.test(text) || text === '-') {
              const numValue = text === '-' ? 0 : parseFloat(text);
              if (!isNaN(numValue)) {
                setMoneyPaid(text);
              } else {
                setMoneyPaid('0');
              }
            }
          }}
          placeholderTextColor="#666"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveReceipt}>
          <Text style={styles.buttonText}>اتمام العملية </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderAddItemModal()}
      <QrReader
        isVisible={isQrScannerVisible}
        onClose={() => setIsQrScannerVisible(false)}
        onScan={handleQrScan}
        continuousScan={false}
      />
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
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '60%',
    alignSelf: 'center',
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
    borderRadius: 16,
    padding: 24,
    maxHeight: '95%', // Increased from 90%
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
    height: 200,
    marginBottom: 16,
    flex: 0, // Prevent flex growing
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedItemCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  selectedItemsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedItemsBadgeContainer: {
    maxHeight: 150, // Fixed height
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badgeRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRemoveText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
  },
  sellPriceInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
    textAlign: 'right',
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
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: '#ffffff',
    color: '#000000',
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 2,
  },
  dropdown: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'row',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'right',
  },
  itemTotalWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'right',
  },
  itemQR: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  itemName: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  productDetailsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  staticProductDetails: {
    gap: 8,
  },
  boxInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  weightSearch: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedItemsWrapper: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    height: 150, // Fixed height
  },
  selectedItemsScroll: {
    flex: 1, // Take remaining space
  },
  selectedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8, // Add some padding at the bottom
  },
  selectedItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8, // Reduced padding
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 4,
  },
  badgeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
    color: '#2d3436',
    marginRight: 8,
  },
  boxCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boxLabel: {
    fontSize: 12,
    color: '#636e72',
  },
  weightText: {
    fontSize: 14,
    color: '#636e72',
  },
  removeButton: {
    width: 18, // Reduced size
    height: 18, // Reduced size
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 5,
  },
  boxCountInput: {
    width: 80,
    height: 35,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14, // Reduced size
    fontWeight: 'bold',
    lineHeight: 14,
  },
});

export default CreateReceipt;
