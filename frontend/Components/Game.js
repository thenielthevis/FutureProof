import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Asset } from 'expo-asset';
import Icon from 'react-native-vector-icons/FontAwesome'; // Use vector icons from react-native-vector-icons
import { FaShoppingCart, FaClipboardCheck, FaHome } from 'react-icons/fa'; // Import additional icons
import { useNavigation } from '@react-navigation/native';

// Function to load the GLB model
function Model({ scale }) {
  const modelUri = Asset.fromModule(require('../assets/tao.glb')).uri;
  const { scene } = useGLTF(modelUri);
  scene.scale.set(scale.x, scale.y, scale.z);
  return <primitive object={scene} />;
}

export default function Prediction() {
  const navigation = useNavigation();  // Ensure useNavigation is called inside the component
  const [heightCm, setHeightCm] = useState(170);
  const [weight, setWeight] = useState(70);
  const [bmi, setBmi] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');
  const [currentIconIndex, setCurrentIconIndex] = useState(0); // State to track the current icon index
  const icons = ['Home', 'shoppingCart', 'clipboardCheck']; // Array of icons to cycle through

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

  const handleNextPress = () => {
    // Cycle to the next icon
    setCurrentIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
  };

  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  const renderAdditionalIcon = () => {
    const icon = icons[currentIconIndex];
    switch (icon) {
      case 'Home':
        return (
          <TouchableOpacity style={styles.iconButton} onPress={handleHomePress}>
            <FaHome style={styles.additionalIconStyle} />
          </TouchableOpacity>
        );
      case 'shoppingCart':
        return <FaShoppingCart style={styles.additionalIconStyle} />;
      case 'clipboardCheck':
        return <FaClipboardCheck style={styles.additionalIconStyle} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      {/* 3D Scene */}
      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 0, 7] }}> {/* Adjust camera position */}
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model scale={scale} />
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={5} maxDistance={15} /> {/* Adjust OrbitControls */}
        </Canvas>
      </View>

      {/* Navigation Bar Below Character */}
      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNextPress}>
          <Icon name="arrow-left" style={styles.iconStyle} />
        </TouchableOpacity>
        <View style={styles.additionalIconsContainer}>
          {renderAdditionalIcon()}
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleNextPress}>
          <Icon name="arrow-right" style={styles.iconStyle} />
        </TouchableOpacity>
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
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
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
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20, // Added top margin for spacing below the 3D scene
    marginBottom: 40, // Adjusted margin for bottom space
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    color: '#000', // Changed color to black for better visibility
    marginLeft: 16,
  },
  iconStyle: {
    fontSize: 50, // Adjusted icon size for better visibility
    color: '#ADFF2F', // Changed color to yellow-green
    textShadow: '2px 2px 4px #000000', // Added black shadow
  },
  additionalIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  additionalIconStyle: {
    fontSize: 50,
    color: '#000', // Changed color to black
    marginLeft: 16,
  },
});