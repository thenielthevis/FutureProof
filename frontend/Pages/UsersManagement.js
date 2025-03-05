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
  ActivityIndicator,
  Platform // Add this import
} from 'react-native';
import { getAllUsers, disableUser, disableInactiveUsers, deleteDisabledUsers, enableUser } from '../API/user_api';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from './Sidebar';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as FileSystem from 'expo-file-system';

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

  const convertImageToBase64 = async (uri) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");
  
      // Calculate how many users per page
      const USERS_PER_PAGE = 10;
      const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
      
      // Create header content that will appear on each page
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h4>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Users Management Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
      `;
  
      // Create first page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
            
            <div style="margin-top: 20px;">
              <h3>User Management Overview</h3>
              <p>This report provides a comprehensive overview of the registered users in the FutureProof platform. It includes user account details, activity status, and last login dates to help administrators monitor and manage user accounts effectively.</p>
              <ul>
                <li>Total Users: ${users.length}</li>
                <li>Active Users: ${users.filter(user => !user.disabled).length}</li>
                <li>Disabled Users: ${users.filter(user => user.disabled).length}</li>
              </ul>
            </div>
          </div>
        </div>
      `;
  
      // Generate pages for users with pagination
      let userPages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * USERS_PER_PAGE;
        const pageUsers = users.slice(startIdx, startIdx + USERS_PER_PAGE);
        
        const pageContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>User Accounts ${i > 0 ? `(Page ${i + 1})` : ''}</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Username</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Email</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Last Login</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageUsers.map((user, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                      <td style="padding: 12px; border: 1px solid #ddd;">${user.username || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${user.email || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">
                        <div style="display: inline-block; padding: 4px 8px; border-radius: 12px; background-color: ${user.disabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'};">
                          <span style="font-weight: 600; font-size: 12px; color: ${user.disabled ? '#B91C1C' : '#065F46'};">
                            ${user.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        userPages.push(pageContent);
      }
  
      // Combine all pages with page breaks
      const allPages = [
        firstPageContent,
        ...userPages
      ].join('<div style="page-break-after: always;"></div>');
  
      if (Platform.OS === 'web') {
        try {
          // For web platform - use jsPDF directly with separate pages
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            // Set a fixed width to match A4 dimensions (595.28pt is standard A4 width)
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
              
              // Use a fixed scale (1.0) to prevent zooming out
              const canvas = await html2canvas(container, {
                scale: 1.0, // Use natural scale
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
          const pages = [firstPageContent, ...userPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save('users-report.pdf');
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        // For mobile platforms
        try {
          const { uri } = await Print.printToFileAsync({
            html: allPages,
            base64: false,
            width: 612, // Standard 8.5" x 11" page width in points
            height: 792 // Standard 8.5" x 11" page height in points
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
    }
  };

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
      < Sidebar />
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
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#10B981'}]} 
              onPress={handleExportPDF}
            >
              <FontAwesome5 name="file-pdf" size={14} color="white" />
              <Text style={styles.actionButtonText}>Export PDF</Text>
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