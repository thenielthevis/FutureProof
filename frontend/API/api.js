import axios from 'axios';

const API_URL = 'http://192.168.1.21:8000';  // Your FastAPI backend URL

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Login a user
export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/login`, userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      throw error.response.data;
    } else if (error.request) {
      // No response received
      console.error('No response received:', error.request);
      throw { detail: 'No response from server' };
    } else {
      // Other errors
      console.error('Error:', error.message);
      throw { detail: error.message };
    }
  }
};