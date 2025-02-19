import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, getAvatar } from '../API/api';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
        setUser(response);
        if (response.default_avatar) {
          const avatarResponse = await getAvatar(response.default_avatar);
          setAvatarUrl(avatarResponse.url);
        }
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchUser();
    }
  }, [visible]);

  const calculateBMI = (height, weight) => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
  };

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi < 24.9) return 'Normal Weight';
    if (bmi >= 25 && bmi < 29.9) return 'Overweight';
    return 'Obese';
  };

  const bmi = calculateBMI(parseFloat(user.height), parseFloat(user.weight));
  const bmiStatus = getBMIStatus(bmi);

  if (loading) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
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

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#14243b', '#77f3bb']}
          style={styles.modalContent}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false} // Hide scrollbar
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userDetails}>{user.age} • {user.gender} • {user.email}</Text>
            </View>

            {/* Daily Habits and Food Intake */}
            <View style={styles.row}>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Daily Habits/Lifestyle</Text>
                <Text style={styles.cardText}>{user.lifestyle}</Text>
                <MaterialIcons name="edit" size={20} color="#4CAF50" style={styles.editIcon} />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Calories/Food Intake</Text>
                <Text style={styles.cardText}>{user.food_intake}</Text>
                <MaterialIcons name="edit" size={20} color="#4CAF50" style={styles.editIcon} />
              </View>
            </View>

            {/* BMI Section */}
            <View style={[styles.card, styles.bmiCard]}>
              <Text style={styles.cardHeader}>Body Mass Index</Text>
              <View style={styles.bmiContainer}>
                <Text style={styles.bmiText}>Height: {user.height} cm</Text>
                <Text style={styles.bmiText}>Weight: {user.weight} kg</Text>
                <Text style={styles.bmiResult}>BMI: {bmi}</Text>
                <Text style={[styles.bmiStatus, { color: bmiStatus === 'Underweight' ? '#FF9800' : '#4CAF50' }]}>
                  {bmiStatus}
                </Text>
              </View>
            </View>

            {/* Additional Sections */}
            <View style={styles.row}>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Environmental Status</Text>
                <Text style={styles.cardText}>{user.environment || 'Quiet'}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Vices/Addiction</Text>
                <Text style={styles.cardText}>{user.vices || 'Substance Abuse, Gambling'}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Genetics/Family History</Text>
                <Text style={styles.cardText}>{user.genetic_diseases || 'Sickle Cell Anemia, Tay-Sachs Disease'}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Daily Sleep</Text>
                <Text style={styles.cardText}>{user.sleep_hours || '>6 Hours'}</Text>
                <MaterialIcons name="edit" size={20} color="#4CAF50" style={styles.editIcon} />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Activeness</Text>
                <Text style={styles.cardText}>{user.activeness || 'Moderate'}</Text>
                <MaterialIcons name="edit" size={20} color="#4CAF50" style={styles.editIcon} />
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
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
    padding: 20,
    borderRadius: 15,
    width: '50%',
    maxHeight: '70%',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    fontSize: 16,
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  bmiCard: {
    marginVertical: 10, // Added margin to prevent overlapping
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
  editIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  bmiContainer: {
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 14,
    color: '#666',
  },
  bmiResult: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  bmiStatus: {
    fontSize: 16,
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#14243b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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