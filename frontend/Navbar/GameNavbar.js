import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, getAvatar } from '../API/api';
import Profile from '../Components/Profile';

const GameNavbar = () => {
  const navigation = useNavigation();
  const [profileVisible, setProfileVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        const user = await getUser(token);
        if (user.default_avatar) {
          const avatarResponse = await getAvatar(user.default_avatar);
          setAvatarUrl(avatarResponse.url);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchAvatar();
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
      {/* Home Icon Button */}
      <TouchableOpacity onPress={() => handleNavigation('Home')} style={styles.iconButton}>
        <FontAwesome name="home" size={24} color="#F5F5F5" />
      </TouchableOpacity>

      {/* Navbar Icons */}
      <View style={styles.iconContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <FontAwesome name="user" size={20} color="#F5F5F5" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="battery-half" size={20} color="#F5F5F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="shopping-cart" size={20} color="#F5F5F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="clipboard" size={20} color="#F5F5F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('Prediction')}>
          <FontAwesome name="line-chart" size={20} color="#F5F5F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome5 name="coins" size={20} color="#F5F5F5" />
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <Profile visible={profileVisible} onClose={handleCloseProfile} />
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
    gap: 15,
  },
  iconButton: {
    marginRight: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: '#F5F5F5',
    borderWidth: 2, 
  },
});

export default GameNavbar;