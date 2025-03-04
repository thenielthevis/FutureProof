import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTotalUsers, getUserRegistrationsByDate } from '../API/user_api';
import { readAssets } from '../API/assets_api';
import { readAvatars } from '../API/avatar_api';
import { getMeditationBreathingExercises } from '../API/meditation_api';
import { getPhysicalActivities } from '../API/physical_activities_api';
import { readQuotes } from '../API/quotes_api';
import { getAllTaskCompletions } from '../API/task_completion_api';
import { getMostPredictedDisease, getTopPredictedDiseases } from '../API/prediction_api';
import { PieChart, LineChart } from 'react-native-chart-kit';

const Admin = () => {
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    totalUsers: 0,
    totalAvatars: 0,
    totalMeditationExercises: 0,
    totalPhysicalActivities: 0,
    totalQuotes: 0,
    mostPredictedDiseases: [],
    totalTaskCompletions: 0,
    assetsByType: {},
    weeklyRegistrations: Array(7).fill(0),  // Initialize with 7 days
    monthlyRegistrations: Array(12).fill(0),  // Initialize with 12 months
    topPredictedDiseases: [],
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const totalUsers = await getTotalUsers(token);
        const assets = await readAssets();
        const totalAssets = assets.length;
        const assetsByType = assets.reduce((acc, asset) => {
          acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
          return acc;
        }, {});
        const avatars = await readAvatars();
        const totalAvatars = avatars.length;
        const meditationExercises = await getMeditationBreathingExercises();
        const totalMeditationExercises = meditationExercises.length;
        const physicalActivities = await getPhysicalActivities();
        const totalPhysicalActivities = physicalActivities.length;
        const quotes = await readQuotes();
        const totalQuotes = quotes.length;
        const taskCompletions = await getAllTaskCompletions();
        const totalTaskCompletions = taskCompletions.length;
        const mostPredictedDisease = await getMostPredictedDisease(token);
        const topPredictedDiseases = await getTopPredictedDiseases(token);
        const registrations = await getUserRegistrationsByDate(token);

        setDashboardData((prevData) => ({
          ...prevData,
          totalUsers,
          totalAssets,
          totalAvatars,
          totalMeditationExercises,
          totalPhysicalActivities,
          totalQuotes,
          totalTaskCompletions,
          mostPredictedDisease,
          assetsByType,
          weeklyRegistrations: registrations.weekly_registrations,
          monthlyRegistrations: registrations.monthly_registrations,
          topPredictedDiseases,
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get icon for dashboard card based on title
  const getCardIcon = (title) => {
    switch (title) {
      case 'Total Assets': return <FontAwesome5 name="boxes" size={24} color="#10B981" />;
      case 'Total Users': return <FontAwesome5 name="users" size={24} color="#10B981" />;
      case 'Total Avatars': return <FontAwesome5 name="user-astronaut" size={24} color="#10B981" />;
      case 'Total Meditation Exercises': return <FontAwesome5 name="spa" size={24} color="#10B981" />;
      case 'Total Physical Activities': return <FontAwesome5 name="running" size={24} color="#10B981" />;
      case 'Total Quotes': return <FontAwesome5 name="quote-right" size={24} color="#10B981" />;
      case 'Total Task Completions': return <FontAwesome5 name="tasks" size={24} color="#10B981" />;
      case 'Most Predicted Disease': return <FontAwesome5 name="heartbeat" size={24} color="#10B981" />;
      default: return <FontAwesome5 name="chart-bar" size={24} color="#10B981" />;
    }
  };

  const dashboardCards = [
    { title: 'Total Assets', value: dashboardData.totalAssets },
    { title: 'Total Users', value: dashboardData.totalUsers },
    { title: 'Total Avatars', value: dashboardData.totalAvatars },
    { title: 'Total Meditation Exercises', value: dashboardData.totalMeditationExercises },
    { title: 'Total Physical Activities', value: dashboardData.totalPhysicalActivities },
    { title: 'Total Quotes', value: dashboardData.totalQuotes },
    { title: 'Total Task Completions', value: dashboardData.totalTaskCompletions },
    { title: 'Most Predicted Disease', value: dashboardData.mostPredictedDisease },
  ];

  const chartColors = [
    '#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#34D399', '#6EE7B7', '#A7F3D0',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#84cc16', '#65a30d', '#4d7c0f',
  ];

  const assetChartData = Object.keys(dashboardData.assetsByType).map((key, index) => ({
    name: key,
    population: dashboardData.assetsByType[key],
    color: chartColors[index % chartColors.length],
    legendFontColor: '#555',
    legendFontSize: 12,
  }));

  const diseaseChartData = dashboardData.topPredictedDiseases.map((disease, index) => ({
    name: disease.condition,
    population: disease.count,
    color: chartColors[index % chartColors.length],
    legendFontColor: '#555',
    legendFontSize: 12,
  }));

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#10B981"
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Sidebar with Gradient */}
      <LinearGradient 
        colors={['#0F766E', '#065F46']} 
        start={{x: 0, y: 0}} 
        end={{x: 0, y: 1}} 
        style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}
      >
        <View style={styles.sidebarTop}>
          {sidebarCollapsed ? (
            <TouchableOpacity style={styles.sidebarLogoCollapsed} onPress={toggleSidebar}>
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarBrand}>FutureProof</Text>
              <TouchableOpacity style={styles.collapseButton} onPress={toggleSidebar}>
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {sidebarCollapsed ? (
          <View style={styles.collapsedMenuItems}>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('Home')}>
              <FontAwesome name="home" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sidebarIconOnly, styles.activeMenuItem]} onPress={() => navigation.navigate('Admin')}>
              <FontAwesome5 name="tachometer-alt" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('AvatarCRUD')}>
              <FontAwesome name="user" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
              <FontAwesome5 name="gift" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('AchievementsCRUD')}>
              <FontAwesome5 name="trophy" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('quotes')}>
              <FontAwesome name="quote-left" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('asset')}>
              <FontAwesome name="archive" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('physicalactivities')}>
              <FontAwesome5 name="running" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('meditation')}>
              <FontAwesome5 name="spa" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('users')}>
              <FontAwesome name="users" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sidebarContent}>
            <View style={styles.menuGroup}>
              <Text style={styles.menuLabel}>MAIN</Text>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
                <FontAwesome5 name="home" size={16} color="white" />
                <Text style={styles.sidebarText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarItem, styles.activeMenuItem]} onPress={() => navigation.navigate('Admin')}>
                <FontAwesome5 name="tachometer-alt" size={16} color="white" />
                <Text style={styles.sidebarText}>Dashboard</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuGroup}>
              <Text style={styles.menuLabel}>CONTENT</Text>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
                <FontAwesome name="user" size={16} color="white" />
                <Text style={styles.sidebarText}>Avatars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
                <FontAwesome5 name="gift" size={16} color="white" />
                <Text style={styles.sidebarText}>Daily Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AchievementsCRUD')}>
                <FontAwesome5 name="trophy" size={16} color="white" />
                <Text style={styles.sidebarText}>Achievements</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('quotes')}>
                <FontAwesome name="quote-left" size={16} color="white" />
                <Text style={styles.sidebarText}>Quotes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('asset')}>
                <FontAwesome name="archive" size={16} color="white" />
                <Text style={styles.sidebarText}>Assets</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuGroup}>
              <Text style={styles.menuLabel}>ACTIVITIES</Text>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('physicalactivities')}>
                <FontAwesome5 name="running" size={16} color="white" />
                <Text style={styles.sidebarText}>Physical Activities</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('meditation')}>
                <FontAwesome5 name="spa" size={16} color="white" />
                <Text style={styles.sidebarText}>Meditation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuGroup}>
              <Text style={styles.menuLabel}>USERS</Text>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('users')}>
                <FontAwesome name="users" size={16} color="white" />
                <Text style={styles.sidebarText}>Manage Users</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {!sidebarCollapsed && (
          <View style={styles.sidebarFooter}>
          </View>
        )}
      </LinearGradient>

      <View style={styles.mainContent}>
        <ScrollView style={styles.content}>
          <View style={styles.dashboard}>
            <Text style={styles.pageTitle}>Admin Dashboard</Text>
            
            {/* Summary Cards */}
            <View style={styles.cardsContainer}>
              <FlatList
                data={dashboardCards}
                numColumns={4}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.dashboardCard}>
                    <View style={styles.cardIconContainer}>
                      {getCardIcon(item.title)}
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.dashboardCardValue}>
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </Text>
                      <Text style={styles.dashboardCardTitle}>{item.title}</Text>
                    </View>
                  </View>
                )}
              />
            </View>
            
            <View style={styles.chartGrid}>
              {/* Weekly User Registrations */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Weekly User Registrations</Text>
                  <View style={styles.chartActions}>
                    <TouchableOpacity style={styles.chartAction}>
                      <MaterialIcons name="refresh" size={18} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartAction}>
                      <FontAwesome name="ellipsis-v" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <LineChart
                  data={{
                    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    datasets: [
                      {
                        data: dashboardData.weeklyRegistrations,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        strokeWidth: 2
                      },
                    ],
                  }}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              
              {/* Assets by Type */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Assets by Type</Text>
                  <View style={styles.chartActions}>
                    <TouchableOpacity style={styles.chartAction}>
                      <MaterialIcons name="refresh" size={18} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartAction}>
                      <FontAwesome name="ellipsis-v" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <PieChart
                  data={assetChartData}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
              
              {/* Monthly User Registrations */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Monthly User Registrations</Text>
                  <View style={styles.chartActions}>
                    <TouchableOpacity style={styles.chartAction}>
                      <MaterialIcons name="refresh" size={18} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartAction}>
                      <FontAwesome name="ellipsis-v" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <LineChart
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                      {
                        data: dashboardData.monthlyRegistrations,
                        color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                        strokeWidth: 2
                      },
                    ],
                  }}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              
              {/* Top 5 Predicted Diseases */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Top 5 Predicted Diseases</Text>
                  <View style={styles.chartActions}>
                    <TouchableOpacity style={styles.chartAction}>
                      <MaterialIcons name="refresh" size={18} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chartAction}>
                      <FontAwesome name="ellipsis-v" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <PieChart
                  data={diseaseChartData}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fc',
  },
  // Sidebar styles
  sidebar: {
    width: 240,
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarTop: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    width: '100%',
  },
  sidebarBrand: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collapseButton: {
    position: 'absolute',
    right: 5,
  },
  sidebarLogoCollapsed: {
    marginTop: 10,
    marginBottom: 20,
  },
  sidebarContent: {
    flex: 1,
  },
  menuGroup: {
    marginBottom: 22,
  },
  menuLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  sidebarIconOnly: {
    alignItems: 'center',
    paddingVertical: 12,
    width: 60,
    marginBottom: 1,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  sidebarText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 10,
  },
  collapsedMenuItems: {
    alignItems: 'center',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 10,
  },
  
  // Main content styles
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  content: {
    flex: 1,
    padding: 25,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 25,
  },
  dashboard: {
  },
  cardsContainer: {
    marginBottom: 25,
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    margin: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: '22%',
    maxWidth: '23%',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  dashboardCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  dashboardCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartActions: {
    flexDirection: 'row',
  },
  chartAction: {
    padding: 5,
    marginLeft: 5,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
});

export default Admin;