import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import { getPrediction } from '../API/prediction_api';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, ProgressChart, PieChart } from 'react-native-chart-kit';
import { getTaskCompletionsByUser, getTodayTaskCompletionsByUser } from '../API/task_completion_api';
import { getTotalOwnedAssetsCount } from '../API/assets_api';
import { getTotalAvatarsCount, getTotalCoins } from '../API/user_api';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalOwnedAssetsCount, setTotalOwnedAssetsCount] = useState(0);
  const [totalAvatarsCount, setTotalAvatarsCount] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const sidebarAnimation = useState(new Animated.Value(250))[0];
  const contentMarginAnimation = useState(new Animated.Value(250))[0];

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
        setTotalOwnedAssetsCount(totalCount);
      } catch (err) {
        setError(err.detail || 'An error occurred');
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

  const bmi = calculateBMI(parseFloat(user.height), parseFloat(user.weight));
  const bmiStatus = getBMIStatus(bmi);
  const bmiColor = getBMIColor(bmi);

  const formatPrediction = (prediction) => {
    const diseaseLabels = prediction.predicted_diseases?.map((item) => item.condition) || [];
    const diseaseData = prediction.predicted_diseases?.map((item) => parseInt(item.details.match(/\d+/)?.[0] || 0)) || [];

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
        data: taskCompletions.length > 0 ? taskCompletions.map((task) => task.time_spent) : [0],
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
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

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: bmiColor }]}>
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
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lifestyleText}>{user.lifestyle || 'No lifestyle data available'}</Text>
                </View>
                
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="nutrition-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Nutrition</Text>
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lifestyleText}>{user.food_intake || 'No nutrition data available'}</Text>
                </View>
                
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleHeader}>
                    <Ionicons name="bed-outline" size={24} color="#3a86ff" />
                    <Text style={styles.lifestyleTitle}>Sleep</Text>
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lifestyleText}>{user.sleep_hours || '>6 Hours'}</Text>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <View style={styles.medicalCard}>
                  <View style={styles.medicalHeader}>
                    <Ionicons name="medical-outline" size={24} color="#3a86ff" />
                    <Text style={styles.medicalTitle}>Genetic Background</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.genetic_diseases || 'No genetic data available'}</Text>
                </View>
                
                <View style={styles.medicalCard}>
                  <View style={styles.medicalHeader}>
                    <Ionicons name="warning-outline" size={24} color="#3a86ff" />
                    <Text style={styles.medicalTitle}>Risk Factors</Text>
                  </View>
                  <Text style={styles.medicalText}>{user.vices || 'No risk factors recorded'}</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'prediction' && (
            <View style={styles.tabContent}>
              {formatPrediction(prediction)}
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
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
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
    backgroundColor: 'rgba(255,59,48,0.2)',
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
});

export default UserDashboard;
