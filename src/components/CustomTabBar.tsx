import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Animated, TextInput } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SettingsMenu: React.FC<{ visible: boolean, onClose: () => void }> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
      <Animated.View 
        style={[
          styles.settingsMenu,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}
      >
        <TouchableOpacity style={styles.menuItem}>
          <Text>Settings Item 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text>Settings Item 2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text>Settings Item 3</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const animatedValues = useRef(state.routes.map(() => new Animated.Value(0))).current;
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const searchWidthAnim = useRef(new Animated.Value(0)).current;

  const currentRoute = state.routes[state.index]?.name || 'الرئيسية';

  useEffect(() => {
    Animated.parallel(
      animatedValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: index === state.index ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [state.index]);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    Animated.timing(searchWidthAnim, {
      toValue: isSearchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Settings and Search Icons */}
      <SafeAreaView style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSettingsVisible(true)}
          >
            <Icon name="ellipsis-v" size={20} color="#000" />
          </TouchableOpacity>

          <Animated.View style={[
            styles.searchContainer,
            {
              width: searchWidthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, width - 100],
              }),
            },
          ]}>
            {isSearchVisible ? (
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                autoFocus
              />
            ) : (
              <Text style={styles.label}>{currentRoute}</Text>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleSearch}
          >
            <Icon name={isSearchVisible ? "arrow-left" : "search"} size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Tab Bar */}
      <SafeAreaView style={styles.bottomBarContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];

            const label = typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.tabBarLabel
              ? options.tabBarLabel({
                  focused: isFocused,
                  color: isFocused ? '#00f' : '#222',
                  position: 'below-icon',
                  children: route.name
                })
              : route.name;

            const iconName = route.name === 'الرئيسية' ? 'home' : route.name === 'العملاء' ? 'users' : route.name === 'الحساب الشخصي' ? 'user' : 'archive';

            const translateY = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
            });

            const backgroundColor = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', '#87CEFA'],
            });

            return (
              <TouchableOpacity
                key={route.name}
                onPress={() => {
                  if (!isFocused) {
                    navigation.navigate(route.name);
                    console.log(`navigated to ${route.name}`)
                  }
                }}
                style={styles.tab}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [{ translateY }],
                      backgroundColor,
                    },
                  ]}
                >
                  <Icon name={iconName} size={20} color={isFocused ? '#fff' : '#222'} />
                </Animated.View>
                <Text style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      <SettingsMenu visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: '100%',
    backgroundColor: 'transparent',
    zIndex:10
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8f8f8',
    zIndex: 1,
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  iconButton: {
    padding: 10,
  },
  searchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#222',
  },
  focusedTabLabel: {
    color: '#00f',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  settingsMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 60,
    marginRight: 10,
    width: 200,
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default CustomTabBar;