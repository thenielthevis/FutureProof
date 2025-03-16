import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

////////////// DAILY REWARDS
// Create a new daily reward
export const createDailyReward = async (dailyRewardData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/daily_rewards/`, dailyRewardData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating daily reward:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Read all daily rewards
export const readDailyRewards = async () => {
  try {
    const response = await axios.get(`${API_URL}/daily_rewards/`);
    return response.data;
  } catch (error) {
    console.error('Error reading daily rewards:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Update a daily reward
export const updateDailyReward = async (rewardId, dailyRewardData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${API_URL}/daily_rewards/${rewardId}`, dailyRewardData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating daily reward:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Delete a daily reward
export const deleteDailyReward = async (rewardId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/daily_rewards/${rewardId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting daily reward:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const claimDailyReward = async (token, userId, rewardId, coins = 0, xp = 0, avatar_id = null, asset_id = null) => {
  try {
    const payload = { user_id: userId, reward_id: rewardId, coins, xp, avatar_id, asset_id };
    console.log('Payload being sent to backend:', payload);
    const response = await axios.post(
      `${API_URL}/claim-daily-reward`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error claiming daily reward:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};