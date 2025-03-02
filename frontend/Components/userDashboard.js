import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import { getPrediction } from '../API/prediction_api';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { getTaskCompletionsByUser, getTodayTaskCompletionsByUser } from '../API/task_completion_api';

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

const UserDashboard = ({ navigation }) => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [prediction, setPrediction] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [taskCompletions, setTaskCompletions] = useState([]);
  const [todayTaskCompletions, setTodayTaskCompletions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);  // Sidebar state

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const userData = await getUser(token);
        setUser(userData);
        if (userData.default_avatar) {
          const avatarResponse = await getAvatar(userData.default_avatar);
          setAvatarUrl(avatarResponse.url);
        }
        const predictionData = await getPrediction(token);
        setPrediction(predictionData);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchTaskCompletions = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const completions = await getTaskCompletionsByUser(token);
        setTaskCompletions(completions);
        const todayCompletions = await getTodayTaskCompletionsByUser(token);
        setTodayTaskCompletions(todayCompletions);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskCompletions();
  }, []);

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

  const formatPrediction = (prediction) => {
    const diseaseLabels = prediction.predicted_diseases?.map((item) => item.condition) || [];
    const diseaseData = prediction.predicted_diseases?.map((item) => parseInt(item.details.match(/\d+/)?.[0] || 0)) || [];

    const chartData = {
      labels: diseaseLabels,
      datasets: [
        {
          data: diseaseData,
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.centerContent}>
        <Text style={styles.sectionHeader}>User Information</Text>
        <View style={styles.userDetailsContainer}>
          <Text style={styles.userDetailsText}>{prediction.user_info?.details || 'No details available'}</Text>
        </View>

        <Text style={styles.sectionHeader}>Predicted Diseases</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={screenWidth * 1.5}
            height={350}
            chartConfig={{
              backgroundColor: '#2c3e50',
              backgroundGradientFrom: '#2c3e50',
              backgroundGradientTo: '#2c3e50',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              fillShadowGradient: '#f6a8f0',
              fillShadowGradientOpacity: 0.4,
            }}
            bezier
            style={{
              marginVertical: 15,
              borderRadius: 16,
              paddingRight: 20,
            }}
          />
        </ScrollView>
        <View style={styles.circleContainer}>
          {diseaseLabels.map((label, index) => (
            <View key={index} style={styles.circleWrapper}>
              <ProgressChart
                data={{ data: [diseaseData[index] / 100] }}
                width={120}
                height={120}
                strokeWidth={12}
                radius={50}
                chartConfig={{
                  backgroundGradientFrom: '#2c3e50',
                  backgroundGradientTo: '#2c3e50',
                  color: (opacity = 1) => `rgba(255, 150, 150, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  strokeWidth: 2,
                  borderRadius: 90,
                }}
                hideLegend={true}
              />
              <Text style={styles.circleText}>{label}</Text>
              <Text style={styles.circleValue}>{diseaseData[index]}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);  // Toggle the sidebar state
  };

  if (loading) {
    return (
      <LinearGradient colors={['#ffffff', '#72f2b8']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.container}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { width: sidebarOpen ? 250 : 60 }]}>
        {/* Toggle Button to open/close sidebar */}
        <TouchableOpacity onPress={toggleSidebar} style={styles.toggleButton}>
          <FontAwesome5 name={sidebarOpen ? 'angle-left' : 'angle-right'} size={24} color="#ffffff" />
        </TouchableOpacity>
        {sidebarOpen && (
          <LinearGradient colors={['#003C2C', '#005C3C']} style={styles.sidebarContent}>
            {/* Sidebar Items */}
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'home' && styles.activeSidebarItem]}
              onPress={() => navigation.navigate('Home')}
            >
              <FontAwesome name="home" size={20} color="#ffffff" />
              <Text style={[styles.sidebarText, activeTab === 'home' && styles.activeSidebarText]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'profile' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('profile')}
            >
              <FontAwesome name="user" size={20} color="#ffffff" />
              <Text style={[styles.sidebarText, activeTab === 'profile' && styles.activeSidebarText]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'prediction' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('prediction')}
            >
              <FontAwesome5 name="heartbeat" size={20} color="#ffffff" />
              <Text style={[styles.sidebarText, activeTab === 'prediction' && styles.activeSidebarText]}>Prediction</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'dashboard' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('dashboard')}
            >
              <FontAwesome name="dashboard" size={20} color="#ffffff" />
              <Text style={[styles.sidebarText, activeTab === 'dashboard' && styles.activeSidebarText]}>Dashboard</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
              {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userDetails}>{user.age} • {user.gender} • {user.email}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Daily Habits/Lifestyle</Text>
                <Text style={styles.cardText}>{user.lifestyle}</Text>
                <MaterialIcons name="edit" size={24} color="#4CAF50" style={styles.editIcon} />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Calories/Food Intake</Text>
                <Text style={styles.cardText}>{user.food_intake}</Text>
                <MaterialIcons name="edit" size={24} color="#4CAF50" style={styles.editIcon} />
              </View>
            </View>

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
                <MaterialIcons name="edit" size={24} color="#4CAF50" style={styles.editIcon} />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Activeness</Text>
                <Text style={styles.cardText}>{user.activeness || 'Moderate'}</Text>
                <MaterialIcons name="edit" size={24} color="#4CAF50" style={styles.editIcon} />
              </View>
            </View>
          </>
        )}
        {activeTab === 'prediction' && formatPrediction(prediction)}
        {activeTab === 'dashboard' && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Task Completions</Text>
            <Text style={styles.cardText}>Total Tasks Completed: {taskCompletions.length}</Text>
            <Text style={styles.cardText}>Tasks Completed Today: {todayTaskCompletions.length}</Text>
            <ScrollView></ScrollView>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#003C2C', zIndex: 999 },
  sidebarContent: { flex: 1, justifyContent: 'flex-start', paddingTop: 50, paddingHorizontal: 10 },
  toggleButton: { padding: 10, position: 'absolute', top: 10, left: 10, zIndex: 1000 },
  sidebarItem: { paddingVertical: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#005C3C' },
  activeSidebarItem: { backgroundColor: '#4189E5' },
  sidebarText: { fontSize: 20, color: '#ffffff', marginLeft: 10 },
  activeSidebarText: { fontWeight: 'bold' },
  scrollViewContent: { flexGrow: 1, width: '100%' },
  profileHeader: { alignItems: 'center', marginBottom: 30, backgroundColor: '#003C2C', padding: 20, borderRadius: 10 },
  avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#4CAF50', marginBottom: 20 },
  userName: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  userDetails: { fontSize: 20, color: '#ffffff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%' },
  card: {
    backgroundColor: '#2c3e50',
    borderRadius: 15,
    padding: 20,
    flex: 1,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  bmiCard: { marginVertical: 20 },
  cardHeader: { fontSize: 22, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 15 },
  cardText: { fontSize: 18, color: '#bdc3c7' },
  editIcon: { position: 'absolute', right: 15, top: 15 },
  bmiContainer: { alignItems: 'center' },
  bmiText: { fontSize: 18, color: '#bdc3c7' },
  bmiResult: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginTop: 15 },
  bmiStatus: { fontSize: 20, marginTop: 10, color: '#ecf0f1' },
  error: { color: 'red', fontSize: 22, textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#14243b', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, width: '100%' },
  backButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  circleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, width: '100%', flexWrap: 'wrap' },
  circleWrapper: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderRadius: 90 },
  circleText: { color: '#2c3e50', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 15, width: 120 },
  circleValue: { color: '#2c3e50', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  sectionHeader: { fontSize: 26, fontWeight: 'bold', color: '#000000', marginBottom: 20, textAlign: 'center' },
  userDetailsContainer: { width: isMobile ? '100%' : '90%', padding: 20, backgroundColor: '#34495e', borderRadius: 15, marginBottom: 30 },
  userDetailsText: { fontSize: 18, color: '#ecf0f1', lineHeight: 28 },
});

export default UserDashboard;
