import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { registerUser } from '../API/api';

const { width } = Dimensions.get('window');

const Register = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const [customFood, setCustomFood] = useState('');
  const [customVice, setCustomVice] = useState("");
  const [customGeneticDisease, setCustomGeneticDisease] = useState("");
  const [customLifestyle, setCustomLifestyle] = useState("");

  const handleCheckboxToggle = (option, setState, state) => {
    setState(state.includes(option) ? state.filter(item => item !== option) : [...state, option]);
  };

  const handleRegister = async () => {
    setError(''); // Reset any previous error

    const updatedVices = customVice.trim() !== "" ? [...vices, customVice.trim()] : vices;
    const updatedGeneticDiseases = customGeneticDisease.trim() !== "" ? [...genetic_diseases, customGeneticDisease.trim()] : genetic_diseases;
    const updatedLifestyle = customLifestyle.trim() !== "" ? [...lifestyle, customLifestyle.trim()] : lifestyle;
    const updatedFoodIntake = customFood.trim() !== "" ? [...food_intake, customFood.trim()] : food_intake;

    try {
      const userData = { 
        username, email, password, age, gender, height, weight, environment, 
        vices: updatedVices, genetic_diseases: updatedGeneticDiseases, 
        lifestyle: updatedLifestyle, food_intake: updatedFoodIntake, 
        sleep_hours, activeness 
      };
      
      const response = await registerUser(userData);
      console.log(response);
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      setError(error.detail || 'Something went wrong');
    }
  };

  const isMobile = width < 768;

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      {/* Left Section - Logo */}
      <View style={[styles.leftSection, isMobile && styles.mobileLeftSection]}>
        <Image 
          source={require('../assets/logo-2.png')} 
          style={[styles.logo, isMobile && styles.mobileLogo]} 
        />
        <Text style={[styles.logoText, isMobile && styles.mobileLogoText]}>
          FutureProof
        </Text>
      </View>

      {/* Right Section - Form with Gradient Background */}
      <LinearGradient
        colors={['#ffffff', '#72f2b8']} // Green gradient
        style={[styles.rightSection, isMobile && styles.mobileRightSection]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={[styles.header, isMobile && styles.mobileHeader]}>
            {step === 1 ? "Step 1: Account Info" :
             step === 2 ? "Step 2: BMI & Environment" :
             step === 3 ? "Step 3: Health & Lifestyle" :
             "Step 4: Sleep & Activeness"}
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
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <TouchableOpacity 
                style={[styles.button, isMobile && styles.mobileButton]} 
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Next</Text>
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
              </View>
              <Text style={styles.subHeader}>Gender</Text>
              {["Male", "Female"].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={gender.includes(option) ? 'checked' : 'unchecked'} 
                  onPress={() => setGender(option)}
                  key={option}
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
              </View>
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>

              <Text style={styles.subHeader}>Environmental Status</Text>
              {["Hushed", "Quiet", "Moderate", "Loud", "Deafening"].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={environment.includes(option) ? 'checked' : 'unchecked'} 
                  onPress={() => setEnvironment(option)}
                  key={option}
                />
              ))}

              <Text style={styles.subHeader}>Vices / Addictions</Text>
              {['Alcoholism', 'Smoking', 'Substance Abuse', 'Digital', 'None'].map((option) => (
                <Checkbox.Item 
                  label={option} 
                  status={vices.includes(option) ? 'checked' : 'unchecked'} 
                  onPress={() => handleCheckboxToggle(option, setVices, vices)} 
                  key={option} 
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Vices"
                  value={customVice}
                  onChangeText={setCustomVice}
                />
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
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.subHeader}>Genetic Diseases</Text>
              {[
                "Sickle Cell Anemia",
                "Huntington's Disease",
                "Hemophilia",
                "Down Syndrome",
                "None"
              ].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={genetic_diseases.includes(option) ? "checked" : "unchecked"}
                  onPress={() => handleCheckboxToggle(option, setGeneticDiseases, genetic_diseases)}
                  key={option}
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Genetic Diseases"
                  value={customGeneticDisease}
                  onChangeText={setCustomGeneticDisease}
                />
              </View>

              <Text style={styles.subHeader}>Daily Habit / Lifestyle</Text>
              {[
                "Physical Activity",
                "Healthy Eating",
                "Stress Management",
                "Regular Check-ups",
                "Social Interaction",
              ].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={lifestyle.includes(option) ? "checked" : "unchecked"}
                  onPress={() => handleCheckboxToggle(option, setLifestyle, lifestyle)}
                  key={option}
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Habits"
                  value={customLifestyle}
                  onChangeText={setCustomLifestyle}
                />
              </View>

              <Text style={styles.subHeader}>Daily Food Intake</Text>
              {["Vegetables", "Fruits", "Grains", "Dairy", "Protein Foods"].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={food_intake.includes(option) ? "checked" : "unchecked"}
                  onPress={() => handleCheckboxToggle(option, setFoodIntake, food_intake)}
                  key={option}
                />
              ))}
              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <TextInput
                  style={[styles.input, isMobile && styles.mobileInput]}
                  placeholder="Other Food Intake"
                  value={customFood}
                  onChangeText={setCustomFood}
                />
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
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.subHeader}>Daily Sleep Hours</Text>
              {["1-2 hrs", "3-4 hrs", "5-6 hrs", "7-8 hrs", "9-10 hrs", "11-12 hrs"].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={sleep_hours === option ? "checked" : "unchecked"}
                  onPress={() => setSleepHours(option)}
                  key={option}
                />
              ))}

              <Text style={styles.subHeader}>Level of Activeness</Text>
              {["Sedentary", "Light", "Moderate", "Vigorous"].map((option) => (
                <Checkbox.Item
                  label={option}
                  status={activeness === option ? "checked" : "unchecked"}
                  onPress={() => setActiveness(option)}
                  key={option}
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
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  mobileButtonText: {
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Register;