import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Animated, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

interface TopNavBarProps {
  title: string;
  onSettingsPress: () => void;
  onSearchChange: (text: string) => void;
  onBackPress?: () => void;
  showBackButton?: boolean;
  showSearchIcon?: boolean;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ 
  title, 
  onSettingsPress, 
  onSearchChange, 
  onBackPress,
  showBackButton = false,
  showSearchIcon = true
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchWidthAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    Animated.timing(searchWidthAnim, {
      toValue: isSearchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      if (!isSearchVisible) {
        searchInputRef.current?.focus();
      }
    });
  };

  useEffect(() => {
    if (!isSearchVisible) {
      onSearchChange('');
    }
  }, [isSearchVisible]);

  return (
    <SafeAreaView style={styles.topBarContainer}>
      <View style={styles.topBar}>
        <View style={styles.leftIcons}>
          {showSearchIcon && (
            <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
              <Icon name="search" size={20} color="#000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
            <Icon name="ellipsis-v" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <Icon name="chevron-right" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[
          styles.searchContainer,
          {
            width: searchWidthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, width - 20],
            }),
            opacity: searchWidthAnim,
          },
        ]}>
          {isSearchVisible && (
            <View style={styles.searchInputContainer}>
              <TouchableOpacity onPress={toggleSearch} style={styles.searchBackButton}>
                <Icon name="arrow-left" size={20} color="#000" />
              </TouchableOpacity>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="إبحث..."
                placeholderTextColor="#000"
                onChangeText={onSearchChange}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBarContainer: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topBar: {
    height: 60,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  leftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10,
  },
  backButton: {
    padding: 10,
  },
  iconButton: {
    padding: 10,
    marginRight: 10,
  },
  searchContainer: {
    height: 40,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  searchInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  searchBackButton: {
    padding: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingRight: 10,
    color: '#000',
  },
});

export default TopNavBar;