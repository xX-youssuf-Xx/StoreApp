/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import {
  getAllProfit, getLastMonthProfit, getMonthProfit, getTodayProfit, getWeekProfit,
  getTodaySales,
  getWeekSales,
  getMonthSales,
  getLastMonthSales,
  getAllSales
} from '../utils/stats';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR, FIREBASE_CREATING_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import TopNav from '../../src/components/TopNav';
import LogoutMenu from '../components/LogoutComponent';
import { getPendingAdminBalance, getInventoryTotalPrice } from '../utils/auth';
const StatCard = ({ title, value }: { title: string; value: number }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value} ج.م</Text>
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Balance state
  const [pendingBalance, setPendingBalance] = useState(0);
  const [inventoryTotalPrice, setInventoryTotalPrice] = useState(0);

  // Profit states
  const [todayProfit, setTodayProfit] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [lastMonthProfit, setLastMonthProfit] = useState(0);
  const [allProfit, setAllProfit] = useState(0);

  // Sales states
  const [todaySales, setTodaySales] = useState(0);
  const [weekSales, setWeekSales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [allSales, setAllSales] = useState(0);

  const getBalance = async () => {
    try {
      const currentPendingBalance = await getPendingAdminBalance(db!);
      if (currentPendingBalance !== null && currentPendingBalance !== undefined) {
        setPendingBalance(Number(currentPendingBalance));
      }

      const currentInventoryTotalPriceBalance = await getInventoryTotalPrice(db!);
      if (currentInventoryTotalPriceBalance !== null && currentInventoryTotalPriceBalance !== undefined) {
        setInventoryTotalPrice(Number(currentInventoryTotalPriceBalance));
      }
    } catch (error) {
      handleError(error);
    }
  };

  const getStats = async () => {
    try {
      // Fetch profit statistics
      const _todayProfit = await getTodayProfit(db!);
      if (_todayProfit !== null && _todayProfit !== undefined) {
        setTodayProfit(Math.floor(Number(_todayProfit)));
      }

      const _weekProfit = await getWeekProfit(db!);
      if (_weekProfit !== null && _weekProfit !== undefined) {
        setWeekProfit(Math.floor(Number(_weekProfit)));
      }

      const _monthProfit = await getMonthProfit(db!);
      if (_monthProfit !== null && _monthProfit !== undefined) {
        setMonthProfit(Math.floor(Number(_monthProfit)));
      }

      const _lastMonthProfit = await getLastMonthProfit(db!);
      if (_lastMonthProfit !== null && _lastMonthProfit !== undefined) {
        setLastMonthProfit(Math.floor(Number(_lastMonthProfit)));
      }

      const _allProfit = await getAllProfit(db!);
      if (_allProfit !== null && _allProfit !== undefined) {
        setAllProfit(Math.floor(Number(_allProfit)));
      }

      // Fetch sales statistics
      const _todaySales = await getTodaySales(db!);
      if (_todaySales !== null && _todaySales !== undefined) {
        setTodaySales(Math.floor(Number(_todaySales)));
      }

      const _weekSales = await getWeekSales(db!);
      if (_weekSales !== null && _weekSales !== undefined) {
        setWeekSales(Math.floor(Number(_weekSales)));
      }

      const _monthSales = await getMonthSales(db!);
      if (_monthSales !== null && _monthSales !== undefined) {
        setMonthSales(Math.floor(Number(_monthSales)));
      }

      const _lastMonthSales = await getLastMonthSales(db!);
      if (_lastMonthSales !== null && _lastMonthSales !== undefined) {
        setLastMonthSales(Math.floor(Number(_lastMonthSales)));
      }

      const _allSales = await getAllSales(db!);
      if (_allSales !== null && _allSales !== undefined) {
        setAllSales(Math.floor(Number(_allSales)));
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

  return (
    <>
      {isMenuOpen && (
        <LogoutMenu
          isFoodStorage={false}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      <TopNav
        title="الحساب الشخصي"
        onSettingsPress={() => {
          setIsMenuOpen(!isMenuOpen);
        }}
        onSearchChange={() => { }}
        onBackPress={() => navigation.goBack()}
        showBackButton={false}
        showSearchIcon={false}
      />
      <ScrollView style={styles.container}>
        {/* Balance Section */}
        <View style={styles.topContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceTitle}>الباقي عند العملاء</Text>
              <Text style={styles.balanceValue}>{Math.floor(pendingBalance)} ج.م</Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceTitle}>سعر بضاعة المخزن</Text>
              <Text style={styles.balanceValue}>{Math.floor(inventoryTotalPrice)} ج.م</Text>
            </View>
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
          <StatCard title="الربح" value={todayProfit} />
          {/* <StatCard title="الدخل" value={todayIncome} /> */}
          <StatCard title="المبيعات" value={todaySales} />
        </View>

        {/* Week Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الأسبوع</Text>
          <StatCard title="الربح" value={weekProfit} />
          {/* <StatCard title="الدخل" value={weekIncome} /> */}
          <StatCard title="المبيعات" value={weekSales} />
        </View>

        {/* Month Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الشهر</Text>
          <StatCard title="الربح" value={monthProfit} />
          {/* <StatCard title="الدخل" value={monthIncome} /> */}
          <StatCard title="المبيعات" value={monthSales} />
        </View>

        {/* Last Month Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الشهر الماضي</Text>
          <StatCard title="الربح" value={lastMonthProfit} />
          {/* <StatCard title="الدخل" value={lastMonthIncome} /> */}
          <StatCard title="المبيعات" value={lastMonthSales} />
        </View>

        {/* Total Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>الإحصائيات الإجمالية</Text>
          <StatCard title="إجمالي الربح" value={allProfit} />
          {/* <StatCard title="إجمالي الدخل" value={allIncome} /> */}
          <StatCard title="إجمالي المبيعات" value={allSales} />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topContainer: {
    marginBottom: 15,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
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
    flexDirection: 'row-reverse',
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