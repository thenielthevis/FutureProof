import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FontAwesome5 } from '@expo/vector-icons';
import { getAchievementIcon, claimAvatar, getUser, readDailyRewards } from '../API/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyRewards = ({ visible, onClose }) => {
  const [rewards, setRewards] = useState([]);
  const [avatarIcons, setAvatarIcons] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const rewardsData = await readDailyRewards();
        setRewards(rewardsData);
      } catch (error) {
        console.error('Error fetching daily rewards:', error);
        setError('Error fetching daily rewards');
      }
    };

    fetchRewards();
  }, []);

  useEffect(() => {
    const fetchAvatarIcons = async () => {
      try {
        const icons = {};
        for (const reward of rewards) {
          if (reward.avatar) {
            const icon = await getAchievementIcon(reward.avatar);
            icons[reward.avatar] = icon.url;
          }
        }
        setAvatarIcons(icons);
      } catch (error) {
        console.error('Error fetching avatar icons:', error);
        setError('Error fetching avatar icons');
      }
    };

    fetchAvatarIcons();
  }, [rewards]);

  useEffect(() => {
    const fetchUserAvatars = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        const claimedAvatars = userData.avatars.map(avatar => avatar.toString());
        setRewards(rewards.map(reward => ({
          ...reward,
          claimed: claimedAvatars.includes(reward.avatar_id)
        })));
      } catch (error) {
        console.error('Error fetching user avatars:', error);
        setError('Error fetching user avatars');
      }
    };

    if (visible) {
      fetchUserAvatars();
    }
  }, [visible]);

  const claimReward = async (day, avatarId) => {
    setRewards(rewards.map(reward => reward.day === day ? { ...reward, claimed: true } : reward));
    if (avatarId) {
      try {
        await claimAvatar(avatarId);
      } catch (error) {
        console.error('Error claiming avatar:', error);
        setError('Error claiming avatar');
      }
    }
    // Add logic to update user's coins and achievements in the backend
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Daily Rewards</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.rewardsRow}>
              {rewards.map((reward) => (
                <View key={reward.day} style={styles.rewardBox}>
                  <View style={styles.coinsContainer}>
                    <FontAwesome5 name="coins" size={20} color="gold" />
                    <Text style={styles.coinsText}>{reward.coins}</Text>
                  </View>
                  {reward.avatar && avatarIcons[reward.avatar] && (
                    <Image source={{ uri: avatarIcons[reward.avatar] }} style={styles.avatarIcon} />
                  )}
                  <TouchableOpacity
                    style={[styles.claimButton, reward.claimed && styles.claimedButton]}
                    onPress={() => claimReward(reward.day, reward.avatar_id)}
                    disabled={reward.claimed}
                  >
                    <Text style={styles.buttonText}>{reward.claimed ? 'Claimed' : 'Claim'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.stepperContainer}>
              {rewards.map((reward, index) => (
                <View key={reward.day} style={styles.stepperItem}>
                  {/* Line before stepper circle */}
                  {index > 0 && <View style={[styles.stepperLine, styles.stepperLineLeft]} />}

                  {/* Stepper Circle */}
                  <View style={[styles.stepperCircle, reward.claimed && styles.stepperCircleClaimed]} />

                  {/* Line after stepper circle */}
                  {index < rewards.length - 1 && <View style={[styles.stepperLine, styles.stepperLineRight]} />}

                  {/* Day Label */}
                  <Text style={styles.stepperText}>Day {reward.day}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={20} color="#fff" />
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardBox: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '13%', // Adjust width to fit 7 columns
    alignItems: 'center',
    marginBottom: 10,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  coinsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  avatarIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  claimButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  claimedButton: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  stepperItem: {
    alignItems: 'center',
    position: 'relative',
    width: '14.7%', // Keeps alignment with rewards
  },
  stepperCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: 'gold',
  },
  stepperCircleClaimed: {
    backgroundColor: 'gold',
  },
  stepperText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stepperLine: {
    position: 'absolute',
    width: '50%',
    height: 2,
    backgroundColor: 'gold',
    top: 6, // Centers with circles
  },
  stepperLineLeft: {
    left: 0,
  },
  stepperLineRight: {
    right: 0,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default DailyRewards;