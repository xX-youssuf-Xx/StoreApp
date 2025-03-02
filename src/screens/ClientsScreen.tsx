import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, BackHandler} from 'react-native';
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
import Icon from 'react-native-vector-icons/FontAwesome';
import ConfirmationModal from '../components/ConfirmationModal';

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

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

  const toggleSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedClients(new Set());
  };

  const deleteSelected = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Implement your delete logic here
      console.log('Deleting clients:', Array.from(selectedClients));
      setIsDeleteModalVisible(false);
      cancelSelection();
      // After successful deletion
      await getClients(); // Refresh the list
      showMessage({
        message: 'تم الحذف بنجاح',
        type: 'success',
        duration: 3000,
        floating: true,
      });
    } catch (error) {
      showMessage({
        message: 'حدث خطأ',
        description: 'فشل في حذف العملاء',
        type: 'danger',
        duration: 3000,
        floating: true,
      });
    }
  };

  const onLongPressClient = (clientId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
    }
    toggleSelection(clientId);
  };

  useEffect(() => {
    getClients();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        cancelSelection();
        return true; // Prevents default back action
      }
      return false; // Allows default back action
    });

    return () => backHandler.remove();
  }, [selectionMode]);

  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };

  const handleBackPress = () => {
    if (selectionMode) {
      cancelSelection();
    } else {
      navigation.goBack();
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getClients().finally(() => setRefreshing(false));
  }, []);

  const renderClientItem = ({item}: {item: Client}) => {
    const isSelected = selectedClients.has(item.id);

    return (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            navigation.navigate('ClientDetails', {client: item});
          }
        }}
        onLongPress={() => onLongPressClient(item.id)}>
        <View style={styles.clientInfo}>
          {selectionMode && (
            <View style={styles.checkIconContainer}>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Icon name="check" size={17} color="#fff" />
                </View>
              )}
            </View>
          )}
          <Text style={styles.clientReceipts}>الفواتير: {item.receiptsCount}</Text>
          <Text style={styles.clientBalance}>الرصيد: {item.balance} ج.م</Text>
        </View>
        <View>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientNumber}>{item.number}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {selectionMode && (
        <View style={styles.selectionNavbar}>
          <TouchableOpacity onPress={cancelSelection} style={styles.selectionNavButton}>
            <Icon name="chevron-right" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.selectionCount}>تم اختيار {selectedClients.size}</Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.selectionNavButton}>
            <Icon name="trash" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      {isMenuOpen && (
        <LogoutMenu
          isFoodStorage={false}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      <TopNav
        title="العملاء"
        onSettingsPress={() => { setIsMenuOpen(!isMenuOpen); }}
        onSearchChange={handleSearchChange}
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
      <ConfirmationModal
        visible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        title="حذف العملاء"
        message="لا يمكن التراجع عن هذا الإجراء"
        itemType="clients"
        count={selectedClients.size}
      />
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
  selectionNavbar: {
    height: 60,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  selectionCount: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'right',
  },
  selectionNavButton: {
    padding: 10,
  },
  checkIcon: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    width: 23,
    height: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconContainer: {
    position: 'absolute',
    top: -18,
    right: -18,
    zIndex: 5,
  },
});

export default ClientsScreen;