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
export const updateMeditationBreathingExercise = async (itemId, data, file) => {
  try {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);

    // Handle instructions array - send as JSON string
    if (Array.isArray(data.instructions) && data.instructions.length > 0) {
      formData.append("instructions", JSON.stringify(data.instructions));
    }

    if (file) {
      formData.append("file", file);
    }

    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/meditation_breathing/${itemId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update meditation exercise");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating meditation exercise:", error);
    throw error;
  }
};

// Delete a meditation/breathing exercise by ID
export const deleteMeditationBreathingExercise = async (itemId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/meditation_breathing/${itemId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete meditation exercise");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting meditation exercise:", error);
    throw error;
  }
};