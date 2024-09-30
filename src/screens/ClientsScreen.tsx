import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {
  createClient,
  getAllClients,
  getClient,
  getClientReceiptsHelper,
} from '../utils/clitent';
import {useFirebase} from '../context/FirebaseContext';
import {FirebaseError} from '../errors/FirebaseError';
import {FIREBASE_CREATING_ERROR, FIREBASE_ERROR} from '../config/Constants';
import {showMessage} from 'react-native-flash-message';
import {
  createReceiptHelper,
  getAllReceipts,
  getReceipt,
} from '../utils/receipts';
import {productsReceiptQuery, ReceiptProduct} from '../utils/types';

interface Client {
  id: string;
  name: string;
  number: string;
  balance: number;
  receiptsCount: number;
}

const ClientsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();
  const [clients, setClients] = useState<Client[]>([]);

  const getClients = async () => {
    try {
      const clients = await getAllClients(db!);
      if (clients) {
        console.log('clients');
        console.log(clients);
        const formattedClients = Object.entries(clients).map(([id, data]) => ({
          id,
          name: data.name,
          number: data.number,
          balance: data.balance,
          receiptsCount: Object.keys(data.receipts || {}).length,
        }));


        setClients(formattedClients);
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

  const getClientDetails = async (clientUuid: string) => {
    // JOE: This function will be used in the website too
    try {
      const client = await getClient(db!, clientUuid);
      if (client) {
        console.log('client');
        console.log(client);
        // JOE: SET THE Client
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

  const getClientReceipts = async (clientUuid: string) => {
    try {
      const receipts = await getClientReceiptsHelper(db!, clientUuid);
      if (receipts) {
        console.log('client receipts');
        console.log(receipts);
        // JOE: SET THE Client
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

  const newClient = async (clientName: string, number: string) => {
    try {
      const key = await createClient(db!, clientName, number);
      if (key) {
        console.log(key);
        // JOE: SET THE PRODUCT DETAILS (AND ITS ITEMS)
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'Success',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
            type: 'success',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          // JOE: ERROR CREATING THE INSTANCE
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const getReceipts = async () => {
    try {
      const receipts = await getAllReceipts(db!);
      if (receipts) {
        console.log('receipts');
        console.log(receipts);
        // JOE: SET THE Recipets
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

  const getReceiptDetails = async (receiptUuid: string) => {
    // JOE: This function will be used in the website too
    try {
      const receipt = await getReceipt(db!, receiptUuid);
      if (receipt) {
        console.log('receipt');
        console.log(receipt);
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
  }
  
  const createReceipt = async (clientUuid: string, moneyPaid: number, pdfPath: string, uploadStateChange: (bytesTransferred: number, totalBytes: number) => void, products?: productsReceiptQuery) => {
    try {
      const receiptUuid = await createReceiptHelper(db!, clientUuid, moneyPaid, pdfPath, uploadStateChange, products);
      if(receiptUuid) {
        console.log("receiptUuid");
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

  useEffect(() => {
    /* createReceipt("-O7hoaCp0zkpTN1XCsYR", 2000, {
      "كبدة": {
        sellPrice: 100,
        items: {
          "-O7dw9t7IuJ04vnhGyw4": 3,
          "-O7dwbhYRFY0vBG3JSZA": 4
        }
      },
      "لحم ايطالي": {
        sellPrice: 200,
        items: {
          "-O7dw9t7IuJ04vnhGyw4": 7
        }
      }
    }, "", () => {}); */
    getClients();
    // getClientDetails('-O7hoaCp0zkpTN1XCsYR');
    // getClientReceipts('-O7hoaCp0zkpTN1XCsYR');
    getReceiptDetails('-O7j1d0q4Yp6Ut4ZYf3q');
    getReceiptDetails("-O7xTrRux7Lee5pgxsUz");
    // createReceipt("-O7hoaCp0zkpTN1XCsYR", 2000, "", () => {}, {});
    // getReceiptDetails("-O7xTrRux7Lee5pgxsUz");
  }, []);

  const handleSettingsPress = () => {
    // Handle settings press
    console.log('Settings pressed');
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    // Perform search operation with the text
    console.log('Searching for:', text);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => {navigation.navigate('ClientDetails', { client: item })
      }}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientBalance}>الرصيد: {item.balance} ج.م</Text>
        <Text style={styles.clientReceipts}>
          الفواتير: {item.receiptsCount}
        </Text>
      </View>
      <View>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientNumber}>{item.number}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TopNav
        title="العملاء"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={styles.container}>
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
  },
  clientItem: {
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
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  clientNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  clientInfo: {
    alignItems: 'flex-end',
  },
  clientBalance: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  clientReceipts: {
    fontSize: 14,
    color: '#2196F3',
  },
});

export default ClientsScreen;
