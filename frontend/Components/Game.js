import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Asset } from 'expo-asset';

// Function to load the GLB model
function Model({ scale }) {
  const modelUri = Asset.fromModule(require('../assets/tao.glb')).uri;
  const { scene } = useGLTF(modelUri);
  scene.scale.set(scale.x, scale.y, scale.z);
  return <primitive object={scene} />;
}

export default function Prediction() {
  const [heightCm, setHeightCm] = useState(170);
  const [weight, setWeight] = useState(70);
  const [bmi, setBmi] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');

  const calculateBmi = () => {
    if (!heightCm || !weight) {
      Alert.alert('Invalid Input', 'Please enter valid height and weight.');
      return;
    }
    const heightMeters = heightCm / 100;
    const bmiValue = (weight / (heightMeters * heightMeters)).toFixed(2);
    setBmi(bmiValue);
    setBmiCategory(getBmiCategory(bmiValue));
  };

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 24.9) return 'Normal';
    if (bmi < 29.9) return 'Overweight';
    return 'Obese';
  };

  const getScaleByBMI = (bmi) => {
    if (bmi < 18.5) return { x: 0.9, y: 1.1, z: 0.9 };
    if (bmi < 24.9) return { x: 1, y: 1, z: 1 };
    if (bmi < 29.9) return { x: 1.1, y: 0.95, z: 1.1 };
    return { x: 1.2, y: 0.9, z: 1.2 };
  };

  const scale = getScaleByBMI(bmi);

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      {/* <Text style={styles.title}>BMI Calculator</Text>

      <View style={styles.inputContainer}>
        <Text>Height (cm):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={heightCm.toString()}
          onChangeText={(value) => setHeightCm(parseFloat(value) || 0)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text>Weight (kg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weight.toString()}
          onChangeText={(value) => setWeight(parseFloat(value) || 0)}
        />
      </View>

      <Button title="Calculate BMI" onPress={calculateBmi} color="#27ae60" />

      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>BMI: {bmi}</Text>
        <Text style={styles.resultText}>Category: {bmiCategory}</Text>
      </View> */}

      {/* 3D Scene */}
      <View style={{ minHeight: 500, width: '100%' }}>
        <Canvas camera={{ position: [0, 0, 7] }}> {/* Adjust camera position */}
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model scale={scale} />
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={5} maxDistance={15} /> {/* Adjust OrbitControls */}
        </Canvas>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginVertical: 10,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    width: '100%',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
