import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';
import { setItem } from '../utils/localStorage';
import { addUser, getActiveUser, getUser, setActiveUser } from '../utils/auth';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR } from '../config/Constants';
import { useFirebase } from '../context/FirebaseContext';
import MobileLogin from '../../assets/images/MobileLogin.svg';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [name, setName] = useState("");
  const navigation = useNavigation<NavigationProp<any>>();
  const { db } = useFirebase();

  const handleNameChange = (text: string) => {
    setName(text);
  };

  const showFlashMessage = (message: string) => {
    showMessage({
      message: "تنبيه",
      description: message,
      type: "danger",
      duration: 3000,
    });
  };

  const submit = async () => {
    try {
      if (!name) {
        showFlashMessage('يرجى إدخال اسم صحيح');
        return false;
      }

      const user = await getUser(db!, name);
      if (!user) {
        await addUser(db!, name);
      }
      await setItem('name', name);

      const activeUser = await getActiveUser(db!);

      if (!activeUser) {
        const res = await setActiveUser(db!, name);
        if (res) {
          await setItem('active', true);
          navigation.navigate('MainTabs');
          return true;
        }
      }

      if (activeUser === name) {
        await setItem('active', true);
        navigation.navigate('MainTabs');
        return true;
      }

      navigation.navigate('AlreadyActive');
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showFlashMessage('حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا');
        } else {
          console.error('An error occurred with code:', error.code);
          showFlashMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
      } else {
        console.error('An unexpected error occurred:', error);
        showFlashMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentContainer}>
            <View style={styles.svgContainer}>
              <MobileLogin width={width * 0.8} height={height * 0.35} />
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.headerText}>مرحبًا بك في تطبيقنا</Text>
              <Text style={styles.subHeaderText}>يرجى إدخال اسمك للمتابعة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك هنا"
                value={name}

                placeholderTextColor='#666'
                onChangeText={handleNameChange}
                textAlign="right"
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={submit}>
            <Text style={styles.buttonText}>تسجيل</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 70, // Add padding to account for the button
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
  formContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 10,
    fontFamily: 'Arial',
  },
  subHeaderText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    fontFamily: 'Arial',
  },
  input: {
    width: '80%',
    height: 50,
    borderColor: '#1E88E5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: '#FFFFFF',
    color: "#000",
    fontFamily: 'Arial',
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

export default LoginScreen;