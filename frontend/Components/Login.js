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

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const userData = { email, password };
      const response = await loginUser(userData);
      console.log('Login success:', response);
      navigation.navigate('Home');
    } catch (err) {
      console.log('Login error:', err);
      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'Something went wrong. Please try again.';
      setError(errorMessage);
    }
  };

  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  const isMobile = width < 768; // Adjust breakpoint as needed

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      {/* Left section */}
      <View style={[styles.leftSection, isMobile && styles.mobileLeftSection]}>
        <Image
          source={require('../assets/logo-2.png')}
          style={[styles.logo, isMobile && styles.mobileLogo]}
        />
        <Text style={[styles.logoText, isMobile && styles.mobileLogoText]}>
          FutureProof
        </Text>
      </View>

      {/* Right section */}
      <LinearGradient
        colors={['#ffffff', '#72f2b8']}
        style={[styles.rightSection, isMobile && styles.mobileRightSection]}
      >
        <Text style={[styles.header, isMobile && styles.mobileHeader]}>
          Sign in account
        </Text>

        <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
          <View style={styles.iconWrapper}>
            <Icon name="email" size={isMobile ? 20 : 30} color="#ffffff" />
          </View>
          <TextInput
            style={[styles.input, isMobile && styles.mobileInput]}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
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

        <TouchableOpacity style={[styles.button, isMobile && styles.mobileButton]} onPress={handleLogin}>
          <Text style={[styles.buttonText, isMobile && styles.mobileButtonText]}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
  },
  mobileContainer: {
    flexDirection: 'column',
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  mobileLeftSection: {
    padding: 10,
  },
  logo: {
    width: 550,
    height: 500,
  },
  mobileLogo: {
    width: 200,
    height: 200,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#004d00',
    textAlign: 'center',
  },
  mobileLogoText: {
    fontSize: 24,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  mobileRightSection: {
    padding: 10,
  },
  header: {
    fontSize: 55,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 60,
    textAlign: 'center',
  },
  mobileHeader: {
    fontSize: 32,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1B5E20',
    borderRadius: 50,
    backgroundColor: '#f9f9f9',
  },
  mobileInputContainer: {
    paddingHorizontal: 5,
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
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  mobileInput: {
    height: 35,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#004d00',
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  mobileButton: {
    paddingVertical: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mobileButtonText: {
    fontSize: 14,
  },
  forgotPassword: {
    color: '#004d00',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  mobileForgotPassword: {
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Login;