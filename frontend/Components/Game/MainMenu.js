import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

export default function MainMenu() {
  const navigation = useNavigation();
  const [showCategories, setShowCategories] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [menuSelectSound, setMenuSelectSound] = useState(null);
  const [menuCloseSound, setMenuCloseSound] = useState(null);
  const [bgMusic, setBgMusic] = useState(null);

  // Load sounds on mount
  useEffect(() => {
    const loadSounds = async () => {
      const selectSound = new Audio.Sound();
      const closeSound = new Audio.Sound();
      const backgroundMusic = new Audio.Sound();

      try {
        await selectSound.loadAsync(require('../../assets/sound-effects/menu-select.mp3'));
        await closeSound.loadAsync(require('../../assets/sound-effects/menu-close.mp3'));
        await backgroundMusic.loadAsync(require('../../assets/sound-effects/main-menu.mp3'), {
          shouldPlay: true,
          isLooping: true,
          volume: 0.5,
        });

        setMenuSelectSound(selectSound);
        setMenuCloseSound(closeSound);
        setBgMusic(backgroundMusic);
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      if (menuSelectSound) menuSelectSound.unloadAsync();
      if (menuCloseSound) menuCloseSound.unloadAsync();
      if (bgMusic) bgMusic.unloadAsync(); // Stop and unload background music
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
    if (menuCloseSound) await menuCloseSound.replayAsync();

    if (showCategories) {
      setShowCategories(false);
    } else {
      navigation.navigate('Game');
      await bgMusic.stopAsync();
      await bgMusic.unloadAsync();
    }
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <Text style={styles.title}>BMI Adventure</Text>

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

          {['Underweight', 'Normal', 'Overweight', 'Obese'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, getCategoryStyle(category)]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={styles.categoryText}>{category}</Text>
              <Text style={styles.categoryDescription}>{getCategoryDescription(category)}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
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
  categoryButton: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  categoryDescription: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
});
