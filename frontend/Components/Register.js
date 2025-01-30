import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { Checkbox, RadioButton } from 'react-native-paper'; // Import checkbox component
import { registerUser } from '../API/api';

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
  
    // Add custom inputs to the corresponding lists before sending to backend
    const updatedVices = customVice.trim() !== "" ? [...vices, customVice.trim()] : vices;
    const updatedGeneticDiseases = customGeneticDisease.trim() !== "" ? [...genetic_diseases, customGeneticDisease.trim()] : genetic_diseases;
    const updatedLifestyle = customLifestyle.trim() !== "" ? [...lifestyle, customLifestyle.trim()] : lifestyle;
    const updatedFoodIntake = customFood.trim() !== "" ? [...food_intake, customFood.trim()] : food_intake;
  
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
        activeness 
      };
      
      // Await the response from the API
      const response = await registerUser(userData);
  
      // You can inspect the response here if needed
      console.log(response);  // Make sure the response is in the expected format
  
      // If registration is successful, navigate to the login screen
      navigation.navigate('Login');
    } catch (error) {
      // Handle error properly
      console.error(error);  // You can inspect the error object in the console to understand its structure
      setError(error.detail || 'Something went wrong');  // Simplify the error message if needed
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 && (
        <View>
          <Text style={styles.header}>Step 1: Account Info</Text>
          <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Next" onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.header}>Step 2: BMI & Environment</Text>
          <Text style={styles.subHeader}>Body Mass Index</Text>
          <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
          <Text style={styles.subHeader}>Gender</Text>
          {["Male", "Female"].map((option) => (
            <Checkbox.Item
              label={option}
              status={gender.includes(option) ? 'checked' : 'unchecked'} 
              onPress={() => setGender(option)}
              key={option}
            />
          ))}
          <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
          <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />

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
            <Checkbox.Item label={option} status={vices.includes(option) ? 'checked' : 'unchecked'} onPress={() => handleCheckboxToggle(option, setVices, vices)} key={option} />
          ))}
          {/* Other Vices */}
          <TextInput
            style={styles.input}
            placeholder="Other Vices"
            value={customVice}
            onChangeText={setCustomVice}
          />
          <Button title="Back" onPress={() => setStep(1)} />
          <Button title="Next" onPress={() => setStep(3)} />
        </View>
      )}

      {step === 3 && (
        <View>
          <Text style={styles.header}>Step 3: Health & Lifestyle</Text>

          {/* Genetic Diseases */}
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
          {/* Other Genetic Diseases */}
          <TextInput
            style={styles.input}
            placeholder="Other Genetic Diseases"
            value={customGeneticDisease}
            onChangeText={setCustomGeneticDisease}
          />
          {/* Daily Habit/Lifestyle */}
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
          {/* Other Lifestyle Habits */}
          <TextInput
            style={styles.input}
            placeholder="Other Habits"
            value={customLifestyle}
            onChangeText={setCustomLifestyle}
          />
          {/* Daily Food Intake */}
          <Text style={styles.subHeader}>Daily Food Intake</Text>
          {["Vegetables", "Fruits", "Grains", "Dairy", "Protein Foods"].map((option) => (
            <Checkbox.Item
              label={option}
              status={food_intake.includes(option) ? "checked" : "unchecked"}
              onPress={() => handleCheckboxToggle(option, setFoodIntake, food_intake)}
              key={option}
            />
          ))}
          {/* Other Food Intake */}
          <TextInput
            style={styles.input}
            placeholder="Other Food Intake"
            value={customFood}
            onChangeText={setCustomFood}
          />
          <Button title="Back" onPress={() => setStep(2)} />
          <Button title="Next" onPress={() => setStep(4)} />
        </View>
      )}

      {step === 4 && (
        <View>
          <Text style={styles.header}>Step 4: Sleep & Activeness</Text>

          {/* Daily Sleep Hours */}
          <Text style={styles.subHeader}>Daily Sleep Hours</Text>
          {["1-2 hrs", "3-4 hrs", "5-6 hrs", "7-8 hrs", "9-10 hrs", "11-12 hrs"].map((option) => (
            <Checkbox.Item
              label={option}
              status={sleep_hours === option ? "checked" : "unchecked"}
              onPress={() => setSleepHours(option)}
              key={option}
            />
          ))}

          {/* Level of Activeness */}
          <Text style={styles.subHeader}>Level of Activeness</Text>
          {["Sedentary", "Light", "Moderate", "Vigorous"].map((option) => (
            <Checkbox.Item
              label={option}
              status={activeness === option ? "checked" : "unchecked"}
              onPress={() => setActiveness(option)}
              key={option}
            />
          ))}

          <Button title="Back" onPress={() => setStep(3)} />
          <Button title="Register" onPress={handleRegister} />
        </View>
      )}       
      {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 16, justifyContent: 'center' },
    header: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 },
    error: { color: 'red', marginBottom: 10 },
  });

export default Register;
