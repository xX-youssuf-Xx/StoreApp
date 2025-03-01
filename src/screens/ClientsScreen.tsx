import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
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
import {productsReceiptQuery} from '../utils/types';
import AddButton from '../components/AddButton';
import CreateClient from '../components/CreateClient';
import LogoutMenu from '../components/LogoutComponent';

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
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getClients = async () => {
    try {
      const clients = await getAllClients(db!);
      if (clients) {
        const formattedClients = Object.entries(clients).map(([id, data]) => ({
          id,
          name: data.name,
          number: data.number,
          balance: data.balance,
          receiptsCount: Object.keys(data.receipts || {}).length,
        }));
        setClients(formattedClients);
        setFilteredClients(formattedClients);
        console.log('clients : ' , formattedClients);
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
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredClients(clients);
    } else {
      const searchQuery = text.toLowerCase();
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(searchQuery) ||
          client.number.toLowerCase().includes(searchQuery)
      );
      setFilteredClients(filtered);
    }
  };

  const getClientDetails = async (clientUuid: string) => {
    try {
      const client = await getClient(db!, clientUuid);
      if (client) {
        console.log('client');
        console.log(client);
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
          // Handle creating error
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const createReceipt = async (
    clientUuid: string,
    moneyPaid: number,
    pdfPath: string,
    uploadStateChange: (bytesTransferred: number, totalBytes: number) => void,
    products?: productsReceiptQuery
  ) => {
    try {
      const receiptUuid = await createReceiptHelper(
        db!,
        clientUuid,
        moneyPaid,
        pdfPath,
        uploadStateChange,
        products
      );
      if (receiptUuid) {
        console.log('receiptUuid');
        console.log(receiptUuid);
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
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  useEffect(() => {
    getClients();
  }, []);

  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getClients().finally(() => setRefreshing(false));
  }, []);

  const renderClientItem = ({item}: {item: Client}) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => {
        navigation.navigate('ClientDetails', {client: item});
      }}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientReceipts}>الفواتير: {item.receiptsCount}</Text>
        <Text style={styles.clientBalance}>الرصيد: {item.balance} ج.م</Text>
      </View>
      <View>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientNumber}>{item.number}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
         {isMenuOpen && (
                <LogoutMenu
          isFoodStorage={true}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      <TopNav
        title="العملاء"
 onSettingsPress={() => {    setIsMenuOpen(!isMenuOpen);
        }}        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={styles.container}>
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']} // Android
              tintColor="#2196F3" // iOS
            />
          }
        />
      </View>
      <AddButton refresh={getClients}>
        {({closeModal, refresh}) => (
          <CreateClient closeModal={closeModal} reloadClients={refresh} />
        )}
      </AddButton>
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
    paddingBottom: 80,
  },
  clientItem: {
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
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
  },
  clientNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'left',
  },
  clientInfo: {
    alignItems: 'flex-start',
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