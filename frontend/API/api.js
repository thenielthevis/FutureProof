import axios from 'axios';

const API_URL = 'http://localhost:8000';  // Your FastAPI backend URL

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data; // Ensure this is a simple object that your frontend can handle
  } catch (error) {
    // Log the error to see its structure
    console.error('Error during registration:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };  // Provide a default error message
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