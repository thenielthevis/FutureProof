import React, { useState, useEffect, Suspense } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { getEquippedAssets } from '../../API/assets_api';
import { Audio } from 'expo-av';
import BMIGameCongratulationsModal from './BMIGameCongratulationsModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Model Component
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

const levels = [
  "I promise to commit to a healthier lifestyle and make better food choices every day.",
  "I will incorporate regular exercise into my routine, whether it's walking, jogging, or hitting the gym.",
  "I will stay consistent with my goals, even when progress seems slow or difficult.",
  "I will drink more water and cut down on sugary drinks to help my body stay hydrated and healthy.",
  "I will prioritize portion control and mindful eating to avoid overeating.",
  "I will get enough sleep each night to support my metabolism and overall well-being.",
  "I will stay motivated by tracking my progress and celebrating small victories along the way."
];

export default function OverweightGame() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [typedWords, setTypedWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [modelPositionX, setModelPositionX] = useState(-15);
  const [modelScale] = useState({ x: 2, y: 2, z: 2 });
  const [equippedAssets, setEquippedAssets] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(true);
  const [selectedTime, setSelectedTime] = useState(300); // 5 minutes default
  const [gameStarted, setGameStarted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [typingStats, setTypingStats] = useState({
    wpm: 0,
    accuracy: 0,
    totalWords: 0
  });
  const [sound, setSound] = useState();
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [coinsReward, setCoinsReward] = useState(50); // Add this state
  const [completedSentences, setCompletedSentences] = useState([]); // Add this state to track completed sentences
  const [showSettings, setShowSettings] = useState(false); // Add this state for settings modal
  const navigation = useNavigation();

  const modelPosition = { x: modelPositionX, y: -1, z: 0 };
  const modelRotation = [0, Math.PI / 2, 0]; // Facing right

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

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else if (!timerActive && elapsedTime !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, startTime]);

  // Add audio effects
  const playSuccessSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  // Clean up audio
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  // Add timer countdown effect
  useEffect(() => {
    let interval;
    if (gameStarted && timerActive && elapsedTime < selectedTime * 1000) {
      interval = setInterval(() => {
        const newElapsedTime = Date.now() - startTime;
        setElapsedTime(newElapsedTime);
        
        // Check if time is up
        if (newElapsedTime >= selectedTime * 1000) {
          clearInterval(interval);
          handleGameEnd();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, timerActive, startTime, selectedTime]);

  const handleStartGame = () => {
    setGameStarted(true);
    setShowTimerModal(false);
    setStartTime(Date.now());
    setTimerActive(true);
  };

  const handleGameEnd = () => {
    setTimerActive(false);
    
    if (currentLevel === levels.length - 1 && typedText.trim() === levels[currentLevel]) {
      // Calculate time spent in minutes
      const minutes = elapsedTime / (1000 * 60);
      
      // Calculate total characters typed from all completed sentences
      const totalChars = completedSentences.join(' ').length;
      
      // Calculate words per minute based on all completed sentences
      const wpm = Math.round((totalChars / 5) / minutes);
      
      // Calculate total words in all levels
      const totalWordsInGame = levels.reduce((acc, level) => acc + level.split(' ').length, 0);
      
      // Calculate total words typed correctly (from completed sentences)
      const totalWordsTypedCorrectly = completedSentences.reduce((acc, sentence) => 
        acc + sentence.split(' ').length, 0
      );
      
      // Calculate accuracy based on all levels
      const accuracy = Math.round((totalWordsTypedCorrectly / totalWordsInGame) * 100);
      
      setTypingStats({
        wpm: wpm || 0,
        accuracy: accuracy || 0,
        totalWords: totalWordsTypedCorrectly || 0
      });
      
      playSuccessSound();
      setShowCongratulations(true);
      return;
    }

    // Only show failure if time's up and not completed
    if (elapsedTime >= selectedTime * 1000) {
      setShowFailureModal(true);
      setIsActive(false);
      playFailureSound();
    }
  };

  const playLevelCompleteSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/menu-select.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const handleTyping = (text) => {
    if (!timerActive) {
      setTimerActive(true);
      setStartTime(Date.now());
    }
    setTypedText(text);
    const words = text.trim().split(" ");
    const levelWords = levels[currentLevel].split(" ");
    
    setTypedWords(words);
    setCurrentWordIndex(words.length - 1);
    
    // Calculate progress based on correct words only
    const correctWords = words.filter((word, index) => 
      index < levelWords.length && word === levelWords[index]
    );
    
    setModelPositionX(-15 + (correctWords.length / levelWords.length) * 30);

    // If the sentence is completed correctly
    if (text.trim() === levels[currentLevel]) {
      playLevelCompleteSound(); // Add sound effect when completing a level
      setCompletedSentences(prev => [...prev, text.trim()]);
      
      if (currentLevel < levels.length - 1) {
        setCurrentLevel(currentLevel + 1);
        setTypedText("");
        setModelPositionX(-15);
      } else if (currentLevel === levels.length - 1) {
        handleGameEnd();
      }
    }
  };

  const getWordStyle = (word, index) => {
    const levelWords = levels[currentLevel].split(" ");
    const typedWords = typedText.trim().split(" ");
    
    if (index >= typedWords.length) {
      return styles.untypedWord;
    }
    
    if (index === typedWords.length - 1) {
      return styles.currentWord;
    }
    
    if (typedWords[index] === levelWords[index]) {
      return styles.correctWord;
    }
    
    return styles.wrongWord;
  };

  // Add these new functions for failure modal
  const handleRestartGame = async () => {
    try {
      // Stop existing sounds
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      setTypedText('');
      setTypedWords([]);
      setCurrentWordIndex(0);
      setModelPositionX(-15);
      setCurrentLevel(0);
      setShowFailureModal(false);
      setIsActive(true);
      setElapsedTime(0);
      setTimerActive(false);
      setGameStarted(false);
      setShowTimerModal(true);
      setCompletedSentences([]); // Reset completed sentences
      setShowSettings(false); // Close settings modal if open
    } catch (error) {
      console.error('Error restarting game:', error);
    }
  };

  const handleBackToMain = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainMenu' }],
      });
    } catch (error) {
      console.error('Error navigating back:', error);
    }
  };

  const handleQuit = () => {
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Game' }],
    });
  };

  // Add this useEffect to check for failure condition
  useEffect(() => {
    if (isActive && 
        elapsedTime >= selectedTime * 1000 && 
        (currentLevel < levels.length - 1 || 
        typedText.trim() !== levels[currentLevel])) {
      setShowFailureModal(true);
      setIsActive(false);
      setTimerActive(false);
      playFailureSound();
    }
  }, [elapsedTime, currentLevel, isActive, typedText]);

  // Add failure sound effect
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

  // Add coin calculation based on timer selection
  const getCoinsForDuration = (minutes) => {
    switch (minutes) {
      case 1: return 100;  // Highest reward for shortest time
      case 3: return 75;
      case 5: return 50;
      case 10: return 25; // Lowest reward for longest time
      default: return 50;
    }
  };

  // Update timer selection handler
  const handleTimerSelection = (minutes) => {
    setSelectedTime(minutes * 60);
    setCoinsReward(getCoinsForDuration(minutes));
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Move Settings Button inside headerContainer */}
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
              <Text style={styles.rewardText}>🌟 10 XP</Text>
              <Text style={styles.rewardText}>💰 {coinsReward} Coins</Text>
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

      {/* Timer Selection Modal */}
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

      {/* Game Content */}
      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            {/* Base Model */}
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
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb'
              position={modelPosition}
              rotation={modelRotation}
            />
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb'
              position={modelPosition}
              rotation={modelRotation}
            />
            
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
        {currentLevel === levels.length - 1 && (
          <Image
            source={require('../../assets/OverGame/finishline.png')}
            style={styles.finishLine}
          />
        )}
      </View>

      <View style={styles.typingGameContainer}>
        <Text style={styles.levelText}>Level {currentLevel + 1}</Text>
        <View style={styles.sentenceContainer}>
          {levels[currentLevel].split(" ").map((word, index) => (
            <Text key={index} style={[styles.word, getWordStyle(word, index)]}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <TextInput
          style={styles.typingInput}
          value={typedText}
          onChangeText={handleTyping}
          placeholder="Type the sentence here..."
          contextMenuHidden={true}  // Disable paste menu
          onKeyPress={(e) => {
            // Only allow typing one character at a time
            if (e.nativeEvent.key === 'v' && e.nativeEvent.metaKey) {
              e.preventDefault();
            }
          }}
        />
      </View>

      <BMIGameCongratulationsModal
        visible={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainMenu' }],
          });
        }}
        rewards={{
          xp: 10,
          coins: coinsReward
        }}
        exercises={[
          { name: `Speed: ${typingStats.wpm} WPM` },
          { name: `Accuracy: ${typingStats.accuracy}%` },
          { name: `Total Words Completed: ${typingStats.totalWords}` },
          { name: `Time Spent: ${Math.floor(elapsedTime / 60000)} minutes` }
        ]}
        timeSpent={Math.floor(elapsedTime / 60000)}
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
}

// Add new styles
const styles = StyleSheet.create({
    // Common styles
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
      height: '60%',
      position: 'relative',
      marginTop: 150,
    },

  typingGameContainer: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  word: {
    fontSize: 18,
    padding: 5,
    margin: 2,
    borderRadius: 5,
  },
  untypedWord: {
    color: 'white',
  },
  currentWord: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
  },
  correctWord: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    color: 'white',
  },
  wrongWord: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    color: 'white',
  },
  typingInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    fontSize: 16,
  },
  finishLine: {
    position: 'absolute',
    bottom: 150, // Adjust this value to align with the feet of the human model
    right: 150,
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '30%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  timerOption: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
    height: 80, // Increased height to accommodate coin text
    justifyContent: 'center',
  },
  selectedTimer: {
    backgroundColor: '#3498db',
  },
  timerOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerGif: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  rewardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  failureTitle: {
    fontSize: 24,
    color: '#e74c3c',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
  coinRewardText: {
    color: '#ffd700',
    fontSize: 14,
    marginTop: 5,
  },
  challengeText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
    padding: 10,
    borderRadius: 25,
  },
  settingsTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,  // Add space between stats and settings button
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
});

