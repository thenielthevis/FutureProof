import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

// Create a new achievement
export const createAchievement = async (achievementData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log("Sending Achievement Data:", achievementData); // Debug what is being sent
    const response = await axios.post(`${API_URL}/create/achievements/`, achievementData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating achievement:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Read all achievements
export const readAchievements = async () => {
  try {
    const response = await axios.get(`${API_URL}/read/achievements/`);
    return response.data;
  } catch (error) {
    console.error('Error reading achievements:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Update an achievement
export const updateAchievement = async (achievementId, achievementData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Sending update request for achievement:', achievementId);
    console.log('Update data:', achievementData);

    const response = await fetch(`${API_URL}/achievements/${achievementId}`, { // Changed from /update/achievements/
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(achievementData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update achievement');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateAchievement:', error);
    throw error;
  }
};

// Delete an achievement
export const deleteAchievement = async (achievementId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/achievements/${achievementId}`, { // Changed from /delete/achievements/
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete achievement');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteAchievement:', error);
    throw error;
  }
};
