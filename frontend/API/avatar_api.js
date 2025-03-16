import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

////////////// AVATAR
export const getAvatar = async (avatarId) => {
  try {
    // console.log(`Fetching avatar with ID: ${avatarId}`); // Debug log
    const response = await axios.get(`${API_URL}/avatars/${avatarId}`);
    // console.log('Avatar fetched successfully:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching avatar:', error.response ? error.response.data : error); // Debug log
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get avatar icon by ID
export const getAchievementIcon = async (avatarId) => {
  try {
    const response = await axios.get(`${API_URL}/avatars/${avatarId}`);
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

    // Append text fields
    if (avatarData.name) formData.append('name', avatarData.name);
    if (avatarData.description) formData.append('description', avatarData.description);

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

    const response = await axios.put(`${API_URL}/update/avatar/${avatarId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // Let Axios handle boundaries
      },
    });

    console.log('Avatar updated:', response.data);
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
    if (!token) {
      throw new Error('Authentication required');
    }

    // Log the request for debugging
    console.log(`Attempting to delete avatar with ID: ${avatarId}`);

    const response = await fetch(`${API_URL}/delete/avatar/${avatarId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Log response status for debugging
    console.log(`Delete response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete avatar');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
    throw error;
  }
};