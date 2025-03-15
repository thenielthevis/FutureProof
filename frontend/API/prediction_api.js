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
    // First try to get the latest prediction
    const latestPrediction = await getLatestPrediction(token);
    if (latestPrediction) {
      return latestPrediction;
    }

    // If no prediction exists, create a new one
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

// Get the latest prediction for the user
export const getLatestPrediction = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/latest_prediction`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // If no prediction exists, create a new one
      return await getPrediction(token);
    }
    console.error('Error getting latest prediction:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get all predictions for the user
export const getUserPredictions = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/user_predictions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user predictions:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Add new function to force create new prediction
export const createNewPrediction = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/force_predict`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating new prediction:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};