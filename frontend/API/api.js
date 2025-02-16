import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.1.143:8000'  // Android Emulator
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
    console.error('Error during login:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
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
    console.error('Error getting prediction:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
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
    console.error('Error getting user information:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
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
    console.error('Error updating user information:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
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

// Get avatar icon by name
export const getAchievementIcon = async (avatarName) => {
  try {
    const encodedAvatarName = encodeURIComponent(avatarName); // URL-encode the avatar name
    const response = await axios.get(`${API_URL}/avatars/icon/${encodedAvatarName}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching avatar icon:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Claim an avatar by ID
export const claimAvatar = async (avatarId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/avatars/claim`,
      { avatar_id: avatarId }, // Ensure the avatar_id is included in the request body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error claiming avatar:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Create a new avatar
export const createAvatar = async (avatarData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();

    // Append text fields
    formData.append('name', avatarData.name);
    formData.append('description', avatarData.description);

    // Handle file upload (Check if file exists)
    if (avatarData.file) {
      console.log('File before upload:', avatarData.file); // Debugging

      let fileToUpload = avatarData.file;

      if (Platform.OS === 'web') {
        // Convert to Blob for web uploads
        const response = await fetch(avatarData.file.uri);
        const blob = await response.blob();
        fileToUpload = {
          uri: avatarData.file.uri,
          type: avatarData.file.type,
          name: avatarData.file.name,
          blob, // Append the Blob
        };
      }

      // Append file to FormData
      formData.append('file', fileToUpload.blob || {
        uri: fileToUpload.uri,
        type: fileToUpload.type,
        name: fileToUpload.name,
      });
    }

    console.log('FormData before sending:', formData); // Debugging

    const response = await axios.post(`${API_URL}/create/avatar/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // Let Axios handle boundaries
      },
    });

    console.log('Avatar created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating avatar:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Read all avatars
export const readAvatars = async () => {
  try {
    const response = await axios.get(`${API_URL}/avatars/`);
    return response.data;
  } catch (error) {
    console.error('Error reading avatars:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Update an avatar
export const updateAvatar = async (avatarId, avatarData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    if (avatarData.name) formData.append('name', avatarData.name);
    if (avatarData.description) formData.append('description', avatarData.description);
    if (avatarData.file) {
      formData.append('file', {
        uri: avatarData.file.uri,
        type: avatarData.file.type,
        name: avatarData.file.name,
      });
    }
    const response = await axios.put(`${API_URL}/update/avatar/${avatarId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating avatar:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Delete an avatar
export const deleteAvatar = async (avatarId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete/avatar/${avatarId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting avatar:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

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