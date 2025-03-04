import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { getAllUsers, disableUser, disableInactiveUsers, deleteDisabledUsers, enableUser } from '../API/user_api';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [headerAnimation] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const usersData = await getAllUsers(token);
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDisableUser = async (userId, username) => {
    console.log(`Disabling user: ${username} with ID: ${userId}`); // Debugging line
    Alert.alert(
      "Confirm Disable",
      `Are you sure you want to disable user "${username}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disable", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              await disableUser(token, userId);
              const updatedUsers = await getAllUsers(token);
              setUsers(updatedUsers);
              setFilteredUsers(
                updatedUsers.filter(user => 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
              Alert.alert('Success', `User "${username}" disabled successfully`);
            } catch (error) {
              console.error('Error disabling user:', error);
              Alert.alert('Error', 'Failed to disable user. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleDisableUserDirect = async (userId, username) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await disableUser(token, userId);
      const updatedUsers = await getAllUsers(token);
      setUsers(updatedUsers);
      setFilteredUsers(
        updatedUsers.filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      Alert.alert('Success', `User "${username}" disabled successfully`);
    } catch (error) {
      console.error('Error disabling user:', error);
      Alert.alert('Error', 'Failed to disable user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableUser = async (userId, username) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await enableUser(token, userId);
      const updatedUsers = await getAllUsers(token);
      setUsers(updatedUsers);
      setFilteredUsers(
        updatedUsers.filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      Alert.alert('Success', `User "${username}" enabled successfully`);
    } catch (error) {
      console.error('Error enabling user:', error);
      Alert.alert('Error', 'Failed to enable user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableInactiveUsers = async () => {
    Alert.alert(
      "Confirm Disable Inactive Users",
      "Are you sure you want to disable all inactive users?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disable Inactive", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              await disableInactiveUsers(token);
              const updatedUsers = await getAllUsers(token);
              setUsers(updatedUsers);
              setFilteredUsers(
                updatedUsers.filter(user => 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
              Alert.alert('Success', 'Inactive users disabled successfully');
            } catch (error) {
              console.error('Error disabling inactive users:', error);
              Alert.alert('Error', 'Failed to disable inactive users. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleDeleteDisabledUsers = async () => {
    Alert.alert(
      "Confirm Delete Disabled Users",
      "Are you sure you want to permanently delete all disabled users? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanently", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              await deleteDisabledUsers(token);
              const updatedUsers = await getAllUsers(token);
              setUsers(updatedUsers);
              setFilteredUsers(
                updatedUsers.filter(user => 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
              Alert.alert('Success', 'Disabled users deleted successfully');
            } catch (error) {
              console.error('Error deleting disabled users:', error);
              Alert.alert('Error', 'Failed to delete disabled users. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleSearch = () => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
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
            <TouchableOpacity style={[styles.sidebarIconOnly, styles.activeMenuItem]} onPress={() => navigation.navigate('users')}>
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
              <TouchableOpacity style={[styles.sidebarItem, styles.activeMenuItem]} onPress={() => navigation.navigate('users')}>
                <FontAwesome name="users" size={16} color="white" />
                <Text style={styles.sidebarText}>Manage Users</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.mainContent}>
        <Animated.View 
          style={[
            styles.pageHeader,
            {
              opacity: headerAnimation,
              transform: [{ translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}]
            }
          ]}
        >
          <Text style={styles.pageTitle}>Users Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#3B82F6'}]} 
              onPress={handleDisableInactiveUsers}
            >
              <FontAwesome5 name="user-clock" size={14} color="white" />
              <Text style={styles.actionButtonText}>Disable Inactive</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#EF4444'}]} 
              onPress={handleDeleteDisabledUsers}
            >
              <FontAwesome5 name="trash-alt" size={14} color="white" />
              <Text style={styles.actionButtonText}>Delete Disabled</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tableWrapper}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 1.5}]}>Username</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Email</Text>
              <Text style={[styles.tableHeaderText, {flex: 1.5}]}>Last Login</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Status</Text>
              <Text style={[styles.tableHeaderText, {flex: 1.5}]}>Actions</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <View style={styles.tableRow} key={user._id}>
                  <Text style={[styles.tableCell, {flex: 1.5}]}>{user.username}</Text>
                  <Text style={[styles.tableCell, {flex: 2}]}>{user.email}</Text>
                  <Text style={[styles.tableCell, {flex: 1.5}]}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </Text>
                  <View style={[styles.tableCell, {flex: 1}]}>
                    <View style={[
                      styles.statusBadge, 
                      user.disabled ? styles.statusDisabled : styles.statusActive
                    ]}>
                      <Text style={styles.statusText}>
                        {user.disabled ? 'Disabled' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.actionCell, {flex: 1.5}]}>
                    {user.disabled ? (
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.enableBtn]} 
                        onPress={() => handleEnableUser(user._id, user.username)}
                      >
                        <FontAwesome5 name="user-check" size={14} color="white" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.disableBtn]} 
                          onPress={() => handleDisableUser(user._id, user.username)}
                        >
                          <FontAwesome5 name="user-slash" size={14} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.disableBtn]} 
                          onPress={() => handleDisableUserDirect(user._id, user.username)}
                        >
                          <FontAwesome5 name="user-times" size={14} color="white" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5 name="users-slash" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search criteria</Text>
              </View>
            )}
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
  // Modern Sidebar styles
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
  
  // Main content styles
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 10,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
    paddingLeft: 16,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#10B981',
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  
  // Table styles
  tableWrapper: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#4B5563',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  enableBtn: {
    backgroundColor: '#10B981',
  },
  disableBtn: {
    backgroundColor: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default Users;