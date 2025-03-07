import React, { useState, useEffect, Suspense, useRef, useContext } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Image, ScrollView, Pressable, Animated, PanResponder, ActivityIndicator } from 'react-native';
import * as THREE from 'three';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import GameNavbar from '../Navbar/GameNavbar';
import DailyRewards from './DailyRewards';
import TaskModal from './TaskModal';
import DailyAssessment from './DailyAssessment';
import { readPurchasedItems, getEquippedAssets } from '../API/assets_api';
import { getUser, updateUserMedication, updateUserSleep } from '../API/user_api'; // Import updateUser function
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatusContext } from '../Context/UserStatusContext';
import { Audio } from 'expo-av';
import { readQuotes } from '../API/quotes_api'; // Import readQuotes function
import TutorialModal from './TutorialModal'; // Import the new TutorialModal

// Reusable Model Component with Color
function Model({ scale, uri, position, color }) {
  // Load base model
  const { scene } = useGLTF(uri);

  // Apply transformations and cleanup
  useEffect(() => {
    return () => {
      scene.traverse((obj) => obj.dispose && obj.dispose());
    };
  }, [uri]);

  // Apply transformations to models
  const applyTransforms = () => {
    if (scene) {
      scene.scale.set(scale.x, scale.y, scale.z);
      scene.position.set(position.x, position.y, position.z);
    }
    return scene;
  };

  // Apply color if provided
  if (color !== null && color !== undefined) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.color.set(color);
        child.material.needsUpdate = true;
      }
    });
  }

  return <primitive object={applyTransforms()} />;
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

const getEyesUri = (isAsleep, sleep) => {
  if (isAsleep) {
    return 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961144/Eyes.007_kyevtv.glb';
  }
  return sleep < 50
    ? 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961145/Eyes.009_snhzzz.glb'
    : 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb';
};

