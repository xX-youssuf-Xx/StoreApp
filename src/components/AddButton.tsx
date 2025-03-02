import React, { useState, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';

interface AddButtonProps {
  children: ReactNode | ((props: { closeModal: () => void, refresh: () => void }) => ReactNode);
  refresh: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ children, refresh }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const openModal = () => {
    setModalVisible(true);
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  };

  const closeModal = () => {
    opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }, () => {
      runOnJS(setModalVisible)(false);
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Icon name="plus" size={24} color="white" />
      </TouchableOpacity>
      {isModalVisible && (
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <TouchableOpacity style={styles.overlay} onPress={closeModal} />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Icon name="times" size={24} color="black" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {typeof children === 'function' ? children({ closeModal, refresh }) : children}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#348feb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default AddButton;