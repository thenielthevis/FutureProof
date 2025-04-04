import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

export const generateDailyAssessment = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/daily-assessment`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating daily reward:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Fetch the daily assessment data for the current day
export const getDailyAssessment = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/daily-assessment`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily assessment:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const readAssessments = async () => {
  try {
    const response = await axios.get(`${API_URL}/daily-assessments`);
    return response.data.assessments;
  } catch (error) {
    console.error('Error fetching assessments:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const readUserAssessments = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user-daily-assessments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.assessments;
  } catch (error) {
    console.error('Error fetching user assessments:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const checkAssessmentRequirements = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/daily-assessment/check-requirements`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking requirements:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};
