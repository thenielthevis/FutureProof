import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Image, ScrollView } from 'react-native';
import * as THREE from 'three';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import GameNavbar from '../Navbar/GameNavbar'; // Import GameNavbar

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
function OptionButton({ label, onPress, isSelected, color, preview }) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: isSelected ? color : '#ddd' }]}
      onPress={onPress}
    >
      <Image source={{ uri: preview }} style={styles.previewImage} />
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
  const [activeTab, setActiveTab] = useState('hair');
  const icons = ['Home', 'shoppingCart', 'clipboardCheck'];

  const colors = {
    hair: "#000000",
    bottom: "#0000ff",
    shoes: "#000000",
  };

  const hairOptions = [
    { id: 1, label: "Hair 001", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961154/Hair.001_kjslfw.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961160/hair_vlrckj.jpg' },
    { id: 2, label: "Hair 002", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961154/Hair.002_fdoekw.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739962931/hair002_hqdyuw.png' },
    // Add more hair options as needed
  ];

  const topOptions = [
    { id: 1, label: "Top 001", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961171/Top.001_r3hrar.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963250/top001_fbuvvv.png' },
    { id: 2, label: "Top 002", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961171/Top.002_clkylw.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963251/top002_lwwb7z.png' }
  ];

  const bottomOptions = [
    { id: 1, label: "Bottom 001", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961133/Bottom.001_xhbnnn.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739962928/bottom001_fflyct.png' },
    { id: 2, label: "Bottom 002", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961132/Bottom.002_obpclh.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739962929/bottom002_fabniq.png' }
  ];

  const shoesOptions = [
    { id: 1, label: "Shoes 001", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961169/Shoes.001_flplvd.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963247/shoes001_pawg36.png' },
    { id: 2, label: "Shoes 002", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961169/Shoes.002_auycyv.glb', preview: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963249/shoes002_wbgu9y.png' }
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
  const modelPosition = { x: 0, y: -2.5, z: 0 }; // Adjusted position to move the model downwards

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
            <FontAwesome name="home" style={styles.additionalIconStyle} />
          </TouchableOpacity>
        );
      case 'shoppingCart':
        return (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate('Shop')}
          >
            <FaShoppingCart style={styles.additionalIconStyle} />
          </TouchableOpacity>
        );
      case 'clipboardCheck':
        return <FontAwesome name="clipboard-check" style={styles.additionalIconStyle} />;
      default:
        return null;
    }
  };
  

  const renderOptions = () => {
    switch (activeTab) {
      case 'hair':
        return hairOptions.map((hair) => (
          <OptionButton key={hair.id} label={hair.label} onPress={() => setSelectedHair(hair.uri)} isSelected={hair.uri === selectedHair} color="#27ae60" preview={hair.preview} />
        ));
      case 'top':
        return topOptions.map((top) => (
          <OptionButton key={top.id} label={top.label} onPress={() => setSelectedTop(top.uri)} isSelected={top.uri === selectedTop} color="#3498db" preview={top.preview} />
        ));
      case 'bottom':
        return bottomOptions.map((bottom) => (
          <OptionButton key={bottom.id} label={bottom.label} onPress={() => setSelectedBottom(bottom.uri)} isSelected={bottom.uri === selectedBottom} color="#e74c3c" preview={bottom.preview} />
        ));
      case 'shoes':
        return shoesOptions.map((shoes) => (
          <OptionButton key={shoes.id} label={shoes.label} onPress={() => setSelectedShoes(shoes.uri)} isSelected={shoes.uri === selectedShoes} color="#f39c12" preview={shoes.preview} />
        ));
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Game Navbar */}
      <GameNavbar />

      {/* 3D Scene */}
      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} />
            {selectedHair && <Model scale={modelScale} uri={selectedHair} position={modelPosition} color={colors.hair} />}
            {selectedTop && <Model scale={modelScale} uri={selectedTop} position={modelPosition} color={colors.top} />}
            {selectedBottom && <Model scale={modelScale} uri={selectedBottom} position={modelPosition} color={colors.bottom} />}
            {selectedShoes && <Model scale={modelScale} uri={selectedShoes} position={modelPosition} color={colors.shoes} />}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
      </View>

      {/* Navigation Bar Below Character */}
      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNextPress}>
          <FontAwesome name="arrow-left" style={styles.iconStyle} />
        </TouchableOpacity>
        <View style={styles.additionalIconsContainer}>
          {renderAdditionalIcon()}
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleNextPress}>
          <FontAwesome name="arrow-right" style={styles.iconStyle} />
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
            
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'hair' && styles.activeTab]} onPress={() => setActiveTab('hair')}>
                <Text style={styles.tabText}>Hair</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'top' && styles.activeTab]} onPress={() => setActiveTab('top')}>
                <Text style={styles.tabText}>Top</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'bottom' && styles.activeTab]} onPress={() => setActiveTab('bottom')}>
                <Text style={styles.tabText}>Bottom</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'shoes' && styles.activeTab]} onPress={() => setActiveTab('shoes')}>
                <Text style={styles.tabText}>Shoes</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Options */}
            <ScrollView horizontal style={styles.optionsContainer}>
              {renderOptions()}
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
    marginTop: 150,
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
    color: '#2ecc71',
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
    width: '20%',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#ccc',
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
    position: 'absolute',
    right: 275,
    left: 275,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalContent: {
    height: '80%',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tabButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    color: '#000',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  optionButton: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#000',
  },
  previewImage: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
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