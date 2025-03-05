import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// MEDITATION BREATHING CRUD OPERATIONS

// Get all meditation/breathing exercises
export const getMeditationBreathingExercises = async () => {
  try {
    const response = await fetch(`${API_URL}/meditation_breathing/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meditation exercises");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching meditation exercises:", error);
    throw error;
  }
};

// Get a single meditation/breathing exercise by ID
export const getMeditationBreathingExerciseById = async (itemId) => {
  try {
    const response = await fetch(`${API_URL}/meditation_breathing/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meditation exercise");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching meditation exercise:", error);
    throw error;
  }
};

// Create a new meditation/breathing exercise
export const createMeditationBreathingExercise = async (data, file) => {
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);

    // Handle instructions array - send as JSON string
    if (Array.isArray(data.instructions) && data.instructions.length > 0) {
      formData.append("instructions", JSON.stringify(data.instructions));
    }

    if (file instanceof File || file instanceof Blob) {
      formData.append("file", file);
    }

    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/meditation_breathing/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create meditation exercise");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating meditation exercise:", error);
    throw error;
  }
};

// Update a meditation/breathing exercise by ID
export const updateMeditationBreathingExercise = async (meditationId, meditationData, file) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    console.log('Updating meditation with ID:', meditationId); // Debug log

    const formData = new FormData();
    
    // Ensure we don't send _id in the form data
    const { _id, ...dataWithoutId } = meditationData;
    
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

    if (file) formData.append('file', file);

    const response = await fetch(`${API_URL}/meditation_breathing/${meditationId}`, { // Updated endpoint
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update meditation');
    }

    const updatedMeditation = await response.json();
    console.log('Successfully updated meditation:', updatedMeditation); // Debug log
    return updatedMeditation;

  } catch (error) {
    console.error('Error in updateMeditation:', error);
    throw error;
  }
};

// Delete a meditation/breathing exercise by ID
export const deleteMeditationBreathingExercise = async (meditationId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_URL}/meditation_breathing/${meditationId}`, { // Updated endpoint
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete meditation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteMeditation:', error);
    throw error;
  }
};