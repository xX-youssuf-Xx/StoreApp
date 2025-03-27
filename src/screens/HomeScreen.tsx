/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import TopNav from '../../src/components/TopNav';
import LogoutMenu from '../components/LogoutComponent';
import { getTodayProfit, getTodaySales } from '../utils/stats';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR, FIREBASE_CREATING_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import CreateProduct from '../components/CreateProduct';
import CreateClient from '../components/CreateClient';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { useLoading } from '../context/LoadingContext';
import { usePasswordProtection } from '../context/PasswordProtectionContext';
import ProtectedContent from '../components/ProtectedContent';
import { attemptFirebaseGet } from '../utils/firebase';

const StatCard = ({ title, value, max }: { title: string; value: number, max: number }) => {
  const { showSecrets } = usePasswordProtection();
  const moduled = value - (Math.floor(value / max) * max);
  // const units = Math.floor(value / max);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueContainer}>
        <Text style={styles.statValue}>{showSecrets ? moduled.toLocaleString() : '**'}</Text>
        {/* {showSecrets && <Text style={styles.statValue}>{units.toString().length === 1 ? '0' + units : units}</Text>} */}
      </View>
    </View>
  );
};

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

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();
  const { setIsLoading } = useLoading();

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Stats states
  const [todayProfit, setTodayProfit] = useState(0);
  const [todaySales, setTodaySales] = useState(0);

  const { showSecrets } = usePasswordProtection();

  useEffect(() => {
    const getClients = async () => {
      const clients = await attemptFirebaseGet(db!, '/clients/-OKMMe194xwxjVLD-3Yw', 10);
      console.log(clients);
    }
    getClients();
  }, []); 

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
    } finally {
      setIsLoading(false);
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

  const handleSettingsPress = () => {
    setIsMenuOpen(!isMenuOpen);
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

  useEffect(() => {
    if (showSecrets) {
      getTodayStats();
    }
  }, [showSecrets]);

  return (
    <>
      <TopNav
        title="الرئيسية"
        onSettingsPress={handleSettingsPress}
        onSearchChange={() => { }}
        showBackButton={false}
        showSearchIcon={false}
      />

      <ScrollView style={styles.container}>
        {/* Today's Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
          <View style={styles.statsRow}>
            <ProtectedContent>
              <StatCard title="الربح" value={todayProfit} max={100000} />
            </ProtectedContent>
            <ProtectedContent>
              <StatCard title="المبيعات" value={todaySales} max={1000000} />
            </ProtectedContent>
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
    position: 'relative',
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
    gap: 10
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
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
    width: '80%',
    maxWidth: 400,
  },
});

export default HomeScreen;