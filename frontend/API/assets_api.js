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

// Add an owned asset
export const addOwnedAsset = async (assetIds) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const asset_ids = Array.isArray(assetIds) ? assetIds : [assetIds];
    console.log('Sending asset IDs to addOwnedAsset:', asset_ids); // Log asset IDs
    const response = await axios.post(`${API_URL}/owned_assets/`, { asset_ids }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Response from addOwnedAsset:', response.data); // Log response
    return response.data;
  } catch (error) {
    console.error('Error adding owned asset:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get owned assets
export const getOwnedAssets = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Fetching owned assets for user'); // Log fetching action
    const response = await axios.get(`${API_URL}/owned_assets/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Response from getOwnedAssets:', response.data); // Log response
    return response.data;
  } catch (error) {
    console.error('Error getting owned assets:', error.response ? error.response.data : error);
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

// Equip an asset
export const equipAsset = async (assetType, assetId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Sending asset type and ID to equipAsset:', assetType, assetId); // Log asset type and ID
    const response = await axios.post(`${API_URL}/equip_asset/`, { asset_type: assetType, asset_id: assetId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Response from equipAsset:', response.data); // Log response
    return response.data;
  } catch (error) {
    console.error('Error equipping asset:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

// Get equipped assets
export const getEquippedAssets = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Fetching equipped assets for user'); // Log fetching action
    const response = await axios.get(`${API_URL}/equipped_assets/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Response from getEquippedAssets:', response.data); // Log response
    return response.data.equipped_assets;
  } catch (error) {
    console.error('Error getting equipped assets:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};