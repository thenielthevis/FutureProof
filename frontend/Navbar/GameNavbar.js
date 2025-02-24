import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
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
  const [status, setStatus] = useState({
    sleep: 50, // 50% sleep
    battery: 25, // 25% battery
    health: 80, // 80% health
    medication: 20,
  });
  
  // Define color & fill logic dynamically
  const getFillColor = (value) => {
    if (value <= 25) return "rgba(255, 0, 0, 0.7)"; // Red
    if (value <= 50) return "rgba(255, 165, 0, 0.7)"; // Orange
    return "rgba(0, 255, 0, 0.7)"; // Green
  };
  
  const statusData = [
    {
      name: "Sleep",
      icon: "moon-o",
      value: status.sleep,
      bgColor: "rgba(255, 255, 255, 0.2)",
      fillColor: getFillColor(status.sleep),
    },
    {
      name: "Battery",
      icon: "bolt",
      value: status.battery,
      bgColor: "rgba(255, 255, 255, 0.2)",
      fillColor: getFillColor(status.battery),
    },
    {
      name: "Health",
      icon: "heartbeat",
      value: status.health,
      bgColor: "rgba(255, 255, 255, 0.2)",
      fillColor: getFillColor(status.health),
    },
    {
      name: "Medication",
      icon: "medkit",
      value: status.medication,
      bgColor: "rgba(255, 255, 255, 0.2)",
      fillColor: getFillColor(status.medication),
    },
  ];  

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
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('Home')}>
            <FontAwesome name="home" size={25} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        {/* Center Status Icons */}
        <View style={styles.statusContainer}>
          {statusData.map((item, index) => (
            <View key={index} style={[styles.statusBox, { backgroundColor: item.bgColor }]}>
              {/* Filler Box (Dynamic Height) */}
              <View style={[styles.fillBox, { height: `${item.value}%`, backgroundColor: item.fillColor }]} />
              
              {/* Icon & Text */}
              <FontAwesome name={item.icon} size={20} color="#FFF" style={styles.statusIcon} />
            </View>
          ))}
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
    backgroundColor: 'rgb(3, 35, 19)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center horizontally
    alignItems: 'center',
    gap: 15,
    transform: [{ translateX: 115 }],
  },
  statusBox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
  },
  fillBox: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  statusIcon: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 5,
  },
});

export default GameNavbar;
