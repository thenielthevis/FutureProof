import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get("window");

const QuizCongratulationsModal = ({ visible, onClose, score, totalQuestions, coins, xp }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  useEffect(() => {
    if (score !== null) {
      setShowConfetti(true);
      playSound();
    }
  }, [score]);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  }

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.congratulationsText}>Congratulations!</Text>
            <Text style={styles.successText}>You've successfully completed the task.</Text>
            <Text style={styles.scoreText}>Total Score: {score}/{totalQuestions}</Text>
            <Text style={styles.coinsText}>
              <FontAwesome5 name="coins" size={20} color="gold" /> + {coins} Coins
            </Text>
            <Text style={styles.xpText}>
              <FontAwesome5 name="star" size={20} color="gold" /> + {xp} XP
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon ref={confettiRef} count={200} origin={{ x: width / 2, y: height / 2 }} explosionSpeed={500} fallSpeed={3000} fadeOut={true}/>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
    width: '50%',
    maxHeight: 'auto',
    position: 'relative',
  },
  congratulationsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4CAF50',
  },
  successText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    transform: [{ translateY: 100 }],
  },
});

export default QuizCongratulationsModal;
