import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, getAvatar } from '../API/api';
import Profile from '../Components/Profile';
import DailyRewards from '../Components/DailyRewards'; // Import the DailyRewards component
import TaskModal from '../Components/TaskModal'; // Import the TaskModal component

const GameNavbar = () => {
  const navigation = useNavigation();
  const [profileVisible, setProfileVisible] = useState(false);
  const [rewardsVisible, setRewardsVisible] = useState(false); // State for Daily Rewards modal
  const [taskModalVisible, setTaskModalVisible] = useState(false); // State for Task Modal
  const [avatarUrl, setAvatarUrl] = useState('');
  const [user, setUser] = useState({ coins: 0, level: 1, xp: 0 });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        const userData = await getUser(token);
        setUser(userData);
        if (userData.default_avatar) {
          const avatarResponse = await getAvatar(userData.default_avatar);
          setAvatarUrl(avatarResponse.url);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleNavigation = (route) => {
    if (route && typeof route === 'string' && route.trim()) {
      navigation.navigate(route);
    } else {
      console.error('Invalid route:', route);
    }
  };

  const handleProfilePress = () => {
    setProfileVisible(true);
  };

  const handleCloseProfile = () => {
    setProfileVisible(false);
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.iconContainer}>
        {/* Left Icons */}
        <View style={styles.leftIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('Prediction')}>
            <FontAwesome name="line-chart" size={20} color="#F5F5F5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setRewardsVisible(true)}>
            <FontAwesome name="clipboard" size={20} color="#F5F5F5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setTaskModalVisible(true)}>
            <FontAwesome name="map" size={20} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        {/* Center Icon */}
        <View style={styles.centerIcon}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="battery-half" size={20} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="coins" size={20} color="gold" />
            <Text style={styles.userInfoText}>{user.coins}</Text>
          </View>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="star" size={20} color="#f1c40f" />
            <Text style={styles.userInfoText}>{user.xp}</Text>
          </View>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="level-up-alt" size={20} color="#3498db" />
            <Text style={styles.userInfoText}>{user.level}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <FontAwesome name="user" size={20} color="#F5F5F5" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Modal */}
      <Profile visible={profileVisible} onClose={handleCloseProfile} />

      {/* Daily Rewards Modal */}
      <DailyRewards visible={rewardsVisible} onClose={() => setRewardsVisible(false)} />

      {/* Task Modal */}
      <TaskModal visible={taskModalVisible} onClose={() => setTaskModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#1A3B32',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  centerIcon: {
    alignItems: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    marginRight: 10,
    alignItems: 'center',
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: '#F5F5F5',
    borderWidth: 2,
  },
  userInfoText: {
    color: '#F5F5F5',
    fontSize: 12,
    marginLeft: 10,
  },
});

export default GameNavbar;
