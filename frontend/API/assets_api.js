import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

// Fetch all assets
export const readAssets = async () => {
  try {
    const response = await axios.get(`${API_URL}/assets/`);
    return response.data;
  } catch (error) {
    console.error('Error reading assets:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Fetch owned assets for a user
export const readOwnedAssets = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/owned_assets/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error reading owned assets:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Buy an asset
export const buyAsset = async (assetUrl) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:8000/buy_asset',
      { asset_url: assetUrl },  // Send asset_url in the request body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error buying asset:', error.response.data);
    throw error;
  }
};

export const purchaseItem = async (assetId) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post('/purchase', { asset_id: assetId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const readPurchasedItems = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get('/purchased-items', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;

  
};