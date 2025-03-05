import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button, Picker,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createPhysicalActivity, getPhysicalActivities, getPhysicalActivityById, updatePhysicalActivity, deletePhysicalActivity } from '../API/physical_activities_api';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
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

      if (editingActivity && editingActivity._id) {
        console.log('Updating activity:', editingActivity._id, activityData);
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
        });
      } else {
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
    // Display instructions as separate lines
    setInstructionsList(Array.isArray(activity.instructions) ? activity.instructions : ['']);
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
    setInstructionsList(['']);
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
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.header}>Physical Activities Management</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.openModalButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.openModalButtonText}>Create Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Activities"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity List */}
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Activity Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Video</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
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
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditActivity(item)}
                    >
                      <FontAwesome name="edit" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteActivity(item._id)}
                    >
                      <FontAwesome name="trash" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Activity */}
        <Modal
          animationType="slide"
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

              <ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Activity Name"
                  value={activityName}
                  onChangeText={setActivityName}
                />
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
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
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
                
                {/* Preview current video if editing */}
                {editingActivity && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Current Video:</Text>
                    <Video
                      source={{ uri: editingActivity.url }}
                      style={styles.videoPreview}
                      resizeMode="contain"
                      repeat={true}
                      paused={false}
                      volume={0}
                    />
                  </View>
                )}

                {/* File upload button */}
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickVideo}>
                  <FontAwesome name="upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {editingActivity ? 'Update Video' : 'Upload Video'}
                  </Text>
                </TouchableOpacity>

                {/* Show selected file name if any */}
                {file && (
                  <Text style={styles.selectedFile}>
                    Selected: {file.name || file.uri.split('/').pop()}
                  </Text>
                )}
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleCreateOrUpdateActivity}>
                  <Text style={styles.buttonText}>{editingActivity ? 'Update' : 'Create'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
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
    backgroundColor: '#F5F5F5',
  },
  sidebar: {
    width: '20%',
    backgroundColor: '#1A3B32',
    padding: 20,
  },
  sidebarCollapsed: {
    width: '5%',
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
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  searchCreateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  openModalButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  openModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    padding: 8,
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
    height: 65,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
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
  previewContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  videoPreview: {
    width: 100,
    height: 80,
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
});

export default PhysicalActivitiesCRUD;