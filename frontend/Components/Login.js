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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser, verifyReactivationOTP } from '../API/user_api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import ReactivationModal from './ReactivationModal';

const Login = ({ navigation }) => {
  const [step, setStep] = useState(1); // Step 1: Login, Step 2: OTP Verification
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [otp, setOtp] = useState(''); // State for OTP input
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loader
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility

  const showToast = (message, type) => {
    const backgroundColors = {
      success: '#1B5E20', // Dark green for success
      error: '#D32F2F', // Dark red for error
      info: '#1B5E20', // Dark green for loading
    };

    Toast.show({
      type: type,
      position: 'top',
      text1: message, // Keep the original text
      visibilityTime: type === 'info' ? 10000 : 2000, // Longer duration for loading toast
      autoHide: type !== 'info', // Do not auto-hide loading toast
      topOffset: Platform.OS === 'android' ? 30 : 60,
      props: {
        style: {
          backgroundColor: backgroundColors[type],
          borderRadius: 8,
          padding: 16,
        },
        text1Style: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#ffffff', // White text
        },
      },
    });
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true); // Show loader

    // Show loading toast
    showToast('Logging in... ⏳', 'info');

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
      Toast.hide(); // Hide all toasts
      showToast('Login Successful! 🎉', 'success');

      // Navigate to the Home screen after 2 seconds
      setTimeout(() => {
        navigation.navigate('Home');
        setIsLoading(false); // Hide loader after navigation
      }, 2000);
    } catch (err) {
      console.log('Login error:', err);
      // If account is disabled, show the reactivation modal
      setIsModalVisible(true);
      showToast('Account is disabled. OTP sent to email for reactivation.', 'info');

      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'An error occurred during login';
      setError(errorMessage);

      // Hide loading toast and show error toast
      Toast.hide(); // Hide all toasts
      showToast(errorMessage, 'error');
      setIsLoading(false); // Hide loader on error
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsLoading(true); // Show loader

    // Show loading toast
    showToast('Verifying OTP... ⏳', 'info');

    try {
      const response = await verifyReactivationOTP({ email, otp });
      console.log('OTP verification success:', response);

      // Hide loading toast and show success toast
      Toast.hide(); // Hide all toasts
      showToast('Account reactivated successfully! 🎉', 'success');

      // Proceed with login after OTP verification
      setStep(1); // Move back to login step
      handleLogin(); // Attempt to log in again
    } catch (err) {
      console.log('OTP verification error:', err);
      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'Invalid OTP. Please try again.';
      setError(errorMessage);

      // Hide loading toast and show error toast
      Toast.hide(); // Hide all toasts
      showToast(errorMessage, 'error');
      setIsLoading(false); // Hide loader on error
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
        <Text style={[styles.tagline, isMobile && styles.mobileTagline]}>
          Embrace the Bear Within—Strong, Resilient, Future-Ready
        </Text>
      </View>

      <LinearGradient
        colors={['#14243b', '#77f3bb']}
        style={[styles.rightSection, isMobile && styles.mobileRightSection]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.header, isMobile && styles.mobileHeader]}>
            {step === 1 ? 'Sign in account' : 'Verify OTP'}
          </Text>

          {step === 1 && (
            <>
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
                  secureTextEntry={!showPassword} // Use showPassword state
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={30} color="#333" />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={handleLogin}
                disabled={isLoading} // Disable button when loading
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" /> // Show loader
                ) : (
                  <Text style={[styles.buttonText, isMobile && styles.mobileButtonText]}>
                    NEXT
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I don't have an account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={[styles.backToHome, isMobile && styles.mobileBackToHome]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View
                style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}
              >
                <View style={styles.iconWrapper}>
                  <Icon name="vpn-key" size={isMobile ? 20 : 30} color="#ffffff" />
                </View>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Enter OTP"
                  placeholderTextColor="#aaa"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={handleVerifyOtp}
                disabled={isLoading} // Disable button when loading
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" /> // Show loader
                ) : (
                  <Text style={[styles.buttonText, isMobile && styles.mobileButtonText]}>
                    VERIFY OTP
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <ReactivationModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        email={email}
      />

      {/* Toast component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff' },
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
  tagline: {
    fontSize: 18,
    color: '#004d00',
    textAlign: 'center',
    marginTop: 10,
  },
  mobileTagline: {
    fontSize: 14,
  },
  rightSection: { flex: 1, justifyContent: 'center', padding: 20 },
  mobileRightSection: { padding: 10 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  header: {
    fontSize: 55,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 70,
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
  input: { flex: 0.9, height: 40, fontSize: 16, padding: 10, backgroundColor: '#f9f9f9' },
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
  backToHome: {
    color: '#004d00',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  mobileBackToHome: {
    fontSize: 14,
  },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});

export default Login;