import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { 
  getAllProfit, getLastMonthProfit, getMonthProfit, getTodayProfit, getWeekProfit,
  getAllIncome, getLastMonthIncome, getMonthIncome, getTodayIncome, getWeekIncome 
} from '../utils/stats';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR, FIREBASE_CREATING_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import { updateAdminBalance, getAdminBalance } from '../utils/auth';
import TopNav from '../../src/components/TopNav';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LogoutMenu from '../components/LogoutComponent';

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Balance state
  const [balance, setBalance] = useState(0);
  
  // Profit states
  const [todayProfit, setTodayProfit] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [lastMonthProfit, setLastMonthProfit] = useState(0);
  const [allProfit, setAllProfit] = useState(0);

  // Income states
  const [todayIncome, setTodayIncome] = useState(0);
  const [weekIncome, setWeekIncome] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [allIncome, setAllIncome] = useState(0);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceChange, setBalanceChange] = useState('');

  const getBalance = async () => {
    try {
      const currentBalance = await getAdminBalance(db!);
      if (currentBalance !== null && currentBalance !== undefined) {
        setBalance(Number(currentBalance));
      }
    } catch (error) {
      handleError(error);
    }
  };

  const getStats = async () => {
    try {
      // Fetch profit statistics
      const today = await getTodayProfit(db!);
      if (today !== null && today !== undefined) {
        setTodayProfit(Number(today));
      }
      
      const week = await getWeekProfit(db!);
      if (week !== null && week !== undefined) {
        setWeekProfit(Number(week));
      }

      const month = await getMonthProfit(db!);
      if (month !== null && month !== undefined) {
        setMonthProfit(Number(month));
      }
      
      const lastMonth = await getLastMonthProfit(db!);
      if (lastMonth !== null && lastMonth !== undefined) {
        setLastMonthProfit(Number(lastMonth));
      }
      
      const all = await getAllProfit(db!);
      if (all !== null && all !== undefined) {
        setAllProfit(Number(all));
      }

      // Fetch income statistics
      const todayInc = await getTodayIncome(db!);
      if (todayInc !== null && todayInc !== undefined) {
        setTodayIncome(Number(todayInc));
      }

      const weekInc = await getWeekIncome(db!);
      if (weekInc !== null && weekInc !== undefined) {
        setWeekIncome(Number(weekInc));
      }

      const monthInc = await getMonthIncome(db!);
      if (monthInc !== null && monthInc !== undefined) {
        setMonthIncome(Number(monthInc));
      }

      const lastMonthInc = await getLastMonthIncome(db!);
      if (lastMonthInc !== null && lastMonthInc !== undefined) {
        setLastMonthIncome(Number(lastMonthInc));
      }

      const allInc = await getAllIncome(db!);
      if (allInc !== null && allInc !== undefined) {
        setAllIncome(Number(allInc));
      }
    } catch (error) {
      handleError(error);
    }
  };

  const changeBalance = async () => {
    const amount = parseFloat(balanceChange);
    if (isNaN(amount)) {
      showMessage({
        message: 'خطأ',
        description: 'الرجاء إدخال رقم صحيح',
        type: 'danger',
        duration: 3000,
        floating: true,
        autoHide: true,
      });
      return;
    }
    
    try {
      const key = await updateAdminBalance(db!, amount);
      if(key) {
        showMessage({
          message: 'نجاح',
          description: 'تم تحديث الرصيد بنجاح',
          type: 'success',
          duration: 3000,
          floating: true,
          autoHide: true,
        });
        setModalVisible(false);
        setBalanceChange('');
        getBalance();
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
    getBalance();
    getStats();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value.toFixed(2)} ج.م</Text>
    </View>
  );

  return (
    <>
     {isMenuOpen && (
        <LogoutMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      <TopNav
        title="الحساب الشخصي"
        onSettingsPress={() => {    setIsMenuOpen(!isMenuOpen);
        }}
        onSearchChange={() => {}}
        onBackPress={() => navigation.goBack()}
        showBackButton={false}
        showSearchIcon={false}
      />
      <ScrollView style={styles.container}>
        {/* Balance Section */}
        <TouchableOpacity style={styles.balanceCard} onPress={() => setModalVisible(true)}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceTitle}>الرصيد الحالي</Text>
            <Text style={styles.balanceValue}>{balance.toFixed(2)} ج.م</Text>
          </View>
          <MaterialIcons name="edit" size={24} color="#4CAF50" />
        </TouchableOpacity>

        {/* Today's Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
          <StatCard title="الربح" value={todayProfit} />
          <StatCard title="الدخل" value={todayIncome} />
        </View>

        {/* Week Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الأسبوع</Text>
          <StatCard title="الربح" value={weekProfit} />
          <StatCard title="الدخل" value={weekIncome} />
        </View>

        {/* Month Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الشهر</Text>
          <StatCard title="الربح" value={monthProfit} />
          <StatCard title="الدخل" value={monthIncome} />
        </View>

        {/* Last Month Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الشهر الماضي</Text>
          <StatCard title="الربح" value={lastMonthProfit} />
          <StatCard title="الدخل" value={lastMonthIncome} />
        </View>

        {/* Total Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>الإحصائيات الإجمالية</Text>
          <StatCard title="إجمالي الربح" value={allProfit} />
          <StatCard title="إجمالي الدخل" value={allIncome} />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تحديث الرصيد</Text>
            <TextInput
              style={styles.input}
              onChangeText={setBalanceChange}
              value={balanceChange}
              placeholder="أدخل المبلغ (يمكن أن يكون سالبًا)"
              keyboardType="numeric"
              placeholderTextColor={"black"}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={changeBalance}>
                <Text style={styles.modalButtonText}>تأكيد</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  balanceContent: {
    flex: 1,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  balanceTitle: {
    fontSize: 18,
    color: '#333',
  },
  sectionContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'left',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
    width: '100%'
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
    alignItems: 'center',
  },
  modalTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 15,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;