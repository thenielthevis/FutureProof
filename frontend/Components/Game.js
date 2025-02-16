import React, { useState, Suspense } from 'react';  
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FaShoppingCart, FaClipboardCheck, FaHome } from 'react-icons/fa';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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

// Reusable Option Button Component with Preview
function OptionButton({ label, onPress, isSelected, buttonColor, uri }) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: isSelected ? buttonColor : '#f0f0f0' }]}

      onPress={onPress}
    >
      <Text style={[styles.optionButtonText, { color: isSelected ? '#fff' : '#333' }]}>{label}</Text>
      <View style={styles.previewContainer}>
        <Canvas camera={{ position: [0, 0, 5], fov: 25 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model scale={{ x: 1.5, y: 1.5, z: 1.5 }} uri={uri} position={{ x: 0, y: -1, z: 0 }} />
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={3} maxDistance={10} />
        </Canvas>
      </View>
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
  const [activeButton, setActiveButton] = useState(null);

  const icons = ['Home', 'shoppingCart', 'clipboardCheck'];

  const colors = {
    hair: "#000000",
    top: "#63c5ea",
    bottom: "#ea4b8b",
    shoes: "#fcb424",
  };

  const hairOptions = [
    { id: 1, label: "Hair 001", uri: Asset.fromModule(require('../assets/Game/Hair.001.glb')).uri },
    { id: 2, label: "Hair 002", uri: Asset.fromModule(require('../assets/Game/Hair.002.glb')).uri },
    { id: 3, label: "Hair 003", uri: Asset.fromModule(require('../assets/Game/Hair.003.glb')).uri },
    { id: 4, label: "Hair 004", uri: Asset.fromModule(require('../assets/Game/Hair.004.glb')).uri },
    { id: 5, label: "Hair 005", uri: Asset.fromModule(require('../assets/Game/Hair.005.glb')).uri },
    { id: 6, label: "Hair 006", uri: Asset.fromModule(require('../assets/Game/Hair.006.glb')).uri },
    { id: 7, label: "Hair 007", uri: Asset.fromModule(require('../assets/Game/Hair.007.glb')).uri },
    { id: 8, label: "Hair 008", uri: Asset.fromModule(require('../assets/Game/Hair.008.glb')).uri },
    { id: 9, label: "Hair 009", uri: Asset.fromModule(require('../assets/Game/Hair.009.glb')).uri },
    { id: 10, label: "Hair 010", uri: Asset.fromModule(require('../assets/Game/Hair.010.glb')).uri },
    { id: 11, label: "Hair 011", uri: Asset.fromModule(require('../assets/Game/Hair.011.glb')).uri },
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
    <LinearGradient colors={['#ffffff', '#72f2b8']} style={styles.container}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Your Character</Text>
            
            <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Hair</Text>
              <View style={styles.optionsRow}>
                {hairOptions.map((hair) => (
                  <OptionButton
                    key={hair.id}
                    label={hair.label}
                    onPress={() => {
                      setSelectedHair(hair.uri);
                      setActiveButton('hair');
                    }}
                    isSelected={activeButton === 'hair' && hair.uri === selectedHair} 
                    buttonColor={activeButton === 'hair' ? '#e74c3c' : '#f0f0f0'}
                    uri={hair.uri}
                  />
                ))}
              </View>

              <Text style={styles.sectionTitle}>Top</Text>
              <View style={styles.optionsRow}>
                {topOptions.map((top) => (
                  <OptionButton
                    key={top.id}
                    label={top.label}
                    onPress={() => {
                      setSelectedTop(top.uri);
                      setActiveButton('top');
                    }}
                    isSelected={activeButton === 'top' && top.uri === selectedTop}
                    buttonColor={activeButton === 'top' ? '#3498db' : '#f0f0f0'}
                    uri={top.uri}
                  />
                ))}
              </View>

              <Text style={styles.sectionTitle}>Bottom</Text>
              <View style={styles.optionsRow}>
                {bottomOptions.map((bottom) => (
                  <OptionButton
                    key={bottom.id}
                    label={bottom.label}
                    onPress={() => {
                      setSelectedBottom(bottom.uri);
                      setActiveButton('bottom');
                    }}
                    isSelected={activeButton === 'bottom' && bottom.uri === selectedBottom}
                    buttonColor={activeButton === 'bottom' ? '#2ecc71' : '#f0f0f0'}
                    uri={bottom.uri}
                  />
                ))}
              </View>

              <Text style={styles.sectionTitle}>Shoes</Text>
              <View style={styles.optionsRow}>
                {shoesOptions.map((shoes) => (
                  <OptionButton
                    key={shoes.id}
                    label={shoes.label}
                    onPress={() => {
                      setSelectedShoes(shoes.uri);
                      setActiveButton('shoes');
                    }}
                    isSelected={activeButton === 'shoes' && shoes.uri === selectedShoes}
                    buttonColor={activeButton === 'shoes' ? '#f39c12' : '#f0f0f0'}
                    uri={shoes.uri}
                  />
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    elevation: 10,
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
    fontSize: 40,
    color: '#1ccb5b',
    textShadow: '2px 2px 4px #1a3b32',
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
    width: '25%',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  customizeButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#8fe0c1',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#555',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#fff',
  },
  calculateButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bmiText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: '#333',
  },
  previewContainer: {
    width: 150,
    height: 150,
    marginTop: 10,
  },
});
