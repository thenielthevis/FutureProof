import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

export const createTaskCompletion = async (taskCompletionData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');

    if (userId) {
      taskCompletionData.user_id = userId;
    }
    console.log('Creating task completion with data:', taskCompletionData);
    const response = await axios.post(`${API_URL}/task-completion`, taskCompletionData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Task completion created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating task completion:', error.response ? error.response.data : error);
    throw error;
  }
};

export const getTaskCompletionsByUser = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      throw new Error('No user ID found');
    }
    console.log('Fetching task completions for user ID:', userId);
    const response = await axios.get(`${API_URL}/task-completion/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Task completions response:', response.data); // Log the response
    return response.data;
  } catch (error) {
    console.error('Error fetching task completions:', error.response ? error.response.data : error);
    throw error;
  }
};

export const getTodayTaskCompletionsByUser = async () => {
  try {
    const taskCompletions = await getTaskCompletionsByUser();
    const today = new Date().toISOString().split('T')[0];
    console.log('Filtering task completions for today:', today);
    const todayTasks = taskCompletions.filter(task => task.date_completed.split('T')[0] === today);
    console.log('Today\'s task completions:', todayTasks);
    return todayTasks;
  } catch (error) {
    console.error('Error fetching today\'s task completions:', error.response ? error.response.data : error);
    throw error;
  }
};

export const getAllTaskCompletions = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/task-completion`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task completion:', error);
    throw error;
  }
};

export const getTotalTaskCompletionsByUser = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      throw new Error('No user ID found');
    }
    console.log('Fetching total task completions for user ID:', userId);
    const response = await axios.get(`${API_URL}/task-completion/user/${userId}/total`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Total task completions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching total task completions:', error.response ? error.response.data : error);
    throw error;
  }
};

export const getTotalTimeSpentByUser = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      throw new Error('No user ID found');
    }
    const response = await axios.get(`${API_URL}/task-completion/user/${userId}/total-time`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching total time spent by user:', error.response ? error.response.data : error);
    throw error;
  }
};
