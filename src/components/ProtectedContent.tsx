import React from 'react';
import { TouchableOpacity } from 'react-native';
import { usePasswordProtection } from '../context/PasswordProtectionContext';

interface ProtectedContentProps {
  children: React.ReactNode;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({ children }) => {
  const { showSecrets, setShowSecretPopup } = usePasswordProtection();

  const handlePress = () => {
    console.log('showSecrets', showSecrets);
    if (!showSecrets) {
      setShowSecretPopup(true);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={{ flex: 1 }}
    >
      {children}
    </TouchableOpacity>
  );
};

export default ProtectedContent; 