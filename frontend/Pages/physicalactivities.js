import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button,
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
      {/* Sidebar */}
      <LinearGradient colors={['#003C2C', '#005C3C']} style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
  <View style={styles.sidebarTop}>
    <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
      <FontAwesome name="bars" size={24} color="white" />
    </TouchableOpacity>
  </View>
  {!sidebarCollapsed && (
    <ScrollView style={styles.sidebarContent}>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
        <FontAwesome name="dashboard" size={24} color="white" />
        <Text style={styles.sidebarText}>DASHBOARD</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
        <FontAwesome name="home" size={24} color="white" />
        <Text style={styles.sidebarText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
        <FontAwesome name="user" size={24} color="white" />
        <Text style={styles.sidebarText}>Avatars</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
        <FontAwesome5 name="gift" size={24} color="white" />
        <Text style={styles.sidebarText}>Daily Rewards</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('quotes')}>
        <FontAwesome name="quote-left" size={24} color="white" />
        <Text style={styles.sidebarText}>Quotes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('asset')}>
        <FontAwesome name="archive" size={24} color="white" />
        <Text style={styles.sidebarText}>Assets</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('physicalactivities')}>
        <FontAwesome5 name="running" size={24} color="white" />
        <Text style={styles.sidebarText}>Physical Activities</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('meditation')}>
        <FontAwesome5 name="spa" size={24} color="white" />
        <Text style={styles.sidebarText}>Meditation Breathing</Text>
      </TouchableOpacity>
    </ScrollView>
  )}
</LinearGradient>

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
        <ScrollView contentContainerStyle={styles.activityGrid}>
          {filteredActivities.map((item) => (
            <View style={styles.activityCard} key={item._id}>
              <Image source={{ uri: item.url }} style={styles.activityImage} />
              <Text style={styles.activityName}>{item.activity_name}</Text>
              <Text style={styles.activityType}>{item.activity_type}</Text>
              <Text style={styles.activityDescription}>{item.description}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditActivity(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteActivity(item._id)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Modal for Create/Update Activity */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>
                {editingActivity ? 'Update Activity' : 'Create Activity'}
              </Text>

              <ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Activity Name"
                  value={activityName}
                  onChangeText={setActivityName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Activity Type"
                  value={activityType}
                  onChangeText={setActivityType}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="URL"
                  value={url}
                  onChangeText={setUrl}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Public ID"
                  value={publicId}
                  onChangeText={setPublicId}
                />
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="Instructions (One per line)"
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                />
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
                <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                  <Text style={styles.buttonText}>Pick an Image</Text>
                </TouchableOpacity>
                {file && <Image source={{ uri: file.uri }} style={styles.imagePreview} />}
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
    padding: 20,
    alignItems: 'flex-start',
  },
  sidebarItem: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 15,
    marginLeft: 10,
  },
  sidebarTop: {
    width: '100%',
    alignItems: 'flex-end',
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityType: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 12,
    color: '#777',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
});

export default PhysicalActivitiesCRUD;