import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTotalUsers } from '../API/user_api';
import { readAssets } from '../API/assets_api';
import { readAvatars } from '../API/avatar_api';
import { getMeditationBreathingExercises } from '../API/meditation_api';
import { getPhysicalActivities } from '../API/physical_activities_api';
import { readQuotes } from '../API/quotes_api';
import { getAllTaskCompletions } from '../API/task_completion_api';

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

        setDashboardData((prevData) => ({
          ...prevData,
          totalUsers,
          totalAssets,
          totalAvatars,
          totalMeditationExercises,
          totalPhysicalActivities,
          totalQuotes,
          totalTaskCompletions,
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
  ];

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
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
              <FontAwesome name="dashboard" size={24} color="white" />
              <Text style={styles.sidebarText}>DASHBOARD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
              <FontAwesome name="home" size={24} color="white" />
              <Text style={styles.sidebarText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
              <FontAwesome name="user" size={24} color="white" />
              <Text style={styles.sidebarText}>Avatars</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
              <FontAwesome5 name="gift" size={24} color="white" />
              <Text style={styles.sidebarText}>Daily Rewards</Text>
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
        <Text style={styles.contentText}>Welcome to the Admin Page</Text>
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitle}>Dashboard Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dashboardRow}>
              {dashboardCards.map((card, index) => (
                <View key={index} style={styles.dashboardCard}>
                  <Text style={styles.dashboardCardTitle}>{card.title}</Text>
                  <Text style={styles.dashboardCardValue}>{card.value}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
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
  dashboardRow: {
    flexDirection: 'row',
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: 150, // Adjust the width to make the cards smaller
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
});

export default Admin;