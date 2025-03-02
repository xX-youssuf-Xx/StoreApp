import React from 'react';
import {View, TouchableOpacity, StyleSheet, Animated, Text} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {useFirebase} from '../context/FirebaseContext';
import Svg, {Path, Polyline, Line} from 'react-native-svg';

interface LogoutMenuProps {
  isFoodStorage: boolean;
  isOpen: boolean;
  onClose: () => void;
  onGetSummary?: () => void;  // Add new prop for the callback
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

const LogoutMenu: React.FC<LogoutMenuProps> = ({
  isFoodStorage,
  isOpen,
  onClose,
  onGetSummary,
}) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const {backup} = useFirebase();

  const handleLogout = async () => {
    try {
      const result = await backup();

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
        {isFoodStorage && onGetSummary && (
          <TouchableOpacity style={styles.menuItem} onPress={onGetSummary}>
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              stroke="gray"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none">
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <Polyline points="17 8 12 3 7 8" />
              <Line x1="12" y1="3" x2="12" y2="15" />
            </Svg>
            <Text style={styles.menuText}>export Data</Text>
          </TouchableOpacity>
        )}
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
    left: 8,
    top: 64,
    width: 120,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    width: '80%',
  },
});

export default LogoutMenu;
