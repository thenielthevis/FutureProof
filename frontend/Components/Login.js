import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { loginUser } from '../API/api';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icons

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    try {
      const userData = { email, password };
      const response = await loginUser(userData);
      console.log('Login success:', response);
      navigation.navigate('Home'); // Navigate to home after login
    } catch (err) {
      console.log('Login error:', err);
      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'Something went wrong. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Left section */}
      <View style={styles.leftSection}>
        <Image
          source={require('../assets/logo-2.png')} // Replace with your logo
          style={styles.logo}
        />
        <Text style={styles.logoText}>FutureProof</Text>
      </View>

      {/* Right section */}
      <LinearGradient
        colors={['#ffffff', '#72f2b8']} // White to green gradient
        style={styles.rightSection}
      >
        <Text style={styles.header}>Sign in account</Text>

        <View style={styles.inputContainer}>
          <View style={styles.iconWrapper}>
            <Icon name="email" size={20} color="#ffffff" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.iconWrapper}>
            <Icon name="lock" size={20} color="#ffffff" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
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
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 1,
  },
  logo: {
    width: 550,
    height: 500,
    marginRight: 1,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#004d00',
    textAlign: 'center',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 55,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 60,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3, // Black border
    borderColor: '#000000', // Black border
    borderRadius: 50,
    paddingHorizontal: 0.5,
    backgroundColor: '#f9f9f9',
  },
  iconWrapper: {
    width: 60,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#004d00', // Dark green background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Decrease margin to bring the icon closer to the input
    alignSelf: 'center', // Vertically align the icon to the center of the input
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#004d00',
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 3, // Black border
    borderColor: '#000000', // Black border
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#004d00',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Login;
