import axios from 'axios';
import { Platform } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';

// Get the correct API base URL
const getApiUrl = async () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.1.143:8000';  // Android Emulator
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:8000';  // iOS Simulator
  } else {
    try {
      const ipAddress = await NetworkInfo.getIPAddress();
      return `http://${ipAddress}:8000`;  // Physical Device
    } catch (error) {
      console.error('Error getting IP address:', error);
      return 'http://localhost:8000';  // Fallback for web
    }
  }
};

// Use the dynamic API URL
let API_URL;
(async () => {
  API_URL = await getApiUrl();
})();

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Login a user
export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/login`, userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw { detail: 'No response from server' };
    } else {
      console.error('Error:', error.message);
      throw { detail: error.message };
    }
  }
};

// Get prediction for the logged-in user
export const getPrediction = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/predict`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw { detail: 'No response from server' };
    } else {
      console.error('Error:', error.message);
      throw { detail: error.message };
    }
  }
};