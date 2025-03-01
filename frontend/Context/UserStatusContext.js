import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUser, updateUserBattery, updateUserHealth, updateUserLevelAndXP } from '../API/user_api';
import { getDailyAssessment } from '../API/daily_assessment_api'; // Import the new API function
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserLevelContext } from './UserLevelContext'; // Import the new context

export const UserStatusContext = createContext();

export const UserStatusProvider = ({ children }) => {
  const [status, setStatus] = useState({ sleep: 0, battery: 0, health: 0, medication: 0 });
  const [avatarUrl, setAvatarUrl] = useState(''); // Add avatarUrl to the state
  const { levelData, addXP } = useContext(UserLevelContext); // Use the new context

  const updateBattery = async (increment) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await getUser(token);
      const newBatteryValue = Math.min(userData.battery + increment, 100); // Ensure battery does not exceed 100
      await updateUserBattery(token, newBatteryValue);
      setStatus((prevStatus) => ({
        ...prevStatus,
        battery: newBatteryValue,
      }));
    } catch (error) {
      console.error('Error updating battery:', error.response ? error.response.data : error);
    }
  };

  const updateHealth = async (updatedPredictions) => {
    try {
      const totalReduction = updatedPredictions.reduce((acc, pred) => acc + (pred.old_percentage - pred.new_percentage), 0);
      const averageReduction = totalReduction / updatedPredictions.length;
      let healthValue = 0;
      // console.log('Average reduction:', averageReduction);

      if (averageReduction >= 1 && averageReduction <= 10) {
        healthValue = 25;
      } else if (averageReduction >= 11 && averageReduction <= 20) {
        healthValue = 50;
      } else if (averageReduction >=  21 && averageReduction <= 30) {
        healthValue = 75;
      } else if (averageReduction >= 30) {
        healthValue = 100;
      }

      const token = await AsyncStorage.getItem('token');
      await updateUserHealth(token, healthValue); // Update the user's health field in the database
      setStatus((prevStatus) => ({
        ...prevStatus,
        health: healthValue,
      }));
    } catch (error) {
      console.error('Error updating health:', error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        console.log('Fetching user data with token:', token);
        const userData = await getUser(token);
        console.log('User data fetched:', userData);
        if (userData) {
          setStatus((prevStatus) => ({
            ...prevStatus,
            sleep: userData.sleep || 0,
            health: userData.health || 0,
            medication: userData.medication || 0,
            battery: userData.battery || 0,
          }));
          setAvatarUrl(userData.default_avatar_url || ''); // Set the avatar URL
          await updateUserLevelAndXP(token); // Update the user's level and XP
        }
      } catch (error) {
        console.error('Error fetching user data:', error.response ? error.response.data : error);
      }
    };

    const fetchDailyAssessment = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const dailyAssessment = await getDailyAssessment(token);
        if (dailyAssessment && dailyAssessment.updated_predictions) {
          updateHealth(dailyAssessment.updated_predictions);
        } else {
          setStatus((prevStatus) => ({
            ...prevStatus,
            health: 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching daily assessment:', error.response ? error.response.data : error);
        setStatus((prevStatus) => ({
          ...prevStatus,
          health: 0,
        }));
      }
    };

    fetchUserData();
    fetchDailyAssessment();
  }, []);

  return (
    <UserStatusContext.Provider value={{ status, setStatus, updateBattery, updateHealth, avatarUrl, setAvatarUrl, levelData, addXP }}>
      {children}
    </UserStatusContext.Provider>
  );
};
