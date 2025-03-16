import React, { useState, useRef, useEffect, Suspense } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Animated, ActivityIndicator, Easing, Modal } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';
import { Audio } from 'expo-av';
import CrosswordPuzzle from './Components/CrosswordPuzzle';
import { Ionicons } from '@expo/vector-icons';
import BMIGameCongratulationsModal from './BMIGameCongratulationsModal';
import { useNavigation, useRoute } from '@react-navigation/native';

const foodImages = {
  breakfast: require('../../assets/food/underbreakfast.png'),
  lunch: require('../../assets/food/underlunch.png'),
  dinner: require('../../assets/food/underdinner.png'),
};

// Add new arrays for daily word sets
const DAILY_WORDS = {
  1: ['PROTEIN', 'MUSCLE', 'EATING', 'HEALTH', 'STRONG'],
  2: ['CALORIE', 'WEIGHT', 'ENERGY', 'GROWTH', 'MEALS'],
  3: ['FITNESS', 'HEALTHY', 'ACTIVE', 'GAINS', 'BOOST'],
  4: ['RECOVER', 'POWER', 'SLEEP', 'BUILD', 'SHAPE'],
  5: ['NUTRIENT', 'BALANCE', 'VITAL', 'MASS', 'TRAIN'],
  6: ['STRENGTH', 'MUSCLE', 'FOOD', 'BULK', 'DIET'],
  7: ['WORKOUT', 'EATING', 'GROW', 'LEAN', 'GAINS']
};

// Keep Model component as it was before
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

