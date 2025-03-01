import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// NUTRITIONAL TRACKING

export const getNutritionalTrackingQuestions = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/nutritional_tracking/questions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Correctly return the response data
  } catch (error) {
    console.error("Error fetching nutritional tracking questions:", error);
    throw error;
  }
};

export const submitNutritionalTrackingResponses = async ({ question_index, answer }) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/nutritional_tracking/responses`, { question_index, answer }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Correctly return the response data
  } catch (error) {
    console.error("Error submitting nutritional tracking responses:", error);
    throw error;
  }
};

export const createNutritionalTracking = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/create/nutritional_tracking/`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Correctly return the response data
  } catch (error) {
    console.error("Error creating nutritional tracking:", error);
    throw error;
  }
};

export const getPastNutritionalTrackingResponses = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/nutritional_tracking/past_responses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Correctly return the response data
  } catch (error) {
    console.error("Error fetching past nutritional tracking responses:", error);
    throw error;
  }
};