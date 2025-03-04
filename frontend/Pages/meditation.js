import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createMeditationBreathingExercise, getMeditationBreathingExercises, updateMeditationBreathingExercise, deleteMeditationBreathingExercise } from '../API/meditation_api';
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

const MeditationCRUD = () => {
  const navigation = useNavigation();
  const [meditations, setMeditations] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [editingMeditation, setEditingMeditation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMeditations, setFilteredMeditations] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchMeditations = async () => {
      try {
        const meditationsData = await getMeditationBreathingExercises();
        setMeditations(meditationsData);
        setFilteredMeditations(meditationsData);
      } catch (error) {
        console.error('Error fetching meditations:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch meditations. Please try again.',
        });
      }
    };
    fetchMeditations();
    
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
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    try {
      const meditationsWithImages = await Promise.all(
        meditations.map(async (meditation) => {
          const imageSrc = await convertImageToBase64(meditation.url);
          return { ...meditation, imageSrc };
        })
      );

      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center;">
              <h1 style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2 style="font-size: 16px; margin: 0;">Meditation Report</h2>
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
              ${meditationsWithImages.map((meditation, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    ${meditation.imageSrc ? `<img src="${meditation.imageSrc}" alt="Meditation" style="max-width: 80px; max-height: 60px;">` : 'No Image'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${meditation.name || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${meditation.description || '-'}</td>
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
              if (img.complete) {
                return Promise.resolve();
              }
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
        pdf.save('meditations_report.pdf');
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
        const fileName = `meditation_${Date.now()}.png`;
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
        name: `meditation_${Date.now()}.png`,
      });
    }
  };

  const handleCreateMeditation = async () => {
    try {
      const newMeditation = await createMeditationBreathingExercise({ name, description, file, instructions });
      setMeditations([...meditations, newMeditation]);
      setFilteredMeditations([...meditations, newMeditation]);
      setModalVisible(false);
      setName('');
      setDescription('');
      setFile(null);
      setInstructions('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Meditation created successfully!',
      });
    } catch (error) {
      console.error('Error creating meditation:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create meditation. Please try again.',
      });
    }
  };

  const handleUpdateMeditation = async () => {
    try {
      const updatedMeditation = await updateMeditationBreathingExercise(editingMeditation._id, { name, description, file, instructions });
      const updatedMeditations = meditations.map(meditation => (meditation._id === editingMeditation._id ? updatedMeditation : meditation));
      setMeditations(updatedMeditations);
      setFilteredMeditations(updatedMeditations);
      setModalVisible(false);
      setEditingMeditation(null);
      setName('');
      setDescription('');
      setFile(null);
      setInstructions('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Meditation updated successfully!',
      });
    } catch (error) {
      console.error('Error updating meditation:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update meditation. Please try again.',
      });
    }
  };

  const handleDeleteMeditation = async (meditationId) => {
    try {
      await deleteMeditationBreathingExercise(meditationId);
      const updatedMeditations = meditations.filter(meditation => meditation._id !== meditationId);
      setMeditations(updatedMeditations);
      setFilteredMeditations(updatedMeditations);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Meditation deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting meditation:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete meditation. Please try again.',
      });
    }
  };

  const handleEditMeditation = (meditation) => {
    setEditingMeditation(meditation);
    setName(meditation.name);
    setDescription(meditation.description);
    setFile(null);
    setInstructions(meditation.instructions.join('\n'));
    setModalVisible(true);
  };

  const handleSearch = () => {
    const filtered = meditations.filter(meditation =>
      meditation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meditation.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMeditations(filtered);
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
          <Text style={styles.pageTitle}>Meditation Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setEditingMeditation(null);
                setName('');
                setDescription('');
                setFile(null);
                setInstructions('');
                setModalVisible(true);
              }}
            >
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Meditation</Text>
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
            placeholder="Search meditations by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Meditation List */}
        <ScrollView style={styles.tableWrapper}>
          <View style={styles.activityGrid}>
            {filteredMeditations.map((item) => (
              <View style={styles.activityCard} key={item._id}>
                <Image source={{ uri: item.url }} style={styles.activityImage} />
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditMeditation(item)}>
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => 
                      Alert.alert(
                        "Confirm Delete",
                        "Are you sure you want to delete this meditation?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", onPress: () => handleDeleteMeditation(item._id), style: "destructive" }
                        ]
                      )
                    }>
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredMeditations.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="spa" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No meditations found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new meditation</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Meditation */}
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
                  {editingMeditation ? 'Update Meditation' : 'Create New Meditation'}
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
                    placeholder="Enter meditation name"
                    value={name}
                    onChangeText={setName}
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
                  <Text style={styles.inputLabel}>Meditation Image</Text>
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
                  onPress={editingMeditation ? handleUpdateMeditation : handleCreateMeditation}
                >
                  <Text style={styles.submitButtonText}>
                    {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
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

export default MeditationCRUD;