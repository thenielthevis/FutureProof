import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FaShoppingCart, FaClipboardCheck, FaHome } from 'react-icons/fa';
import { useNavigation } from '@react-navigation/native';

// Reusable Model Component with Color
function Model({ scale, uri, position, color }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);

  if (color) {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color) });
      }
    });
  }

  return <primitive object={scene} />;
}

// Reusable Option Button Component
function OptionButton({ label, onPress, isSelected, color }) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: isSelected ? color : '#ddd' }]}
      onPress={onPress}
    >
      <Text style={styles.optionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Prediction() {
  const navigation = useNavigation();
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedShoes, setSelectedShoes] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState(null);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const icons = ['Home', 'shoppingCart', 'clipboardCheck'];

  const colors = {
    hair: "#000000",
    bottom: "#0000ff",
    shoes: "#000000",
  };

  const hairOptions = [
    { id: 1, label: "Hair 001", uri: Asset.fromModule(require('../assets/Hair.001.glb')).uri },
    { id: 2, label: "Hair 002", uri: Asset.fromModule(require('../assets/Hair.002.glb')).uri },
    { id: 3, label: "Hair 003", uri: Asset.fromModule(require('../assets/Hair.003.glb')).uri },
    { id: 4, label: "Hair 004", uri: Asset.fromModule(require('../assets/Hair.004.glb')).uri },
    { id: 5, label: "Hair 005", uri: Asset.fromModule(require('../assets/Hair.005.glb')).uri },
    { id: 6, label: "Hair 006", uri: Asset.fromModule(require('../assets/Hair.006.glb')).uri },
    { id: 7, label: "Hair 007", uri: Asset.fromModule(require('../assets/Hair.007.glb')).uri },
    { id: 8, label: "Hair 008", uri: Asset.fromModule(require('../assets/Hair.008.glb')).uri },
    { id: 9, label: "Hair 009", uri: Asset.fromModule(require('../assets/Hair.009.glb')).uri },
    { id: 10, label: "Hair 010", uri: Asset.fromModule(require('../assets/Hair.010.glb')).uri },
    { id: 11, label: "Hair 011", uri: Asset.fromModule(require('../assets/Hair.011.glb')).uri },
  ];

  const topOptions = [
    { id: 1, label: "Top 001", uri: Asset.fromModule(require('../assets/Game/Top.001.glb')).uri },
    { id: 2, label: "Top 002", uri: Asset.fromModule(require('../assets/Game/Top.002.glb')).uri }
  ];

  const bottomOptions = [
    { id: 1, label: "Bottom 001", uri: Asset.fromModule(require('../assets/Game/Bottom.001.glb')).uri },
    { id: 2, label: "Bottom 002", uri: Asset.fromModule(require('../assets/Game/Bottom.002.glb')).uri }
  ];

  const shoesOptions = [
    { id: 1, label: "Shoes 001", uri: Asset.fromModule(require('../assets/Game/Shoes.001.glb')).uri },
    { id: 2, label: "Shoes 002", uri: Asset.fromModule(require('../assets/Game/Shoes.002.glb')).uri }
  ];

  const calculateBmi = () => {
    const heightInMeters = height / 100;
    const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    setBmi(bmiValue);

    if (bmiValue < 18.5) {
      setBmiCategory('Underweight');
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      setBmiCategory('Normal');
    } else if (bmiValue >= 25 && bmiValue < 30) {
      setBmiCategory('Overweight');
    } else {
      setBmiCategory('Obese');
    }
  };

  const getModelScale = () => {
    const defaultBodyScale = 2.5;
    const baseHeight = 140;
    const heightScale = height ? (height / baseHeight) * defaultBodyScale : defaultBodyScale;
    let widthScale = 2.5;
    if (bmiCategory === 'Underweight') widthScale = 1.8;
    else if (bmiCategory === 'Overweight') widthScale = 3.0;
    else if (bmiCategory === 'Obese') widthScale = 3.5;
    return { x: widthScale, y: heightScale, z: widthScale };
  };

  const modelScale = getModelScale();
  const modelPosition = { x: 0, y: -1.5, z: 0 };

  const handleNextPress = () => {
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
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model scale={modelScale} uri={Asset.fromModule(require('../assets/Game/NakedFullBody.glb')).uri} position={modelPosition} />
            <Model scale={modelScale} uri={Asset.fromModule(require('../assets/Game/Head.001.glb')).uri} position={modelPosition} />
            {selectedHair && <Model scale={modelScale} uri={selectedHair} position={modelPosition} color={colors.hair} />}
            {selectedTop && <Model scale={modelScale} uri={selectedTop} position={modelPosition} color={colors.top} />}
            {selectedBottom && <Model scale={modelScale} uri={selectedBottom} position={modelPosition} color={colors.bottom} />}
            {selectedShoes && <Model scale={modelScale} uri={selectedShoes} position={modelPosition} color={colors.shoes} />}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={5} maxDistance={15} />
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

      {/* Right Panel */}
      <View style={styles.rightPanel}>
        <TouchableOpacity style={styles.customizeButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Customize Character</Text>
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <TouchableOpacity style={styles.calculateButton} onPress={calculateBmi}>
            <Text style={styles.buttonText}>Calculate BMI</Text>
          </TouchableOpacity>
          {bmi && <Text style={styles.bmiText}>BMI: {bmi} ({bmiCategory})</Text>}
        </View>
      </View>
      
      {/* Modal for Customization */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Your Character</Text>
            
            <Text style={styles.sectionTitle}>Hair</Text>
            <View style={styles.optionsRow}>
              {hairOptions.map((hair) => (
                <OptionButton key={hair.id} label={hair.label} onPress={() => setSelectedHair(hair.uri)} isSelected={hair.uri === selectedHair} color="#27ae60" />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Top</Text>
            <View style={styles.optionsRow}>
              {topOptions.map((top) => (
                <OptionButton key={top.id} label={top.label} onPress={() => setSelectedTop(top.uri)} isSelected={top.uri === selectedTop} color="#3498db" />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Bottom</Text>
            <View style={styles.optionsRow}>
              {bottomOptions.map((bottom) => (
                <OptionButton key={bottom.id} label={bottom.label} onPress={() => setSelectedBottom(bottom.uri)} isSelected={bottom.uri === selectedBottom} color="#e74c3c" />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Shoes</Text>
            <View style={styles.optionsRow}>
              {shoesOptions.map((shoes) => (
                <OptionButton key={shoes.id} label={shoes.label} onPress={() => setSelectedShoes(shoes.uri)} isSelected={shoes.uri === selectedShoes} color="#f39c12" />
              ))}
            </View>
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 40,
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    color: '#000',
    marginLeft: 16,
  },
  iconStyle: {
    fontSize: 50,
    color: '#ADFF2F',
    textShadow: '2px 2px 4px #000000',
  },
  additionalIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  additionalIconStyle: {
    fontSize: 50,
    color: '#000',
    marginLeft: 16,
  },
  rightPanel: {
    position: 'absolute',
    right: 16,
    top: 100,
    width: '30%',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  customizeButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  optionButton: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  optionButtonText: {
    color: '#000',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  canvasContainer: {
    flex: 1,
    height: '70%',
    width: '70%',
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  calculateButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});