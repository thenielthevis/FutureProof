import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import { getPrediction } from '../API/prediction_api';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import {getTaskCompletionsByUser, getTodayTaskCompletionsByUser} from '../API/task_completion_api';

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
        {isMobile ? (
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
                propsForLabels: {
                  rotation: -45,
                  fontSize: 10,
                  fontWeight: 'bold',
                  dx: 8,
                  dy: 1,
                  textAnchor: 'middle',
                  wordWrap: 'break-word',
                },
              }}
              bezier
              style={{
                marginVertical: 15,
                borderRadius: 16,
                paddingRight: 20,
              }}
            />
          </ScrollView>
        ) : (
          <ScrollView horizontal>
            <LineChart
              data={chartData}
              width={screenWidth * 0.6}
              height={400}
              chartConfig={{
                backgroundColor: '#2c3e50',
                backgroundGradientFrom: '#2c3e50',
                backgroundGradientTo: '#2c3e50',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 150, 150, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </ScrollView>
        )}
        {isMobile ? (
          <View style={styles.circleContainerMobile}>
            {diseaseLabels.map((label, index) => (
              <View key={index} style={styles.circleWrapperMobile}>
                <ProgressChart
                  data={{ data: [diseaseData[index] / 100] }}
                  width={100}
                  height={100}
                  strokeWidth={12}
                  radius={40}
                  chartConfig={{
                    backgroundGradientFrom: '#2c3e50',
                    backgroundGradientTo: '#2c3e50',
                    color: (opacity = 1) => `rgba(255, 150, 150, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    strokeWidth: 2,
                  }}
                  hideLegend={true}
                  
                />
                <Text style={styles.circleText} numberOfLines={3} ellipsizeMode="tail">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
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
        )}
      </View>
    );
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
    <LinearGradient colors={['rgb(20, 36, 59)', 'rgb(119, 243, 187)']} style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prediction' && styles.activeTab]}
          onPress={() => setActiveTab('prediction')}
        >
          <Text style={[styles.tabText, activeTab === 'prediction' && styles.activeTabText]}>Prediction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
      </View>
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
            <ScrollView>
            </ScrollView>
          </View>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  scrollViewContent: { flexGrow: 1, width: '100%' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
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
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, width: '100%' },
  tab: { paddingVertical: 15, paddingHorizontal: 25, backgroundColor: '#1e3a5f', borderRadius: 15, marginHorizontal: 10 },
  activeTab: { backgroundColor: '#4189E5' },
  tabText: { fontSize: 20, color: '#B0C4DE' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  backButton: { backgroundColor: '#14243b', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, width: '100%' },
  backButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  circleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, width: '100%', flexWrap: 'wrap',borderRadius: 90, },
  circleContainerMobile: { flexDirection: 'column', marginTop: 80, paddingHorizontal: 10 },
  circleWrapper: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderRadius: 90, },
  circleWrapperMobile: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 30, marginHorizontal: 10 },
  circleText: { color: '#2c3e50', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 15, width: 120 },
  circleValue: { color: '#2c3e50', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  sectionHeader: { fontSize: 26, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 20, textAlign: 'center' },
  userDetailsContainer: { width: isMobile ? '100%' : '90%', padding: 20, backgroundColor: '#34495e', borderRadius: 15, marginBottom: 30, },
  userDetailsText: { fontSize: 18, color: '#ecf0f1', lineHeight: 28 },
  emptyDashboard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyDashboardText: { fontSize: 22, color: '#ffffff' },
  dashboardContainer: { flex: 1, padding: 20, alignItems: 'center' },
  dashboardText: { fontSize: 18, color: '#ffffff', marginVertical: 10 },
  taskItem: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, marginVertical: 5, width: '100%' },
  taskText: { fontSize: 16, color: '#ecf0f1' },
  taskDate: { fontSize: 14, color: '#bdc3c7', marginTop: 5 },
});

export default UserDashboard;