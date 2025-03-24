import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser } from '../API/user_api';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios'; // Import axios

const { width } = Dimensions.get('window');

const Register = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [environment, setEnvironment] = useState('');
  const [vices, setVices] = useState([]);
  const [genetic_diseases, setGeneticDiseases] = useState([]);
  const [lifestyle, setLifestyle] = useState([]);
  const [food_intake, setFoodIntake] = useState([]);
  const [sleep_hours, setSleepHours] = useState('');
  const [activeness, setActiveness] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [customFood, setCustomFood] = useState('');
  const [customVice, setCustomVice] = useState('');
  const [customGeneticDisease, setCustomGeneticDisease] = useState('');
  const [customLifestyle, setCustomLifestyle] = useState('');

  const [ageError, setAgeError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [customViceError, setCustomViceError] = useState('');
  const [customGeneticDiseaseError, setCustomGeneticDiseaseError] = useState('');
  const [customLifestyleError, setCustomLifestyleError] = useState('');
  const [customFoodError, setCustomFoodError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

  console.log('Current API_URL:', API_URL); // Add this line for debugging

  const handleCheckboxToggle = (option, setState, state) => {
    setState(state.includes(option) ? state.filter(item => item !== option) : [...state, option]);
  };

  const showToast = (message, type) => {
    const backgroundColors = {
      success: '#1B5E20',
      error: '#D32F2F',
      info: '#1B5E20',
    };

    Toast.show({
      type: type,
      position: 'top',
      text1: message,
      visibilityTime: type === 'info' ? 10000 : 2000,
      autoHide: type !== 'info',
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
          color: '#ffffff',
        },
      },
    });
  };

  const sendEmail = async (email, username) => {
    try {
      const response = await axios.post(`${API_URL}/send-email/`, {
        to_email: email,
        subject: 'Welcome to FutureProof',
        message: `Hello ${username}, welcome to FutureProof! We are excited to have you on board.`,
      });

      Alert.alert('Success', response.data.message);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send email');
    }
  };

  const verifyOtp = async () => {
    setOtpError('');
    setIsLoading(true);
  
    if (otp.trim() === '') {
      setOtpError('OTP is required.');
      showToast('OTP is required.', 'error');
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(`${API_URL}/verify-otp/`, {
        email: email,
        otp: otp
      });
  
      if (response.data.message) {
        showToast('OTP verified successfully! 🎉', 'success');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (error) {
      console.log('OTP verification error:', error);
      const errorMessage = error.response?.data?.detail || 'Invalid OTP. Please try again.';
      setOtpError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setAgeError('');
    setHeightError('');
    setWeightError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setCustomViceError('');
    setCustomGeneticDiseaseError('');
    setCustomLifestyleError('');
    setCustomFoodError('');
    setIsLoading(true);

    if (!/^\d+$/.test(age)) {
      setAgeError('Age must be a number.');
      showToast('Age must be a number.', 'error');
      setIsLoading(false);
      return;
    }
    if (!/^\d+$/.test(height)) {
      setHeightError('Height must be a number.');
      showToast('Height must be a number.', 'error');
      setIsLoading(false);
      return;
    }
    if (!/^\d+$/.test(weight)) {
      setWeightError('Weight must be a number.');
      showToast('Weight must be a number.', 'error');
      setIsLoading(false);
      return;
    }

    if (username.trim() === '') {
      setUsernameError('Username is required.');
      showToast('Username is required.', 'error');
      setIsLoading(false);
      return;
    }
    if (email.trim() === '') {
      setEmailError('Email is required.');
      showToast('Email is required.', 'error');
      setIsLoading(false);
      return;
    }
    if (password.trim() === '') {
      setPasswordError('Password is required.');
      showToast('Password is required.', 'error');
      setIsLoading(false);
      return;
    }
    if (confirmPassword.trim() === '') {
      setConfirmPasswordError('Confirm Password is required.');
      showToast('Confirm Password is required.', 'error');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      showToast('Passwords do not match.', 'error');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z\s]*$/.test(customVice)) {
      setCustomViceError('Other Vices must be text.');
      showToast('Other Vices must be text.', 'error');
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z\s]*$/.test(customGeneticDisease)) {
      setCustomGeneticDiseaseError('Other Genetic Diseases must be text.');
      showToast('Other Genetic Diseases must be text.', 'error');
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z\s]*$/.test(customLifestyle)) {
      setCustomLifestyleError('Other Habits must be text.');
      showToast('Other Habits must be text.', 'error');
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z\s]*$/.test(customFood)) {
      setCustomFoodError('Other Food Intake must be text.');
      showToast('Other Food Intake must be text.', 'error');
      setIsLoading(false);
      return;
    }

    showToast('Registering... ⏳', 'info');

    const updatedVices = customVice.trim() !== '' ? [...vices, customVice.trim()] : vices;
    const updatedGeneticDiseases = customGeneticDisease.trim() !== '' ? [...genetic_diseases, customGeneticDisease.trim()] : genetic_diseases;
    const updatedLifestyle = customLifestyle.trim() !== '' ? [...lifestyle, customLifestyle.trim()] : lifestyle;
    const updatedFoodIntake = customFood.trim() !== '' ? [...food_intake, customFood.trim()] : food_intake;

    try {
      const userData = {
        username,
        email,
        password,
        age,
        gender,
        height,
        weight,
        environment,
        vices: updatedVices,
        genetic_diseases: updatedGeneticDiseases,
        lifestyle: updatedLifestyle,
        food_intake: updatedFoodIntake,
        sleep_hours,
        activeness,
      };
  
      // Send data to Python server
      const registerResponse = await axios.post(`${API_URL}/register/`, userData);
      console.log('Register success:', registerResponse);
  
      Toast.hide();
      showToast('Registration Successful! 🎉', 'success');
  
      setIsOtpSent(true); // Set OTP sent flag to true
      setStep(5); // Move to OTP verification step
      setIsLoading(false);
    } catch (error) {
      console.log('Register error:', error);
      const errorMessage =
        error.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(errorMessage);
  
      Toast.hide();
      showToast(errorMessage, 'error');
      setIsLoading(false);
    }
  };

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
            {step === 1
              ? 'Step 1: Account Info'
              : step === 2
              ? 'Step 2: BMI & Environment'
              : step === 3
              ? 'Step 3: Health & Lifestyle'
              : step === 4
              ? 'Step 4: Sleep & Activeness'
              : 'Step 5: Verify OTP'}
          </Text>

          {step === 1 && (
            <View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                />
                {usernameError ? <Text style={styles.error}>{usernameError}</Text> : null}
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                />
                {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#333" />
                </TouchableOpacity>
                {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Confirm Password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon name={showConfirmPassword ? 'eye' : 'eye-slash'} size={20} color="#333" />
                </TouchableOpacity>
                {confirmPasswordError ? <Text style={styles.error}>{confirmPasswordError}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.subHeader}>Body Mass Index</Text>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Age"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
                {ageError ? <Text style={styles.error}>{ageError}</Text> : null}
              </View>
              <Text style={styles.subHeader}>Gender</Text>
              {['Male', 'Female'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={gender.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => setGender(option)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Height (cm)"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
                {heightError ? <Text style={styles.error}>{heightError}</Text> : null}
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
                {weightError ? <Text style={styles.error}>{weightError}</Text> : null}
              </View>

              <Text style={styles.subHeader}>Environmental Status</Text>
              {['Hushed', 'Quiet', 'Moderate', 'Loud', 'Deafening'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={environment.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => setEnvironment(option)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}

              <Text style={styles.subHeader}>Vices / Addictions</Text>
              {['Alcoholism', 'Smoking', 'Substance Abuse', 'Digital', 'None'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={vices.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => handleCheckboxToggle(option, setVices, vices)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Vices"
                  value={customVice}
                  onChangeText={setCustomVice}
                />
                {customViceError ? <Text style={styles.error}>{customViceError}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.subHeader}>Genetic Diseases</Text>
              {[
                'Sickle Cell Anemia',
                "Huntington's Disease",
                'Hemophilia',
                'Down Syndrome',
                'None',
              ].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={genetic_diseases.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => handleCheckboxToggle(option, setGeneticDiseases, genetic_diseases)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Genetic Diseases"
                  value={customGeneticDisease}
                  onChangeText={setCustomGeneticDisease}
                />
                {customGeneticDiseaseError ? <Text style={styles.error}>{customGeneticDiseaseError}</Text> : null}
              </View>

              <Text style={styles.subHeader}>Daily Habit / Lifestyle</Text>
              {[
                'Physical Activity',
                'Healthy Eating',
                'Stress Management',
                'Regular Check-ups',
                'Social Interaction',
              ].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={lifestyle.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => handleCheckboxToggle(option, setLifestyle, lifestyle)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Habits"
                  value={customLifestyle}
                  onChangeText={setCustomLifestyle}
                />
                {customLifestyleError ? <Text style={styles.error}>{customLifestyleError}</Text> : null}
              </View>

              <Text style={styles.subHeader}>Daily Food Intake</Text>
              {['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Protein Foods'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={food_intake.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => handleCheckboxToggle(option, setFoodIntake, food_intake)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Food Intake"
                  value={customFood}
                  onChangeText={setCustomFood}
                />
                {customFoodError ? <Text style={styles.error}>{customFoodError}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(4)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.subHeader}>Daily Sleep Hours</Text>
              {['1-2 hrs', '3-4 hrs', '5-6 hrs', '7-8 hrs', '9-10 hrs', '11-12 hrs'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={sleep_hours === option ? 'checked' : 'unchecked'}
                  onPress={() => setSleepHours(option)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}

              <Text style={styles.subHeader}>Level of Activeness</Text>
              {['Sedentary', 'Light', 'Moderate', 'Vigorous'].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={activeness === option ? 'checked' : 'unchecked'}
                  onPress={() => setActiveness(option)}
                  key={option}
                  labelStyle={{ color: '#ffffff' }} // White text
                />
              ))}
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.subHeader}>Enter OTP</Text>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="OTP"
                  value={otp}
                  onChangeText={setOtp}
                />
                {otpError ? <Text style={styles.error}>{otpError}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.button, isMobile && styles.mobileButton]}
                onPress={verifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.forgotPassword, isMobile && styles.mobileForgotPassword]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={[styles.backToHome, isMobile && styles.mobileBackToHome]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
      <Toast />
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
  tagline: {
    fontSize: 18,
    color: '#004d00',
    textAlign: 'center',
    marginTop: 10,
  },
  mobileTagline: {
    fontSize: 14,
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
    color: '#ffffff',
    marginBottom: 60,
    marginTop: 100,
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
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  mobileInputContainer: {
    paddingHorizontal: 5,
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
    fontSize: 18,
    textAlign: 'center',
  },
  mobileButtonText: {
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  forgotPassword: {
    color: '#004d00',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  Checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
});

export default Register;