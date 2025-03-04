import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Sidebar = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={['#003C2C', '#005C3C']} style={styles.sidebar}>
      <View style={styles.sidebarTop}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
          <FontAwesome name="home" size={24} color="white" />
          <Text style={styles.sidebarText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
          <FontAwesome name="dashboard" size={24} color="white" />
          <Text style={styles.sidebarText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Assessments')}>
          <FontAwesome name="dashboard" size={24} color="white" />
          <Text style={styles.sidebarText}>Assessments</Text>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: '20%',
    backgroundColor: '#1A3B32',
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
});

export default Sidebar;
