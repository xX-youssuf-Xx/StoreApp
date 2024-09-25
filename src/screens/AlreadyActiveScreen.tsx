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
import { getActiveUser } from '../utils/auth';
import MobileLogin from '../../assets/images/MobileLogin.svg';

const { width, height } = Dimensions.get('window');

const AlreadyActiveScreen = () => {
  const [activeName, setActiveName] = useState('');
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();

  useEffect(() => {
    const fetchActiveUser = async () => {
      try {
        const activeUser = await getActiveUser(db!);
        if (activeUser) {
          setActiveName(activeUser.val());
        }
      } catch (error) {
        console.error('Error fetching active user:', error);
      }
    };

    fetchActiveUser();
  }, [db]);

  const handleRetry = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.contentContainer}>
          <View style={styles.svgContainer}>
            <MobileLogin width={width * 0.8} height={height * 0.35} />
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.headerText}>هناك حساب مسجل بالفعل</Text>
            <Text style={styles.subHeaderText}>اسم الحساب: {activeName}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>اعادة المحاولة</Text>
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

export default AlreadyActiveScreen;