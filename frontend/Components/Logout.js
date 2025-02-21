import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Logout = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(true); // Show popup on load

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully!',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 30 : 60,
      });

      // Close the popup
      setModalVisible(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Modal visible={modalVisible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Are you sure you want to logout?</Text>
          
          {/* Buttons Side by Side */}
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
            <Button title="Logout" onPress={handleLogout} color="#388E3C" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30, // Increased padding for bigger popup
    borderRadius: 10,
    width: 200, // Increased width
    alignItems: 'center',
  },
  header: {
    fontSize: 26, // Slightly larger text
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row', // Align buttons side by side
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    borderRadius: 20,
  },
});

export default Logout;