export default function Game() {
  const navigation = useNavigation();
  const pan = useRef(new Animated.ValueXY()).current; // Move initialization here
  const { status, setStatus, updateSleepStatus } = useContext(UserStatusContext);
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
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [dailyRewardsVisible, setDailyRewardsVisible] = useState(false);
  const [dailyAssessmentVisible, setDailyAssessmentVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [predictionVisible, setPredictionVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hasClaimableReward, setHasClaimableReward] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);
  const [medicationField, setMedicationField] = useState(0);
  const [sound, setSound] = useState();
  const [equippedAssets, setEquippedAssets] = useState({}); // State to track equipped assets
  const [loading, setLoading] = useState(true); // Add loading state
  const [quotes, setQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [eyesUri, setEyesUri] = useState(getEyesUri(isAsleep, status.sleep));
  const [quoteAnimationValue] = useState(new Animated.Value(300)); // Add this with other state declarations
  const [tutorialModalVisible, setTutorialModalVisible] = useState(false); // Add state for tutorial modal

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
    const newEyesUri = getEyesUri(isAsleep, status.sleep);
    console.log('Updating eyesUri to:', newEyesUri); // Log new eyesUri
    setEyesUri(newEyesUri); // Update eyes when state changes
  }, [isAsleep, status.sleep]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await readPurchasedItems();
        setPurchasedItems(items);

        const equippedAssetsData = await getEquippedAssets();
        // Ensure equipped assets are properly formatted
        const formattedEquippedAssets = {};
        Object.entries(equippedAssetsData || {}).forEach(([key, value]) => {
          if (value && value.url) {
            formattedEquippedAssets[key] = {
              ...value,
              _id: value._id ? value._id.toString() : null, // Ensure ID is string
            };
          }
        });
        setEquippedAssets(formattedEquippedAssets);

        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        console.log('User isAsleep:', userData.isasleep); // Log isAsleep field
        const now = new Date();
        const nextClaimTime = new Date(userData.next_claim_time);
        if (now >= nextClaimTime) {
          setHasClaimableReward(true);
        } else {
          setHasClaimableReward(false);
        }
        setIsAsleep(userData.isasleep);
        setMedicationField(userData.medication);
        setStatus((prevStatus) => ({
          ...prevStatus,
          sleep: userData.sleep,
          health: userData.health,
          medication: userData.medication,
          isAsleep: userData.isasleep,
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchEquippedAssets = async () => {
        try {
          const equippedAssetsData = await getEquippedAssets();
          const formattedEquippedAssets = {};
          Object.entries(equippedAssetsData || {}).forEach(([key, value]) => {
            if (value && value.url) {
              formattedEquippedAssets[key] = {
                ...value,
                _id: value._id ? value._id.toString() : null,
              };
            }
          });
          setEquippedAssets(formattedEquippedAssets);
        } catch (error) {
          console.error('Error fetching equipped assets:', error);
        }
      };

      fetchEquippedAssets();
    }, [])
  );

  useEffect(() => {
    let sleepInterval;
    if (isAsleep) {
      sleepInterval = setInterval(() => {
        setStatus((prevStatus) => ({ ...prevStatus, sleep: prevStatus.sleep + 1 }));
      }, 60000); // Increment sleep field every 1 minute
    }
    return () => clearInterval(sleepInterval);
  }, [isAsleep]);

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

  const playDrinkingSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/sound-effects/drinking.mp3'));
    setSound(sound);
    await sound.playAsync();
  };

  const playSwitchSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/sound-effects/switch.mp3'));
    setSound(sound);
    await sound.playAsync();
  };

  const playMenuSelect = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/sound-effects/menu-select.mp3'));
    setSound(sound);
    await sound.playAsync();
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
        await playMenuSelect();
        setDailyAssessmentVisible(true);
        break;
      case 1:
        await playMenuSelect();
        setDailyRewardsVisible(true);
        break;
      case 2:
        await playMenuSelect();
        navigation.navigate('Prediction');
        break;
      case 3:
        await playMenuSelect();
        navigation.navigate('Shop');
        break;
      case 4:
        await playMenuSelect();
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

  const handleSleepToggle = async () => {
    setIsAsleep((prev) => !prev);  // Toggle sleep state safely
    setStatus((prevStatus) => ({
      ...prevStatus,
      sleep: !isAsleep ? prevStatus.sleep + 1 : prevStatus.sleep, // Ensure correct sleep update
    }));
  
    try {
      const token = await AsyncStorage.getItem('token');
      await playSwitchSound();
      await updateUserSleep(token, { isasleep: !isAsleep });
      console.log('Updated isAsleep to:', !isAsleep); // Log updated isAsleep field
    } catch (error) {
      console.error('Error updating sleep status:', error);
    }
  };

  const SleepEyes = () => {
    return 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961144/Eyes.007_kyevtv.glb';
  };

  const LowHealth = () => {
    if (status.health < 50) {
      return {
        image: require('../assets/gamenavbaricons/lowhealth.gif')
      };
    }
    return {
      color: null,
      image: null
    };
  };

  const LowSleep = () => {
    if (status.sleep < 50) {
      return 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961145/Eyes.009_snhzzz.glb';
    }
    return 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb';
  };

  const LowBattery = () => {
    if (status.battery < 50) {
      return require('../assets/gamenavbaricons/lowbattery.gif');
    }
    return null;
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        setIsAsleep(userData.isasleep);
        setStatus((prevStatus) => ({
          ...prevStatus,
          sleep: userData.sleep,
          health: userData.health,
          medication: userData.medication,
          battery: userData.battery
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleMedicationUpdate = async () => {
    setMedicationField(prev => prev + 25);
    setStatus((prevStatus) => ({ ...prevStatus, medication: prevStatus.medication + 25 }));
    try {
      const token = await AsyncStorage.getItem('token');
      await playDrinkingSound();
      await updateUserMedication(token, { medication: medicationField + 50 });
    } catch (error) {
      console.error('Error updating medication field:', error);
    }
  };
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: async (e, gestureState) => {
      if (gestureState.moveY < 400) { // Example drop area condition
        await handleMedicationUpdate();
      }
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  const LowMed = () => {
    if (medicationField < 51) {
      return (
        <Image
          source={require('../assets/gamenavbaricons/lowmed.gif')}
          style={styles.thinkCloud}
        />
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const quotesData = await readQuotes();
        setQuotes(quotesData);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }
    };

    fetchQuotes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (quotes.length > 0 && !quoteVisible) {  // Only show new quote if none is currently visible
        showQuoteNotification();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes, quoteVisible]);  // Add quoteVisible to dependencies

  const showQuoteNotification = () => {
    setQuoteVisible(true);
    Animated.spring(quoteAnimationValue, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleQuoteClose = () => {
    Animated.spring(quoteAnimationValue, {
      toValue: 300, // Keep this the same since we want it to exit to the right
      useNativeDriver: true,
    }).start(() => {
      setQuoteVisible(false);
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);  // Update index after closing
    });
  };

  const playMenuClose = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/sound-effects/menu-close.mp3'));
    setSound(sound);
    await sound.playAsync();
  };

  useFocusEffect(
    React.useCallback(() => {
      const refreshGame = async () => {
        setLoading(true);
        try {
          // Refetch equipped assets
          const equippedAssetsData = await getEquippedAssets();
          const formattedEquippedAssets = {};
          Object.entries(equippedAssetsData || {}).forEach(([key, value]) => {
            if (value && value.url) {
              formattedEquippedAssets[key] = {
                ...value,
                _id: value._id ? value._id.toString() : null,
              };
            }
          });
          setEquippedAssets(formattedEquippedAssets);

          // Refetch user data
          const token = await AsyncStorage.getItem('token');
          const userData = await getUser(token);
          setIsAsleep(userData.isasleep);
          setMedicationField(userData.medication);
          setStatus(prevStatus => ({
            ...prevStatus,
            sleep: userData.sleep,
            health: userData.health,
            medication: userData.medication,
            isAsleep: userData.isasleep,
          }));

        } catch (error) {
          console.error('Error refreshing game data:', error);
        } finally {
          setLoading(false);
        }
      };

      refreshGame();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Game Navbar */}
      <GameNavbar />
  
      {/* 3D Scene */}
      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} color={LowHealth().color} />
            <Model scale={modelScale} uri={eyesUri} position={modelPosition} key={eyesUri} /> {/* Eyes */}
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} color={LowHealth().color}/> {/* Nose */}
            {Object.entries(equippedAssets).map(([assetType, asset]) => (
              <Model
                key={assetType}
                scale={modelScale}
                uri={asset.url}
                position={modelPosition}
                color={asset.color} // Support for colored items
              />
            ))}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
        {LowMed()}
        {LowHealth().image && (
          <Image
            source={LowHealth().image}
            style={styles.lowHealthImage}
          />
        )}
        {LowBattery() && (
          <Image
            source={LowBattery()}
            style={styles.lowBatteryImage}
          />
        )}
        {isAsleep && (
          <>
            <Image
              source={{ uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1740814904/blanket_if606d.gif' }}
              style={styles.blanket}
            />
            <Image
              source={require('../assets/gamenavbaricons/zzz.gif')}
              style={styles.zzzImage}
            />
          </>
        )}
      </View>
  
      {/* Navigation Bar Below Character */}
      <View style={styles.navContainer}>{renderAdditionalIcons()}</View>
  
      {/* Floating Icons */}
      <View style={styles.floatingIconsContainer}>
        <TouchableOpacity onPress={handleSleepToggle}>
          <Image
            source={isAsleep ? require('../assets/icons/Side/lights-on.png') : require('../assets/icons/Side/lights-off.png')}
            style={styles.floatingIcon}
          />
        </TouchableOpacity>
        <Animated.View {...panResponder.panHandlers} style={pan.getLayout()}>
          <Image source={require('../assets/icons/Side/pill.png')} style={styles.floatingIcon} />
        </Animated.View>
        <TouchableOpacity onPress={() => navigation.navigate('achievements')}>
          <Image source={require('../assets/icons/Side/achievements.png')} style={styles.floatingIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('BMIGame')}>
          <Image source={require('../assets/icons/Side/mini-game.png')} style={styles.floatingIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('NormalGame')}>
          <Image source={require('../assets/icons/Side/mini-game.png')} style={styles.floatingIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTutorialModalVisible(true)}>
          <Image source={require('../assets/icons/Side/help.png')} style={styles.floatingIcon} />
        </TouchableOpacity>
      </View>
  
      {/* Modal for Customization */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Your Character</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'hair' && styles.activeTab]} onPress={() => setActiveTab('hair')}>
                <Text style={styles.tabText}>Hair</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'head' && styles.activeTab]} onPress={() => setActiveTab('head')}>
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
            <ScrollView horizontal style={styles.optionsContainer}>{renderOptions()}</ScrollView>
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
      {/* Tutorial Modal */}
      <TutorialModal visible={tutorialModalVisible} onClose={() => setTutorialModalVisible(false)} />
      {/* Sleep Overlay Condition */}
      {isAsleep && <View style={styles.sleepOverlay} />}
      {quoteVisible && (
        <Animated.View
          style={[
            styles.quoteNotification,
            {
              transform: [{ translateX: quoteAnimationValue }],
            },
          ]}
        >
          <Text style={styles.quoteNotificationText}>"{quotes[currentQuoteIndex].text}"</Text>
          <Text style={styles.quoteNotificationAuthor}>- {quotes[currentQuoteIndex].author}</Text>
          <TouchableOpacity style={styles.quoteButton} onPress={handleQuoteClose}>
            <Text style={styles.quoteButtonText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    width: 175,
    height: 110,
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
  floatingIconsContainer: {
    position: 'absolute',
    left: 16,
    top: 100,
    zIndex: 10,
    overflow: 'visible', // Ensure nothing is clipped
  },
  
  floatingIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
    resizeMode: 'contain', // Ensures full icon visibility
  },  
  sleepOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 5,
  },
  thinkCloud: {
    position: 'absolute',
    right: '40%', // Keep it on the right side
    top: '-20%', // Same top positioning as lowBatteryImage
    transform: [{ translateX: 75 }], // Center horizontally
    width: 150,
    height: 150,
    zIndex: 10,
    resizeMode: 'contain',
  },
blanket: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: [{ translateX: -180 }, { translateY: -75 }, { rotate: '90deg' }], // Move more to the left
  width: 350, // Increased width
  height: 200,
  zIndex: 10,
},
lowHealthImage: {
  position: 'absolute',
  right: 1000, // Increased to move left
  top: 20,
  bottom: 20,
  width: 150,
  height: 150,
  zIndex: 10,
  resizeMode: 'contain',
},
loaderContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
zzzImage: {
  position: 'absolute',
  right: 500, // Same positioning as thinkCloud
  top: 20,
  bottom: 20,
  width: 150,
  height: 150,
  zIndex: 10,
},
lowBatteryImage: {
  position: 'absolute',
  left: '40%',
  top: '-20%', // Positioned above the head model
  transform: [{ translateX: -75 }], // Center horizontally
  width: 150,
  height: 150,
  zIndex: 10,
  resizeMode: 'contain',
},
bmiGameButton: {
  backgroundColor: '#4CAF50',
  padding: 10,
  borderRadius: 5,
  alignItems: 'center',
  marginTop: 20,
},
bmiGameButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
quoteNotification: {
  position: 'absolute',
  right: 0, // Changed from left: 0
  top: '40%',
  backgroundColor: 'rgba(44, 62, 80, 0.9)',
  padding: 15,
  borderTopLeftRadius: 10, // Changed from borderTopRightRadius
  borderBottomLeftRadius: 10, // Changed from borderBottomRightRadius
  maxWidth: 300,
  shadowColor: '#000',
  shadowOffset: {
    width: -2, // Changed from 2
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
quoteNotificationText: {
  color: '#fff',
  fontSize: 14,
  marginBottom: 5,
},
quoteNotificationAuthor: {
  color: '#bdc3c7',
  fontSize: 12,
  fontStyle: 'italic',
},
quoteButton: {
  backgroundColor: '#3498db',
  padding: 8,
  borderRadius: 5,
  alignItems: 'center',
  marginTop: 10,
},
quoteButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
});
