// types.ts
export interface ReceiptProduct {
  items: {[key: string]: number};
  sellPrice: number;
  totalWeight: number;
}

// ReceiptDetails.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import {Receipt} from '../utils/types';

interface ReceiptDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  receipt: Receipt;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({
  isVisible,
  onClose,
  receipt,
}) => {
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

            <Text style={styles.text}>رقم العميل: {receipt?.client}</Text>
            <Text style={styles.text}>
              الرصيد الأولي: {receipt?.initialBalance} ج.م
            </Text>
            <Text style={styles.text}>
              المبلغ المدفوع: {receipt?.moneyPaid} ج.م
            </Text>
            <Text style={styles.text}>الإجمالي: {receipt?.totalPrice} ج.م</Text>

            <Text style={styles.subtitle}>المنتجات:</Text>
            {receipt && (
              <>
                {Object.entries(receipt?.products).map(
                  ([productName, productDetails]) => (
                    <View key={productName} style={styles.productContainer}>
                      <Text style={styles.productName}>{productName}</Text>
                      <Text style={styles.productDetail}>
                        سعر البيع: {productDetails.sellPrice} ج.م
                      </Text>
                      <Text style={styles.productDetail}>
                        الوزن الإجمالي: {productDetails.totalWeight} كجم
                      </Text>
                      <Text style={styles.productDetail}>التفاصيل:</Text>
                      {Object.entries(productDetails.items).map(
                        ([itemId, weight]) => (
                          <Text key={itemId} style={styles.itemDetail}>
                            - العنصر {itemId}: {weight} كجم
                          </Text>
                        ),
                      )}
                    </View>
                  ),
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'center',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    alignSelf: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  productContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDetail: {
    fontSize: 14,
    marginBottom: 3,
  },
  itemDetail: {
    fontSize: 12,
    marginLeft: 10,
    color: '#666',
  },
});

export default ReceiptDetails;
