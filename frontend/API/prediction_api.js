import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// PREDICTION

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

// Get the most commonly predicted disease
export const getMostPredictedDisease = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/most_predicted_disease`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting most predicted disease:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get the top 5 most commonly predicted diseases
export const getTopPredictedDiseases = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/top_predicted_diseases`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting top predicted diseases:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};