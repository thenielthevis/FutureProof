import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode'; // Fix import statement

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

// Fetch all quotes
export const readQuotes = async () => { // Fix function name
  try {
    const response = await axios.get(`${API_URL}/quotes/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quotes:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};
  
// Create a new quote
export const createQuote = async (quoteData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Sending request to create quote with data:', quoteData); // Log request data

    // Convert quoteData to form-data
    const formData = new FormData();
    formData.append('text', quoteData.text);
    if (quoteData.author) {
      formData.append('author', quoteData.author);
    }

    const response = await axios.post(`${API_URL}/quotes/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Quote created successfully:', response.data); // Log response data
    return response.data;
  } catch (error) {
    console.error('Error creating quote:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};
  
// Update a quote
export const updateQuote = async (quoteId, quoteData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Sending request to update quote with data:', quoteData); // Log request data

    // Convert quoteData to form-data
    const formData = new FormData();
    if (quoteData.text) {
      formData.append('text', quoteData.text);
    }
    if (quoteData.author) {
      formData.append('author', quoteData.author);
    }

    // Check if formData is empty
    if (!formData.has('text') && !formData.has('author')) {
      throw new Error('No fields to update');
    }

    const response = await axios.put(`${API_URL}/quotes/${quoteId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Quote updated successfully:', response.data); // Log response data
    return response.data;
  } catch (error) {
    console.error('Error updating quote:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};
  
// Delete a quote
export const deleteQuote = async (quoteId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/quotes/${quoteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting quote:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};