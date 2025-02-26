import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

export const createTaskCompletion = async (taskCompletionData) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      taskCompletionData.user_id = userId;
    }
    const response = await axios.post(`${API_URL}/task-completion`, taskCompletionData);
    return response.data;
  } catch (error) {
    console.error('Error creating task completion:', error);
    throw error;
  }
};
