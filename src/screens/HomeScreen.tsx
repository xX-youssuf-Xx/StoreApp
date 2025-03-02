import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import TopNav from '../../src/components/TopNav';
import LogoutMenu from '../components/LogoutComponent';
import { getTodayProfit, getTodayIncome, getTodaySales } from '../utils/stats';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR, FIREBASE_CREATING_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import CreateProduct from '../components/CreateProduct';
import CreateClient from '../components/CreateClient';
import Svg, { Path, Polyline, Line } from 'react-native-svg';

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db, setShouldOnline } = useFirebase();

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Stats states
  const [todayProfit, setTodayProfit] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [searchText, setSearchText] = useState('');

  const getTodayStats = async () => {
    try {
      // Fetch today's profit
      const profit = await getTodayProfit(db!);
      if (profit !== null && profit !== undefined) {
        setTodayProfit(Math.floor(Number(profit)));
      }

      // Fetch today's income
      const sales = await getTodaySales(db!);
      if (sales !== null && sales !== undefined) {
        setTodaySales(Math.floor(Number(sales)));
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    if (error instanceof FirebaseError) {
      if (error.code === FIREBASE_ERROR) {
        showMessage({
          message: 'خطأ',
          description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
          type: 'danger',
          duration: 3000,
          floating: true,
          autoHide: true,
        });
      } else if (error.code === FIREBASE_CREATING_ERROR) {
        console.error('Error creating instance:', error);
      } else {
        console.error('An error occurred with code:', error.code);
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }
  };

  useEffect(() => {
    setShouldOnline(false);
    getTodayStats();
  }, []);

  const handleSettingsPress = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleAddClient = () => {
    setIsClientModalOpen(true);
  };

  const handleAddProduct = () => {
    setIsProductModalOpen(true);
  };

  // Dummy reload function
  const dummyReload = () => {
    console.log('Reload function called');
  };

  const handleStoragePress = () => {
    navigation.navigate('StorageDetails');
  };

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value} ج.م</Text>
    </View>
  );

  const ActionCard = ({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <MaterialIcons name={icon} size={32} color="#4CAF50" />
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const UpArrowIcon = () => (
    <Svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      stroke="#4CAF50"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      style={{ transform: [{ rotate: '-90deg' }] }}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );

  // Custom Modal Component
  const CustomModal = ({ isVisible, onClose, children }: { isVisible: boolean; onClose: () => void; children: React.ReactNode }) => (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <>
      <TopNav
        title="الرئيسية"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        showBackButton={false}
        showSearchIcon={false}
      />
      
      <ScrollView style={styles.container}>
        {/* Today's Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
          <View style={styles.statsRow}>
            <StatCard title="الربح" value={todayProfit} />
            <StatCard title="المبيعات" value={todaySales} />
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}> </Text>
          <ActionCard
            title="إضافة عميل جديد"
            icon="person-add"
            onPress={handleAddClient}
          />
          <ActionCard
            title="إضافة منتج جديد"
            icon="add-box"
            onPress={handleAddProduct}
          />
          {/* Add this new ActionCard */}
          <TouchableOpacity style={styles.actionCard} onPress={handleStoragePress}>
            <UpArrowIcon />
            <Text style={styles.actionTitle}>المخزن</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Components */}
      <CustomModal
        isVisible={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      >
        <CreateClient 
          closeModal={() => setIsClientModalOpen(false)}
          reloadClients={dummyReload}
        />
      </CustomModal>

      <CustomModal
        isVisible={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      >
        <CreateProduct
          closeModal={() => setIsProductModalOpen(false)}
          reloadProducts={dummyReload}
        />
      </CustomModal>

      {isMenuOpen && (
                <LogoutMenu
          isFoodStorage={false}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 0.48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 15,
    gap: 15,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionTitle: {
    fontSize: 18,
    color: '#333',
    marginLeft: 15,
    textAlign: 'right',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
});

export default HomeScreen;