import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Admin = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.sidebarText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
          <Text style={styles.sidebarText}>Avatars</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
          <Text style={styles.sidebarText}>Daily Rewards</Text>
        </TouchableOpacity>
      </View>
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
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 18,
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
