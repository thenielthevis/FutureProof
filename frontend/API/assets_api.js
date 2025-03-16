import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

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

export const createAsset = async (formData) => {
  try {
    const token = await AsyncStorage.getItem("token");

    const response = await axios.post(`${API_URL}/create/asset/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        return data; // Ensure FormData is sent as-is
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error creating asset:",
      error.response ? error.response.data : error
    );
    throw error.response ? error.response.data : { detail: "An error occurred" };
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
    // Ensure we always return a consistent structure
    return {
      ...response.data,
      asset_ids: response.data.asset_ids || []
    };
  } catch (error) {
    console.error('Error getting owned assets:', error.response ? error.response.data : error);
    // Return a default structure instead of throwing error
    return { asset_ids: [] };
  }
};

// Fetch total number of owned assets
export const getTotalOwnedAssetsCount = async () => {
  try {
    const ownedAssets = await getOwnedAssets();
    // Check if asset_ids exists and is an array
    return ownedAssets.asset_ids.length;
  } catch (error) {
    console.error('Error fetching total owned assets count:', error);
    // Return 0 instead of throwing an error
    return 0;
  }
};

// Buy an asset
export const buyAsset = async (assetId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/buy_asset/`, { asset_id: assetId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error buying asset:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
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
export const equipAsset = async (assetType, assetId, color) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_URL}/equip_asset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        asset_type: assetType,
        asset_id: assetId,
        color: color
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error equipping asset:', error);
    throw error;
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
    return response.data.equipped_assets || {}; // Return an empty object if no equipped assets are found
  } catch (error) {
    console.error('Error getting equipped assets:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : { detail: 'An error occurred' };
  }
};

export const unequipAsset = async (assetType) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_URL}/unequip_asset/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ asset_type: assetType }),
  });

  if (!response.ok) {
    throw new Error('Failed to unequip asset');
  }

  return await response.json();
};