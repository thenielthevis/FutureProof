import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Create a new asset
export const createAsset = async (assetData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', assetData.name);
    formData.append('description', assetData.description);
    formData.append('file', {
      uri: assetData.file.uri,
      type: assetData.file.type,
      name: assetData.file.name,
    });
    formData.append('image_file', {
      uri: assetData.imageFile.uri,
      type: assetData.imageFile.type,
      name: assetData.imageFile.name,
    });
    formData.append('price', assetData.price);
    formData.append('asset_type', assetData.assetType);
    if (assetData.glbFile) {
      formData.append('glb_file', {
        uri: assetData.glbFile.uri,
        type: assetData.glbFile.type,
        name: assetData.glbFile.name,
      });
    }

    const response = await axios.post(`${API_URL}/create/asset/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating asset:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Update an existing asset
export const updateAsset = async (assetId, assetData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', assetData.name);
    formData.append('description', assetData.description);
    if (assetData.file) {
      formData.append('file', {
        uri: assetData.file.uri,
        type: assetData.file.type,
        name: assetData.file.name,
      });
    }
    formData.append('price', assetData.price);
    formData.append('asset_type', assetData.assetType);

    const response = await axios.put(`${API_URL}/update/asset/${assetId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating asset:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Delete an asset
export const deleteAsset = async (assetId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete/asset/${assetId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting asset:', error.response ? error.response.data : error);
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