import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { getAllProfit, getLastMonthProfit, getMonthProfit, getTodayProfit, getWeekProfit } from '../utils/stats';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR, FIREBASE_CREATING_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import { updateAdminBalance } from '../utils/auth';
import TopNav from '../../src/components/TopNav';

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();

  const [todayProfit, setTodayProfit] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [lastMonthProfit, setLastMonthProfit] = useState(0);
  const [allProfit, setAllProfit] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [balanceChange, setBalanceChange] = useState('');

  const getStats = async () => {
    try {
      const todayProfit = await getTodayProfit(db!);
      if(todayProfit !== null && todayProfit !== undefined) {
        console.log("todayProfit");
        console.log(todayProfit);
        setTodayProfit(Number(todayProfit));
      }
      
      const weekProfit = await getWeekProfit(db!);
      if(weekProfit !== null && weekProfit !== undefined) {
        console.log("weekProfit");
        console.log(weekProfit);
        setWeekProfit(Number(weekProfit));
      }

      const monthProfit = await getMonthProfit(db!);
      if(monthProfit !== null && monthProfit !== undefined) {
        console.log("monthProfit");
        console.log(monthProfit);
        setMonthProfit(Number(monthProfit));
      }
      
      const lastMonthProfit = await getLastMonthProfit(db!);
      if(lastMonthProfit !== null && lastMonthProfit !== undefined) {
        console.log("lastMonthProfit");
        console.log(lastMonthProfit);
        setLastMonthProfit(Number(lastMonthProfit));
      }
      
      const allProfit = await getAllProfit(db!);
      if(allProfit !== null && allProfit !== undefined) {
        console.log("allProfit");
        console.log(allProfit);
        setAllProfit(Number(allProfit));
      }
    } catch (error) {
      handleError(error);
    }
  }

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
        console.log(key);
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
        getStats();
      }
    } catch (error) {
      handleError(error);
    }
  }

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
    console.log('Settings pressed');
  };

  const handleSearchChange = (text: string) => {
    console.log('Searching for:', text);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    getStats();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value.toFixed(2)} ج.م</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <>
      <TopNav
        title="الحساب الشخصي"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={false}
      />
      <ScrollView style={styles.container}>
        <View style={styles.statsContainer}>
          <StatCard title="ربح اليوم" value={todayProfit} />
          <StatCard title="ربح الأسبوع" value={weekProfit} />
          <StatCard title="ربح الشهر" value={monthProfit} />
          <StatCard title="ربح الشهر الماضي" value={lastMonthProfit} />
          <StatCard title="إجمالي الربح" value={allProfit} />
        </View>
        {/* <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.updateButtonText}>تحديث الرصيد</Text>
        </TouchableOpacity> */}
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
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
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
  statsContainer: {
    padding: 15,
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
  },
  updateButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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