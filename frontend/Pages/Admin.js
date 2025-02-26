import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const Admin = () => {
  const navigation = useNavigation();
  console.log('Admin component rendered'); // Add this line

  return (
    <View style={styles.container}>
    {/* Sidebar */}
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

      <View style={styles.content}>
        <Text style={styles.contentText}>Welcome to the Admin Page</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '20%',
    backgroundColor: '#1A3B32',
    padding: 20,
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
  },
  contentText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Admin;
