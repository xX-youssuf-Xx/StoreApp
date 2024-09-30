import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import TopNav from '../../src/components/TopNav';
import {useFirebase} from '../context/FirebaseContext';
import {FirebaseError} from '../errors/FirebaseError';
import {FIREBASE_ERROR} from '../config/Constants';
import {showMessage} from 'react-native-flash-message';
import {
  createReceiptHelper,
  getAllReceipts,
  getReceipt,
} from '../utils/receipts';
import {
  createClient,
  getAllClients,
  getClient,
  getClientReceiptsHelper,
} from '../utils/clitent';
import {productsReceiptQuery, ReceiptProduct, Receipt} from '../utils/types';
import ReceiptDetails from '../components/ReciptDetails';

interface Client {
  id: string;
  name: string;
  number: string;
  balance: number;
  receiptsCount: number;
}

type ClientDetailsRouteProp = RouteProp<
  {ClientDetails: {client: Client}},
  'ClientDetails'
>;

const ClientDetailsScreen = () => {
  const [isReceiptDetailsVisible, setIsReceiptDetailsVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const navigation = useNavigation();
  const route = useRoute<ClientDetailsRouteProp>();
  const {client} = route.params;
  const {db} = useFirebase();
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    getClientReceipts(client.id);
  }, [client.id]);

  const getClientReceipts = async (clientUuid: string) => {
    console.log("used client uuid : ", clientUuid);
    try {
      const fetchedReceipts = await getClientReceiptsHelper(db!, clientUuid);
      if (fetchedReceipts) {
        console.log("fetchedReceipts:", fetchedReceipts);
        const formattedReceipts = Object.entries(fetchedReceipts)
          .filter(([_, data]) => data !== null) // Filter out null receipts
          .map(([id, data]) => ({
            id,
            client: data.client,
            initialBalance: data.initialBalance || 0,
            moneyPaid: data.moneyPaid || 0,
            totalPrice: data.totalPrice || 0,
            products: data.products || {},
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
          }));
        setReceipts(formattedReceipts);
        console.log('formatted : ', formattedReceipts);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const getReceiptDetails = async (receiptUuid: string) => {
    console.log('received receipt uuid', receiptUuid);
    try {
      const receipt = await getReceipt(db!, receiptUuid);
      if (receipt) {
        console.log('receipt details:', receipt.products);
        setSelectedReceipt(receipt);
        setIsReceiptDetailsVisible(true);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const createReceipt = async (
    moneyPaid: number,
    products: productsReceiptQuery,
    pdfPath: string,
    uploadStateChange: (bytesTransferred: number, totalBytes: number) => void,
  ) => {
    try {
      const receiptUuid = await createReceiptHelper(
        db!,
        client.id,
        moneyPaid,
        products,
        pdfPath,
        uploadStateChange,
      );
      if (receiptUuid) {
        console.log('New receipt created:', receiptUuid);
        getClientReceipts(client.id); // Refresh the receipts list
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof FirebaseError) {
      if (error.code === FIREBASE_ERROR) {
        showMessage({
          message: 'Error',
          description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
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
  };

  const renderReceiptItem = ({item}: {item: Receipt}) => (
    <TouchableOpacity
      style={styles.receiptItem}
      onPress={() => getReceiptDetails(item.id)}>
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptDate}>{item.createdAt}</Text>
        <Text style={styles.receiptAmount}>المبلغ: {item.moneyPaid} ج.م</Text>
      </View>
      <View>
        <Text style={styles.receiptBalance}>
          الرصيد الأولي: {item.initialBalance} ج.م
        </Text>
        <Text style={styles.receiptTotal}>الإجمالي: {item.totalPrice} ج.م</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TopNav
        title={`تفاصيل العميل: ${client.name}`}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        showSearchIcon={false}
        onSettingsPress={function (): void {}}
        onSearchChange={function (text: string): void {}}
      />
      <View style={styles.container}>
        <View style={styles.clientSummary}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientNumber}>{client.number}</Text>
          <Text style={styles.clientBalance}>
            {' '}
            الرصيد:الحالي {client.balance} ج.م
          </Text>
        </View>
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {selectedReceipt && (
        <ReceiptDetails
          isVisible={isReceiptDetailsVisible}
          onClose={() => setIsReceiptDetailsVisible(false)}
          receipt={selectedReceipt}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
  },
  clientSummary: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clientNumber: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  clientBalance: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 10,
  },
  listContainer: {
    padding: 10,
  },
  receiptItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  receiptInfo: {
    alignItems: 'flex-end',
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  receiptBalance: {
    fontSize: 14,
    color: '#666',
  },
  receiptTotal: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 5,
  },
});

export default ClientDetailsScreen;
