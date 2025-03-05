import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button, Picker, Animated
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
import Video from 'react-native-video';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

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
  const [instructionsList, setInstructionsList] = useState(['']); // Initialize with one empty instruction
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

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

  const handlePickVideo = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use DocumentPicker for web platform
        const result = await DocumentPicker.getDocumentAsync({
          type: 'video/*',
          copyToCacheDirectory: true,
        });
  
        if (result.canceled) {
          console.log('Video picking was canceled.');
          Toast.show({
            type: 'info',
            text1: 'Canceled',
            text2: 'Video selection was canceled.',
          });
          return;
        }
  
        const pickedFile = result.assets[0];
        
        // Validate video file type
        const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (!validVideoTypes.includes(pickedFile.mimeType)) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Please select a valid video file.',
          });
          return;
        }
  
        setFile({
          uri: pickedFile.uri,
          type: pickedFile.mimeType,
          name: pickedFile.name,
        });
  
      } else {
        // Use ImagePicker for native platforms
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 1,
          videoMaxDuration: 60,
        });
  
        if (!result.canceled) {
          const pickedFile = result.assets[0];
          let fileUri = pickedFile.uri;
  
          if (Platform.OS !== 'web') {
            const fileName = `activity_${Date.now()}.mp4`;
            fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            try {
              await FileSystem.moveAsync({
                from: pickedFile.uri,
                to: fileUri,
              });
  
              // Check file size for native platforms
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              const maxSize = 50 * 1024 * 1024; // 50MB
              if (fileInfo.size > maxSize) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Video file is too large (max 50MB)',
                });
                return;
              }
            } catch (error) {
              console.error('Error processing file:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to process video file',
              });
              return;
            }
          }
  
          setFile({
            uri: fileUri,
            type: 'video/mp4',
            name: `activity_${Date.now()}.mp4`,
          });
        }
      }
  
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Video selected successfully',
      });
  
    } catch (error) {
      console.error('Error picking video:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select video',
      });
    }
  };
  

  // Handle create or update activity
  const handleCreateOrUpdateActivity = async () => {
    try {
      if (!activityName || !activityType || !description) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill all required fields.',
        });
        return;
      }

      if (!file && !editingActivity) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a video file.',
        });
        return;
      }

      // Filter out empty instructions
      const filteredInstructions = instructionsList.filter(instruction => instruction.trim() !== '');

      const activityData = {
        activity_name: activityName,
        activity_type: activityType,
        description,
        instructions: filteredInstructions,
        repetition: repetition ? parseInt(repetition, 10) : null,
        timer: timer ? parseInt(timer, 10) : null,
      };

      let fileToUpload = null;
      if (file && file.uri) {
        // Create Blob from file URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileToUpload = new File([blob], file.name || 'video.mp4', { type: file.type || 'video/mp4' });
      }

      console.log('Current editingActivity:', editingActivity); // Debug log

      if (editingActivity?._id) {
        console.log('Updating existing activity:', editingActivity._id);
        const updatedActivity = await updatePhysicalActivity(editingActivity._id, activityData, fileToUpload);
        
        setActivities(prevActivities => 
          prevActivities.map(activity => 
            activity._id === editingActivity._id ? updatedActivity : activity
          )
        );
        
        setFilteredActivities(prevFiltered => 
          prevFiltered.map(activity => 
            activity._id === editingActivity._id ? updatedActivity : activity
          )
        );

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Activity updated successfully!',
          visibilityTime: 3000,
          position: 'top',
        });
      } else {
        console.log('Creating new activity');
        const newActivity = await createPhysicalActivity(activityData, fileToUpload);
        setActivities(prevActivities => [...prevActivities, newActivity]);
        setFilteredActivities(prevFiltered => [...prevFiltered, newActivity]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Activity created successfully!',
        });
      }

      setModalVisible(false);
      resetForm();
      
      // Refresh the activities list after create/update
      const refreshedActivities = await getPhysicalActivities();
      setActivities(refreshedActivities);
      setFilteredActivities(refreshedActivities);
      
    } catch (error) {
      console.error('Error in handleCreateOrUpdateActivity:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save activity. Please try again.',
      });
    }
  };
  

  // Handle delete activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await deletePhysicalActivity(activityId);
      setActivities(prevActivities => 
        prevActivities.filter(activity => activity._id !== activityId)
      );
      setFilteredActivities(prevFiltered => 
        prevFiltered.filter(activity => activity._id !== activityId)
      );
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Activity deleted successfully!',
        visibilityTime: 3000,
        position: 'top',
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete activity. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  // Handle edit activity
  const handleEditActivity = (activity) => {
    console.log('Editing activity:', activity); // Debug log
    setEditingActivity(activity);
    setActivityName(activity.activity_name || '');
    setActivityType(activity.activity_type || '');
    setDescription(activity.description || '');
    setInstructionsList(Array.isArray(activity.instructions) ? activity.instructions : ['']);
    setRepetition(activity.repetition?.toString() || '');
    setTimer(activity.timer?.toString() || '');
    setFile(activity.url ? { uri: activity.url } : null);
    setModalVisible(true);
  };

  // Reset form fields
  const resetForm = () => {
    setEditingActivity(null);
    setActivityName('');
    setActivityType('');
    setDescription('');
    setInstructionsList(['']);
    setRepetition('');
    setTimer('');
    setFile(null);
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

  // Handle adding a new instruction input field
  const handleAddInstruction = () => {
    setInstructionsList([...instructionsList, '']);
  };

  // Handle changing an instruction input field
  const handleInstructionChange = (index, value) => {
    const newInstructionsList = [...instructionsList];
    newInstructionsList[index] = value;
    setInstructionsList(newInstructionsList);
  };

  // Handle removing an instruction input field
  const handleRemoveInstruction = (index) => {
    const newInstructionsList = instructionsList.filter((_, i) => i !== index);
    setInstructionsList(newInstructionsList);
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
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Activity Name</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Type</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Description</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Video</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredActivities.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.activity_name}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.activity_type}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Video
                    source={{ uri: item.url }}
                    style={styles.videoThumbnail}
                    resizeMode="contain"
                    repeat={true}
                    paused={true}
                    volume={0}
                  />
                </View>
                <View style={[styles.tableCell, styles.actionCell, { flex: 1 }]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.editBtn]} 
                      onPress={() => handleEditActivity(item)}
                    >
                      <FontAwesome name="pencil" size={14} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.deleteBtn]} 
                      onPress={() => {
                        setSelectedActivity(item._id);
                        setDeleteModalVisible(true);
                      }}
                    >
                      <FontAwesome name="trash" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Activity */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            resetForm();
            setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>
                  {editingActivity ? 'Update Activity' : 'Create New Activity'}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}
                >
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
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={activityType}
                      onValueChange={(itemValue) => setActivityType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Activity Type" value="" />
                      <Picker.Item label="Workout" value="Workout" />
                      <Picker.Item label="Zumba" value="Zumba" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter activity description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                {/* Instructions Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Instructions</Text>
                  {instructionsList.map((instruction, index) => (
                    <View key={index} style={styles.instructionContainer}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder={`Instruction ${index + 1}`}
                        value={instruction}
                        onChangeText={(value) => handleInstructionChange(index, value)}
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.removeInstructionButton}
                        onPress={() => handleRemoveInstruction(index)}
                      >
                        <FontAwesome name="minus-circle" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addInstructionButton} onPress={handleAddInstruction}>
                    <FontAwesome name="plus-circle" size={20} color="#3498db" />
                    <Text style={styles.addInstructionButtonText}>Add Instruction</Text>
                  </TouchableOpacity>
                </View>

                {/* Optional Fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Optional Details</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repetition (Optional)"
                    value={repetition}
                    onChangeText={setRepetition}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Timer (Optional)"
                    value={timer}
                    onChangeText={setTimer}
                    keyboardType="numeric"
                  />
                </View>

                {/* Video Upload Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Video</Text>
                  <TouchableOpacity style={styles.fileButton} onPress={handlePickVideo}>
                    <FontAwesome5 name="video" size={16} color="white" />
                    <Text style={styles.fileButtonText}>
                      {editingActivity ? 'Change Video' : 'Upload Video'}
                    </Text>
                  </TouchableOpacity>
                  {file && (
                    <View style={styles.previewContainer}>
                      <Video 
                        source={{ uri: file.uri }} 
                        style={styles.videoPreview} 
                        resizeMode="contain" 
                        repeat={true}
                        paused={false}
                        volume={0}
                      />
                      <TouchableOpacity 
                        style={styles.removePreviewBtn} 
                        onPress={() => setFile(null)}
                      >
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

        {/* Delete Confirmation Modal */}
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
                  Are you sure you want to delete this activity?
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
                    if (selectedActivity) {
                      handleDeleteActivity(selectedActivity);
                      setDeleteModalVisible(false);
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No activity selected for deletion',
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
    borderBottomColor: '#eee',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tableCell: {
    padding: 8,
  },
  videoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  editBtn: {
    backgroundColor: '#3498db',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    maxWidth: 800,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
  imagePreview: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  exportButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  videoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedFile: {
    marginTop: 5,
    color: '#666',
    textAlign: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeInstructionButton: {
    marginLeft: 10,
  },
  addInstructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addInstructionButtonText: {
    marginLeft: 10,
    color: '#3498db',
    fontWeight: 'bold',
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
});

export default PhysicalActivitiesCRUD;