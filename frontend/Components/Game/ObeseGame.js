import React, { Suspense, useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, Modal, Animated, Pressable } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/native';
import styles from '../../styles/gameStyles';
import { useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';
import BMIGameCongratulationsModal from './BMIGameCongratulationsModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

// Add Model component from BMIGame
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

// Add food choices data inside component
const foodChoices = [
  { food1: { name: 'Apple (Medium, 100g)', calories: 52, image: require('../../assets/ObeseMode/1.png') }, food2: { name: 'Cheeseburger', calories: 303, image: require('../../assets/ObeseMode/2.png') } },
  { food1: { name: 'Caesar Salad (1 cup)', calories: 184, image: require('../../assets/ObeseMode/3.png') }, food2: { name: 'Slice of Pepperoni Pizza', calories: 298, image: require('../../assets/ObeseMode/4.png') } },
  { food1: { name: 'Banana (Medium, 118g)', calories: 105, image: require('../../assets/ObeseMode/5.png') }, food2: { name: 'Peanut Butter (1 tbsp)', calories: 96, image: require('../../assets/ObeseMode/6.png') } },
  { food1: { name: 'Grilled Chicken Breast (100g, skinless)', calories: 165, image: require('../../assets/ObeseMode/7.png') }, food2: { name: 'Baked Potato (100g, plain)', calories: 93, image: require('../../assets/ObeseMode/8.png') } },
  { food1: { name: 'Boiled Egg (Large)', calories: 68, image: require('../../assets/ObeseMode/9.png') }, food2: { name: 'Slice of Cheddar Cheese (28g)', calories: 113, image: require('../../assets/ObeseMode/10.png') } },
  { food1: { name: 'French Baguette (50g slice)', calories: 135, image: require('../../assets/ObeseMode/11.png') }, food2: { name: 'Brown Rice (100g, cooked)', calories: 110, image: require('../../assets/ObeseMode/12.png') } },
  { food1: { name: 'Salmon Sushi (1 piece, nigiri)', calories: 48, image: require('../../assets/ObeseMode/13.png') }, food2: { name: 'Whole Wheat Bread (1 slice, 28g)', calories: 69, image: require('../../assets/ObeseMode/14.png') } },
  { food1: { name: 'Almonds (10 pieces, 14g)', calories: 81, image: require('../../assets/ObeseMode/15.png') }, food2: { name: 'Cashews (10 pieces, 16g)', calories: 87, image: require('../../assets/ObeseMode/16.png') } },
  { food1: { name: 'Sirloin Steak (100g, grilled, lean)', calories: 206, image: require('../../assets/ObeseMode/17.png') }, food2: { name: 'Avocado (Half, 100g)', calories: 160, image: require('../../assets/ObeseMode/18.png') } },
  { food1: { name: 'Dark Chocolate (1 small piece, 10g, 85% cocoa)', calories: 60, image: require('../../assets/ObeseMode/19.png') }, food2: { name: 'Coconut Meat (10g, fresh)', calories: 65, image: require('../../assets/ObeseMode/20.png') } },
];

export default function ObeseGame() {
  // Add new state for mass indicator
  const [showMassIndicator, setShowMassIndicator] = useState(false);
  const [massValue, setMassValue] = useState(0);
  
  const [currentFoodSet, setCurrentFoodSet] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedFoodCalories, setSelectedFoodCalories] = useState(null);
  const [equippedAssets, setEquippedAssets] = useState({});
  const [modelScale, setModelScale] = useState({ x: 5, y: 3, z: 5 });
  const [showModal, setShowModal] = useState(false);
  // Add new state variables
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(true);
  const [selectedTime, setSelectedTime] = useState(300); // 5 minutes default
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [coinsReward, setCoinsReward] = useState(50);
  const navigation = useNavigation();
  // Add new state for button animation and sound
  const [buttonScale] = useState(new Animated.Value(1));
  const [sound, setSound] = useState();
  // Add new state for failure modal
  const [showFailureModal, setShowFailureModal] = useState(false);
  // Add new state for glow animation
  const [showGlowEffect, setShowGlowEffect] = useState(false);
  const gainTextOpacity = useRef(new Animated.Value(0)).current;
  const gainTextPosition = useRef(new Animated.Value(0)).current;
  const modelGlowOpacity = useRef(new Animated.Value(0)).current;
  // Add new state for accumulated coins
  const [accumulatedCoins, setAccumulatedCoins] = useState(0);
  const [coinsPerCorrect, setCoinsPerCorrect] = useState(6); // Default for 5 mins

  useEffect(() => {
    const fetchEquippedAssets = async () => {
      try {
        const assets = await getEquippedAssets();
        setEquippedAssets(assets);
      } catch (error) {
        console.error('Error fetching equipped assets:', error);
      }
    };

    fetchEquippedAssets();
  }, []);

  // Add model configuration
  const modelPosition = { x: 0, y: -3, z: 0 };
  const modelRotation = [0, 0, 0];

  // Add timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && timerActive && elapsedTime < selectedTime * 1000) {
      interval = setInterval(() => {
        const newElapsedTime = Date.now() - startTime;
        setElapsedTime(newElapsedTime);
        
        if (newElapsedTime >= selectedTime * 1000) {
          clearInterval(interval);
          // Check if game is completed
          if (currentFoodSet < foodChoices.length - 1) {
            handleFailure();
            setTimerActive(false);
          } else {
            setShowModal(true);
            setTimerActive(false);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, timerActive, startTime, selectedTime, currentFoodSet]);

  // Add sound cleanup
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Add play sound function
  const playNextSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/menu-select.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  // Add sound effect functions
  const playCorrectSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const playWrongSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/wrong.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  // Add failure sound effect
  const playFailureSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/try-again.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  // Add button animation functions
  const animateButton = (pressed) => {
    Animated.spring(buttonScale, {
      toValue: pressed ? 0.95 : 1,
      useNativeDriver: true,
    }).start();
  };

  // Add new functions for game control
  const handleStartGame = () => {
    setGameStarted(true);
    setShowTimerModal(false);
    setStartTime(Date.now());
    setTimerActive(true);
  };

  // Update getCoinsForDuration to return only coins value
  const getCoinsForDuration = (minutes) => {
    switch (minutes) {
      case 1: return 100;
      case 3: return 80;
      case 5: return 60;
      case 10: return 30;
      default: return 60;
    }
  };

  // Add new function to get coins per correct answer
  const getCoinsPerCorrect = (minutes) => {
    switch (minutes) {
      case 1: return 10;
      case 3: return 8;
      case 5: return 6;
      case 10: return 3;
      default: return 6;
    }
  };

  // Update handleTimerSelection
  const handleTimerSelection = (minutes) => {
    setSelectedTime(minutes * 60);
    setCoinsReward(getCoinsForDuration(minutes));
    setCoinsPerCorrect(getCoinsPerCorrect(minutes));
  };

  // Update handleRestartGame to reset accumulated coins
  const handleRestartGame = async () => {
    setCurrentFoodSet(0);
    setScore(0);
    setSelectedFoodCalories(null);
    setModelScale({ x: 5, y: 3, z: 5 });
    setElapsedTime(0);
    setTimerActive(false);
    setGameStarted(false);
    setShowFailureModal(false);
    setShowTimerModal(true);
    setShowSettings(false);
    setAccumulatedCoins(0);
  };

  const handleBackToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainMenu' }],
    });
  };

  const handleQuit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Game' }],
    });
  };

  // Add glow effect animation
  const showWeightLossEffect = () => {
    gainTextPosition.setValue(0);
    gainTextOpacity.setValue(1);
    setShowGlowEffect(true);

    Animated.parallel([
      Animated.timing(gainTextPosition, {
        toValue: -50,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(gainTextOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(modelGlowOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(modelGlowOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => setShowGlowEffect(false));
  };

  // Update handleFoodChoice to include mass indicator, glow effect, and coin accumulation
  const handleFoodChoice = async (food) => {
    const correctChoice = Math.min(foodChoices[currentFoodSet].food1.calories, foodChoices[currentFoodSet].food2.calories);
    if (food.calories === correctChoice) {
      await playCorrectSound();
      setScore(score + 1);
      setAccumulatedCoins(prev => prev + coinsPerCorrect); // Add coins for correct answer
      
      // Show mass indicator and glow effect
      setMassValue(-0.15);
      setShowMassIndicator(true);
      showWeightLossEffect();
      setTimeout(() => setShowMassIndicator(false), 1500);
      
      setModelScale((prevScale) => ({
        x: Math.max(prevScale.x - 0.15, 1),
        y: prevScale.y,
        z: prevScale.z
      }));
    } else {
      await playWrongSound();
    }
    setSelectedFoodCalories({
      food1: foodChoices[currentFoodSet].food1.calories,
      food2: foodChoices[currentFoodSet].food2.calories
    });
  };

  // Update handleNextFoodSet to stop timer on completion
  const handleNextFoodSet = async () => {
    await playNextSound();
    if (currentFoodSet < foodChoices.length - 1) {
      setCurrentFoodSet(currentFoodSet + 1);
      setSelectedFoodCalories(null);
    } else {
      setTimerActive(false); // Stop timer
      setShowModal(true);
    }
  };

  const handleFailure = async () => {
    setShowFailureModal(true);
    await playFailureSound();
  };

  const getCardStyle = (food) => {
    if (selectedFoodCalories === null) {
      return styles.foodCard;
    }
    const correctChoice = Math.min(foodChoices[currentFoodSet].food1.calories, foodChoices[currentFoodSet].food2.calories);
    if (food.calories === correctChoice) {
      return [styles.foodCard, styles.correctCard];
    } else if (food.calories === selectedFoodCalories.food1 || food.calories === selectedFoodCalories.food2) {
      return [styles.foodCard, styles.wrongCard];
    }
    return styles.foodCard;
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Update Header Container */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.statsContainer}>
            <View style={styles.timerContainer}>
              <Image
                source={require('../../assets/timer.gif')}
                style={styles.timerGif}
              />
              <Text style={styles.timerText}>
                {Math.floor((selectedTime * 1000 - elapsedTime) / 1000)}s
              </Text>
            </View>
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardText}>🎯 Level {currentFoodSet + 1}/10</Text>
              <Text style={styles.rewardText}>⭐ Score: {score}</Text>
              <Text style={styles.rewardText}>🌟 {score * 10} XP</Text>
              <Text style={styles.rewardText}>💰 {accumulatedCoins}/{coinsReward} Coins</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Mass Indicator
      {showMassIndicator && (
        <View style={styles.massIndicator}>
          <Text style={styles.massText}>{massValue.toFixed(2)} Mass</Text>
        </View>
      )} */}

      {/* Add Timer Selection Modal */}
      <Modal
        visible={showTimerModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Timer Duration</Text>
            <View style={styles.timerOptions}>
              {[1, 3, 5, 10].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timerOption,
                    selectedTime === minutes * 60 && styles.selectedTimer
                  ]}
                  onPress={() => handleTimerSelection(minutes)}
                >
                  <Text style={styles.timerOptionText}>{minutes} min</Text>
                  <Text style={styles.coinRewardText}>💰 {getCoinsForDuration(minutes)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.challengeText}>
              Challenge: Shorter time = Higher rewards!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>Game Settings</Text>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleRestartGame}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.settingsText}>Restart Game</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleBackToMain}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.settingsText}>Back to Main Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleQuit}
            >
              <Ionicons name="exit" size={24} color="#fff" />
              <Text style={styles.settingsText}>Quit Game</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Failure Modal */}
      <Modal
        visible={showFailureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailureModal(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <Text style={styles.failureTitle}>Time's Up!</Text>
            <Text style={styles.failureSubtitle}>You didn't complete all levels in time.</Text>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleRestartGame}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.settingsText}>Restart Game</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleBackToMain}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.settingsText}>Back to Main Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleQuit}
            >
              <Ionicons name="exit" size={24} color="#fff" />
              <Text style={styles.settingsText}>Quit Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Existing game content */}
      <View style={styles.obeseModeContainer}>
        <View style={styles.foodChoiceGameContainer}>
          <Text style={styles.foodChoiceText}>Choose the lower calorie food:</Text>
          <View style={styles.foodChoiceContainer}>
            <View style={[getCardStyle(foodChoices[currentFoodSet].food1), styles.cardLayout]}>
              <TouchableOpacity style={styles.foodChoiceButton} onPress={() => handleFoodChoice(foodChoices[currentFoodSet].food1)}>
                <View style={styles.foodImageContainer}>
                  <Image source={foodChoices[currentFoodSet].food1.image} style={styles.foodImage} />
                </View>
                <Text style={styles.foodChoiceButtonText}>{foodChoices[currentFoodSet].food1.name}</Text>
                {selectedFoodCalories && (
                  <Text style={styles.calorieText}>Calories: {foodChoices[currentFoodSet].food1.calories}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={[getCardStyle(foodChoices[currentFoodSet].food2), styles.cardLayout]}>
              <TouchableOpacity style={styles.foodChoiceButton} onPress={() => handleFoodChoice(foodChoices[currentFoodSet].food2)}>
                <View style={styles.foodImageContainer}>
                  <Image source={foodChoices[currentFoodSet].food2.image} style={styles.foodImage} />
                </View>
                <Text style={styles.foodChoiceButtonText}>{foodChoices[currentFoodSet].food2.name}</Text>
                {selectedFoodCalories && (
                  <Text style={styles.calorieText}>Calories: {foodChoices[currentFoodSet].food2.calories}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Pressable
            onPressIn={() => animateButton(true)}
            onPressOut={() => animateButton(false)}
            onPress={handleNextFoodSet}
            style={({ pressed }) => [
              styles.nextFoodSetButton,
              pressed && styles.nextFoodSetButtonPressed
            ]}
          >
            <Animated.Text 
              style={[
                styles.nextFoodSetButtonText,
                { transform: [{ scale: buttonScale }] }
              ]}
            >
              Next
            </Animated.Text>
          </Pressable>
        </View>
        <View style={styles.modelWrapper}>
          <Canvas camera={{ position: [0, 0, 10] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Suspense fallback={null}>
              {/* Base Model */}
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} rotation={modelRotation} />

              {/* Equipped Assets */}
              {Object.entries(equippedAssets).map(([assetType, asset]) => (
                <Model
                  key={assetType}
                  scale={modelScale}
                  uri={asset.url}
                  position={modelPosition}
                  rotation={modelRotation}
                  color={asset.color}
                />
              ))}
            </Suspense>
            <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
          </Canvas>
        </View>
      </View>
      
      {/* Add glow effects */}
      {showGlowEffect && (
        <Animated.View style={[styles.gainEffect, {
          opacity: gainTextOpacity,
          transform: [{ translateY: gainTextPosition }]
        }]}>
          <Text style={styles.gainText}>-MASS</Text>
        </Animated.View>
      )}
      
      <Animated.View style={[styles.modelGlow, {
        opacity: modelGlowOpacity
      }]} />

      {/* Update BMIGameCongratulationsModal */}
      <BMIGameCongratulationsModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainMenu' }],
          });
        }}
        rewards={{ xp: score * 10, coins: accumulatedCoins }}
        exercises={foodChoices.map((choice, index) => ({ name: `Food Set ${index + 1}` }))}
        timeSpent={Math.round(elapsedTime / 60000)}
      />
    </LinearGradient>
  );
}