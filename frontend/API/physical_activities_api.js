import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// PHYSICAL ACTIVITIES

export const getPhysicalActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/physical_activity`, {
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