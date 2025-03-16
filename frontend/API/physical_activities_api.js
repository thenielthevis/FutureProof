import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_URL_IOS_WEB;

////////////// PHYSICAL ACTIVITIES - CRUD OPERATIONS

/**
 * Fetch all physical activities
 * @returns {Promise<Array>} List of physical activities
 */
export const getPhysicalActivities = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/physical_activities/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch physical activities");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching physical activities:", error);
    throw error;
  }
};

/**
 * Fetch a specific physical activity by ID
 * @param {string} itemId - The ID of the physical activity
 * @returns {Promise<Object>} Physical activity details
 */
export const getPhysicalActivityById = async (itemId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/physical_activities/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch physical activity");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching physical activity:", error);
    throw error;
  }
};

/**
 * Create a new physical activity
 * @param {Object} activityData - The data for the new physical activity
 * @param {File} file - The file to upload (e.g., video or image)
 * @returns {Promise<Object>} The created physical activity
 */
export const createPhysicalActivity = async (activityData, file) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append("activity_name", activityData.activity_name);
    formData.append("activity_type", activityData.activity_type);
    formData.append("description", activityData.description);

    // Handle instructions array - send as JSON string
    if (Array.isArray(activityData.instructions) && activityData.instructions.length > 0) {
      formData.append("instructions", JSON.stringify(activityData.instructions));
    }

    if (activityData.repetition) {
      formData.append("repetition", activityData.repetition.toString());
    }
    if (activityData.timer) {
      formData.append("timer", activityData.timer.toString());
    }

    // File handling
    if (file instanceof File || file instanceof Blob) {
      formData.append("file", file);
    }

    const response = await fetch(`${API_URL}/physical_activities/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create physical activity');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating physical activity:", error);
    throw error;
  }
};

/**
 * Update an existing physical activity
 * @param {string} activityId - The ID of the physical activity to update
 * @param {Object} activityData - The updated data for the physical activity
 * @param {File} file - The new file to upload (optional)
 * @returns {Promise<Object>} The updated physical activity
 */
export const updatePhysicalActivity = async (activityId, activityData, file) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    console.log('Updating activity with ID:', activityId); // Debug log

    const formData = new FormData();
    
    // Ensure we don't send _id in the form data
    const { _id, ...dataWithoutId } = activityData;
    
    // Add all fields except the file to formData
    Object.entries(dataWithoutId).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add file if it exists
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_URL}/physical_activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update activity');
    }

    const updatedActivity = await response.json();
    console.log('Successfully updated activity:', updatedActivity); // Debug log
    return updatedActivity;

  } catch (error) {
    console.error('Error in updateActivity:', error);
    throw error;
  }
};

/**
 * Delete a physical activity
 * @param {string} itemId - The ID of the physical activity to delete
 * @returns {Promise<Object>} The deleted physical activity
 */
export const deletePhysicalActivity = async (itemId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/physical_activities/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete physical activity");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting physical activity:", error);
    throw error;
  }
};