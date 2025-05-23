import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions, Animated, TextInput, Alert, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, updateUserProfile, resetUserPrediction } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import { getPrediction, getUserPredictions, createNewPrediction } from '../API/prediction_api';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from 'react-native-vector-icons';
import { LineChart, ProgressChart, PieChart } from 'react-native-chart-kit';
import { getTaskCompletionsByUser, getTodayTaskCompletionsByUser } from '../API/task_completion_api';
import { getTotalOwnedAssetsCount } from '../API/assets_api';
import { getTotalAvatarsCount, getTotalCoins } from '../API/user_api';
import { readUserAssessments } from '../API/daily_assessment_api';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';
import Chart from 'chart.js/auto';
import Icon from 'react-native-vector-icons/FontAwesome';

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

const formatDate = (dateString) => {
  try {
    if (!dateString) {
      return 'No date available';
    }

    // Parse MongoDB ISO date string
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'No date available';
    }

    // Format as MM/DD/YYYY HH:mm
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}/${day}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error, 'dateString:', dateString);
    return 'No date available';
  }
};

const UserDashboard = ({ navigation }) => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [prediction, setPrediction] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [taskCompletions, setTaskCompletions] = useState([]);
  const [todayTaskCompletions, setTodayTaskCompletions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalOwnedAssetsCount, setTotalOwnedAssetsCount] = useState(0);
  const [totalAvatarsCount, setTotalAvatarsCount] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const sidebarAnimation = useState(new Animated.Value(250))[0];
  const contentMarginAnimation = useState(new Animated.Value(250))[0];
  const [isLoading, setIsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    environment: '',
    vices: [],
    genetic_diseases: [],
    lifestyle: [],
    food_intake: [],
    sleep_hours: '',
    activeness: ''
  });

  // Add new state for all predictions
  const [allPredictions, setAllPredictions] = useState([]);

  // Update the options arrays to match Register.js
  const environmentOptions = ['Hushed', 'Quiet', 'Moderate', 'Loud', 'Deafening', 'Other'];
  const sleepOptions = ['1-2 hrs', '3-4 hrs', '5-6 hrs', '7-8 hrs', '9-10 hrs', '11-12 hrs', 'Other'];
  const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Vigorous', 'Other'];
  const viceOptions = ['Alcoholism', 'Smoking', 'Substance Abuse', 'Digital', 'None', 'Other'];
  const lifestyleOptions = [
    'Physical Activity',
    'Healthy Eating',
    'Stress Management',
    'Regular Check-ups',
    'Social Interaction',
    'Other'
  ];
  const foodIntakeOptions = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Protein Foods', 'Other'];
  const genderOptions = ['Male', 'Female', 'Other'];

  // Add state for "Other" inputs
  const [otherInputs, setOtherInputs] = useState({
    environment: '',
    sleepHours: '',
    activeness: '',
    vices: '',
    lifestyle: '',
    foodIntake: '',
    gender: '',
  });

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

        // Calculate total time spent
        const totalTime = completions.reduce((sum, task) => sum + task.time_spent, 0);
        setTotalTimeSpent(totalTime);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskCompletions();
  }, []);

  useEffect(() => {
    const fetchTotalOwnedAssetsCount = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const totalCount = await getTotalOwnedAssetsCount();
        setTotalOwnedAssetsCount(totalCount || 0); // Ensure we have at least 0
      } catch (err) {
        console.error('Error fetching owned assets count:', err);
        setTotalOwnedAssetsCount(0); // Default to 0 on error
      } finally {
        setLoading(false);
      }
    };

    fetchTotalOwnedAssetsCount();
  }, []);

  useEffect(() => {
    const fetchTotalAvatarsCount = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const totalCount = await getTotalAvatarsCount();
        setTotalAvatarsCount(totalCount);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTotalAvatarsCount();
  }, []);

  useEffect(() => {
    const fetchTotalCoins = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const totalCoins = await getTotalCoins();
        setTotalCoins(totalCoins);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTotalCoins();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('Login');
    } catch (err) {
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const assessmentsData = await readUserAssessments(token);
        console.log("Fetched User Assessments:", assessmentsData);  // Log fetched assessments
        setAssessments(assessmentsData);
        setFilteredAssessments(assessmentsData);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      }
    };
    fetchAssessments();
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        // Get all predictions
        const predictionsData = await getUserPredictions(token);
        setAllPredictions(predictionsData);

        // Set latest prediction
        if (predictionsData.length > 0) {
          setPrediction(predictionsData[0]);
        }
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const handleRefreshPrediction = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      // Force create new prediction
      const newPrediction = await createNewPrediction(token);
      setPrediction(newPrediction);
      
      // Refresh all predictions list
      const predictionsData = await getUserPredictions(token);
      setAllPredictions(predictionsData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'New prediction created successfully'
      });
    } catch (err) {
      setError(err.detail || 'An error occurred');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create new prediction'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getBMIColor = (bmi) => {
    if (bmi < 18.5) return '#FFB74D'; // Orange for underweight
    if (bmi >= 18.5 && bmi < 24.9) return '#4CAF50'; // Green for normal weight
    if (bmi >= 25 && bmi < 29.9) return '#FF9800'; // Dark orange for overweight
    return '#F44336'; // Red for obese
  };

  const bmi = user.height && user.weight ? 
    calculateBMI(parseFloat(user.height || 0), parseFloat(user.weight || 0)) : 
    '0.00';
  const bmiStatus = getBMIStatus(bmi);
  const bmiColor = getBMIColor(bmi);

  const formatPrediction = (prediction) => {
    const diseaseLabels = prediction.predicted_diseases?.map((item) => item.condition) || [];
    const diseaseData = prediction.predicted_diseases?.map((item) => {
      const match = item.details.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }) || [];

    const chartData = {
      labels: diseaseLabels,
      datasets: [
        {
          data: diseaseData,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
    
    const pieChartData = diseaseLabels.map((label, index) => {
      const colors = ['#00C853', '#69F0AE', '#00E676', '#1B5E20', '#388E3C', '#43A047'];
      return {
        name: label,
        population: diseaseData[index],
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });

    return (
      <View style={styles.centerContent}>
        <Text style={styles.sectionTitle}>Health Prediction Analysis</Text>
        <View style={styles.userInfoCard}>
          <Text style={styles.cardTitle}>User Information</Text>
          <Text style={styles.userDetailsText}>{prediction.user_info?.details || 'No details available'}</Text>
        </View>

        <View style={styles.predictionSection}>
          <Text style={styles.cardTitle}>Risk Analysis</Text>
          {diseaseLabels.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={chartData}
                width={screenWidth * 1.2}
                height={280}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#2e7d32',
                  },
                  propsForLabels: {
                    fontSize: 12,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No prediction data available</Text>
          )}
        </View>

        <View style={styles.predictionSection}>
          <Text style={styles.cardTitle}>Risk Distribution</Text>
          {diseaseLabels.length > 0 ? (
            <PieChart
              data={pieChartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No prediction data available</Text>
          )}
        </View>

        <View style={styles.circleContainer}>
          {diseaseLabels.map((label, index) => (
            <View key={index} style={styles.riskCard}>
              <View style={styles.progressChartWrapper}>
                <ProgressChart
                  data={{ data: [diseaseData[index] / 100] }}
                  width={120}
                  height={120}
                  strokeWidth={12}
                  radius={50}
                  chartConfig={{
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => pieChartData[index].color,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  hideLegend={true}
                />
                <View style={styles.progressChartOverlay}>
                  <Text style={styles.riskPercentage}>{diseaseData[index]}%</Text>
                </View>
              </View>
              <Text style={styles.riskName}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const toggleSidebar = () => {
    const newWidth = sidebarOpen ? 60 : 250;
    Animated.parallel([
      Animated.timing(sidebarAnimation, {
        toValue: newWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(contentMarginAnimation, {
        toValue: newWidth,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = () => {
    const filtered = assessments.filter(assessment =>
      new Date(assessment.date).toLocaleDateString().includes(searchQuery)
    );
    setFilteredAssessments(filtered);
  };  

  // Convert a local image to a Base64 string (or return remote URL)
  const convertImageToBase64 = async (uri) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // Fetch remote image and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Convert local image to base64
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");
  
      // PAGE 1: Profile Section
      const profileHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center; margin-top: 15px;">
              <h1 style="font-size: 18px; margin: 0;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <br>
              <h2 style="font-size: 16px; margin: 0;">User Profile Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
          <div style="margin-top: 20px;">
            <h3>Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Username</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${user.username}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Age</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${user.age}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Gender</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${user.gender}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Height</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${user.height} cm</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Weight</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${user.weight} kg</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">BMI</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${bmi} (${bmiStatus})</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Tasks Completed</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${taskCompletions.length}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Time Spent</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${totalTimeSpent} minutes</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Coins</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${totalCoins}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Owned Assets</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${totalOwnedAssetsCount}</td>
              </tr>
            </table>
          </div>
        </div>
      `;
  
      // PAGE 2: Prediction Section
      const predictionHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 40px; width: auto;">
            <div style="text-align: center;">
              <h2 style="font-size: 16px; margin: 0;">Health Prediction Analysis</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${user.username} - ${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 40px; width: auto;">
          </div>
          
          <div style="margin-top: 20px;">
            <h3 style="font-size: 16px;">User Health Information</h3>
            <p style="font-size: 14px;">${prediction.user_info?.details || 'No details available'}</p>
          </div>
          
          <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 100%; margin-bottom: 20px;">
              <h3 style="font-size: 16px; text-align: center;">Risk Analysis</h3>
              <div id="riskAnalysisChart" style="width: 600px; height: 250px; margin: 0 auto;"></div>
            </div>
            
            <div style="width: 100%;">
              <h3 style="font-size: 16px; text-align: center;">Risk Distribution</h3>
              <div id="riskDistributionChart" style="width: 500px; height: 250px; margin: 0 auto;"></div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <h3 style="font-size: 16px;">Risk Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Health Condition</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Risk Level</th>
              </tr>
              ${prediction.predicted_diseases?.map((disease, index) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${disease.condition}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${disease.details}</td>
                </tr>
              `).join('') || '<tr><td colspan="2" style="padding: 8px; border: 1px solid #ddd;">No prediction data available</td></tr>'}
            </table>
          </div>
        </div>
      `;
  
      // PAGE 3: Dashboard Section
      const dashboardHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 40px; width: auto;">
            <div style="text-align: center;">
              <h2 style="font-size: 16px; margin: 0;">Performance Dashboard</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${user.username} - ${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 40px; width: auto;">
          </div>
          
          <div style="margin-top: 20px;">
            <div style="width: 100%; margin-bottom: 20px;">
              <h3 style="font-size: 16px; text-align: center;">Task Completion Time (Minutes)</h3>
              <div id="taskCompletionChart" style="width: 600px; height: 250px; margin: 0 auto;"></div>
            </div>
            
            <div style="margin-top: 30px;">
              <h3 style="font-size: 16px;">Recent Task Completions</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Task Type</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date Completed</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Time Spent (min)</th>
                </tr>
                ${taskCompletions.slice(0, 5).map((task, index) => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${task.task_type}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(task.date_completed).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${task.time_spent}</td>
                  </tr>
                `).join('') || '<tr><td colspan="3" style="padding: 8px; border: 1px solid #ddd;">No task completion data available</td></tr>'}
              </table>
            </div>
            
            <div style="margin-top: 30px;">
              <h3 style="font-size: 16px;">Performance Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Today's Tasks</th>
                  <td style="padding: 8px; border: 1px solid #ddd;">${todayTaskCompletions.length}</td>
                </tr>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Tasks Completed</th>
                  <td style="padding: 8px; border: 1px solid #ddd;">${taskCompletions.length}</td>
                </tr>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Time Spent</th>
                  <td style="padding: 8px; border: 1px solid #ddd;">${totalTimeSpent} minutes</td>
                </tr>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Total Coins</th>
                  <td style="padding: 8px; border: 1px solid #ddd;">${totalCoins}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;
  
      if (Platform.OS === 'web') {
        // Create containers for each page and add to document
        const profileContainer = document.createElement('div');
        profileContainer.style.position = 'absolute';
        profileContainer.style.left = '-9999px';
        profileContainer.innerHTML = profileHtml;
        document.body.appendChild(profileContainer);
  
        const predictionContainer = document.createElement('div');
        predictionContainer.style.position = 'absolute';
        predictionContainer.style.left = '-9999px';
        predictionContainer.innerHTML = predictionHtml;
        document.body.appendChild(predictionContainer);
  
        const dashboardContainer = document.createElement('div');
        dashboardContainer.style.position = 'absolute';
        dashboardContainer.style.left = '-9999px';
        dashboardContainer.innerHTML = dashboardHtml;
        document.body.appendChild(dashboardContainer);
  
        // Render prediction charts
        if (prediction.predicted_diseases?.length > 0) {
          const diseaseLabels = prediction.predicted_diseases.map((item) => item.condition);
          const diseaseData = prediction.predicted_diseases.map((item) => parseInt(item.details.match(/\d+/)?.[0] || 0));
          
          // Risk Analysis Line Chart
          const riskAnalysisChart = document.getElementById('riskAnalysisChart');
          const riskCtx = document.createElement('canvas');
          riskCtx.width = 600;
          riskCtx.height = 250;
          riskAnalysisChart.appendChild(riskCtx);
          
          new Chart(riskCtx, {
            type: 'line',
            data: {
              labels: diseaseLabels,
              datasets: [{
                label: 'Risk Level (%)',
                data: diseaseData,
                borderColor: '#2e7d32',
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: { font: { size: 10 }}
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { font: { size: 10 }}
                },
                x: {
                  ticks: { font: { size: 10 }}
                }
              }
            }
          });
          
          // Risk Distribution Pie Chart
          const riskDistributionChart = document.getElementById('riskDistributionChart');
          const pieCtx = document.createElement('canvas');
          pieCtx.width = 500;
          pieCtx.height = 250;
          riskDistributionChart.appendChild(pieCtx);
          
          const colors = ['#00C853', '#69F0AE', '#00E676', '#1B5E20', '#388E3C', '#43A047'];
          
          new Chart(pieCtx, {
            type: 'pie',
            data: {
              labels: diseaseLabels,
              datasets: [{
                data: diseaseData,
                backgroundColor: colors.slice(0, diseaseLabels.length),
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: { font: { size: 9 }}
                }
              }
            }
          });
        }
        
        // Render task completion chart
        const taskCompletionChart = document.getElementById('taskCompletionChart');
        const taskCtx = document.createElement('canvas');
        taskCtx.width = 600;
        taskCtx.height = 250;
        taskCompletionChart.appendChild(taskCtx);
        
        new Chart(taskCtx, {
          type: 'bar',
          data: {
            labels: taskCompletions.length > 0 ? 
              taskCompletions.slice(0, 10).map((task, index) => `Task ${index + 1}`) : 
              ["No Data"],
            datasets: [{
              label: 'Time Spent (Minutes)',
              data: taskCompletions.length > 0 ? 
                taskCompletions.slice(0, 10).map((task) => task.time_spent) : 
                [0],
              backgroundColor: 'rgba(46, 125, 50, 0.7)',
              borderColor: '#2e7d32',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: { font: { size: 10 }}
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { font: { size: 10 }}
              },
              x: {
                ticks: { font: { size: 10 }}
              }
            }
          }
        });
  
        // Wait for images and charts to render
        const waitForRendering = () => {
          const allCanvases = [
            ...predictionContainer.getElementsByTagName('canvas'),
            ...dashboardContainer.getElementsByTagName('canvas')
          ];
          const allImages = [
            ...profileContainer.getElementsByTagName('img'),
            ...predictionContainer.getElementsByTagName('img'),
            ...dashboardContainer.getElementsByTagName('img')
          ];
          
          return Promise.all([
            ...allImages.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve anyway to continue
              });
            }),
            // Add a short delay for charts to render
            new Promise(resolve => setTimeout(resolve, 500))
          ]);
        };
  
        try {
          await waitForRendering();
  
          const pdf = new jsPDF('p', 'pt', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          
          // Add Page 1: Profile
          const profileCanvas = await html2canvas(profileContainer);
          const profileImgData = profileCanvas.toDataURL('image/png');
          const profileHeight = (profileCanvas.height * pdfWidth) / profileCanvas.width;
          pdf.addImage(profileImgData, 'PNG', 0, 0, pdfWidth, profileHeight);
          
          // Add Page 2: Prediction
          pdf.addPage();
          const predictionCanvas = await html2canvas(predictionContainer);
          const predictionImgData = predictionCanvas.toDataURL('image/png');
          const predictionHeight = (predictionCanvas.height * pdfWidth) / predictionCanvas.width;
          pdf.addImage(predictionImgData, 'PNG', 0, 0, pdfWidth, predictionHeight);
          
          // Add Page 3: Dashboard
          pdf.addPage();
          const dashboardCanvas = await html2canvas(dashboardContainer);
          const dashboardImgData = dashboardCanvas.toDataURL('image/png');
          const dashboardHeight = (dashboardCanvas.height * pdfWidth) / dashboardCanvas.width;
          pdf.addImage(dashboardImgData, 'PNG', 0, 0, pdfWidth, dashboardHeight);
          
          // Save the PDF
          pdf.save('futureproof-health-report.pdf');
  
          // Show success message
          Toast.show({
            type: 'success',
            text1: 'PDF Generated',
            text2: 'Your report has been successfully exported',
          });
  
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
          // Clean up
          document.body.removeChild(profileContainer);
          document.body.removeChild(predictionContainer);
          document.body.removeChild(dashboardContainer);
        }
      } else {
        try {
          // For mobile, use Expo Print
          const { uri } = await Print.printToFileAsync({ 
            html: `
              ${profileHtml}
              <div style="page-break-after: always;"></div>
              ${predictionHtml}
              <div style="page-break-after: always;"></div>
              ${dashboardHtml}
            ` 
          });
          await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleExportPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportUserPDF = async (assessment) => {
    setIsLoading(true);
      try {
        // Convert logo URLs to base64
        const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
        const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");
  
        // Create header content that will appear on each page
        const headerContent = `
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center; margin-top: 15px;">
              <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <br>
              <h2 style="font-size: 16px; margin: 0;">Daily Assessment Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
        `;
  
        // Create first page with mission and vision
        const firstPageContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>Our Mission</h3>
              <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
              <h3>Our Vision</h3>
              <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
            </div>
          </div>
        `;
        
        // User Information Page
        const userInfoPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>User Information - ${assessment.username}</h3>
              <h4>Page 1 of 4</h4>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Username</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.username}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Age</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.age}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Gender</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.gender}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Height</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.height} cm</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Weight</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.weight} kg</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Environment</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.environment}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Vices</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.vices.join(', ')}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Genetic Diseases</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.genetic_diseases.join(', ')}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Lifestyle</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.lifestyle.join(', ')}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Food Intake</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.food_intake.join(', ')}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Sleep Hours</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.sleep_hours}</td>
                </tr>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Activeness</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${assessment.activeness}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
  
        // Prevention Progress Page
        const preventionPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>Prevention Progress - ${assessment.username}</h3>
              <h4>Page 2 of 4</h4>
              <ul>
                ${assessment.updated_predictions.map(prediction => `
                  <li>
                    <b>Condition: ${prediction.condition}</b><br>
                    <div style="display: flex; align-items: center;">
                      <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                        <div style="width: ${prediction.old_percentage}%; height: 100%; background-color: #3498db;"></div>
                      </div>
                      <span>${prediction.old_percentage}%</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-top: 5px;">
                      <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                        <div style="width: ${prediction.new_percentage}%; height: 100%; background-color: #2ecc71;"></div>
                      </div>
                      <span>${prediction.new_percentage}%</span>
                    </div>
                    <p>Reason: ${prediction.reason}</p>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        `;
  
        // Nutritional Analysis Page
        const nutritionalPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>Nutritional Analysis - ${assessment.username}</h3>
              <h4>Page 3 of 4</h4>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Question</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  ${assessment.nutritional_analysis.questions_answers.map(qa => `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #ddd;">${qa.question}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${qa.answer}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
  
        // Recommendations Page
        const recommendationsPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>Recommendations - ${assessment.username}</h3>
              <h4>Page 4 of 4</h4>
              <div style="margin-top: 10px;">
                ${assessment.recommendations.map((rec, index) => `
                  <div style="margin-bottom: 10px; padding: 16px; border-radius: 8px;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-weight: 600; color: #1a1a1a; font-size: 16px;">Recommendation ${index + 1}:</span>
                      <p style="margin: 8px 0; line-height: 1.5;">${rec.recommendation || 'N/A'}</p>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="font-weight: 600; color: #1a1a1a;">Scientific Basis:</span>
                      <p style="margin: 8px 0; line-height: 1.5;">${rec.basis || 'N/A'}</p>
                    </div>
                    <div>
                      <span style="font-weight: 600; color: #1a1a1a;">Reference:</span>
                      <p style="margin: 8px 0; line-height: 1.5;">${rec.reference || 'N/A'}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
  
        // Combine all pages
        const allPages = [
          firstPageContent,
          userInfoPage,
          preventionPage,
          nutritionalPage,
          recommendationsPage
        ].join('<div style="page-break-after: always;"></div>');
  
        if (Platform.OS === 'web') {
          try {
            // For web platform - use jsPDF directly with separate pages
            const pdf = new jsPDF('p', 'pt', 'a4');
            
            // Function to add a page to the PDF
            const addPageToPdf = async (htmlContent, pageNum) => {
              const container = document.createElement('div');
              // Set a fixed width to match A4 dimensions
              container.style.width = '595.28pt';
              container.style.position = 'absolute';
              container.style.left = '-9999px';
              container.innerHTML = htmlContent;
              document.body.appendChild(container);
              
              try {
                // Wait for images to load
                await Promise.all(
                  Array.from(container.querySelectorAll('img')).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    });
                  })
                );
                
                // Use a fixed scale to prevent zooming out
                const canvas = await html2canvas(container, {
                  scale: 1.0,
                  useCORS: true,
                  logging: false
                });
                
                // Always use the full page width
                const pdfWidth = pdf.internal.pageSize.getWidth();
                
                // Add new page if it's not the first page
                if (pageNum > 0) pdf.addPage();
                
                // Add image with proper sizing
                pdf.addImage(
                  canvas.toDataURL('image/jpeg', 1.0), 
                  'JPEG', 
                  0, 0, 
                  pdfWidth, 
                  canvas.height * (pdfWidth / canvas.width)
                );
              } finally {
                document.body.removeChild(container);
              }
            };
            
            // Process each page
            const pages = [firstPageContent, userInfoPage, preventionPage, nutritionalPage, recommendationsPage];
            for (let i = 0; i < pages.length; i++) {
              await addPageToPdf(pages[i], i);
            }
            
            const userName = assessment.username.replace(/\s+/g, '').toLowerCase();
            pdf.save(`${userName}-assessment-report.pdf`);
          } catch (err) {
            console.error('Error generating PDF:', err);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
          }
        } else {
          try {
            const { uri } = await Print.printToFileAsync({ 
              html: allPages,
              base64: false,
              width: 612,
              height: 792
            });
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
          } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error in handleExportUserPDF:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

  const handleExportSinglePrediction = async (predictionData, index) => {
    setIsLoading(true);
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      // Create header content
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Health Prediction Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
      `;

      // First page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
        </div>
      `;

      // Create prediction details page
      const predictionDetailsPage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          <div style="margin-top: 20px;">
            <h3>User Health Information</h3>
            <p>${predictionData.user_info?.details || 'No details available'}</p>
            
            <h3>Risk Analysis</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Health Condition</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Risk Level</th>
              </tr>
              ${predictionData.predicted_diseases?.map(disease => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${disease.condition}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${disease.details}</td>
                </tr>
              `).join('') || '<tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd;">No prediction data available</td></tr>'}
            </table>

            <h3>Recommendations</h3>
            <ul>
              ${predictionData.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No recommendations available</li>'}
            </ul>
          </div>
        </div>
      `;

      // Combine all pages
      const allPages = [
        firstPageContent,
        predictionDetailsPage
      ].join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        try {
          // For web platform - use jsPDF directly with separate pages
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            container.style.width = '595.28pt';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
            try {
              await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
              
              const canvas = await html2canvas(container, {
                scale: 1.0,
                useCORS: true,
                logging: false
              });
              
              const pdfWidth = pdf.internal.pageSize.getWidth();
              
              if (pageNum > 0) pdf.addPage();
              
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0),
                'JPEG',
                0, 0,
                pdfWidth,
                canvas.height * (pdfWidth / canvas.width)
              );
            } finally {
              document.body.removeChild(container);
            }
          };
          
          // Process each page
          const pages = [firstPageContent, predictionDetailsPage];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          // Update filename to use prediction number instead of date
          const predictionNumber = allPredictions.length - index;
          const fileName = `prediction-report-${predictionNumber}.pdf`;
          pdf.save(fileName);
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: allPages,
          base64: false
        });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Prediction report exported successfully'
      });
    } catch (error) {
      console.error('Error in handleExportSinglePrediction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export prediction report'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAllPredictions = async () => {
    setIsLoading(true);
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      // Create header content
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <br>
            <h2 style="font-size: 16px; margin: 0;">All Predictions Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
      `;

      // First page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
        </div>
      `;

      // Create prediction pages
      const predictionPages = allPredictions.map((pred, index) => `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          <div style="margin-top: 20px;">
            <h3>Prediction ${index + 1} - ${formatDate(pred.created_at)}</h3>
            
            <h4>User Health Information</h4>
            <p>${pred.user_info?.details || 'No details available'}</p>
            
            <h4>Risk Analysis</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Health Condition</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Risk Level</th>
              </tr>
              ${pred.predicted_diseases?.map(disease => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${disease.condition}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${disease.details}</td>
                </tr>
              `).join('') || '<tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd;">No prediction data available</td></tr>'}
            </table>

            <h4>Recommendations</h4>
            <ul>
              ${pred.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No recommendations available</li>'}
            </ul>
          </div>
        </div>
      `);

      // Combine all pages
      const allPages = [
        firstPageContent,
        ...predictionPages
      ].join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        try {
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            container.style.width = '595.28pt';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
            try {
              await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
              
              const canvas = await html2canvas(container, {
                scale: 1.0,
                useCORS: true,
                logging: false
              });
              
              const pdfWidth = pdf.internal.pageSize.getWidth();
              
              if (pageNum > 0) pdf.addPage();
              
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0),
                'JPEG',
                0, 0,
                pdfWidth,
                canvas.height * (pdfWidth / canvas.width)
              );
            } finally {
              document.body.removeChild(container);
            }
          };
          
          // Process each page
          const pages = [firstPageContent, ...predictionPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save(`all-predictions-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: allPages,
          base64: false
        });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'All predictions exported successfully'
      });
    } catch (error) {
      console.error('Error in handleExportAllPredictions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export predictions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditedUser({
      age: user.age || '',
      gender: user.gender || '',
      height: user.height || '',
      weight: user.weight || '',
      environment: user.environment || '',
      vices: user.vices || [],
      genetic_diseases: user.genetic_diseases || [],
      lifestyle: user.lifestyle || [],
      food_intake: user.food_intake || [],
      sleep_hours: user.sleep_hours || '',
      activeness: user.activeness || ''
    });
    setEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedUser = await updateUserProfile(token, editedUser);
      setUser(updatedUser);
      setEditModalVisible(false);
      
      // After updating profile, reset prediction
      const resetResponse = await resetUserPrediction(token);
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated and prediction reset.'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update profile'
      });
    }
  };

  const renderEditProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.modalBody}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={String(editedUser.age)}
                onChangeText={(text) => setEditedUser({...editedUser, age: parseInt(text) || ''})}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.radioGroup}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioButton,
                      editedUser.gender === option && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditedUser({...editedUser, gender: option})}
                  >
                    <Text style={styles.radioText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                {editedUser.gender === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.gender}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, gender: text});
                      setEditedUser({...editedUser, gender: text});
                    }}
                    placeholder="Specify gender..."
                  />
                )}
              </View>

              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={String(editedUser.height)}
                onChangeText={(text) => setEditedUser({...editedUser, height: parseFloat(text) || ''})}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={String(editedUser.weight)}
                onChangeText={(text) => setEditedUser({...editedUser, weight: parseFloat(text) || ''})}
                keyboardType="numeric"
              />
            </View>

            {/* Environment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Environment</Text>
              <View style={styles.chipGroup}>
                {environmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.environment === option && styles.chipSelected
                    ]}
                    onPress={() => setEditedUser({...editedUser, environment: option})}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.environment === option && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.environment === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.environment}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, environment: text});
                      setEditedUser({...editedUser, environment: text});
                    }}
                    placeholder="Specify environment..."
                  />
                )}
              </View>
            </View>

            {/* Vices */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vices</Text>
              <View style={styles.chipGroup}>
                {viceOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.vices.includes(option) && styles.chipSelected
                    ]}
                    onPress={() => {
                      const newVices = editedUser.vices.includes(option)
                        ? editedUser.vices.filter(v => v !== option)
                        : [...editedUser.vices, option];
                      setEditedUser({...editedUser, vices: newVices});
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.vices.includes(option) && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.vices.includes('Other') && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.vices}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, vices: text});
                      setEditedUser({...editedUser, vices: [...editedUser.vices.filter(v => v !== 'Other'), text]});
                    }}
                    placeholder="Specify vices..."
                  />
                )}
              </View>
            </View>

            {/* Genetic Diseases */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genetic Diseases</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedUser.genetic_diseases.join(', ')}
                onChangeText={(text) => setEditedUser({
                  ...editedUser,
                  genetic_diseases: text.split(',').map(item => item.trim()).filter(Boolean)
                })}
                placeholder="Enter diseases separated by commas"
                multiline
              />
            </View>

            {/* Lifestyle */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              <View style={styles.chipGroup}>
                {lifestyleOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.lifestyle.includes(option) && styles.chipSelected
                    ]}
                    onPress={() => {
                      const newLifestyle = editedUser.lifestyle.includes(option)
                        ? editedUser.lifestyle.filter(l => l !== option)
                        : [...editedUser.lifestyle, option];
                      setEditedUser({...editedUser, lifestyle: newLifestyle});
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.lifestyle.includes(option) && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.lifestyle.includes('Other') && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.lifestyle}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, lifestyle: text});
                      setEditedUser({...editedUser, lifestyle: [...editedUser.lifestyle.filter(l => l !== 'Other'), text]});
                    }}
                    placeholder="Specify lifestyle..."
                  />
                )}
              </View>
            </View>

            {/* Food Intake */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Food Intake</Text>
              <View style={styles.chipGroup}>
                {foodIntakeOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.food_intake.includes(option) && styles.chipSelected
                    ]}
                    onPress={() => {
                      const newFoodIntake = editedUser.food_intake.includes(option)
                        ? editedUser.food_intake.filter(f => f !== option)
                        : [...editedUser.food_intake, option];
                      setEditedUser({...editedUser, food_intake: newFoodIntake});
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.food_intake.includes(option) && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.food_intake.includes('Other') && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.foodIntake}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, foodIntake: text});
                      setEditedUser({...editedUser, food_intake: [...editedUser.food_intake.filter(f => f !== 'Other'), text]});
                    }}
                    placeholder="Specify food intake..."
                  />
                )}
              </View>
            </View>

            {/* Sleep Hours */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Hours</Text>
              <View style={styles.chipGroup}>
                {sleepOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.sleep_hours === option && styles.chipSelected
                    ]}
                    onPress={() => setEditedUser({...editedUser, sleep_hours: option})}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.sleep_hours === option && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.sleep_hours === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.sleepHours}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, sleepHours: text});
                      setEditedUser({...editedUser, sleep_hours: text});
                    }}
                    placeholder="Specify sleep hours..."
                  />
                )}
              </View>
            </View>

            {/* Activeness */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Level</Text>
              <View style={styles.chipGroup}>
                {activityLevels.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      editedUser.activeness === option && styles.chipSelected
                    ]}
                    onPress={() => setEditedUser({...editedUser, activeness: option})}
                  >
                    <Text style={[
                      styles.chipText,
                      editedUser.activeness === option && styles.chipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                {editedUser.activeness === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    value={otherInputs.activeness}
                    onChangeText={(text) => {
                      setOtherInputs({...otherInputs, activeness: text});
                      setEditedUser({...editedUser, activeness: text});
                    }}
                    placeholder="Specify activity level..."
                  />
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#e63946" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.retryButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const taskCompletionChartData = {
    labels: taskCompletions.length > 0 ? taskCompletions.map((task, index) => `Task ${index + 1}`) : ["No Data"],
    datasets: [
      {
        data: taskCompletions.length > 0 ? 
          taskCompletions.map((task) => task.time_spent || 0) : 
          [0], // Provide a default value when no data
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Update the display sections for list data
  const renderListItems = (items) => {
    if (!items || !items.length) return 'None specified';
    return (
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemBullet}>•</Text>
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { width: sidebarAnimation }]}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.toggleButton}>
          <FontAwesome5 name={sidebarOpen ? 'angle-left' : 'angle-right'} size={24} color="#ffffff" />
        </TouchableOpacity>
        {sidebarOpen ? (
          <LinearGradient colors={['#004d40', '#1b5e20']} style={styles.sidebarContent}>
            <View style={styles.sidebarHeader}>
              {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.sidebarAvatar} />}
              <Text style={styles.sidebarUserName}>{user.username}</Text>
            </View>

            {/* Sidebar Menu Items */}
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'home' && styles.activeSidebarItem]}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="home-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'profile' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('profile')}
            >
              <Ionicons name="person-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'prediction' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('prediction')}
            >
              <Ionicons name="pulse-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Prediction</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'dashboard' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('dashboard')}
            >
              <Ionicons name="grid-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarItem, activeTab === 'assessments' && styles.activeSidebarItem]}
              onPress={() => setActiveTab('assessments')}
            >
              <Ionicons name="clipboard-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Assessments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#ffffff" />
              <Text style={styles.sidebarText}>Logout</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <LinearGradient colors={['#004d40', '#1b5e20']} style={styles.collapsedSidebar}>
            <View style={styles.collapsedSidebarContent}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.collapsedSidebarItem}>
                <Ionicons name="home-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.collapsedSidebarItem}>
                <Ionicons name="person-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('prediction')} style={styles.collapsedSidebarItem}>
                <Ionicons name="pulse-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.collapsedSidebarItem}>
                <Ionicons name="grid-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('assessments')} style={styles.collapsedSidebarItem}>
                <Ionicons name="clipboard-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.mainContent, { marginLeft: contentMarginAnimation }]}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'profile' && (
            <View style={styles.tabContent}>
              <View style={styles.profileHeader}>
                <LinearGradient colors={['#004d40', '#1b5e20']} style={styles.profileHeaderBg}>
                  {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user.username}</Text>
                    <View style={styles.profileDetailsBadge}>
                      <Text style={styles.profileDetails}>{user.age} • {user.gender}</Text>
                    </View>
                    <View style={styles.profileEmailBadge}>
                      <Ionicons name="mail-outline" size={16} color="#ffffff" style={styles.profileEmailIcon} />
                      <Text style={styles.profileEmail}>{user.email}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
              
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#ffffff' }]}>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{bmi}</Text>
                    <Text style={styles.statLabel}>BMI</Text>
                  </View>
                  <Text style={styles.statStatus}>{bmiStatus}</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{totalTimeSpent || 0}</Text>
                    <Text style={styles.statLabel}>Minutes</Text>
                  </View>
                  <Text style={styles.statStatus}>Active Time</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{taskCompletions.length}</Text>
                    <Text style={styles.statLabel}>Tasks</Text>
                  </View>
                  <Text style={styles.statStatus}>Completed</Text>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Physical Profile</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoCard}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="body-outline" size={24} color="#3a86ff" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Height</Text>
                      <Text style={styles.infoValue}>{user.height} cm</Text>
                    </View>
                  </View>
                  <View style={styles.infoCard}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="fitness-outline" size={24} color="#3a86ff" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoValue}>{user.weight} kg</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Lifestyle</Text>
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="calendar-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Daily Habits</Text>
                  </View>
                  {renderListItems(user.lifestyle)}
                </View>
                
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="nutrition-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Nutrition</Text>
                  </View>
                  {renderListItems(user.food_intake)}
                </View>
                
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="bed-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Sleep</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.sleep_hours || 'No sleep data available'}</Text>
                </View>

                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="bicycle-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Activeness Level</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.activeness || 'No activeness data available'}</Text>
                </View>

                <View style={styles.medicalCard}>
                  <View style={styles.medicalHeader}>
                    <Ionicons name="warning-outline" size={24} color="#3a86ff" />
                    <Text style={styles.medicalTitle}>Vices/Addictions</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.vices || 'No risk factors recorded'}</Text>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <View style={styles.medicalCard}>
                  <View style={styles.medicalHeader}>
                    <Ionicons name="medical-outline" size={24} color="#3a86ff" />
                    <Text style={styles.medicalTitle}>Genetical Disease</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.genetic_diseases || 'No genetic data available'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              {renderEditProfileModal()}
            </View>
          )}

          {activeTab === 'prediction' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Latest Prediction</Text>
              {formatPrediction(prediction)}
              
              {/* List of All Predictions */}
              <View style={styles.allPredictionsContainer}>
                <View style={styles.predictionsHeader}>
                  <Text style={styles.sectionTitle}>Prediction History</Text>
                  <TouchableOpacity
                    style={styles.exportAllButton}
                    onPress={handleExportAllPredictions}
                  >
                    <Icon name="download" size={18} color="#fff" />
                    <Text style={styles.exportAllButtonText}>Export All</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.predictionsScrollView}>
                  {allPredictions.map((pred, index) => (
                    <View key={index} style={styles.predictionHistoryCard}>
                      <View style={styles.predictionHistoryHeader}>
                        <Text style={styles.predictionDate}>
                          Prediction #{allPredictions.length - index}
                        </Text>
                        <TouchableOpacity
                          style={styles.exportPredictionButton}
                          onPress={() => handleExportSinglePrediction(pred, index)}
                        >
                          <Icon name="download" size={18} color="#fff" />
                          <Text style={styles.updateButtonText}>Export</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.predictionSummary}>
                        <Text style={styles.predictionSummaryText}>
                          Number of identified risks: {pred.predicted_diseases?.length || 0}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshPrediction}
              >
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>Update Prediction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <Text style={styles.exportButtonText}>Export PDF Charts</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'dashboard' && (
            <View style={styles.tabContent}>
              <Text style={styles.dashboardTitle}>Performance Dashboard</Text>
              
              <View style={styles.statsGridContainer}>
                <View style={styles.statsGrid}>
                  <View style={[styles.statGridCard, styles.statGridPrimary]}>
                    <Ionicons name="checkmark-circle-outline" size={32} color="#ffffff" />
                    <Text style={styles.statGridValue}>{todayTaskCompletions.length}</Text>
                    <Text style={styles.statGridLabel}>Tasks Today</Text>
                  </View>
                  <View style={[styles.statGridCard, styles.statGridSecondary]}>
                    <Ionicons name="time-outline" size={32} color="#ffffff" />
                    <Text style={styles.statGridValue}>{totalTimeSpent || 0}</Text>
                    <Text style={styles.statGridLabel}>Minutes Spent</Text>
                  </View>
                  <View style={[styles.statGridCard, styles.statGridAccent]}>
                    <Ionicons name="trophy-outline" size={32} color="#ffffff" />
                    <Text style={styles.statGridValue}>{totalCoins || 0}</Text>
                    <Text style={styles.statGridLabel}>Total Coins</Text>
                  </View>
                  <View style={[styles.statGridCard, styles.statGridNeutral]}>
                    <Ionicons name="wallet-outline" size={32} color="#ffffff" />
                    <Text style={styles.statGridValue}>{totalOwnedAssetsCount || 0}</Text>
                    <Text style={styles.statGridLabel}>Assets Owned</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Task Completion Time (Minutes)</Text>
                {taskCompletions.length > 0 ? (
                  <LineChart
                    data={taskCompletionChartData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#2e7d32',
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                ) : (
                  <View style={styles.noDataContainer}>
                    <Ionicons name="analytics-outline" size={48} color="#a5d6a7" />
                    <Text style={styles.noDataText}>No task completion data available</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.tasksListContainer}>
                <View style={styles.tasksListHeader}>
                  <Text style={styles.tasksListTitle}>Recent Tasks</Text>
                </View>
                
                <ScrollView style={styles.tasksScrollView}>
                  {taskCompletions.length > 0 ? (
                    taskCompletions.slice(0, 5).map((task, index) => (
                      <View key={index} style={styles.taskListItem}>
                        <View style={styles.taskIconContainer}>
                          <Ionicons name="checkmark-done-circle" size={24} color="#3a86ff" />
                        </View>
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskName}>{task.task_type}</Text>
                          <Text style={styles.taskTime}>{task.time_spent} minutes</Text>
                        </View>
                        <Text style={styles.taskDate}>{new Date(task.date_completed).toLocaleDateString()}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTasksText}>No completed tasks</Text>
                  )}
                </ScrollView>
              </View>
              
              <View style={styles.assetsSection}>
                <Text style={styles.assetsSectionTitle}>My Collection</Text>
                <View style={styles.assetsGrid}>
                  <View style={styles.assetCard}>
                    <Ionicons name="person-outline" size={28} color="#3a86ff" />
                    <Text style={styles.assetValue}>{totalAvatarsCount || 0}</Text>
                    <Text style={styles.assetLabel}>Avatars</Text>
                  </View>
                  <View style={styles.assetCard}>
                    <Ionicons name="cube-outline" size={28} color="#3a86ff" />
                    <Text style={styles.assetValue}>{totalOwnedAssetsCount || 0}</Text>
                    <Text style={styles.assetLabel}>Assets</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'assessments' && (
            <View style={styles.assessmentTabContent}>
              <Text style={styles.assessmentSectionTitle}>Daily Assessments</Text>

              {/* Search and Export Section */}
              <View style={styles.assessmentSearchExportContainer}>
                {/* Export All Button */}
                <TouchableOpacity style={styles.assessmentExportButton} onPress={handleExportPDF}>
                  <Ionicons name="download-outline" size={20} color="#ffffff" />
                  <Text style={styles.assessmentExportButtonText}>Export All as PDF</Text>
                </TouchableOpacity>

                {/* Search Bar */}
                <View style={styles.assessmentSearchContainer}>
                  <TextInput
                    style={styles.assessmentSearchInput}
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <TouchableOpacity style={styles.assessmentSearchButton} onPress={handleSearch}>
                    <Ionicons name="search-outline" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Table Structure - Remove ScrollView */}
              <View style={styles.assessmentTableContainer}>
                {/* Table Header */}
                <View style={styles.assessmentTableHeader}>
                  <Text style={styles.assessmentTableHeaderText}>Date</Text>
                  <Text style={[styles.assessmentTableHeaderText, styles.actionColumn]}>Action</Text>
                </View>

                {/* Table Data */}
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((assessment, index) => (
                    <View key={index} style={styles.assessmentTableRow}>
                      {/* Date Column */}
                      <Text style={styles.assessmentTableCell}>
                        {new Date(assessment.date).toLocaleDateString()}
                      </Text>

                      {/* Action Button Column */}
                      <View style={[styles.assessmentTableActionCell, styles.actionColumn]}>
                        <TouchableOpacity
                          style={styles.assessmentExportButton}
                          onPress={() => handleExportUserPDF(assessment)}
                        >
                          <Ionicons name="download-outline" size={16} color="white" />
                          <Text style={styles.assessmentExportButtonText}>Export</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.assessmentNoAssessmentsText}>No assessments found</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      {/* Add Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlayPDF}>
          <View style={styles.loadingContainerPDF}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingTextPDF}>Generating PDF...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const additionalStyles = {
  listContainer: {
    marginTop: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingLeft: 5,
  },
  listItemBullet: {
    color: '#2e7d32',
    marginRight: 8,
    fontSize: 16,
  },
  listItemText: {
    flex: 1,
    color: '#689f38',
    fontSize: 16,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginTop: 5,
    width: '100%',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  allPredictionsContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionsScrollView: {
    maxHeight: 300,
  },
  predictionHistoryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  predictionHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  exportPredictionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  predictionSummary: {
    marginTop: 5,
  },
  predictionSummaryText: {
    fontSize: 14,
    color: '#666',
  },
  predictionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  exportAllButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8e9',
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 999,
    height: '100%',
    overflow: 'hidden',
  },
  sidebarContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  sidebarHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  sidebarAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  sidebarUserName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    position: 'absolute',
    top: 20,
    right: 10,
    zIndex: 1000,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  activeSidebarItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sidebarText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
  },
  collapsedSidebar: {
    flex: 1,
    paddingTop: 70,
  },
  collapsedSidebarContent: {
    alignItems: 'center',
  },
  collapsedSidebarItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f1f8e9',
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2e7d32',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e63946',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2e7d32',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  profileHeader: {
    marginBottom: 30,
  },
  profileHeaderBg: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  profileDetailsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  profileDetails: {
    fontSize: 16,
    color: '#ffffff',
  },
  profileEmailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  profileEmailIcon: {
    marginRight: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 16,
    color: '#689f38',
  },
  statStatus: {
    marginTop: 10,
    fontSize: 16,
    color: '#689f38',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIconContainer: {
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#689f38',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  lifestyleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lifestyleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lifestyleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    flex: 1,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    padding: 5,
  },
  lifestyleText: {
    fontSize: 16,
    color: '#689f38',
  },
  medicalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    flex: 1,
    marginLeft: 10,
  },
  medicalText: {
    fontSize: 16,
    color: '#689f38',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
  },
  statsGridContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statGridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGridPrimary: {
    backgroundColor: '#2e7d32',
  },
  statGridSecondary: {
    backgroundColor: '#388e3c',
  },
  statGridAccent: {
    backgroundColor: '#43a047',
  },
  statGridNeutral: {
    backgroundColor: '#66bb6a',
  },
  statGridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statGridLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  noDataText: {
    fontSize: 16,
    color: '#689f38',
    marginTop: 10,
  },
  tasksListContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tasksListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tasksListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  viewAllButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewAllText: {
    color: '#ffffff',
    fontSize: 14,
  },
  tasksScrollView: {
    maxHeight: 200,
  },
  taskListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskIconContainer: {
    marginRight: 10,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    color: '#2e7d32',
  },
  taskTime: {
    fontSize: 14,
    color: '#689f38',
  },
  taskDate: {
    fontSize: 14,
    color: '#689f38',
  },
  noTasksText: {
    fontSize: 16,
    color: '#689f38',
    textAlign: 'center',
    marginTop: 10,
  },
  assetsSection: {
    marginBottom: 20,
  },
  assetsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  assetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 10,
  },
  assetLabel: {
    fontSize: 16,
    color: '#689f38',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoCard: {
    width: '100%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  userDetailsText: {
    fontSize: 16,
    color: '#689f38',
  },
  predictionSection: {
    width: '100%',
    marginBottom: 20,
  },
  circleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  riskCard: {
    width: 150,
    alignItems: 'center',
    margin: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressChartWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressChartOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  riskName: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  riskPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  searchCreateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  assessmentsScrollView: {
    maxHeight: 400,
  },
  assessmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assessmentUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  assessmentContent: {
    fontSize: 14,
    color: '#689f38',
    marginBottom: 5,
  },
  assessmentDate: {
    fontSize: 12,
    color: '#a5d6a7',
  },
  
  // Assessment Tab Styles
  assessmentTabContent: {
    flex: 1,
    padding: 20,
    width: '100%',
  },
  assessmentSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  assessmentSearchExportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Ensures space between export & search
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  assessmentExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12, // Reduce width
    borderRadius: 5,
  },
  assessmentExportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    textAlign: 'center',
  },
  assessmentSearchContainer: {
    flex: 1,
    minWidth: 250,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
  },
  assessmentSearchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  assessmentSearchButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  assessmentTableContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  assessmentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  assessmentTableHeaderText: {
    flex: 3,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  assessmentTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  assessmentTableCell: {
    flex: 3,
    fontSize: 16,
    color: '#333',
  },
  assessmentTableActionCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionColumn: {
    flex: 1,
  },
  assessmentNoAssessmentsText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },
  exportButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  exportButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  loadingOverlayPDF: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainerPDF: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingTextPDF: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalBody: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 8,
    margin: 4,
  },
  chipSelected: {
    backgroundColor: '#2e7d32',
  },
  chipText: {
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  updateButton: {
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 5,
  },
  updateButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  radioButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  radioButtonSelected: {
    backgroundColor: '#2e7d32',
  },
  refreshButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ...additionalStyles
});

export default UserDashboard;