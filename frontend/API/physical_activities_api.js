import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// PHYSICAL ACTIVITIES - CRUD OPERATIONS

/**
 * Fetch all physical activities
 * @returns {Promise<Array>} List of physical activities
 */
export const getPhysicalActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/physical_activities/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    const response = await fetch(`${API_URL}/physical_activities/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    const formData = new FormData();
    formData.append("activity_name", activityData.activity_name);
    formData.append("activity_type", activityData.activity_type);
    formData.append("description", activityData.description);
    formData.append("url", activityData.url);
    formData.append("public_id", activityData.public_id);
    formData.append("file", file);

    if (activityData.instructions) {
      activityData.instructions.forEach((instruction, index) => {
        formData.append(`instructions[${index}]`, instruction);
      });
    }
    if (activityData.repetition) {
      formData.append("repetition", activityData.repetition);
    }
    if (activityData.timer) {
      formData.append("timer", activityData.timer);
    }

    const response = await fetch(`${API_URL}/physical_activities/`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create physical activity");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating physical activity:", error);
    throw error;
  }
};

/**
 * Update an existing physical activity
 * @param {string} itemId - The ID of the physical activity to update
 * @param {Object} activityData - The updated data for the physical activity
 * @param {File} file - The new file to upload (optional)
 * @returns {Promise<Object>} The updated physical activity
 */
export const updatePhysicalActivity = async (itemId, activityData, file) => {
  try {
    const formData = new FormData();
    if (activityData.activity_name) {
      formData.append("activity_name", activityData.activity_name);
    }
    if (activityData.activity_type) {
      formData.append("activity_type", activityData.activity_type);
    }
    if (activityData.description) {
      formData.append("description", activityData.description);
    }
    if (activityData.url) {
      formData.append("url", activityData.url);
    }
    if (activityData.public_id) {
      formData.append("public_id", activityData.public_id);
    }
    if (file) {
      formData.append("file", file);
    }
    if (activityData.instructions) {
      activityData.instructions.forEach((instruction, index) => {
        formData.append(`instructions[${index}]`, instruction);
      });
    }
    if (activityData.repetition) {
      formData.append("repetition", activityData.repetition);
    }
    if (activityData.timer) {
      formData.append("timer", activityData.timer);
    }

    const response = await fetch(`${API_URL}/physical_activities/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update physical activity");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating physical activity:", error);
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
    const response = await fetch(`${API_URL}/physical_activities/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
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