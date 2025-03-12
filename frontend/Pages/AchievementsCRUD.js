import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Animated, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAchievement, readAchievements, updateAchievement, deleteAchievement } from '../API/achievements_api';
import { readAvatars, getAvatar } from '../API/avatar_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';

const AchievementsCRUD = () => {
  const navigation = useNavigation();
  const [achievements, setAchievements] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coins, setCoins] = useState('');
  const [xp, setXp] = useState('');
  const [requirements, setRequirements] = useState('');
  const [avatar, setAvatar] = useState('');
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [avatarImages, setAvatarImages] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const achievementsData = await readAchievements();
        setAchievements(achievementsData);
        setFilteredAchievements(achievementsData);
      } catch (error) {
        console.error('Error fetching achievements:', error);
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

    fetchAchievements();
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
        for (const achievement of achievements) {
          if (achievement.avatar_id) {
            const avatarData = await getAvatar(achievement.avatar_id);
            images[achievement.avatar_id] = avatarData.url;
          }
        }
        setAvatarImages(images);
      } catch (error) {
        console.error('Error fetching avatar images:', error);
      }
    };

    fetchAvatarImages();
  }, [achievements]);

  const handleCreateAchievement = async () => {
    try {
      const newAchievement = await createAchievement({
        name,
        description,
        coins: Number(coins), // Ensure numbers
        xp: Number(xp), // Ensure numbers
        requirements,
        avatar_id: avatar ? String(avatar) : null, // Convert avatar to string or null
      });

      setAchievements([...achievements, newAchievement]);
      setFilteredAchievements([...filteredAchievements, newAchievement]);
      setModalVisible(false);
      setName('');
      setDescription('');
      setCoins('');
      setXp('');
      setRequirements('');
      setAvatar('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement created successfully!',
      });
    } catch (error) {
      console.error('Error creating achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create achievement. Please try again.',
      });
    }
  };

  const resetForm = () => {
    setEditingAchievement(null);
    setName('');
    setDescription('');
    setCoins('');
    setXp('');
    setRequirements('');
    setAvatar('');
  }

  const handleUpdateAchievement = async () => {
    try {
      if (!editingAchievement?._id) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No achievement selected for update',
        });
        return;
      }
  
      const updateData = {
        name,
        description,
        coins: parseInt(coins),
        xp: parseInt(xp),
        requirements,
        avatar_id: avatar || null,
      };
  
      console.log('Updating achievement:', editingAchievement._id);
      console.log('Update data:', updateData);
  
      const updatedAchievement = await updateAchievement(editingAchievement._id, updateData);
  
      setAchievements(prevAchievements => 
        prevAchievements.map(achievement => 
          achievement._id === editingAchievement._id ? updatedAchievement : achievement
        )
      );
      
      setFilteredAchievements(prevFiltered => 
        prevFiltered.map(achievement => 
          achievement._id === editingAchievement._id ? updatedAchievement : achievement
        )
      );
  
      setModalVisible(false);
      resetForm();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement updated successfully!',
      });
    } catch (error) {
      console.error('Error updating achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update achievement',
      });
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    try {
      await deleteAchievement(achievementId);
      const updatedAchievements = achievements.filter(achievement => achievement._id !== achievementId);
      setAchievements(updatedAchievements);
      setFilteredAchievements(updatedAchievements);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete achievement. Please try again.',
      });
    }
  };

  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement);
    setName(achievement.name);
    setDescription(achievement.description);
    setCoins(achievement.coins.toString());
    setXp(achievement.xp.toString());
    setRequirements(achievement.requirements);
    setAvatar(achievement.avatar_id || '');
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingAchievement(null);
    setName('');
    setDescription('');
    setCoins('');
    setXp('');
    setRequirements('');
    setAvatar('');
    setModalVisible(true);
  };
  
  const handleSearch = () => {
    const filtered = achievements.filter(achievement =>
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.requirements.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAchievements(filtered);
  };

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
    setIsLoading(true);
    try {
      // Convert all avatar images to base64
      const achievementsWithImages = await Promise.all(
        achievements.map(async (achievement) => {
          if (achievement.avatar_id && avatarImages[achievement.avatar_id]) {
            try {
              const imageSrc = await convertImageToBase64(avatarImages[achievement.avatar_id]);
              return { ...achievement, imageSrc };
            } catch (error) {
              console.error('Error converting image:', error);
              return { ...achievement, imageSrc: null };
            }
          }
          return { ...achievement, imageSrc: null };
        })
      );
  
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");
  
      // Calculate how many achievements per page
      const ACHIEVEMENTS_PER_PAGE = 6;
      const totalPages = Math.ceil(achievementsWithImages.length / ACHIEVEMENTS_PER_PAGE);
      
      // Create header content for each page
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h4>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Achievements Report</h2>
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
          </div>
        </div>
      `;
  
      // Generate pages for achievements with pagination
      let achievementPages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * ACHIEVEMENTS_PER_PAGE;
        const pageAchievements = achievementsWithImages.slice(startIdx, startIdx + ACHIEVEMENTS_PER_PAGE);
        
        const pageContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>Achievements ${i > 0 ? `(Page ${i + 1})` : ''}</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Avatar</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Name</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Description</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Requirements</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageAchievements.map((achievement, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                        ${achievement.imageSrc ? `<img src="${achievement.imageSrc}" alt="${achievement.name}" style="width: 60px; height: 60px; object-fit: cover; display: block; margin: 0 auto; border-radius: 30px;">` : 'No Avatar'}
                      </td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${achievement.name || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${achievement.description || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">${achievement.requirements || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd;">
                        <div style="display: flex; align-items: center;">
                          <strong style="margin-right: 10px;">
                            <span style="color: gold;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" style="fill: gold; display: inline; margin-right: 2px;">
                                <path d="M512 80c0 18-14.3 34.6-38.4 48c-29.1 16.1-72.5 27.5-122.3 30.9c-3.7-1.8-7.4-3.5-11.3-5C300.6 137.4 248.2 128 192 128c-8.3 0-16.4 .2-24.5 .6l-1.1-.6C142.3 114.6 128 98 128 80c0-44.2 86-80 192-80S512 35.8 512 80z"/>
                                <path d="M160.7 161.1c10.2-.7 20.7-1.1 31.3-1.1c62.2 0 117.4 12.3 152.5 31.4C369.3 204.9 384 221.7 384 240c0 4-.7 7.9-2.1 11.7c-4.6 13.2-17 25.3-35 35.5c0 0 0 0 0 0c-.1 .1-.3 .1-.4 .2l0 0 0 0c-.3 .2-.6 .3-.9 .5c-35 19.4-90.8 32-153.6 32c-59.6 0-112.9-11.3-148.2-29.1c-1.9-.9-3.7-1.9-5.5-2.9C14.3 274.6 0 258 0 240c0-34.8 53.4-64.5 128-75.4c10.5-1.5 21.4-2.7 32.7-3.5zM416 240c0-21.9-10.6-39.9-24.1-53.4c28.3-4.4 54.2-11.4 76.2-20.5c16.3-6.8 31.5-15.2 43.9-25.5V176c0 19.3-16.5 37.1-43.8 50.9c-14.6 7.4-32.4 13.7-52.4 18.5c.1-1.8 .2-3.5 .2-5.3zm-32 96c0 18-14.3 34.6-38.4 48c-1.8 1-3.6 1.9-5.5 2.9C304.9 404.7 251.6 416 192 416c-62.8 0-118.6-12.6-153.6-32C14.3 370.6 0 354 0 336V300.6c12.5 10.3 27.6 18.7 43.9 25.5C83.4 342.6 135.8 352 192 352s108.6-9.4 148.1-25.9c7.8-3.2 15.3-6.9 22.4-10.9c6.1-3.4 11.8-7.2 17.2-11.2c1.5-1.1 2.9-2.3 4.3-3.4V336zm0 96c0 18-14.3 34.6-38.4 48c-1.8 1-3.6 1.9-5.5 2.9C304.9 500.7 251.6 512 192 512c-62.8 0-118.6-12.6-153.6-32C14.3 466.6 0 450 0 432V396.6c12.5 10.3 27.6 18.7 43.9 25.5C83.4 438.6 135.8 448 192 448s108.6-9.4 148.1-25.9c7.8-3.2 15.3-6.9 22.4-10.9c6.1-3.4 11.8-7.2 17.2-11.2c1.5-1.1 2.9-2.3 4.3-3.4V432z"/>
                              </svg>
                              ${achievement.coins}
                            </span> | 
                            <span style="color: #3B82F6; margin-left: 5px;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512" style="fill: #3B82F6; display: inline; margin-right: 2px;">
                                <path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/>
                              </svg>
                              ${achievement.xp} XP
                            </span>
                          </strong>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        achievementPages.push(pageContent);
      }
  
      // Combine all pages with page breaks
      const allPages = [
        firstPageContent,
        ...achievementPages
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
              const pdfHeight = pdf.internal.pageSize.getHeight();
              
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
          const pages = [firstPageContent, ...achievementPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save('achievements-report.pdf');
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
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.pageTitle}>Achievements Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Achievement</Text>
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
            placeholder="Search achievements by name or description..."
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
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Avatar</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Requirements</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Rewards</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            {filteredAchievements.map((achievement) => (
              <View key={achievement._id} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                  {avatarImages[achievement.avatar_id] ? (
                    <Image
                      source={{ uri: avatarImages[achievement.avatar_id] }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.noAvatarText}>No Avatar</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, { flex: 2 }]}>{achievement.name}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{achievement.description}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{achievement.requirements}</Text>
                <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  <FontAwesome5 name="coins" size={16} color="gold" />
                  <Text style={{ marginLeft: 5 }}>{achievement.coins}</Text>
                  <FontAwesome5 name="star" size={16} color="#3B82F6" style={{ marginLeft: 10 }} />
                  <Text style={{ marginLeft: 5 }}>{achievement.xp} XP</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1, flexDirection: 'row' }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEditAchievement(achievement)}
                  >
                    <FontAwesome5 name="edit" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => {
                      setSelectedAchievement(achievement);
                      setDeleteModalVisible(true);
                    }}
                  >
                    <FontAwesome5 name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Create/Edit Achievement Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>
                  {editingAchievement ? 'Edit Achievement' : 'Create Achievement'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <FontAwesome5 name="times" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter achievement name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter achievement description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Coins</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter coins"
                      value={coins}
                      onChangeText={setCoins}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>XP</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter XP"
                      value={xp}
                      onChangeText={setXp}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Requirements</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter requirements"
                    value={requirements}
                    onChangeText={setRequirements}
                    multiline
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar</Text>
                  <ScrollView horizontal style={styles.avatarSelector}>
                    {avatars.map((avatarOption) => (
                      <TouchableOpacity
                        key={avatarOption._id}
                        style={[
                          styles.avatarOption,
                          avatar === avatarOption._id && styles.avatarOptionSelected
                        ]}
                        onPress={() => setAvatar(avatarOption._id)}
                      >
                        <Image
                          source={{ uri: avatarOption.url }}
                          style={styles.avatarOptionImage}
                        />
                        <Text style={styles.avatarOptionText}>{avatarOption.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.avatarOption,
                        !avatar && styles.avatarOptionSelected
                      ]}
                      onPress={() => setAvatar('')}
                    >
                      <View style={styles.emptyAvatarBox}>
                        <Text style={styles.avatarOptionText}>No Avatar</Text>
                      </View>
                    </TouchableOpacity>
                  </ScrollView>
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
                  onPress={editingAchievement ? handleUpdateAchievement : handleCreateAchievement}
                >
                  <Text style={styles.submitButtonText}>
                    {editingAchievement ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.deleteModal_overlay}>
            <View style={styles.deleteModal_content}>
              <View style={styles.deleteModal_header}>
                <Text style={styles.deleteModal_headerText}>Delete Achievement</Text>
              </View>
              <View style={styles.deleteModal_body}>
                <Text style={styles.deleteModal_text}>
                  Are you sure you want to delete this achievement?
                </Text>
              </View>
              <View style={styles.deleteModal_footer}>
                <TouchableOpacity
                  style={styles.deleteModal_cancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.deleteModal_cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModal_deleteButton}
                  onPress={() => {
                    handleDeleteAchievement(selectedAchievement._id);
                    setDeleteModalVisible(false);
                  }}
                >
                  <Text style={styles.deleteModal_deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* Add Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Generating PDF...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fc',
  },
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
  descriptionCell: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noAvatarText: {
    color: '#9CA3AF',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  avatarSelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  avatarOption: {
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 4,
  },
  avatarOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  avatarOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  emptyAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarOptionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
    width: 70,
    textAlign: 'center',
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
    color: '#B91C1C',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default AchievementsCRUD;