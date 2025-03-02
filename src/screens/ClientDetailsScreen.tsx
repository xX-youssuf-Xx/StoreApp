import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
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
import Animated, { withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from 'react-native-modal';
import ClientDetailsSection from '../components/ClientDetailsSection ';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
            Rnumber: data.Rnumber || 0,
            client: data.client,
            initialBalance: data.initialBalance || 0,
            moneyPaid: data.moneyPaid || 0,
            totalPrice: data.totalPrice || 0,
            totalBoughtPrice: data.totalBoughtPrice || 0,
            products: data.products || {},
            createdAt: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString()
              : 'N/A',
            returnedAt: data.returnedAt || null,
            status: data.status || 'active',
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getClientReceipts(client.id).finally(() => setRefreshing(false));
  }, [client.id]);

  const handleResetBalance = () => {
    // Add your reset balance logic here
    console.log('Reset balance for client:', client.id);
    // Example: You might want to call a function to update the client's balance to 0
    // updateClientBalance(client.id, 0);
  };

  const renderReceiptItem = ({item}: {item: Receipt}) => {
    return (
      <TouchableOpacity
        style={[
          styles.receiptItem,
          item.status === 'returned' && styles.returnedReceipt
        ]}
        onPress={() => {
            getReceiptDetails(item.id);
            setSelectedReceiptUUid(item.id);
        }}>
        <View style={[ styles.receiptInfo]}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptDate}>{item.createdAt}</Text>
            {item.status === 'returned' && (
              <Text style={styles.returnedBadge}>مرتجع</Text>
            )}
          </View>
          <Text style={styles.receiptAmount}>المبلغ: {item.moneyPaid} ج.م</Text>
        </View>
        <View>
          <Text style={styles.receiptBalance}>
            الرصيد السابق: {item.initialBalance} ج.م
          </Text>
          <Text style={styles.receiptTotal}>
            الإجمالي: {item.totalPrice} ج.م
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ConfirmationModal = () => (
    <Modal
      isVisible={showConfirmation}
      onBackdropPress={() => setShowConfirmation(false)}
      backdropOpacity={0.4}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>تأكيد تصفير الحساب</Text>
          <Text style={styles.modalMessage}>
            هل أنت متأكد من أنك تريد تصفير حساب {client.name}؟
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                handleResetBalance();
                setShowConfirmation(false);
              }}
            >
              <Text style={styles.confirmButtonText}>تأكيد</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowConfirmation(false)}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      <ClientDetailsSection 
          client={client} 
          onResetBalance={(clientId) => {
            try {
              // Create a receipt with a dummy product and the client's balance as money paid
              const emptyReceipt = {
                client: clientId,
                products: {
                  'تعديل رصيد': {
                    sellPrice: 0,
                    totalWeight: 0,
                    Pnumber: 1,
                    items: {'تعديل رصيد': 0},
                  },
                }
              };
          
              // Create the receipt using createReceiptHelper
              createReceiptHelper(
                db!,
                clientId.toString(),
                client.balance, // Use the client's current balance as the paid amount
                'pdfPath',
                (bytesTransferred: number, totalBytes: number) => {
                  console.log(`Uploaded ${bytesTransferred} of ${totalBytes} bytes`);
                },
                emptyReceipt.products
              ).then(() => {
                showMessage({
                  message: 'Success',
                  description: 'تم تصفير الحساب بنجاح',
                  type: 'success',
                  duration: 3000,
                  floating: true,
                });
                
                // Close the confirmation modal
                setShowConfirmation(false);
                
                // Refresh the client data
                onRefresh();
              }).catch((error) => {
                console.error('Error creating reset receipt:', error);
                showMessage({
                  message: 'Error',
                  description: 'فشل تصفير الحساب. برجاء المحاولة مرة أخرى.',
                  type: 'danger',
                  duration: 3000,
                  floating: true,
                });
              });
          
            } catch (error) {
              console.error('Error in onResetBalance:', error);
              showMessage({
                message: 'Error',
                description: 'حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.',
                type: 'danger',
                duration: 3000,
                floating: true,
              });
            }
          }} 
        />
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
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

      <ConfirmationModal />
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
  },
  clientInfoGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  gridColumn: {
    flex: 1,
    gap: 15,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    textAlign: 'right',
  },
  clientInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    alignItems: 'flex-end',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  clientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  clientNumber: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  clientBalance: {
    flex: 1,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  resetButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    position: 'relative',
    overflow: 'visible',
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
  returnedReceipt: {
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)', // Lighter red border
    backgroundColor: 'white', // Keep white background
    overflow: 'visible', // Keep overflow visible
  },

  returnedText: {
    color: '#dc3545', // Consistent red color for all text
  },

  returnedBadge: {
    color: 'rgba(232, 29, 49, 0.9)',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(231, 161, 168, 0.5)', // Lighter red background
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 2,
    textAlign: 'left',
  },

  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },

  watermarkText: {
    color: 'rgba(220, 53, 69, 0.1)',
    fontSize: 40,
    fontWeight: 'bold',
    transform: [{ rotate: '-25deg' }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    elevation: 2,
  },
  confirmButton: {
    backgroundColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ClientDetailsScreen;
