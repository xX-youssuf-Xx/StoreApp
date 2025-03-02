import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
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
                color: isFocused ? '#4682B4' : '#222',
                position: 'below-icon',
                children: route.name
              })
            : route.name;

          const iconName = route.name === 'الرئيسية' ? 'home' : route.name === 'العملاء' ? 'users' : route.name === 'الحساب الشخصي' ? 'user' : 'archive';

          return (
            <TouchableOpacity
              key={route.name}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(route.name);
                  console.log(`navigated to ${route.name}`);
                }
              }}
              style={styles.tab}
            >
              <View style={styles.iconContainer}>
                <Icon name={iconName} size={24} color={isFocused ? '#4682B4' : '#222'} />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomBarContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#222',
  },
  focusedTabLabel: {
    color: '#4682B4',
  },
});

export default BottomTabBar;