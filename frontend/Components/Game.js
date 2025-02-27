import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Image, ScrollView, Pressable, Animated } from 'react-native';
import * as THREE from 'three';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import GameNavbar from '../Navbar/GameNavbar';
import DailyRewards from './DailyRewards';
import TaskModal from './TaskModal';
import DailyAssessment from './DailyAssessment';
// import Prediction from './Prediction';
import { FaShoppingCart } from 'react-icons/fa';
import { readPurchasedItems, getEquippedAssets } from '../API/assets_api';
import { getUser } from '../API/user_api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable Model Component with Color
function Model({ scale, uri, position }) { // Removed color prop
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);

  return <primitive object={scene} />;
}

// Reusable Option Button Component
function OptionButton({ label, onPress, isSelected, preview }) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: isSelected ? '#27ae60' : '#ddd' }]}
      onPress={onPress}
    >
      <Image source={{ uri: preview }} style={styles.previewImage} />
      <Text style={styles.optionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Game() {
  const navigation = useNavigation();
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedHead, setSelectedHead] = useState(null);  // Define selectedHead state
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
  const [purchasedItems, setPurchasedItems] = useState([]); // Ensure it's initialized as an array
  const [dailyRewardsVisible, setDailyRewardsVisible] = useState(false);
  const [dailyAssessmentVisible, setDailyAssessmentVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [predictionVisible, setPredictionVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hasClaimableReward, setHasClaimableReward] = useState(false); // State to track if there's a claimable reward
  const [equippedAssets, setEquippedAssets] = useState({}); // State to track equipped assets
  const icons = [
    require('../assets/icons/Navigation/dailyassessment.png'),
    require('../assets/icons/Navigation/dailyrewards.png'),
    require('../assets/icons/Navigation/prediction.png'),
    require('../assets/icons/Navigation/shop.png'),
    require('../assets/icons/Navigation/task.png')
  ];

  const handleShopPress = () => {
    navigation.navigate('Shop');   
  };

  useEffect(() => {
    // Fetch purchased items from the backend
    const fetchPurchasedItems = async () => {
      try {
        const items = await readPurchasedItems();
        setPurchasedItems(items);
      } catch (error) {
        console.error('Error fetching purchased items:', error);
      }
    };

    // Fetch equipped assets
    const fetchEquippedAssets = async () => {
      try {
        const equippedAssets = await getEquippedAssets();
        setEquippedAssets(equippedAssets); // Assuming setEquippedAssets is a state setter for equipped assets
      } catch (error) {
        console.error('Error fetching equipped assets:', error);
      }
    };

    fetchPurchasedItems();
    fetchEquippedAssets();
  }, []);

  useEffect(() => {
    // Fetch user data to check for claimable rewards
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        const now = new Date();
        const nextClaimTime = new Date(userData.next_claim_time);
        if (now >= nextClaimTime) {
          setHasClaimableReward(true);
        } else {
          setHasClaimableReward(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchEquippedAssets = async () => {
        try {
          const equippedAssets = await getEquippedAssets();
          setEquippedAssets(equippedAssets);
        } catch (error) {
          console.error('Error fetching equipped assets:', error);
        }
      };

      fetchEquippedAssets();
    }, [])
  );

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

  const modelScale = { x: getModelScale().x * 2, y: getModelScale().y * 2, z: getModelScale().z * 2 }; // 2x larger
  const modelPosition = { x: 0, y: -5, z: 0 }; // Adjusted position to move the model downwards

  const handleIconPress = async (index) => {
    switch (index) {
      case 0:
        setDailyAssessmentVisible(true);
        break;
      case 1:
        setDailyRewardsVisible(true);
        break;
      case 2:
        navigation.navigate('Prediction');
        break;
      case 3:
        navigation.navigate('Shop');
        break;
      case 4:
        setTaskModalVisible(true);
        break;
      default:
        break;
    }
  };

  const renderAdditionalIcons = () => {
    return icons.map((icon, index) => (
      <Pressable
        key={index}
        style={({ hovered }) => [
          styles.iconButton,
          hovered || hoveredIndex === index ? styles.hoveredIcon : null,
        ]}
        onHoverIn={() => setHoveredIndex(index)}
        onHoverOut={() => setHoveredIndex(null)}
        onPress={() => handleIconPress(index)}
      >
        <Image source={icon} style={[styles.additionalIconStyle, index === 1 && hasClaimableReward ? styles.claimableRewardIcon : null]} />
      </Pressable>
    ));
  };

  const renderOptions = () => {
    if (!Array.isArray(purchasedItems) || purchasedItems.length === 0) {
      return (
        <View style={styles.noAssetsContainer}>
          <Text style={styles.noAssetsText}>You don't have any accessories. Purchase them from the Shop!</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'hair':
        return purchasedItems.filter(item => item.asset_type === 'hair').map((hair) => (
          <OptionButton key={hair._id} label={hair.name} onPress={() => setSelectedHair(hair.url)} isSelected={hair.url === selectedHair} preview={hair.image_url} />
        ));
      case 'head':  // Add case for head
        return purchasedItems.filter(item => item.asset_type === 'head').map((head) => (
          <OptionButton key={head._id} label={head.name} onPress={() => setSelectedHead(head.url)} isSelected={head.url === selectedHead} preview={head.image_url} />
        ));
      case 'top':
        return purchasedItems.filter(item => item.asset_type === 'top').map((top) => (
          <OptionButton key={top._id} label={top.name} onPress={() => setSelectedTop(top.url)} isSelected={top.url === selectedTop} preview={top.image_url} />
        ));
      case 'bottom':
        return purchasedItems.filter(item => item.asset_type === 'bottom').map((bottom) => (
          <OptionButton key={bottom._id} label={bottom.name} onPress={() => setSelectedBottom(bottom.url)} isSelected={bottom.url === selectedBottom} preview={bottom.image_url} />
        ));
      case 'shoes':
        return purchasedItems.filter(item => item.asset_type === 'shoes').map((shoes) => (
          <OptionButton key={shoes._id} label={shoes.name} onPress={() => setSelectedShoes(shoes.url)} isSelected={shoes.url === selectedShoes} preview={shoes.image_url} />
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
          <ambientLight intensity={0.5} /> {/* Imitated lighting */}
          <directionalLight position={[5, 5, 5]} /> {/* Imitated lighting */}
          <Suspense fallback={null}>
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} /> {/* Eyes */}
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} /> {/* Nose */}
            {selectedHair && <Model scale={modelScale} uri={selectedHair} position={modelPosition} />}
            {selectedHead && <Model scale={modelScale} uri={selectedHead} position={modelPosition} />}  {/* Add selectedHead */}
            {selectedTop && <Model scale={modelScale} uri={selectedTop} position={modelPosition} />}
            {selectedBottom && <Model scale={modelScale} uri={selectedBottom} position={modelPosition} />}
            {selectedShoes && <Model scale={modelScale} uri={selectedShoes} position={modelPosition} />}
            {Object.keys(equippedAssets).map(assetType => (
              <Model
                key={assetType}
                scale={modelScale}
                uri={equippedAssets[assetType].url}
                position={modelPosition}
              />
            ))}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
      </View>

      {/* Navigation Bar Below Character */}
      <View style={styles.navContainer}>
        {renderAdditionalIcons()}
      </View>

      {/* Right Panel
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
      </View> */}
      
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
              <TouchableOpacity style={[styles.tabButton, activeTab === 'head' && styles.activeTab]} onPress={() => setActiveTab('head')}>  {/* Add tab for head */}
                <Text style={styles.tabText}>Head</Text>
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

      {/* Daily Assessment Modal */}
      <DailyAssessment visible={dailyAssessmentVisible} onClose={() => setDailyAssessmentVisible(false)} />
      {/* Daily Rewards Modal */}
      <DailyRewards visible={dailyRewardsVisible} onClose={() => setDailyRewardsVisible(false)} />

      {/* Task Modal */}
      <TaskModal visible={taskModalVisible} onClose={() => setTaskModalVisible(false)} />

      {/* Prediction Modal */}
      {/* <Prediction visible={predictionVisible} onClose={() => setPredictionVisible(false)} /> */}
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
    width: 200,
    height: 125,
    marginLeft: 30,
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 10,
    shadowRadius: 2,
  },
  hoveredIcon: {
    transform: [{ scale: 1.2 }], // Scale up when hovered
    transition: 'transform 0.2s', // Smooth transition
  },
  claimableRewardIcon: {
    shadowColor: 'gold',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
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
  noAssetsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: '#e74c3c',
  },
  noAssetsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
