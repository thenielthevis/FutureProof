import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAvatar, readAvatars, updateAvatar, deleteAvatar } from '../API/avatar_api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';

const AvatarCRUD = () => {
  const navigation = useNavigation();
  const [avatars, setAvatars] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAvatars, setFilteredAvatars] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const avatarsData = await readAvatars();
        setAvatars(avatarsData);
        setFilteredAvatars(avatarsData);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };
    fetchAvatars();
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Convert a local image to a Base64 string (or return remote URL)
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
      const avatarsWithImages = await Promise.all(
        avatars.map(async (avatar) => {
          if (avatar.url) {
            const imageSrc = await convertImageToBase64(avatar.url);
            return { ...avatar, imageSrc };
          }
          return { ...avatar, imageSrc: null }; // No image available
        })
      );

      // Convert logo URLs to base64
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      // HTML content for the PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center;">
              <h1 style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2 style="font-size: 16px; margin: 0;">Avatar Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Image</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Name</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${avatarsWithImages.map((avatar, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    ${avatar.imageSrc ? `<img src="${avatar.imageSrc}" alt="Avatar" style="max-width: 80px; max-height: 60px;">` : 'No Image'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${avatar.name || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${avatar.description || '-'}</td>
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
          pdf.save('avatar-report.pdf'); // Save the PDF
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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],   
      quality: 1,
      base64: false,
    });
    if (!result.canceled) {
      const pickedFile = result.assets[0];
      if (!pickedFile.uri) {
        console.error('Invalid file URI:', pickedFile);
        return;
      }
      let fileUri = pickedFile.uri;
      if (Platform.OS !== 'web') {
        const fileName = `avatar_${Date.now()}.png`;
        fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        try {
          await FileSystem.moveAsync({
            from: pickedFile.uri,
            to: fileUri,
          });
        } catch (error) {
          console.error('Error moving file:', error);
        }
      }
      setFile({
        uri: fileUri,
        type: 'image/png',
        name: `avatar_${Date.now()}.png`,
      });
    }
  };

  const handleCreateAvatar = async () => {
    try {
      const newAvatar = await createAvatar({ name, description, file });
      setAvatars([...avatars, newAvatar]);
      setFilteredAvatars([...avatars, newAvatar]);
      setModalVisible(false);
      setName('');
      setDescription('');
      setFile(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Avatar created successfully!',
      });
    } catch (error) {
      console.error('Error creating avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create avatar. Please try again.',
      });
    }
  };

  const handleUpdateAvatar = async () => {
    if (!editingAvatar || !editingAvatar._id) {
      console.error('Invalid avatar ID for updating');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid avatar ID. Please try again.',
      });
      return;
    }

    try {
      const updatedAvatar = await updateAvatar(editingAvatar._id, { name, description, file });
      const updatedAvatars = avatars.map(avatar => (avatar._id === editingAvatar._id ? updatedAvatar : avatar));
      setAvatars(updatedAvatars);
      setFilteredAvatars(updatedAvatars);
      setModalVisible(false);
      setEditingAvatar(null);
      setName('');
      setDescription('');
      setFile(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Avatar updated successfully!',
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update avatar. Please try again.',
      });
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    try {
      if (!avatarId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid avatar ID',
        });
        return;
      }

      // Show loading indicator
      Toast.show({
        type: 'info',
        text1: 'Deleting...',
        text2: 'Please wait',
      });

      // Delete the avatar
      await deleteAvatar(avatarId);

      // Update the local state only after successful deletion
      setAvatars(prevAvatars => prevAvatars.filter(avatar => avatar._id !== avatarId));
      setFilteredAvatars(prevFiltered => prevFiltered.filter(avatar => avatar._id !== avatarId));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Avatar deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete avatar',
      });
    }
  };

  const handleEditAvatar = (avatar) => {
    setEditingAvatar(avatar);
    setName(avatar.name);
    setDescription(avatar.description);
    setFile(null);
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingAvatar(null);
    setName('');
    setDescription('');
    setFile(null);
    setModalVisible(true);
  };

  const handleSearch = () => {
    const filtered = avatars.filter(avatar =>
      avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAvatars(filtered);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderDeleteButton = (item) => (
    <TouchableOpacity 
      style={[styles.actionBtn, styles.deleteBtn]} 
      onPress={() => {
        setSelectedAvatar(item._id);
        setDeleteModalVisible(true);
      }}
    >
      <FontAwesome name="trash" size={14} color="white" />
    </TouchableOpacity>
  );

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
          <Text style={styles.pageTitle}>Avatars Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Avatar</Text>
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
            placeholder="Search avatars by name or description..."
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
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Image</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Name</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Description</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredAvatars.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <View style={[styles.tableCell, {flex: 1}]}>
                  <Image source={{ uri: item.url }} style={styles.avatarImage} />
                </View>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.name}</Text>
                <Text style={[styles.tableCell, {flex: 2}, styles.descriptionCell]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditAvatar(item)}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  {renderDeleteButton(item)}
                </View>
              </View>
            ))}
            
            {filteredAvatars.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="user-circle" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No avatars found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new avatar</Text>
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
                  {editingAvatar ? 'Update Avatar' : 'Create New Avatar'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter avatar name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter avatar description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar Image</Text>
                  <TouchableOpacity style={styles.fileButton} onPress={handlePickImage}>
                    <FontAwesome5 name="image" size={16} color="white" />
                    <Text style={styles.fileButtonText}>Select Image</Text>
                  </TouchableOpacity>
                  {file && (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: file.uri }} style={styles.imagePreviewModal} />
                      <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setFile(null)}>
                        <FontAwesome name="times-circle" size={20} color="#ff4d4d" />
                      </TouchableOpacity>
                    </View>
                  )}
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
                  onPress={editingAvatar ? handleUpdateAvatar : handleCreateAvatar}
                >
                  <Text style={styles.submitButtonText}>
                    {editingAvatar ? 'Update Avatar' : 'Create Avatar'}
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
                  Are you sure you want to delete this avatar?
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
                    if (selectedAvatar) {
                      handleDeleteAvatar(selectedAvatar);
                      setDeleteModalVisible(false);
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No avatar selected for deletion',
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
  
  // Modal styles
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
    maxHeight: 400,
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
  fileButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  fileButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContainer: {
    position: 'relative',
    marginTop: 10,
  },
  imagePreviewModal: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 2,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#    374151',
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

export default AvatarCRUD;

