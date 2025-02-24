import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FontAwesome5 } from '@expo/vector-icons';
import { getUser } from '../API/user_api';
import { getAchievementIcon, claimAvatar,  } from '../API/avatar_api';
import { readDailyRewards } from '../API/daily_rewards_api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyRewards = ({ visible, onClose }) => {
  const [rewards, setRewards] = useState([]);
  const [avatarIcons, setAvatarIcons] = useState({});
  const [error, setError] = useState('');
  const [currentDay, setCurrentDay] = useState(1); // Assuming day 1 is the current day

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
  };

  const getCoinImage = (coins) => {
    if (coins > 50) {
      return require("../assets/CoinPack3.png");
    } else if (coins > 20) {
      return require("../assets/CoinPack2.png");
    } else {
      return require("../assets/CoinPack1.png");
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.modalHeader}>Daily Rewards</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.rewardsRow}>
              {rewards.map((reward) => (
                <TouchableOpacity
                  key={reward.day}
                  style={[
                    styles.rewardBox,
                    reward.day === currentDay && styles.currentDayBox,
                    reward.claimed && styles.claimedBox,
                  ]}
                  onPress={() => claimReward(reward.day, reward.avatar_id)}
                  disabled={reward.claimed || reward.day !== currentDay}
                >
                  {/* Reward Content */}
                  <View style={styles.rewardContent}>
                    {reward.claimed && (
                      <Icon name="check-circle" size={24} color="#fff" style={styles.checkedIcon} />
                    )}
                    <View style={styles.coinsContainer}>
                      <Image
                        source={getCoinImage(reward.coins)}
                        style={[
                          styles.coinImage,
                          !reward.avatar && styles.largeCoinImage // Larger coin image when no avatar
                        ]}
                      />
                      <Text style={[styles.coinsText, !reward.avatar && styles.largeCoinsText]}>
                        {reward.coins}
                      </Text>
                    </View>
                    {reward.avatar && avatarIcons[reward.avatar] && (
                      <Image source={{ uri: avatarIcons[reward.avatar] }} style={styles.avatarIcon} />
                    )}
                    <Text style={[styles.dayText, reward.claimed && styles.claimedText]}>
                      Day {reward.day}
                    </Text>
                  </View>

                  {/* Overlay for Unclaimed Days */}
                  {!reward.claimed && reward.day !== currentDay && (
                    <View style={styles.overlay} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.stepperContainer}>
              {rewards.map((reward, index) => (
                <View key={reward.day} style={styles.stepperItem}>
                  {index > 0 && <View style={[styles.stepperLine, styles.stepperLineLeft]} />}
                  <View style={[styles.stepperCircle, reward.claimed && styles.stepperCircleClaimed]} />
                  {index < rewards.length - 1 && <View style={[styles.stepperLine, styles.stepperLineRight]} />}
                  <Text style={[styles.stepperText, reward.claimed && styles.claimedText]}>
                    Day {reward.day}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
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
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '65%',
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
  modalHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardBox: {
    backgroundColor: '#34495e', // Default dark background for unclaimable rewards
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b4a5a',
    width: '13%',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
    height: 180,
    position: 'relative', // Needed for the overlay positioning
  },
  rewardContent: {
    zIndex: 1, // Ensure content is above the overlay
  },
  currentDayBox: {
    backgroundColor: '#4CAF50', // Green background for claimable rewards
  },
  claimedBox: {
    backgroundColor: '#2196F3', // Blue background for claimed rewards
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
    borderRadius: 10,
    zIndex: 2, // Ensure overlay is above the reward box content
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  coinImage: {
    width: 40,
    height: 40,
  },
  largeCoinImage: {
    width: 120, // Larger coin image when no avatar
    height: 120,
  },
  coinsText: {
    fontSize: 18,
    color: 'gold',
    marginLeft: 5,
  },
  largeCoinsText: {
    fontSize: 20,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  dayText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  claimedText: {
    color: '#888',
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
    width: '14.7%',
  },
  stepperCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: 'gold',
  },
  stepperCircleClaimed: {
    backgroundColor: 'gold',
  },
  stepperText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stepperLine: {
    position: 'absolute',
    width: '50%',
    height: 2,
    backgroundColor: 'gold',
    top: 6,
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
  checkedIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
});

export default DailyRewards;