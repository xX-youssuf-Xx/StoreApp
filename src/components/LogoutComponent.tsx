import React from 'react';
import {View, TouchableOpacity, StyleSheet, Animated, Text} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {useFirebase} from '../context/FirebaseContext';
import Svg, {Path, Polyline, Line} from 'react-native-svg';

interface LogoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutIcon = () => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    stroke="gray"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const LogoutMenu: React.FC<LogoutMenuProps> = ({isOpen, onClose}) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const {backup} = useFirebase();

  const handleLogout = async () => {
    try {
      console.log('logout clicked before');
      const result = await backup();
      console.log('logout clicked after');

      if (result) {
        console.log(result);
        navigation.navigate('NoActiveUser');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.overlayBackground} />
      </TouchableOpacity>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogoutIcon />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  menuContainer: {
    position: 'absolute',
    right: 8,
    top: 64,
    width: 180,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
  },
});

export default LogoutMenu;
