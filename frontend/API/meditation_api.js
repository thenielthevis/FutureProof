import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// MEDITATION BREATHING

export const getMeditationBreathingExercises = async () => {
  try {
    const response = await fetch(`${API_URL}/meditation_breathing`, {
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