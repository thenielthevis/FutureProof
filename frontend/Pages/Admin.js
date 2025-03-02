import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
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
  }, []);

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
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#00CC99',
  ];

  const assetChartData = Object.keys(dashboardData.assetsByType).map((key, index) => ({
    name: key,
    population: dashboardData.assetsByType[key],
    color: chartColors[index % chartColors.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 15,
  }));

  const diseaseChartData = dashboardData.topPredictedDiseases.map((disease, index) => ({
    name: disease.condition,
    population: disease.count,
    color: chartColors[index % chartColors.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 15,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#003C2C', '#005C3C']} style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
        <View style={styles.sidebarTop}>
          <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
            <FontAwesome name="bars" size={24} color="white" />
          </TouchableOpacity>
        </View>
             {!sidebarCollapsed && (
                    <View style={styles.sidebarContent}>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
                         <FontAwesome name="home" size={24} color="white" />
                         <Text style={styles.sidebarText}>Home</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
                         <FontAwesome name="dashboard" size={24} color="white" />
                         <Text style={styles.sidebarText}>Dashboard</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
                         <FontAwesome name="user" size={24} color="white" />
                         <Text style={styles.sidebarText}>Avatars</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
                         <FontAwesome5 name="gift" size={24} color="white" />
                         <Text style={styles.sidebarText}>Daily Rewards</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AchievementsCRUD')}>
                         <FontAwesome5 name="trophy" size={24} color="white" />
                         <Text style={styles.sidebarText}>Achievements</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('quotes')}>
                         <FontAwesome name="quote-left" size={24} color="white" />
                         <Text style={styles.sidebarText}>Quotes</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('asset')}>
                         <FontAwesome name="archive" size={24} color="white" />
                         <Text style={styles.sidebarText}>Assets</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('physicalactivities')}>
                         <FontAwesome5 name="running" size={24} color="white" />
                         <Text style={styles.sidebarText}>Physical Activities</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('meditation')}>
                         <FontAwesome5 name="spa" size={24} color="white" />
                         <Text style={styles.sidebarText}>Meditation Breathing</Text>
                       </TouchableOpacity>
             </View>
           )}
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitle}>Admin Dashboard</Text>
          <FlatList
            data={dashboardCards}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.dashboardCard}>
                <Text style={styles.dashboardCardTitle}>{item.title}</Text>
                <Text style={styles.dashboardCardValue}>{item.value}</Text>
              </View>
            )}
          />
          <View style={styles.chartGrid}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Assets by Type</Text>
              <PieChart
                data={assetChartData}
                width={500}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weekly User Registrations</Text>
              <LineChart
                data={{
                  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  datasets: [
                    {
                      data: dashboardData.weeklyRegistrations,
                    },
                  ],
                }}
                width={500}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                verticalLabelRotation={30}
              />
            </View>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Monthly User Registrations</Text>
              <LineChart
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: [
                    {
                      data: dashboardData.monthlyRegistrations,
                    },
                  ],
                }}
                width={500}
                height={220}
                chartConfig={{
                  backgroundColor: '#1cc910',
                  backgroundGradientFrom: '#eff3ff',
                  backgroundGradientTo: '#efefef',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                verticalLabelRotation={30}
              />
            </View>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top 5 Predicted Diseases</Text>
              <PieChart
                data={diseaseChartData}
                width={600}
                height={220}
                chartConfig={{
                  backgroundColor: '#1cc910',
                  backgroundGradientFrom: '#eff3ff',
                  backgroundGradientTo: '#efefef',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  sidebar: {
    width: '20%',
    backgroundColor: '#1A3B32',
    padding: 20,
  },
  sidebarCollapsed: {
    width: '5%',
  },
  sidebarItem: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 18,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  contentText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003C2C',
    marginBottom: 20,
  },
  dashboard: {
    marginTop: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003C2C',
    marginBottom: 20,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    flex: 1,
    maxWidth: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  dashboardCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003C2C',
    marginBottom: 10,
  },
  dashboardCardValue: {
    fontSize: 14,
    color: '#005C3C',
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    width: '48%',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#003C2C',
  },
});

export default Admin;