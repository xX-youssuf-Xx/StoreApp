import {View, Text} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { getAllProfit, getLastMonthProfit, getMonthProfit, getTodayProfit, getWeekProfit } from '../utils/stats';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import { updateAdminBalance } from '../utils/auth';
const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();

  const getStats = async () => {
    try {
      const todayProfit = await getTodayProfit(db!);
      if(todayProfit) {
        console.log("todayProfit");
        console.log(todayProfit);
        // JOE: SET THE STATs
      }
      
      const weekProfit = await getWeekProfit(db!);
      if(weekProfit) {
        console.log("weekProfit");
        console.log(weekProfit);
        // JOE: SET THE STATs
      }
      const monthProfit = await getMonthProfit(db!);
      if(monthProfit) {
        console.log("monthProfit");
        console.log(monthProfit);
        // JOE: SET THE STATs
      }
      
      const lastMonthProfit = await getLastMonthProfit(db!);
      if(lastMonthProfit) {
        console.log("lastMonthProfit");
        console.log(lastMonthProfit);
        // JOE: SET THE STATs
      }
      
      const allProfit = await getAllProfit(db!);
      if(allProfit) {
        console.log("allProfit");
        console.log(allProfit);
        // JOE: SET THE STATs
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          console.log("ERROR");
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

  const changeBalance = async (amount: number) => {
    try {
      const key = await updateAdminBalance(db!, amount);
      if(key) {
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
  }

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

  useEffect(() => {
    getStats();
    changeBalance(-200);
  }, []);
  
  return (
    <>
      <TopNav
        title="الحساب الشخصي"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={{flex: 1, backgroundColor: 'red'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Profile Screen</Text>
        </View>
      </View>
    </>
  );
};

export default ProfileScreen;
