import React, { createContext, useState, useEffect } from 'react';
import { getUserLevelAndXP, updateUserXP } from '../API/user_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LevelUpModal from '../Components/LevelUpModal'; // Import the LevelUpModal

export const UserLevelContext = createContext();

export const UserLevelProvider = ({ children }) => {
  const [levelData, setLevelData] = useState({ level: 1, xp: 0, coins: 0 });
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  const fetchLevelData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const data = await getUserLevelAndXP(token);
      setLevelData(data);
    } catch (error) {
      console.error('Error fetching level data:', error.response ? error.response.data : error);
    }
  };

  const addXP = async (xp) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedData = await updateUserXP(token, xp);
      console.log('Updated level data:', updatedData); // Add debug statement
      if (updatedData.level > levelData.level) {
        setShowLevelUpModal(true);
      }
      setLevelData(updatedData);
    } catch (error) {
      console.error('Error updating XP:', error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchLevelData();
  }, []);

  return (
    <UserLevelContext.Provider value={{ levelData, addXP }}>
      {children}
      <LevelUpModal
        visible={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        level={levelData.level}
      />
    </UserLevelContext.Provider>
  );
};
