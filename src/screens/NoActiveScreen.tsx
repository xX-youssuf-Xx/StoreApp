import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { getActiveUser, setActiveUser } from '../utils/auth';
import MobileLogin from '../../assets/images/MobileLogin.svg';
import { getItem, setItem } from '../utils/localStorage';
import { showMessage } from 'react-native-flash-message';
import { FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';

const { width, height } = Dimensions.get('window');

const NoActiveScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { db, setShouldOnline } = useFirebase();

  const handleRetry = async () => {
    try {
      setShouldOnline(true);
      const name = await getItem('name');
      console.log('Retrieved name from storage:', name);
      if (!name) {
        // JOE: transferr to login page
        return;
      }


      const activeUser = await getActiveUser(db!);

      if (!activeUser) {
        const res = await setActiveUser(db!, name);
        if (res) {
          await setItem('active', true);
          navigation.navigate('MainTabs');
          return true;
        }
      }

      // JOE: transfer there is already an active user
    } catch (error) {
      console.error('Error in checkAuth:', error);
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
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.contentContainer}>
          <View style={styles.svgContainer}>
            <MobileLogin width={width * 0.8} height={height * 0.35} />
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.headerText}>لا يوجد حساب مسَجِل حاليا , هل تود تسجيل الدخول ؟    </Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>تسجيل </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 70,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  svgContainer: {
    height: height * 0.35,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 10,
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 18,
    color: '#333',
    marginTop: 20,
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: '10%',
    paddingBottom: 20,
    backgroundColor: '#E3F2FD',
  },
  button: {
    height: 50,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
});

export default NoActiveScreen;
