import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, TouchableWithoutFeedback } from 'react-native';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import { getHashedAdminPassword } from '../utils/auth';
import { useLoading } from './LoadingContext';
import { useFirebase } from './FirebaseContext';

interface PasswordProtectionContextType {
  showSecrets: boolean;
  showSecretPopup: boolean;
  setShowSecretPopup: (show: boolean) => void;
  handleSecretSubmit: (db: any, onSuccess: () => void) => Promise<void>;
  secretPassword: string;
  setSecretPassword: (password: string) => void;
  setCanClose: (canClose: boolean) => void;
}

const PasswordProtectionContext = createContext<PasswordProtectionContextType | undefined>(undefined);

interface PasswordProtectionProviderProps {
  children: ReactNode;
}

export const PasswordProtectionProvider: React.FC<PasswordProtectionProviderProps> = ({ children }) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [showSecretPopup, setShowSecretPopup] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [canClose, setCanClose] = useState(true);
  const { setIsLoading } = useLoading();
  const { db } = useFirebase();

  const handleSecretSubmit = async () => {
    try {
      if (!db) {
        throw new FirebaseError(FIREBASE_ERROR);
      }
      setIsLoading(true);
      const storedPass = await getHashedAdminPassword(db);
      if (storedPass === false) {
        throw new FirebaseError(FIREBASE_ERROR);
      }
      const isMatch = secretPassword == storedPass;

      if (isMatch) {
        setShowSecrets(true);
        setShowSecretPopup(false);
      } else {
        showMessage({
          message: 'خطأ',
          description: 'كلمة المرور غير متطابقة',
          type: 'danger',
        });
      }
    } catch (err) {
      console.error('Error comparing passwords:', err);
      showMessage({
        message: 'خطأ',
        description: 'حدث خطأ أثناء التحقق من كلمة المرور',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PasswordProtectionContext.Provider
      value={{
        showSecrets,
        showSecretPopup,
        setShowSecretPopup,
        handleSecretSubmit,
        secretPassword,
        setSecretPassword,
        setCanClose,
      }}
    >
      {children}
      {showSecretPopup && (
        <TouchableWithoutFeedback onPress={() => canClose ? setShowSecretPopup(false) : null}>
          <View style={[styles.secretPopupContainer, !canClose ? { bottom: 62 } : {}]}>
            <TouchableWithoutFeedback onPress={(e) => { e.stopPropagation(); }}>
              <View style={styles.secretPopup}>
                <Text style={styles.secretPopupTitle}>أدخل كلمة المرور</Text>
                <TextInput
                  style={styles.secretInput}
                  secureTextEntry
                  onChangeText={setSecretPassword}
                  value={secretPassword}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#999"
                />
                <View style={styles.secretButtonsContainer}>
                  {canClose && <TouchableOpacity
                    style={styles.secretButton}
                    onPress={() => setShowSecretPopup(false)}
                  >
                    <Text style={styles.secretButtonText}>إلغاء</Text>
                  </TouchableOpacity>}
                  <TouchableOpacity
                    style={[styles.secretButton, styles.confirmButton]}
                    onPress={() => handleSecretSubmit()}
                  >
                    <Text style={[styles.secretButtonText, styles.confirmButtonText]}>تأكيد</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </PasswordProtectionContext.Provider>
  );
};

export const usePasswordProtection = () => {
  const context = useContext(PasswordProtectionContext);
  if (context === undefined) {
    throw new Error('usePasswordProtection must be used within a PasswordProtectionProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  secretPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secretPopup: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  secretPopupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  secretInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'right',
  },
  secretButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  secretButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  secretButtonText: {
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#27ae60',
  },
  confirmButtonText: {
    color: '#fff',
  },
});
