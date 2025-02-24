import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import ConfettiCannon from 'react-native-confetti-cannon';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const DailyRewardsClaimedModal = ({ visible, onClose, claimedReward, avatarIcons }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
    }
  }, [visible]);

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.congratulationsText}>Congratulations!</Text>
            <Text style={styles.successText}>You've successfully claimed your reward.</Text>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              <View style={styles.rewardItem}>
                {claimedReward && claimedReward.avatar && avatarIcons[claimedReward.avatar] && (
                  <Image source={{ uri: avatarIcons[claimedReward.avatar] }} style={styles.avatarIcon} />
                )}
                {claimedReward && claimedReward.coins && (
                  <Text style={styles.rewardText}> {claimedReward.coins} <FontAwesome5 name="coins" size={20} color="gold" /></Text>
                )}
                {claimedReward && claimedReward.xp && (
                  <Text style={styles.rewardText}>XP: {claimedReward.xp}</Text>
                )}
                {claimedReward && claimedReward.asset_id && (
                  <Text style={styles.rewardText}>Asset ID: {claimedReward.asset_id}</Text>
                )}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>X</Text>
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
    width: '80%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#c0392b',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  rewardItem: {
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
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

export default DailyRewardsClaimedModal;
