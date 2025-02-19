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
import AddButton from '../components/AddButton';
import CreateReceipt from '../components/CreateReceipt';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [isReceiptDetailsVisible, setIsReceiptDetailsVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedReceiptUUid, setSelectedReceiptUUid] = useState<String | null>(
    null,
  );

  const navigation = useNavigation();
  const route = useRoute<ClientDetailsRouteProp>();
  const {client} = route.params;
  const {db} = useFirebase();
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    getClientReceipts(client.id);
  }, [client.id]);

  const getClientReceipts = async (clientUuid: string) => {
    console.log('used client uuid : ', clientUuid);
    try {
      const fetchedReceipts = await getClientReceiptsHelper(db!, clientUuid);
      if (fetchedReceipts) {
        console.log('fetchedReceipts:', fetchedReceipts);
        const formattedReceipts = Object.entries(fetchedReceipts)
          .filter(([_, data]) => data !== null) // Filter out null receipts
          .map(([id, data]) => ({
            id,
            Rnumber: data.Rnumber || 0, // Add Rnumber
            client: data.client,
            initialBalance: data.initialBalance || 0,
            moneyPaid: data.moneyPaid || 0,
            totalPrice: data.totalPrice || 0,
            products: data.products || {},
            createdAt: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString()
              : 'N/A',
            // Add raw date for sorting
            rawDate: data.createdAt ? new Date(data.createdAt) : new Date(0),
          }))
          .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()); // Sort by date, newest first

        // Remove rawDate before setting state
        const receiptsForState = formattedReceipts.map(({ rawDate, ...rest }) => rest);
        setReceipts(receiptsForState);
        console.log('formatted : ', receiptsForState);
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
    clientUuid: string,
    moneyPaid: number,
    pdfPath: string,
    uploadStateChange: (bytesTransferred: number, totalBytes: number) => void,
    products?: productsReceiptQuery,
  ) => {
    try {
      const receiptUuid = await createReceiptHelper(
        db!,
        clientUuid,
        moneyPaid,
        pdfPath,
        uploadStateChange,
        products,
      );
      if (receiptUuid) {
        console.log('receiptUuid');
        console.log(receiptUuid);
        // JOE: SET THE receipt
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          console.log('ERROR');
          showMessage({
            message: 'Success',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
            type: 'success',
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
      onPress={() => {
        getReceiptDetails(item.id);
        setSelectedReceiptUUid(item.id);
      }}>
      <View style={styles.receiptInfo}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptDate}>{item.createdAt}</Text>
        </View>
        <Text style={styles.receiptAmount}>المبلغ: {item.moneyPaid} ج.م</Text>
      </View>
      <View>
        <Text style={styles.receiptBalance}>
          الرصيد السابق: {item.initialBalance} ج.م
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
          <Text style={styles.clientNumber}>رقم العميل: {client.number}</Text>
          <Text style={styles.clientBalance}>
            الرصيدالحالي: {client.balance} ج.م
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
          receiptUuid={selectedReceiptUUid}
          clientName={client.name}
        />
      )}

      <AddButton refresh={() => getClientReceipts(client.id)}>
        {({closeModal, refresh}) => (
          <CreateReceipt
            clientId={client.id}
            clientName={client.name}
            onClose={closeModal}
            refresh={refresh}
          />
        )}
      </AddButton>
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
    paddingBottom: 80,
  },
  receiptItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row-reverse',
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
  receiptRNumber: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
});

export default ClientDetailsScreen;
