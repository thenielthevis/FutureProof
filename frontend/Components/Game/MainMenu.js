import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import Modal from 'react-native-modal';
import { useFocusEffect } from '@react-navigation/native';

const GAME_INFO = {
  'Word Hunt: Fuel Up!': {
    route: 'UnderweightGame',
    color: '#FFB74D',
    image: require('../../assets/Game/word-hunt-thumbnail.png'),
    description: 'Build healthy mass through proper nutrition',
    purpose: 'Word Hunt: Fuel Up! aims to educate underweight individuals about essential nutrients and healthy foods that promote weight gain in a balanced way. The game enhances vocabulary and awareness of proper nutrition.',
    mechanics: [
      'Players are given a grid of scrambled letters.',
      'They must find and highlight words related to healthy weight gain.',
      'A timer challenges players to find as many words as possible within the time limit.',
      'Each correct word earns coins.'
    ]
  },
  'Health Dash: Live Smart!': {
    route: 'NormalGame',
    color: '#81C784',
    image: require('../../assets/Game/food-dash-thumbnail.png'),
    description: 'Maintain your healthy lifestyle',
    purpose: 'Health Dash: Live Smart! helps players maintain a balanced diet through quick decision-making in a fun and engaging endless runner format.',
    mechanics: [
      'Run through three lanes collecting healthy food items.',
      'Dodge obstacles and unhealthy food choices.',
      'Earn points for making healthy food choices.',
      'Speed increases as you progress.'
    ]
  },
  'Type & Sprint!': {
    route: 'OverweightGame',
    color: '#FF8A65',
    image: require('../../assets/Game/type-sprint-thumbnail.png'),
    description: 'Progress towards a healthier weight',
    purpose: 'Type & Sprint! encourages players to commit to their health goals through typing exercises that reinforce positive health affirmations.',
    mechanics: [
      'Type health-related affirmations accurately.',
      'Watch your character move forward as you type correctly.',
      'Progress through multiple levels of increasing difficulty.',
      'Earn rewards for completing affirmations.'
    ]
  },
  'MindFit: Guess Right!': {
    route: 'ObeseGame',
    color: '#E57373',
    image: require('../../assets/Game/mindfit-thumbnail.png'),
    description: 'Begin your transformation journey',
    purpose: 'MindFit: Guess Right! helps players make better food choices by comparing calorie content and nutritional value of different foods.',
    mechanics: [
      'Compare two food items and select the healthier option.',
      'Learn about portion sizes and calorie content.',
      'Progress through different food categories.',
      'Earn points for correct choices.'
    ]
  }
};

