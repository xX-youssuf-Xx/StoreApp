import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { getAllProducts } from '../utils/inventory';
import TopNav from '../../src/components/TopNav';
import Icon from 'react-native-vector-icons/FontAwesome';
import FileViewer from 'react-native-file-viewer';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { cowLogoBase64 } from '../utils/imageAssets';
import { Product } from '../utils/types';

interface ProductSummary {
  name: string;
  remainingWeight: number;
  averagePrice: number;
  unit: string;
}

const StorageDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsSummary, setProductsSummary] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getAllProducts(db!);
      if (products) {
        const formattedProducts = Object.entries(products).map(
          ([name, data]): Product => {
            // Count only items with weight > 0
            const validItemsCount = Object.values(data.items || {}).filter(
              (item: any) => item && item.weight > 0
            ).length;

            return {
              name,
              itemCount: validItemsCount,
              items: data.items,
              status: data.status,
              isStatic: Boolean(data.isStatic),
              isQrable: Boolean(data.isQrable),
              boxWeight: Number(data.boxWeight) || 0,
            };
          }
        ).filter(product => !product.status || product.status != 'deleted');
        
        setProducts(formattedProducts);
        
        // Generate product summary for the list
        const summary = formattedProducts
          .map(product => {
            const validItems = Object.values(product.items || {}).filter(
              (item: any) => item && item.weight > 0
            );

            if (validItems.length > 0) {
              let remainingWeight = validItems.reduce(
                (sum, item) => sum + item.weight,
                0
              );
              
              const averagePrice = validItems.reduce(
                (sum, item) => sum + item.boughtPrice,
                0
              ) / validItems.length;

              // For static products, divide by boxWeight
              const unit = product.isStatic && product.boxWeight > 0 ? 'قطعة' : 'كيلو';
              
              if (product.isStatic && product.boxWeight > 0) {
                remainingWeight = remainingWeight / product.boxWeight;
              }

              return {
                name: product.name,
                remainingWeight,
                averagePrice,
                unit
              };
            }
            return null;
          })
          .filter((item): item is ProductSummary => item !== null);

        setProductsSummary(summary);
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          const errorMessage = 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا';
          setError(errorMessage);
          showMessage({
            message: 'Error',
            description: errorMessage,
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else {
          console.error('An error occurred with code:', error.code);
          setError('An unexpected error occurred');
        }
      } else {
        console.error('An unexpected error occurred:', error);
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInventory();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getInventory().finally(() => setRefreshing(false));
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const printSummary = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page { size: A5 portrait; margin: 5mm; }
              body {
                font-family: 'Cairo', Arial, sans-serif;
                margin: 0;
                padding: 10px;
                background-color: white;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 10px;
              }
              
              .header-right {
                order: 1;
              }
              
              .header-center {
                order: 2;
                text-align: center;
                flex-grow: 1;
              }
              
              .header-left {
                order: 3;
                text-align: left;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
              }
  
              .logo {
                width: 60px;
                height: 60px;
              }
              .company-info {
                text-align: center;
                margin-bottom: 20px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 5px 0;
              }
              .company-phone {
                font-size: 16px;
                color: #666;
              }
              .title {
                font-size: 28px;
                text-align: center;
                margin: 15px 0;
                color: #000;
                font-weight: bold;
              }
              .date {
                font-size: 16px;
                text-align: center;
                color: #666;
                margin: 15px 0 25px 0;
                font-weight: bold;
              }
              .products-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .products-table th {
                background-color: #e9ecef;
                color: #2196F3;
                padding: 10px;
                text-align: center;
                border: 1px solid #dee2e6;
                font-size: 16px;
              }
              .products-table td {
                padding: 8px;
                text-align: center;
                border: 1px solid #dee2e6;
                font-size: 14px;
              }
              .products-table tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .product-name {
                text-align: right;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-right">
                <img src="${cowLogoBase64}" class="logo" />
              </div>
              <div class="header-center">
                <div class="company-name">البركة للحوم المجمدة</div>
              </div>
              <div class="header-left">
                <div class="contact-info">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
                <div class="contact-info">ت/01024963110</div>
              </div>
            </div>
            
            <div class="title">ملخص المخزون</div>
  
            <table class="products-table">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>الكمية المتبقية</th>
                  <th>متوسط السعر</th>
                </tr>
              </thead>
              <tbody>
                ${productsSummary.map(product => `
                  <tr>
                    <td class="product-name">${product.name}</td>
                    <td>${product.remainingWeight.toFixed(2)} ${product.unit}</td>
                    <td>${product.averagePrice.toFixed(2)} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
  
      const options = {
        html: htmlContent,
        fileName: 'inventory_summary',
        directory: 'Documents',
        width: 148,
        height: 210,
      };
  
      const file = await RNHTMLtoPDF.convert(options);
  
      if (file.filePath) {
        await FileViewer.open(file.filePath, {showOpenWithDialog: true});
      } else {
        throw new Error('PDF file path is undefined');
      }
    } catch (error) {
      console.error('Error generating or opening PDF:', error);
      Alert.alert('Error', `Failed to generate or open the PDF: ${error}`);
    }
  };

  const renderProductItem = ({ item }: { item: ProductSummary }) => {
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productDetails}>
            <Text style={styles.productDetailText}>
              الكمية المتبقية: {item.remainingWeight.toFixed(2)} {item.unit}
            </Text>
            <Text style={styles.productDetailText}>
              متوسط السعر: {item.averagePrice.toFixed(2)} ج.م
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>لا توجد منتجات متاحة</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={getInventory}>
        <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <TopNav
        title="ملخص المخزون"
        onBackPress={handleBackPress}
        onSettingsPress={() => {}}  
        onSearchChange={() => {}}
        showBackButton={true}
        showSearchIcon={false}
      />
      <View style={styles.container}>
        {error ? (
          renderError()
        ) : (
          <FlatList
            data={productsSummary}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']} // Android
                tintColor="#2196F3" // iOS
              />
            }
          />
        )}
      </View>

      {/* Print Button */}
      <TouchableOpacity 
        style={styles.printButton} 
        onPress={printSummary}
      >
        <Icon name="print" size={24} color="#fff" />
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRightWidth: 4,
    borderRightColor: '#348feb',
    flexDirection: 'row', // Change direction to row-reverse for RTL
  },
  productInfo: {
    flex: 1,
    alignItems: 'flex-start', // Changed from flex-end to flex-start
    alignSelf: 'flex-end', // Add this to ensure alignment to the right edge
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'System',
    width: '100%', // Ensure the text takes the full width
  },
  productDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start', // Changed from flex-end to flex-start
    marginTop: 4,
    paddingHorizontal: 4,
    width: '100%', // Ensure the container takes the full width
  },
  productDetailText: {
    fontSize: 14,
    color: '#484848',
    textAlign: 'right', // Keep text-align right
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 2,
    width: '100%', // Ensure the text takes the full width
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#348feb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  printButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#348feb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});

export default StorageDetailsScreen;