import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, getAvatar } from '../API/api';
import Toast from 'react-native-toast-message';

const Profile = ({ visible, onClose }) => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const response = await getUser(token);
        console.log('User fetched successfully:', response); // Debug log
        setUser(response);
        let avatarResponse;
        if (response.default_avatar) {
          avatarResponse = await getAvatar(response.default_avatar); // Fetch avatar URL
          console.log('Avatar fetched successfully:', avatarResponse); // Debug log
          setAvatarUrl(avatarResponse.url); // Set avatar URL
        }
      } catch (err) {
        console.error('Error fetching user or avatar:', err); // Debug log
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchUser();
    }
  }, [visible]);

  if (loading) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const calculateBMI = (height, weight) => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
  };

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi < 24.9) return 'Normal weight';
    if (bmi >= 25 && bmi < 29.9) return 'Overweight';
    return 'obese';
  };

  const bmi = calculateBMI(parseFloat(user.height), parseFloat(user.weight));
  const bmiStatus = getBMIStatus(bmi);

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalHeader}>Profile</Text>
            <View style={styles.gridContainer}>
              {/* Box 1: Username, Age, Gender, Email */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Personal Information</Text>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text>No Avatar</Text>
                )}
                <Text style={styles.infoText}>{user.username}</Text>
                <Text style={styles.infoText}>{user.age}</Text>
                <Text style={styles.infoText}>{user.gender}</Text>
                <Text style={styles.infoText}>{user.email}</Text>
              </View>

              {/* Box 2: Daily Habits/Lifestyle */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Daily Habits/Lifestyle</Text>
                <Text style={styles.infoText}>{user.lifestyle}</Text>
              </View>

              {/* Box 3: Calories/Food Intake */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Calories/Food Intake</Text>
                <Text style={styles.infoText}>{user.food_intake}</Text>
              </View>

              {/* Box 4: Body Mass Index */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Body Mass Index</Text>
                <Text style={styles.infoText}>Height: {user.height} cm</Text>
                <Text style={styles.infoText}>Weight: {user.weight} kg</Text>
                <Text style={styles.bmiResult}>BMI: {bmi}</Text>
                <Text style={styles.bmiStatus}>You are currently {bmiStatus}</Text>
              </View>

              {/* Box 5: Environmental Status */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Environmental Status</Text>
                <Text style={styles.infoText}>{user.environment}</Text>
              </View>

              {/* Box 6: Vices/Addiction */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Vices/Addiction</Text>
                <Text style={styles.infoText}>{user.vices}</Text>
              </View>

              {/* Box 7: Genetical Disease */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Genetical Disease</Text>
                <Text style={styles.infoText}>{user.genetic_diseases}</Text>
              </View>

              {/* Box 8: Daily Sleep */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Daily Sleep</Text>
                <Text style={styles.infoText}>{user.sleep_hours}</Text>
              </View>

              {/* Box 9: Activeness */}
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Activeness</Text>
                <Text style={styles.infoText}>{user.activeness}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#f5f5f5', // Soft neutral background for a modern look
    padding: 20,
    borderRadius: 15,
    width: '92%',
    maxHeight: '90%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    backgroundColor: 'white',
    paddingVertical: 5, // Reduce padding
    paddingHorizontal: 10, // Reduce padding
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    flexBasis: '20%', // Make the boxes flexible
    marginBottom: 10,
  },
  boxHeader: {
    fontSize: 14, // Reduce font size
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5, // Reduce margin
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  avatar: {
    width: 150, // Reduce size
    height: 150, // Reduce size
    borderRadius: 70, // Adjust border radius
    borderWidth: 2,
    borderColor: 'gold',
    alignSelf: 'center',
    marginBottom: 10,
  },
  bmiResult: {
    fontSize: 14, // Reduce font size
    fontWeight: 'bold',
    marginTop: 5, // Reduce margin
    color: '#2E7D32',
  },
  bmiStatus: {
    fontSize: 14, // Reduce font size
    marginTop: 5,
    color: '#555',
  },
  closeButton: {
    backgroundColor: '#888',
    paddingVertical: 10, // Reduce padding
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Profile;