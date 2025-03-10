import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// USERS
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
    const { access_token, role } = response.data;
    const decodedToken = jwtDecode(access_token);  // Correct function call
    console.log('Decoded token:', decodedToken);  // Log the decoded token for debugging

    const userId = decodedToken.user_id;  // Retrieve the user ID from the token
    console.log('User ID:', userId);  // Log the user ID for debugging

    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('userId', userId);
    await AsyncStorage.setItem('role', role);

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

export const getCurrentUserId = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.user_id;
  } catch (error) {
    console.error('Error fetching current user ID:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const getTotalUsers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/total-users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.total_users;
  } catch (error) {
    console.error('Error getting total users:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Update user information
export const updateUserSleep = async (token, userData) => {
  try {
    const response = await axios.put(`${API_URL}/user/sleep-toggle`, userData, {
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

// Update user information
export const updateUserMedication = async (token, userData) => {
  try {
    const response = await axios.put(`${API_URL}/user/increase-medication`, userData, {
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

export const updateUserBattery = async (token, battery) => {
  try {
    const payload = { battery: Math.floor(battery) }; // Convert battery to integer
    console.log('Updating user battery with payload:', payload);
    const response = await axios.put(`${API_URL}/user/battery`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user battery:', error.response ? error.response.data : error);
    throw error;
  }
};

export const updateUserHealth = async (token, health) => {
  try {
    const payload = { health: Math.floor(health) };
    // console.log('Updating user health with payload:', payload);
    const response = await axios.put(`${API_URL}/user/health`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user health:', error.response ? error.response.data : error);
    throw error;
  }
};

export const getUserRegistrations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user-registrations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user registrations:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get user registrations categorized by weekday and month
export const getUserRegistrationsByDate = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user-registrations-by-date`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user registrations by date:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const getUserLevelAndXP = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user/level-xp`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user level and XP:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const updateUserXP = async (token, xp) => {
  try {
    const response = await axios.put(`${API_URL}/user/xp`, { xp }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user XP:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const updateUserLevelAndXP = async (token) => {
  try {
    const response = await axios.put(`${API_URL}/user/update-level-xp`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user level and XP:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Fetch user avatars
export const getUserAvatars = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user/avatars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user avatars:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Fetch total number of avatars
export const getTotalAvatarsCount = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/user/avatars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.length;
  } catch (error) {
    console.error('Error fetching total avatars count:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Fetch total amount of coins
export const getTotalCoins = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.coins;
  } catch (error) {
    console.error('Error fetching total coins:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const getAllUsers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/all-users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting users:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const disableUser = async (token, userId) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}/disable`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error disabling user:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const enableUser = async (token, userId) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}/enable`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error enabling user:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const disableInactiveUsers = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/users/disable-inactive`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error disabling inactive users:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const deleteDisabledUsers = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/users/delete-disabled`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting disabled users:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const verifyReactivationOTP = async (otpData) => {
  try {
    const response = await axios.post(`${API_URL}/verify-reactivation-otp`, otpData);
    return response.data;
  } catch (error) {
    console.error('Error verifying reactivation OTP:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const checkAccountStatus = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/check-account-status`, { email });
    return response.data.disabled;
  } catch (error) {
    console.error('Error checking account status:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Send OTP for reactivation
export const sendReactivationOTP = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/send-reactivation-otp`, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending reactivation OTP:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get user registrations by day for the current month
export const getDailyUserRegistrations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user-daily-registrations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting daily user registrations:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};