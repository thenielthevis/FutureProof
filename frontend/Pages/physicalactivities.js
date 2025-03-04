import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createPhysicalActivity, getPhysicalActivities, getPhysicalActivityById, updatePhysicalActivity, deletePhysicalActivity } from '../API/physical_activities_api';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Sidebar from './Sidebar';

const PhysicalActivitiesCRUD = () => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [publicId, setPublicId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [repetition, setRepetition] = useState('');
  const [timer, setTimer] = useState('');
  const [file, setFile] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));

  // Fetch all activities on component mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesData = await getPhysicalActivities();
        setActivities(activitiesData);
        setFilteredActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching activities:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch activities. Please try again.',
        });
      }
    };
    fetchActivities();
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle image picker
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const pickedFile = result.assets[0];
      setFile({
        uri: pickedFile.uri,
        type: 'image/jpeg', // Adjust based on the file type
        name: `activity_${Date.now()}.jpg`,
      });
    }
  };

  // Handle create or update activity
  const handleCreateOrUpdateActivity = async () => {
    if (!activityName || !activityType || !description || !url || !publicId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields.',
      });
      return;
    }

    const activityData = {
      activity_name: activityName,
      activity_type: activityType,
      description,
      url,
      public_id: publicId,
      instructions: instructions.split('\n').filter(instruction => instruction.trim() !== ''),
      repetition: repetition ? parseInt(repetition, 10) : null,
      timer: timer ? parseInt(timer, 10) : null,
    };

    try {
      if (editingActivity) {
        // Update existing activity
        const updatedActivity = await updatePhysicalActivity(editingActivity._id, activityData, file);
        const updatedActivities = activities.map(activity =>
          activity._id === editingActivity._id ? updatedActivity : activity
        );
        setActivities(updatedActivities);
        setFilteredActivities(updatedActivities);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Activity updated successfully!',
        });
      } else {
        // Create new activity
        const newActivity = await createPhysicalActivity(activityData, file);
        setActivities([...activities, newActivity]);
        setFilteredActivities([...activities, newActivity]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Activity created successfully!',
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save activity. Please try again.',
      });
    }
  };

  // Handle delete activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await deletePhysicalActivity(activityId);
      const updatedActivities = activities.filter(activity => activity._id !== activityId);
      setActivities(updatedActivities);
      setFilteredActivities(updatedActivities);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Activity deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete activity. Please try again.',
      });
    }
  };

  // Handle edit activity
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setActivityName(activity.activity_name);
    setActivityType(activity.activity_type);
    setDescription(activity.description);
    setUrl(activity.url);
    setPublicId(activity.public_id);
    setInstructions(activity.instructions?.join('\n') || '');
    setRepetition(activity.repetition?.toString() || '');
    setTimer(activity.timer?.toString() || '');
    setFile({ uri: activity.url });
    setModalVisible(true);
  };

  // Reset form fields
  const resetForm = () => {
    setActivityName('');
    setActivityType('');
    setDescription('');
    setUrl('');
    setPublicId('');
    setInstructions('');
    setRepetition('');
    setTimer('');
    setFile(null);
    setEditingActivity(null);
  };

  // Handle search
  const handleSearch = () => {
    const filtered = activities.filter(activity =>
      activity.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredActivities(filtered);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleExportPDF = async () => {
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");
  
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center;">
              <h1 style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2 style="font-size: 16px; margin: 0;">Physical Activities Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Activity Name</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Activity Type</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${activities.map((activity, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                  <td style="padding: 12px; border: 1px solid #ddd;">${activity.activity_name || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${activity.activity_type || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${activity.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
  
      if (Platform.OS === 'web') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
  
        const waitForImages = () => {
          const images = container.getElementsByTagName('img');
          return Promise.all(
            Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = img.onerror = resolve;
              });
            })
          );
        };
  
        await waitForImages();
        const canvas = await html2canvas(container);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 0, 0);
        pdf.save('physical_activities_report.pdf');
        document.body.removeChild(container);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error('Error in handleExportPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
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
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
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
          <Text style={styles.pageTitle}>Physical Activities Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Activity</Text>
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
            placeholder="Search activities by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Activity List */}
        <ScrollView style={styles.tableWrapper}>
          <View style={styles.activityGrid}>
            {filteredActivities.map((item) => (
              <View style={styles.activityCard} key={item._id}>
                <Image source={{ uri: item.url }} style={styles.activityImage} />
                <Text style={styles.activityName}>{item.activity_name}</Text>
                <Text style={styles.activityType}>{item.activity_type}</Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditActivity(item)}>
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => 
                      Alert.alert(
                        "Confirm Delete",
                        "Are you sure you want to delete this activity?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", onPress: () => handleDeleteActivity(item._id), style: "destructive" }
                        ]
                      )
                    }>
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredActivities.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="running" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No activities found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new activity</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Activity */}
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
                  {editingActivity ? 'Update Activity' : 'Create New Activity'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter activity name"
                    value={activityName}
                    onChangeText={setActivityName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Type</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter activity type"
                    value={activityType}
                    onChangeText={setActivityType}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter URL"
                    value={url}
                    onChangeText={setUrl}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Public ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Public ID"
                    value={publicId}
                    onChangeText={setPublicId}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Instructions</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter instructions (one per line)"
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Repetition (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter repetition"
                    value={repetition}
                    onChangeText={setRepetition}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Timer (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter timer"
                    value={timer}
                    onChangeText={setTimer}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Image</Text>
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
                  onPress={handleCreateOrUpdateActivity}
                >
                  <Text style={styles.submitButtonText}>
                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

// Styles
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: '#4B5563',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    width: '100%',
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
  sidebar: {
    width: 240,
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  sidebarText: {
    color: 'white',
  },
});

export default PhysicalActivitiesCRUD;