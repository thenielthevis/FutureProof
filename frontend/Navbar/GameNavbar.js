import React, { useContext, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { UserStatusContext } from '../Context/UserStatusContext';
import { UserLevelContext } from '../Context/UserLevelContext'; // Import the new context
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, updateUserSleep, updateUserMedication, updateUserHealth } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import Profile from '../Components/Profile';
import DailyRewards from '../Components/DailyRewards'; // Import the DailyRewards component
import TaskModal from '../Components/TaskModal'; // Import the TaskModal component

const GameNavbar = () => {
  const navigation = useNavigation();
  const { status, setStatus } = useContext(UserStatusContext);
  const { levelData } = useContext(UserLevelContext); // Use the new context
  const [profileVisible, setProfileVisible] = useState(false);
  const [rewardsVisible, setRewardsVisible] = useState(false); // State for Daily Rewards modal
  const [taskModalVisible, setTaskModalVisible] = useState(false); // State for Task Modal
  const [avatarUrl, setAvatarUrl] = useState('');
  const [user, setUser] = useState({ coins: 0, level: 1, xp: 0 });

  const [sleepAnim] = useState(new Animated.Value(status.sleep));
  const [batteryAnim] = useState(new Animated.Value(status.battery));
  const [healthAnim] = useState(new Animated.Value(status.health));
  const [medicationAnim] = useState(new Animated.Value(status.medication));

  // Define color & fill logic dynamically
  const getFillColor = (value) => {
    if (value <= 25) return "rgba(255, 0, 0, 0.7)"; // Red
    if (value <= 50) return "rgba(255, 165, 0, 0.7)"; // Orange
    return "rgba(0, 255, 0, 0.7)"; // Green
  };

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
  
// Create animated color transition
const animatedFillColor = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 25, 50, 100],
    outputRange: [
      "rgba(255, 0, 0, 0.7)",   // Red (0-25)
      "rgba(255, 165, 0, 0.7)", // Orange (26-50)
      "rgba(0, 255, 0, 0.7)",   // Green (51-100)
      "rgba(0, 255, 0, 0.7)",   // Green (100)
    ],
  });
};

// Status data with animated color
const statusData = [
  {
    name: "Sleep",
    icon: "moon-o",
    value: sleepAnim,
    bgColor: "rgba(255, 255, 255, 0.2)",
    fillColor: animatedFillColor(sleepAnim), // Corrected
  },
  {
    name: "Battery",
    icon: "bolt",
    value: batteryAnim,
    bgColor: "rgba(255, 255, 255, 0.2)",
    fillColor: animatedFillColor(batteryAnim), // Corrected
  },
  {
    name: "Health",
    icon: "heartbeat",
    value: healthAnim,
    bgColor: "rgba(255, 255, 255, 0.2)",
    fillColor: animatedFillColor(healthAnim), // Corrected
  },
  {
    name: "Medication",
    icon: "medkit",
    icon: "medkit",
    value: medicationAnim,
    bgColor: "rgba(255, 255, 255, 0.2)",
    fillColor: animatedFillColor(medicationAnim), // Corrected
  },
];

// Fetch user data
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

      if (userData) {
        setStatus({
          sleep: userData.sleep || 0,
          battery: userData.battery || 0,
          health: userData.health || 0,
          medication: userData.medication || 0,
        });
        setMedicationLevel(userData.medication || 0); // Set medication level
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
}, []);
useEffect(() => {
  Animated.timing(sleepAnim, {
    toValue: status.sleep,
    duration: 500,
    useNativeDriver: false,
  }).start();

  Animated.timing(batteryAnim, {
    toValue: status.battery,
    duration: 500,
    useNativeDriver: false,
  }).start();

  Animated.timing(healthAnim, {
    toValue: status.health,
    duration: 500,
    useNativeDriver: false,
  }).start();

  Animated.timing(medicationAnim, {
    toValue: status.medication,
    duration: 500,
    useNativeDriver: false,
  }).start();
}, [status]);

// Sleep increases every 60 seconds
useEffect(() => {
  let interval;
  if (status.sleep < 100) {
    interval = setInterval(() => {
      setStatus((prevStatus) => {
        const newSleep = Math.min(prevStatus.sleep + 1, 100);
        Animated.timing(sleepAnim, {
          toValue: newSleep,
          duration: 500,
          useNativeDriver: false,
        }).start();
        return { ...prevStatus, sleep: newSleep };
      });
    }, 60000); // Increment sleep every 60 seconds
  }
  return () => clearInterval(interval);
}, [status.sleep]);


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
              <Animated.View style={[styles.fillBox, { height: item.value.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }), backgroundColor: item.fillColor }]} />
              
              {/* Icon & Text */}
              <FontAwesome name={item.icon} size={20} color="#FFF" style={styles.statusIcon} />
            </View>
          ))}
        </View>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="coins" size={20} color="gold" />
            <Text style={styles.userInfoText}>{levelData.coins}</Text> {/* Use levelData */}
          </View>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="star" size={20} color="#f1c40f" />
            <Text style={styles.userInfoText}>{levelData.xp}</Text> {/* Use levelData */}
          </View>
          <View style={styles.iconWithText}>
            <FontAwesome5 name="level-up-alt" size={20} color="#3498db" />
            <Text style={styles.userInfoText}>{levelData.level}</Text> {/* Use levelData */}
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