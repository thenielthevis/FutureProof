import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

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
    console.log("Updating Achievement ID:", achievementId); // Debug the ID
    console.log("Updating Achievement Data:", achievementData); // Debug the data
    const response = await axios.put(`${API_URL}/update/achievements/${achievementId}`, achievementData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating achievement:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Delete an achievement
export const deleteAchievement = async (achievementId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete/achievements/${achievementId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting achievement:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};
