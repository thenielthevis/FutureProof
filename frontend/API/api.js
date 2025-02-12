import axios from 'axios';
import { Platform } from 'react-native';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.1.4:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

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

// Get user information
export const getUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

// Update user information
export const updateUser = async (token, userData) => {
  try {
    const response = await axios.put(`${API_URL}/user`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

export const getAvatar = async (avatarId) => {
  try {
    console.log(`Fetching avatar with ID: ${avatarId}`); // Debug log
    const response = await axios.get(`${API_URL}/avatars/${avatarId}`);
    console.log('Avatar fetched successfully:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching avatar:', error.response ? error.response.data : error); // Debug log
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};