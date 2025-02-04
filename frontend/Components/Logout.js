import React from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Logout = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully!',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 30 : 60,
      });

      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Are you sure you want to logout?</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});

export default Logout;