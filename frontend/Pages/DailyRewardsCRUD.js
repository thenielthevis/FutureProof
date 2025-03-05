import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, Picker, ScrollView, Modal, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDailyReward, readDailyRewards, updateDailyReward, deleteDailyReward } from '../API/daily_rewards_api';
import { readAvatars, getAvatar } from '../API/avatar_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';

const DailyRewardsCRUD = () => {
  const navigation = useNavigation();
  const [rewards, setRewards] = useState([]);
  const [day, setDay] = useState('');
  const [coins, setCoins] = useState('');
  const [avatar, setAvatar] = useState('');
  const [top, setTop] = useState('');
  const [bottom, setBottom] = useState('');
  const [shoes, setShoes] = useState('');
  const [editingReward, setEditingReward] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [avatarImages, setAvatarImages] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAvatars, setFilteredAvatars] = useState([]);
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const rewardsData = await readDailyRewards();
        setRewards(rewardsData);
        setFilteredAvatars(rewardsData);
      } catch (error) {
        console.error('Error fetching daily rewards:', error);
      }
    };

    const fetchAvatars = async () => {
      try {
        const avatarsData = await readAvatars();
        setAvatars(avatarsData);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchRewards();
    fetchAvatars();
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchAvatarImages = async () => {
      try {
        const images = {};
        for (const reward of rewards) {
          if (reward.avatar) {
            const avatarData = await getAvatar(reward.avatar);
            images[reward.avatar] = avatarData.url;
          }
        }
        setAvatarImages(images);
      } catch (error) {
        console.error('Error fetching avatar images:', error);
      }
    };

    fetchAvatarImages();
  }, [rewards]);

  const convertImageToBase64 = async (uri) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // Fetch remote image and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Convert local image to base64
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
      // Convert all avatar images to base64
      const rewardsWithImages = await Promise.all(
        rewards.map(async (reward) => {
          if (reward.avatar && avatarImages[reward.avatar]) {
            const imageSrc = await convertImageToBase64(avatarImages[reward.avatar]);
            return { ...reward, imageSrc };
          }
          return { ...reward, imageSrc: null }; // No image available
        })
      );

      // HTML content for the PDF
      const logo1 = "https://i.ibb.co/GQygLXT9/tuplogo.png";
      const logo2 = "https://i.ibb.co/YBStKgFC/logo-2.png";

      // Convert logo URLs to base64
      const logo1Base64 = await convertImageToBase64(logo1);
      const logo2Base64 = await convertImageToBase64(logo2);


      const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center;">
            <h1 style="style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
             <h2 style="font-size: 16px; margin: 0;">Daily Rewards Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Avatar</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Day</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Coins</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Top ID</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Bottom ID</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Shoes ID</th>
            </tr>
          </thead>
          <tbody>
            ${rewardsWithImages.map((reward, index) => `
              <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                <td style="padding: 12px; border: 1px solid #ddd;">
                  ${reward.imageSrc ? `<img src="${reward.imageSrc}" alt="Avatar" style="max-width: 80px; max-height: 60px;">` : 'No Image'}
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.day || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.coins || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.top || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.bottom || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.shoes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

      if (Platform.OS === 'web') {
        // Create a hidden container to render the HTML
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        // Wait for all images to load
        const waitForImages = () => {
          const images = container.getElementsByTagName('img');
          return Promise.all(
            Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
              });
            })
          );
        };

        try {
          await waitForImages(); // Wait for images to load
          const canvas = await html2canvas(container); // Capture the content as an image
          const imgData = canvas.toDataURL('image/png'); // Convert canvas to image data URL

          // Generate PDF
          const pdf = new jsPDF('p', 'pt', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('daily-reward-report.pdf'); // Save the PDF
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
          document.body.removeChild(container); // Clean up the hidden container
        }
      } else {
        // For mobile, use expo-print
        try {
          const { uri } = await Print.printToFileAsync({ html: htmlContent });
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

  const handleCreateReward = async () => {
    try {
      const newReward = await createDailyReward({ day, coins, avatar, top, bottom, shoes });
      setRewards([...rewards, newReward]);
      setFilteredAvatars([...rewards, newReward]); // Update filteredAvatars
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Reward created successfully!',
      });
    } catch (error) {
      console.error('Error creating reward:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create reward. Please try again.',
      });
    }
  };

  const handleUpdateReward = async () => {
    try {
      const updatedReward = await updateDailyReward(editingReward._id, { day, coins, avatar, top, bottom, shoes });
      const updatedRewards = rewards.map(reward => (reward._id === editingReward._id ? updatedReward : reward));
      setRewards(updatedRewards);
      setFilteredAvatars(updatedRewards); // Update filteredAvatars
      setEditingReward(null);
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Reward updated successfully!',
      });
    } catch (error) {
      console.error('Error updating reward:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update reward. Please try again.',
      });
    }
  };

  const handleDeleteReward = async (rewardId) => {
    try {
      await deleteDailyReward(rewardId);
      const updatedRewards = rewards.filter(reward => reward._id !== rewardId);
      setRewards(updatedRewards);
      setFilteredAvatars(updatedRewards); // Update filteredAvatars
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Reward deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting reward:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete reward. Please try again.',
      });
    }
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setDay(reward.day);
    setCoins(reward.coins);
    setAvatar(reward.avatar);
    setTop(reward.top);
    setBottom(reward.bottom);
    setShoes(reward.shoes);
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingReward(null);
    setDay('');
    setCoins('');
    setAvatar('');
    setTop('');
    setBottom('');
    setShoes('');
    setModalVisible(true);
  };

  const handleSearch = async () => {
    try {
      const rewardsData = await readDailyRewards();
      const filtered = rewardsData.filter(reward => {
        const dayMatch = String(reward.day).toLowerCase().includes(searchQuery.toLowerCase());
        const coinsMatch = reward.coins.toString().includes(searchQuery);
        return dayMatch || coinsMatch;
      });
      setFilteredAvatars(filtered);
    } catch (error) {
      console.error('Error fetching daily rewards:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <View style={styles.container}>
      <Sidebar />
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
          <Text style={styles.pageTitle}>Daily Rewards Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Reward</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
              <FontAwesome5 name="file-pdf" size={14} color="white" />
              <Text style={styles.actionButtonText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by day or coins..."
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
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Day</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Coins</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Avatar</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Top ID</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Bottom ID</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Shoes ID</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {rewards.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.day}</Text>
                <View style={[styles.tableCell, {flex: 1, flexDirection: 'row', alignItems: 'center'}]}>
                  <FontAwesome5 name="coins" size={14} color="gold" style={{marginRight: 5}} />
                  <Text>{item.coins}</Text>
                </View>
                <View style={[styles.tableCell, {flex: 1}]}>
                  {item.avatar && avatarImages[item.avatar] ? (
                    <Image source={{ uri: avatarImages[item.avatar] }} style={styles.avatarImage} />
                  ) : (
                    <Text>No Avatar</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.top}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.bottom}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.shoes}</Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditReward(item)}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => {
                      setSelectedReward(item._id);
                      setDeleteModalVisible(true);
                    }}
                  >
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredAvatars.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="coins" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No rewards found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new reward</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>
                  {editingReward ? 'Update Reward' : 'Create New Reward'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Day</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter day number"
                    value={day}
                    onChangeText={setDay}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Coins</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter coin amount"
                    value={coins}
                    onChangeText={setCoins}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar</Text>
                  <Picker
                    selectedValue={avatar}
                    style={styles.picker}
                    onValueChange={(itemValue) => setAvatar(itemValue)}
                  >
                    <Picker.Item label="Select Avatar" value="" />
                    {avatars.map((avatar) => (
                      <Picker.Item key={avatar._id} label={avatar.name} value={avatar._id} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Top ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter top clothing ID"
                    value={top}
                    onChangeText={setTop}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bottom ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter bottom clothing ID"
                    value={bottom}
                    onChangeText={setBottom}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Shoes ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter shoes ID"
                    value={shoes}
                    onChangeText={setShoes}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={editingReward ? handleUpdateReward : handleCreateReward}
                >
                  <Text style={styles.submitButtonText}>
                    {editingReward ? 'Update Reward' : 'Create Reward'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="slide"
        >
          <View style={styles.deleteModal_overlay}>
            <View style={styles.deleteModal_content}>
              <View style={styles.deleteModal_header}>
                <Text style={styles.deleteModal_headerText}>Confirm Delete</Text>
              </View>

              <View style={styles.deleteModal_body}>
                <Text style={styles.deleteModal_text}>
                  Are you sure you want to delete this daily reward?
                </Text>
              </View>

              <View style={styles.deleteModal_footer}>
                <TouchableOpacity 
                  onPress={() => setDeleteModalVisible(false)} 
                  style={styles.deleteModal_cancelButton}
                >
                  <Text style={styles.deleteModal_cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => {
                    if (selectedReward) {
                      handleDeleteReward(selectedReward);
                      setDeleteModalVisible(false);
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No reward selected for deletion',
                      });
                    }
                  }} 
                  style={styles.deleteModal_deleteButton}
                >
                  <Text style={styles.deleteModal_deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionCell: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editBtn: {
    backgroundColor: '#3B82F6',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 10,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Delete Modal Styles
  deleteModal_overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  deleteModal_content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  deleteModal_header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deleteModal_headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B91C1C', // Dark Red for danger
  },
  deleteModal_body: {
    padding: 20,
    alignItems: 'center',
  },
  deleteModal_text: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  deleteModal_footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deleteModal_cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteModal_cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  deleteModal_deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  deleteModal_deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default DailyRewardsCRUD;