const UnderweightGame = ({ setGameCompleted, setBmiCategory }) => {
  const [day, setDay] = useState(1);
  const [foodDragged, setFoodDragged] = useState(false);
  const [highlightedFood, setHighlightedFood] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [eating, setEating] = useState(false);
  const [equippedAssets, setEquippedAssets] = useState({});
  const [sound, setSound] = useState();
  const [gamePhase, setGamePhase] = useState('crossword'); // 'crossword' or 'feeding'
  const [modelScale, setModelScale] = useState({ x: 2, y: 4, z: 4 }); // Initial slim model
  const [wordSearchCompleted, setWordSearchCompleted] = useState(false);
  const [currentWords, setCurrentWords] = useState(DAILY_WORDS[1]);
  const [foodsLocked, setFoodsLocked] = useState(true);
  const [wordSearchActive, setWordSearchActive] = useState(true);
  const [draggedFoods, setDraggedFoods] = useState(new Set()); // Add this state
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [gameStartTime] = useState(new Date());
  const [gainEffect, setGainEffect] = useState(false);
  const gainTextOpacity = useRef(new Animated.Value(0)).current;
  const gainTextPosition = useRef(new Animated.Value(0)).current;
  const modelGlowOpacity = useRef(new Animated.Value(0)).current;
  const [showSettings, setShowSettings] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [timer, setTimer] = useState(300); // Add timer state
  const [resetTimer, setResetTimer] = useState(false);
  const [tempFoodDescription, setTempFoodDescription] = useState(null);
  const [showTempDescription, setShowTempDescription] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [ isActive, setIsActive ] = useState(true);

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

  // Add cleanup effect for audio
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // Add refresh mechanism for model loading
  useEffect(() => {
    const refreshAssets = async () => {
      try {
        // Clear existing assets
        setEquippedAssets({});
        // Fetch fresh assets
        const assets = await getEquippedAssets();
        setEquippedAssets(assets);
      } catch (error) {
        console.error('Error refreshing assets:', error);
      }
    };

    refreshAssets();
  }, [navigation.isFocused()]); // Refresh when screen comes into focus

  // Add model configuration
  const modelPosition = { x: 0, y: -2.5, z: 0 };
  const modelRotation = [0, 0, 0];

  // Pan responder setup
  const panBreakfast = useRef(new Animated.ValueXY()).current;
  const panLunch = useRef(new Animated.ValueXY()).current;
  const panDinner = useRef(new Animated.ValueXY()).current;

  // Modify handleFoodDrag to track individual foods
  const handleFoodDrag = (meal) => {
    setDraggedFoods(prev => new Set([...prev, meal]));
    setEating(true);
    
    // Show food description
    setTempFoodDescription(foodDescriptions[`under${meal}`]?.description);
    setShowTempDescription(true);
    
    // Hide description and eating state after 2 seconds
    setTimeout(() => {
      setShowTempDescription(false);
      setEating(false);
    }, 3000);
  };

  const playEatingSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/eating.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const playCorrectSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };


  const playSuccessSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  // Add function to play failure sound
  const playFailureSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound-effects/try-again.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing failure sound:', error);
    }
  };

  // Modify createPanResponder to check wordSearchCompleted
  const createPanResponder = (pan, meal) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => wordSearchCompleted, // Only allow drag if word search is completed
      onPanResponderMove: (e, gestureState) => {
        if (wordSearchCompleted) {
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gestureState);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (wordSearchCompleted && gestureState.moveY < 400) {
          handleFoodDrag(meal);
          playEatingSound();
        }
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    });
  };

  // Update panResponder creation with meal identification
  const panResponderBreakfast = createPanResponder(panBreakfast, 'breakfast');
  const panResponderLunch = createPanResponder(panLunch, 'lunch');
  const panResponderDinner = createPanResponder(panDinner, 'dinner');

  // Modify handleNextDay to reset dragged foods and word search
  const handleNextDay = () => {
    if (draggedFoods.size === 3) {
      if (day < 7) {
        setDay(prevDay => prevDay + 1);
        setDraggedFoods(new Set());
        showGainEffect();
        setModelScale(prev => ({
          ...prev,
          x: Math.min(prev.x + 0.3, 5)
        }));
        setCurrentWords(DAILY_WORDS[day + 1]);
        setWordSearchCompleted(false);
        setWordSearchActive(true);
        setFoodsLocked(true);
        playSuccessSound();
      } else if (day === 7) {
        // Show congratulations first, then update BMI category
        setShowCongratulations(true);
        playSuccessSound();
        // BMI category will be updated when modal is closed
      }
    } else {
      alert('Please drag all food items before proceeding to the next day.');
    }
  };

  const handleCrosswordComplete = () => {
    setGamePhase('feeding');
  };

  // Add function to handle word search completion
  const handleWordSearchComplete = () => {
    setWordSearchCompleted(true);
    setFoodsLocked(false);
    setWordSearchActive(false);
    playCorrectSound(); // Play sound when foods are unlocked
  };

  // Add useEffect to watch for food dragging completion
  useEffect(() => {
    if (foodDragged) {
      setWordSearchActive(true);
    }
  }, [foodDragged]);

  // Add effect to watch for day changes and update words
  useEffect(() => {
    if (DAILY_WORDS[day]) {
      setCurrentWords(DAILY_WORDS[day]);
    }
  }, [day]);

  // Add getTimeSpent function
  const getTimeSpent = () => {
    const endTime = new Date();
    const timeSpent = Math.floor((endTime - gameStartTime) / 60000); // Convert to minutes
    return timeSpent;
  };

  const foodDescriptions = {
    underbreakfast: {
      image: require('../../assets/food/underbreakfast.png'),
      description: `Breakfast (High-Calorie & Protein-Rich)
✅ Oatmeal with Peanut Butter & Banana
1 cup oats cooked with milk
1 tbsp peanut butter
1 sliced banana
Handful of nuts (almonds, walnuts, or cashews)
1 boiled egg or scrambled eggs with cheese
📌 Calories: 600-700 kcal`,
    },
    underlunch: {
      image: require('../../assets/food/underlunch.png'),
      description: `Lunch (Balanced & High-Calorie)
✅ Grilled Chicken with Brown Rice & Avocado
150g grilled chicken breast
1 cup cooked brown rice/quinoa
½ avocado
1 cup steamed vegetables (broccoli, carrots, or spinach)
Drizzle of olive oil
📌 Calories: 700-800 kcal`,
    },
    underdinner: {
      image: require('../../assets/food/underdinner.png'),
      description: `Dinner (High-Protein & Fiber-Rich)
✅ Salmon with Mashed Sweet Potatoes & Greens
150g grilled salmon
1 cup mashed sweet potatoes
1 serving steamed kale/spinach with olive oil
📌 Calories: 600-700 kcal`,
    },
  };

  const handleFoodHover = (foodKey) => {
    setHighlightedFood(foodKey);
    setSelectedFood(foodDescriptions[foodKey]?.description);
  };

  const showGainEffect = () => {
    gainTextPosition.setValue(0);
    gainTextOpacity.setValue(1);
    setGainEffect(true);

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
    ]).start(() => setGainEffect(false));
  };

  const handleRestartGame = async () => {
    try {
      // Stop existing sounds
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      setDay(1);
      setDraggedFoods(new Set());
      setModelScale({ x: 2, y: 4, z: 4 });
      setCurrentWords(DAILY_WORDS[1]);
      setWordSearchCompleted(false);
      setWordSearchActive(true);
      setFoodsLocked(true);
      setShowSettings(false);
      setShowFailureModal(false); // Add this line
      setIsActive(true); // Add this line to reactivate the game
      setResetTimer(prev => !prev); // Toggle resetTimer to trigger useEffect in CrosswordPuzzle
      
      // Refresh equipped assets
      const assets = await getEquippedAssets();
      setEquippedAssets(assets);
    } catch (error) {
      console.error('Error restarting game:', error);
    }
  };

  const handleBackToMain = async () => {
    try {
      // Stop all sounds before navigation
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      
      const currentRoute = navigation.getState().routes;
      const isInMainMenu = currentRoute[currentRoute.length - 1].name === 'MainMenu';
      
      if (isInMainMenu) {
        setShowSettings(false);
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainMenu' }],
        });
      }
    } catch (error) {
      console.error('Error navigating back:', error);
    }
  };

  const handleQuit = () => {
    const currentRoute = navigation.getState().routes;
    const isInGame = currentRoute[currentRoute.length - 1].name === 'Game';
    
    // Stop all audio before quitting
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
    }
    
    if (isInGame) {
      setShowSettings(false);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Game' }],
      });
    }
  };

  // Modify the timer effect to show failure modal
  useEffect(() => {
    let interval;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setShowFailureModal(true);
            playFailureSound();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  // Add timer end handler
  const handleTimeUp = () => {
    setShowFailureModal(true);
    playFailureSound();
    setIsActive(false); // Stop the game
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Add Settings Button at the top right */}
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => setShowSettings(true)}
      >
        <Ionicons name="settings-outline" size={30} color="#fff" />
      </TouchableOpacity>

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

      <View style={styles.contentContainer}>
        <View style={styles.leftContainer}>
          {gamePhase === 'crossword' ? (
            <View style={[
              styles.crosswordContainer,
              !wordSearchActive && styles.dimmedContainer
            ]}>
              <View style={styles.headerStats}>
                <Text style={styles.dayText}>Day {day}</Text>
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardText}>🌟 10 XP</Text>
                  <Text style={styles.rewardText}>💰 50 Coins</Text>
                </View>
              </View>
              <CrosswordPuzzle 
                words={currentWords} // This will now receive the correct words for each day
                onComplete={handleWordSearchComplete}
                isActive={wordSearchActive}
                resetTimer={resetTimer}
                onTimeUp={handleTimeUp}  // Add this prop
              />
            </View>
          ) : null}
        </View>

        {/* Right Side - 3D Model and Food Items */}
        <View style={styles.rightContainer}>
          {gainEffect && (
            <Animated.View style={[styles.gainEffect, {
              opacity: gainTextOpacity,
              transform: [{ translateY: gainTextPosition }]
            }]}>
              <Text style={styles.gainText}>+MASS</Text>
            </Animated.View>
          )}
          
          <Animated.View style={[styles.modelGlow, {
            opacity: modelGlowOpacity
          }]} />

          <Canvas camera={{ position: [0, 0, 10] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Suspense fallback={null}>
              <Model 
                scale={modelScale} 
                uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' 
                position={modelPosition} 
                rotation={modelRotation}
              />
              <Model 
                scale={modelScale} 
                uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' 
                position={modelPosition} 
                rotation={modelRotation}
              />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} rotation={modelRotation} />
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

          {/* Show food container always, but with locks initially */}
          <View style={styles.foodAndControlsContainer}>
            <View style={styles.foodContainer}>
              {['breakfast', 'lunch', 'dinner'].map((meal) => (
                <Animated.View
                  key={meal}
                  {...(eval(`panResponder${meal.charAt(0).toUpperCase() + meal.slice(1)}`).panHandlers)}
                  style={[
                    eval(`pan${meal.charAt(0).toUpperCase() + meal.slice(1)}`).getLayout(),
                    styles.foodIconContainer,
                    !wordSearchCompleted && styles.lockedFoodContainer
                  ]}
                  onMouseEnter={() => wordSearchCompleted && handleFoodHover(`under${meal}`)}
                  onMouseLeave={() => handleFoodHover(null)}
                >
                  <Image
                    source={foodImages[meal]}
                    style={[
                      styles.foodImage,
                      highlightedFood === `under${meal}` && styles.highlightedFoodImage,
                    ]}
                  />
                  {!wordSearchCompleted ? (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={24} color="white" />
                    </View>
                  ) : (
                    draggedFoods.has(meal) && (
                      <View style={styles.draggedOverlay}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      </View>
                    )
                  )}
                </Animated.View>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.nextButton,
                (!wordSearchCompleted || draggedFoods.size < 3 || eating) && styles.disabledButton
              ]} 
              onPress={handleNextDay}
              disabled={!wordSearchCompleted || draggedFoods.size < 3 || eating}
            >
              <Ionicons 
                name="arrow-forward-circle" 
                size={40} 
                color={(!wordSearchCompleted || draggedFoods.size < 3 || eating) ? "#666" : "#4CAF50"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {selectedFood && day < 7 && gamePhase === 'feeding' && (
        <View style={styles.foodDescriptionContainer}>
          <Text style={styles.descriptionText}>{selectedFood}</Text>
        </View>
      )}

      {/* Add temporary food description display */}
      {showTempDescription && tempFoodDescription && (
        <View style={styles.tempDescriptionContainer}>
          <Text style={styles.descriptionText}>{tempFoodDescription}</Text>
        </View>
      )}

      <BMIGameCongratulationsModal
        visible={showCongratulations}
        onClose={() => {
          if (typeof setGameCompleted === 'function') {
            setGameCompleted(true);
          }
          if (typeof setBmiCategory === 'function') {
            setBmiCategory('Normal');
          }
          setShowCongratulations(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainMenu' }],
          });
        }}
        rewards={{
          xp: 10,
          coins: 50
        }}
        exercises={[
          { name: 'Completed 7 days of healthy eating' },
          { name: 'Mastered word puzzles' },
          { name: 'Achieved normal BMI target' }
        ]}
        timeSpent={getTimeSpent()}
      />

      {/* Add Failure Modal */}
      <Modal
        visible={showFailureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailureModal(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <Text style={styles.failureTitle}>Time's up! You failed.</Text>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  leftContainer: {
    flex: 3,
    marginRight: 20,
  },
  rightContainer: {
    flex: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    position: 'relative',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  crosswordContainer: {
    borderRadius: 10,
    padding: 20,
    height: 500,
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    // boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  feedingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  foodAndControlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10, // Ensure controls are above animations
  },
  dayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  foodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(4px)',
    zIndex: 10, // Ensure food container is above animations
  },
  foodIconContainer: {
    position: 'relative',
    marginHorizontal: 10,
    width: 80,  // Match the image width
    height: 80, // Match the image height
  },
  foodImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    borderRadius: 10,
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.05)',
    },
  },
  highlightedFoodImage: {
    borderColor: '#FFD700',
    borderWidth: 3,
    borderRadius: 10,
  },
  lockedFoodContainer: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  nextButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.2s, opacity 0.2s',
    ':hover': {
      transform: 'scale(1.1)',
    },
  },
  disabledButton: {
    opacity: 0.5,
  },
  foodDescriptionContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    width: '25%',
    maxHeight: 200,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  dimmedContainer: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  draggedOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  gainEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 5, // Lower zIndex
    transform: [{ translateX: -25 }],
    pointerEvents: 'none', // Allow interaction with elements below
  },
  gainText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: '0 0 10px #4CAF50',
  },
  modelGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    zIndex: 1,
    pointerEvents: 'none', // Allow interaction with elements below
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
    padding: 10,
    borderRadius: 25,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '30%',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: '100%',
    gap: 10,
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tempDescriptionContainer: {
    position: 'absolute',
    top: '50%',
    left: '80%',
    transform: [{ translateX: -200 }, { translateY: -100 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    width: 400,
    maxHeight: 300,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  failureTitle: {
    fontSize: 24,
    color: '#e74c3c',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default UnderweightGame;