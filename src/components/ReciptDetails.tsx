import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {Receipt, ReceiptProduct} from '../utils/types';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';

interface ReceiptDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  receipt: Receipt | undefined;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({
  isVisible,
  onClose,
  receipt,
}) => {
  const [expandedProducts, setExpandedProducts] = useState<{
    [key: string]: boolean;
  }>({});

  const calculateTotal = (product: ReceiptProduct) => {
    if (!product) return 0;
    return ((product.totalWeight || 0) * (product.sellPrice || 0)).toFixed(2);
  };
      
  const calculateNetBalance = () => {
    if (!receipt) return 0;
    return ((receipt.initialBalance || 0) + (receipt.totalPrice || 0) - (receipt.moneyPaid || 0)).toFixed(2);
  };

  const toggleProductExpansion = (productName: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  const getArabicOrdinal = (number: number) => {
    const ordinals = [
      'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'
    ];
    return ordinals[number - 1] || number.toString();
  };

  const generateReceiptHTML = () => {
    const productRows = receipt?.products
      ? Object.entries(receipt.products)
          .map(
            ([productName, product]) => `
              <div class="product-card">
                <div class="product-header">
                  <span class="product-weight">الوزن: ${
                    product.totalWeight ?? 'غير محدد'
                  } كجم</span>
                  <span class="product-name">${productName}</span>
                </div>
                <div class="product-details">
                  <span class="product-total">${calculateTotal(product)} ج.م</span>
                  <span class="product-price">السعر: ${
                    product.sellPrice
                  } ج.م/كجم</span>
                </div>
                <div class="items-container">
                  ${Object.entries(product.items || {})
                    .reduce((rows, [itemId, weight], index) => {
                      if (index % 2 === 0) rows.push([]);
                      rows[rows.length - 1].push(`
                        <div class="item-text">القطعة ${getArabicOrdinal(index + 1)}  :  ${weight} كجم</div>
                      `);
                      return rows;
                    }, [] as string[][])
                    .map(row => `<div class="item-row">${row.join('')}</div>`)
                    .join('')}
                </div>
              </div>
            `
          )
          .join('')
      : '';

    return `
      <html dir="rtl">
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
            .text { font-size: 16px; margin-bottom: 10px; }
            .subtitle { font-size: 20px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
            .product-card { 
              background-color: #f9f9f9; 
              border-radius: 10px; 
              padding: 15px; 
              margin-bottom: 15px;
            }
            .product-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .product-name { font-size: 18px; font-weight: bold; }
            .product-weight { font-size: 14px; color: #666; }
            .product-details { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .product-total { font-size: 16px; font-weight: bold; color: #2196F3; }
            .product-price { font-size: 14px; color: #666; }
            .items-container { border-top: 1px solid #eee; padding-top: 10px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-text { font-size: 14px; color: #666; width: 48%; }
            .summary { background-color: #f5f5f5; border-radius: 10px; padding: 15px; margin-top: 20px; }
            .summary-text { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .summary-label { font-size: 14px; color: #666; }
            .summary-value { font-size: 14px; font-weight: bold; }
            .net-balance { color: #4CAF50; }
          </style>
        </head>
        <body>
          <h1 class="title">تفاصيل الإيصال</h1>
          
          <p class="text">رقم العميل: ${receipt?.client || 'غير محدد'}</p>
          <p class="text">الرصيد الأولي: ${receipt?.initialBalance || 0} ج.م</p>
  
          <h2 class="subtitle">المنتجات:</h2>
  
          ${productRows || '<p>لا توجد منتجات لهذا الإيصال</p>'}
  
          <div class="summary">
            <p class="summary-text">ملخص الحساب:</p>
            <div class="summary-row">
              <span class="summary-label">الرصيد الأولي:</span>
              <span class="summary-value">${receipt?.initialBalance || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">إجمالي تكلفة المنتجات:</span>
              <span class="summary-value">${receipt?.totalPrice || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">المبلغ المدفوع:</span>
              <span class="summary-value">${receipt?.moneyPaid || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">الصافي:</span>
              <span class="summary-value net-balance">${calculateNetBalance()} ج.م</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    try {
      if (typeof RNHTMLtoPDF.convert !== 'function') {
        throw new Error('RNHTMLtoPDF.convert is not a function');
      }

      const options = {
        html: generateReceiptHTML(),
        fileName: `receipt_${receipt?.client || 'unknown'}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (file.filePath) {
        console.log('PDF saved to:', file.filePath);
        await FileViewer.open(file.filePath, { showOpenWithDialog: true });
      } else {
        throw new Error('PDF file path is undefined');
      }
    } catch (error) {
      console.error('Error generating or opening PDF:', error);
      Alert.alert('Error', `Failed to generate or open the PDF receipt: ${error}`);
    }
  };

  if (!receipt) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.title}>خطأ في تحميل الإيصال</Text>
            <Text style={styles.text}>لا يمكن العثور على تفاصيل الإيصال.</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.title}>تفاصيل الإيصال</Text>

            <Text style={styles.text}>رقم العميل: {receipt.client || 'غير محدد'}</Text>
            <Text style={styles.text}>
              تاريخ الإيصال : {receipt.createdAt || 'غير محدد'}
            </Text>

            <Text style={styles.subtitle}>المنتجات:</Text>

            {receipt.products &&
            Object.entries(receipt.products).length > 0 ? (
              Object.entries(receipt.products).map(
                ([productName, product], index) => (
                  <View key={index} style={styles.productCard}>
                    <TouchableOpacity
                      onPress={() => toggleProductExpansion(productName)}>
                      <View style={styles.productHeader}>
                        <Text style={styles.productDetail}>
                          الوزن: {product.totalWeight ?? 'غير محدد'} كجم
                        </Text>
                        <Text style={styles.productName}>{productName}</Text>
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={styles.productTotal}>
                          {calculateTotal(product)} ج.م
                        </Text>
                        <Text style={styles.productDetail}>
                          السعر: {product.sellPrice} ج.م/كجم
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {expandedProducts[productName] && product.items && (
                      <View style={styles.itemsContainer}>
                        {Object.entries(product.items)
                          .reduce((rows, [itemId, weight], index) => {
                            if (index % 2 === 0) rows.push([]);
                            rows[rows.length - 1].push(
                              <Text key={itemId} style={styles.itemText}>
                                القطعة {getArabicOrdinal(index + 1)} : {weight} كجم
                              </Text>
                            );
                            return rows;
                          }, [] as React.ReactNode[][])
                          .map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.itemRow}>
                              {row}
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                ),
              )
            ) : (
              <Text style={styles.noProductsText}>
                لا توجد منتجات لهذا الإيصال
              </Text>
            )}

            <View style={styles.summary}>
              <Text style={styles.summaryText}>ملخص الحساب:</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.initialBalance || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>الرصيد الأولي:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.totalPrice || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>إجمالي تكلفة المنتجات:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.moneyPaid || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>المبلغ المدفوع:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryValue, styles.netBalance]}>
                  {calculateNetBalance()} ج.م
                </Text>
                <Text style={styles.summaryLabel}>الصافي:</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.printButton}
              onPress={handleGeneratePDF}>
              <Text style={styles.buttonText}>طباعة الإيصال</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  noProductsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  netBalance: {
    color: '#4CAF50',
  },
  printButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});

export default ReceiptDetails;
