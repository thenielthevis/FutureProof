import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { loginUser } from '../API/api';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const showToast = (message, type) => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    Toast.show({
      type: type,
      position: 'top',
      text1: `${icons[type] || ''} ${message}`,
      visibilityTime: 2000,
      autoHide: true,
      topOffset: Platform.OS === 'android' ? 30 : 60,
    });
  };

  const handleLogin = async () => {
    setError('');

    Toast.show({
      type: 'info',
      text1: 'Logging in... ⏳',
      position: 'top',
      visibilityTime: 10000,
      autoHide: false,
      id: 'loading',
    });

    try {
      const userData = { email, password };
      const response = await loginUser(userData);
      console.log('Login success:', response);

      // Save the token in AsyncStorage
      await AsyncStorage.setItem('token', response.access_token);

      // Log the token to the console for debugging
      const token = await AsyncStorage.getItem('token');
      console.log('Stored token:', token);

      // Hide loading toast and show success toast
      Toast.hide('loading');
      showToast('Login Successful! 🎉', 'success');

      // Navigate to the Home screen after 2 seconds
      setTimeout(() => {
        navigation.navigate('Home'); // Ensure 'Home' is defined in your navigation stack
      }, 2000);
    } catch (err) {
      console.log('Login error:', err);
      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'An error occurred during login';
      setError(errorMessage);
      Toast.hide('loading');
      showToast(errorMessage, 'error');
    }
  };

  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      <View style={[styles.leftSection, isMobile && styles.mobileLeftSection]}>
        <Image
          source={require('../assets/logo-2.png')}
          style={[styles.logo, isMobile && styles.mobileLogo]}
        />
        <Text style={[styles.logoText, isMobile && styles.mobileLogoText]}>
          FutureProof
        </Text>
      </View>

      <LinearGradient
        colors={['#ffffff', '#72f2b8']}
        style={[styles.rightSection, isMobile && styles.mobileRightSection]}
      >
        <Text style={[styles.header, isMobile && styles.mobileHeader]}>
          Sign in account
        </Text>

        <View
          style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}
        >
          <View style={styles.iconWrapper}>
            <Icon name="email" size={isMobile ? 20 : 30} color="#ffffff" />
          </View>
          <TextInput
            style={[styles.input, isMobile && styles.mobileInput]}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View
          style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}
        >
          <View style={styles.iconWrapper}>
            <Icon name="lock" size={isMobile ? 20 : 30} color="#ffffff" />
          </View>
          <TextInput
            style={[styles.input, isMobile && styles.mobileInput]}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isMobile && styles.mobileButton]}
          onPress={handleLogin}
        >
          <Text style={[styles.buttonText, isMobile && styles.mobileButtonText]}>
            LOGIN
          </Text>
        </TouchableOpacity>

        <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
          Forgot Password?
        </Text>
      </LinearGradient>

      {/* Toast component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8f8f8' },
  mobileContainer: { flexDirection: 'column' },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  mobileLeftSection: { padding: 10 },
  logo: { width: 550, height: 500 },
  mobileLogo: { width: 200, height: 200 },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#004d00',
    textAlign: 'center',
  },
  mobileLogoText: { fontSize: 24 },
  rightSection: { flex: 1, justifyContent: 'center', padding: 20 },
  mobileRightSection: { padding: 10 },
  header: {
    fontSize: 55,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 60,
    textAlign: 'center',
  },
  mobileHeader: { fontSize: 32, marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1B5E20',
    borderRadius: 50,
    backgroundColor: '#f9f9f9',
  },
  iconWrapper: {
    width: 60,
    height: 50,
    borderRadius: 70,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    alignSelf: 'center',
  },
  input: { flex: 1, height: 40, fontSize: 16, color: '#333' },
  button: {
    backgroundColor: '#004d00',
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  forgotPassword: {
    color: '#004d00',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});

export default Login;