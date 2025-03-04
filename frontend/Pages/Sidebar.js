import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Sidebar = () => {
  const navigation = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
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
          <TouchableOpacity style={styles.sidebarIconOnly} onPress={() => navigation.navigate('Admin')}>
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
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
              <FontAwesome5 name="tachometer-alt" size={16} color="white" />
              <Text style={styles.sidebarText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Assessments')}>
              <FontAwesome5 name="clipboard-list" size={16} color="white" />
              <Text style={styles.sidebarText}>Assessments</Text>
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
  );
};

const styles = StyleSheet.create({
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
});

export default Sidebar;