export default function MainMenu() {
  const navigation = useNavigation();
  const [showCategories, setShowCategories] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [menuSelectSound, setMenuSelectSound] = useState(null);
  const [menuCloseSound, setMenuCloseSound] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [bgMusic, setBgMusic] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [pressedCategory, setPressedCategory] = useState(null);

  useEffect(() => {
    const loadSounds = async () => {
      const selectSound = new Audio.Sound();
      const closeSound = new Audio.Sound();

      try {
        await selectSound.loadAsync(require('../../assets/sound-effects/menu-select.mp3'));
        await closeSound.loadAsync(require('../../assets/sound-effects/menu-close.mp3'));

        setMenuSelectSound(selectSound);
        setMenuCloseSound(closeSound);
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      if (menuSelectSound) menuSelectSound.unloadAsync();
      if (menuCloseSound) menuCloseSound.unloadAsync();
    };
  }, []);

  const handleBackgroundMusic = async () => {
    try {
      if (isMusicPlaying) return;

      if (bgMusic) {
        await bgMusic.unloadAsync();
      }

      const music = new Audio.Sound();
      await music.loadAsync(require('../../assets/sound-effects/main-menu.mp3'));
      await music.setIsLoopingAsync(true);
      await music.setVolumeAsync(0.5);
      await music.playAsync();
      setBgMusic(music);
      setIsMusicPlaying(true);
    } catch (error) {
      console.error('Error handling background music:', error);
    }
  };

  useEffect(() => {
    handleBackgroundMusic();
    
    return () => {
      if (bgMusic) {
        const cleanup = async () => {
          try {
            await bgMusic.stopAsync();
            await bgMusic.unloadAsync();
            setIsMusicPlaying(false);
          } catch (error) {
            console.error('Error cleaning up background music:', error);
          }
        };
        cleanup();
      }
    };
  }, []);

  const handlePlayPress = async () => {
    if (menuSelectSound) await menuSelectSound.replayAsync();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCategories(true);
    });
  };

  const handleCategorySelect = (category) => {
    const gameRoutes = {
      'Underweight': 'UnderweightGame',
      'Normal': 'NormalGame',
      'Overweight': 'OverweightGame',
      'Obese': 'ObeseGame'
    };
    navigation.navigate(gameRoutes[category]);
  };

  const handleBack = async () => {
    try {
      if (menuCloseSound) await menuCloseSound.replayAsync();

      if (showCategories) {
        setShowCategories(false);
      } else {
        if (bgMusic) {
          await bgMusic.stopAsync();
          await bgMusic.unloadAsync();
          setIsMusicPlaying(false);
        }
        navigation.navigate('Game');
      }
    } catch (error) {
      console.error('Error handling back navigation:', error);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setCountdown(null);
            navigation.navigate(GAME_INFO[selectedGame].route);
          }, 1000);
          return 'GO!';
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGameSelect = (gameName) => {
    setSelectedGame(gameName);
    setShowGameInfo(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleStartGame = async () => {
    try {
      if (bgMusic) {
        await bgMusic.stopAsync();
        await bgMusic.unloadAsync();
        setIsMusicPlaying(false);
      }
      setShowGameInfo(false);
      startCountdown();
      setTimeout(() => {
        navigation.navigate(GAME_INFO[selectedGame].route);
      }, 4000);
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  };

  const handleCloseModal = () => {
    setShowGameInfo(false);
    setSelectedGame(null);
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {!showCategories && <Text style={styles.title}>BMI Adventure</Text>}

      {!showCategories ? (
        <View style={styles.menuContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={styles.button} onPress={handlePlayPress}>
              <Text style={styles.buttonText}>Play</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={[styles.backButton]} onPress={handleBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.categoriesContainer}>
          <Text style={styles.subtitle}>Select Your Journey</Text>

          {Object.keys(GAME_INFO).map((gameName) => (
            <Animated.View
              key={gameName}
              style={[
                styles.categoryContainer,
                {
                  transform: [{
                    scale: pressedCategory === gameName ? 0.95 : 1
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => handleGameSelect(gameName)}
                onPressIn={() => setPressedCategory(gameName)}
                onPressOut={() => setPressedCategory(null)}
              >
                <Image
                  source={GAME_INFO[gameName].image}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.categoryOverlay}
                >
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryText}>{gameName}</Text>
                    <Text style={styles.categoryDescription}>
                      {GAME_INFO[gameName].description}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}

          <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {countdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      <Modal
        isVisible={showGameInfo}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={styles.modal}
        onBackdropPress={handleCloseModal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseModal}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{selectedGame}</Text>
          
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalSectionTitle}>Purpose:</Text>
            <Text style={styles.modalText}>
              {selectedGame && GAME_INFO[selectedGame].purpose}
            </Text>

            <Text style={styles.modalSectionTitle}>Mechanics:</Text>
            <View style={styles.mechanicsList}>
              {selectedGame && GAME_INFO[selectedGame].mechanics.map((mechanic, index) => (
                <Text key={index} style={styles.mechanicItem}>• {mechanic}</Text>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Helper functions
const getCategoryStyle = (category) => ({
  Underweight: { backgroundColor: '#FFB74D' },
  Normal: { backgroundColor: '#81C784' },
  Overweight: { backgroundColor: '#FF8A65' },
  Obese: { backgroundColor: '#E57373' },
}[category]);

const getCategoryDescription = (category) => ({
  Underweight: 'Build healthy mass through proper nutrition',
  Normal: 'Maintain your healthy lifestyle',
  Overweight: 'Progress towards a healthier weight',
  Obese: 'Begin your transformation journey',
}[category]);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  menuContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  categoriesContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    padding: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    backgroundColor: '#455A64',
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryContainer: {
    width: '100%',
    height: 120, // Reduced from 160
    marginVertical: 8, // Reduced from 10
    borderRadius: 15,
    overflow: 'hidden',
  },
  categoryButton: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  categoryContent: {
    zIndex: 2,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryDescription: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff',  // Changed from #666
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: '70%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',  // Changed from #333
    marginBottom: 15,
    marginTop: 5,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ecf0f1',  // Changed from #444
    marginTop: 10,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#bdc3c7',  // Changed from #666
    lineHeight: 24,
  },
  mechanicsList: {
    marginTop: 10,
  },
  mechanicItem: {
    fontSize: 16,
    color: '#bdc3c7',  // Changed from #666
    marginBottom: 8,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 25,
    alignSelf: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: 'white',
  }
});
