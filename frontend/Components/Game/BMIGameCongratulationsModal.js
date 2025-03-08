import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';
import { createTaskCompletion } from '../../API/task_completion_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatusContext } from '../../Context/UserStatusContext';
import { UserLevelContext } from '../../Context/UserLevelContext';

const { width, height } = Dimensions.get("window");

const BMIGameCongratulationsModal = ({ visible, onClose, rewards, exercises, timeSpent }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const [sound, setSound] = useState();
  const { updateBattery } = useContext(UserStatusContext);
  const { addXP } = useContext(UserLevelContext);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      playSound();
    }
  }, [visible]);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playMenuClose = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../../assets/sound-effects/menu-close.mp3'));
    setSound(sound);
    await sound.playAsync();
  };

  const handleContinue = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const taskCompletionData = {
      user_id: userId, // Store as string
      task_type: 'bmi_game',
      time_spent: timeSpent,
      coins_received: rewards.coins,
      xp_received: rewards.xp,
      date_completed: new Date().toISOString()
    };
    try {
      await createTaskCompletion(taskCompletionData);
      await playMenuClose();
      await updateBattery(10);
      await addXP(rewards.xp);
      onClose();
    } catch (error) {
      console.error('Error creating task completion:', error);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.congratulationsText}>Congratulations!</Text>
            <Text style={styles.successText}>You've successfully completed the BMI game session.</Text>
            <Text style={styles.rewardsText}>
              <FontAwesome5 name="star" size={20} color="gold" /> + {rewards.xp} XP
            </Text>
            <Text style={styles.rewardsText}>
              <FontAwesome5 name="coins" size={20} color="gold" /> + {rewards.coins} Coins
            </Text>
            <Text style={styles.timeSpentText}>Time Spent: {timeSpent} minutes</Text>
            <Text style={styles.exercisesHeader}>Exercises Completed:</Text>
            <FlatList
              data={exercises}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Text style={styles.exerciseText}>• {item.name}</Text>
              )}
            />
            <TouchableOpacity onPress={handleContinue} style={styles.closeButton}>
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
  rewardsText: {
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
  timeSpentText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    color: '#fff',
  },
  exercisesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
  },
  exerciseText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
});

export default BMIGameCongratulationsModal;
