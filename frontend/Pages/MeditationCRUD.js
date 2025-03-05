import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createMeditationBreathingExercise, getMeditationBreathingExercises, updateMeditationBreathingExercise, deleteMeditationBreathingExercise } from '../API/meditation_api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';
import Video from 'react-native-video';

const MeditationCRUD = () => {
  const navigation = useNavigation();
  const [meditations, setMeditations] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [instructionsList, setInstructionsList] = useState(['']); // Initialize with one empty instruction
  const [editingMeditation, setEditingMeditation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMeditations, setFilteredMeditations] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchMeditations = async () => {
      try {
        const meditationsData = await getMeditationBreathingExercises();
        setMeditations(meditationsData);
        setFilteredMeditations(meditationsData);
      } catch (error) {
        console.error('Error fetching meditations:', error);
      }
    };
    fetchMeditations();
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

  const handlePickVideo = async () => {
    try {
      if (Platform.OS === 'web') {
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
            const fileName = `meditation_${Date.now()}.mp4`;
            fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            try {
              await FileSystem.moveAsync({
                from: pickedFile.uri,
                to: fileUri,
              });

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
            name: `meditation_${Date.now()}.mp4`,
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

  const handleCreateOrUpdateMeditation = async () => {
    try {
      if (!name || !description) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill all required fields.',
        });
        return;
      }

      if (!file && !editingMeditation) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a video file.',
        });
        return;
      }

      const filteredInstructions = instructionsList.filter(instruction => instruction.trim() !== '');

      const meditationData = {
        name,
        description,
        instructions: filteredInstructions,
      };

      let fileToUpload = null;
      if (file && file.uri) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileToUpload = new File([blob], file.name || 'video.mp4', { type: file.type || 'video/mp4' });
      }

      if (editingMeditation && editingMeditation._id) {
        console.log('Updating meditation:', editingMeditation._id, meditationData);
        const updatedMeditation = await updateMeditationBreathingExercise(editingMeditation._id, meditationData, fileToUpload);
        setMeditations(prevMeditations => 
          prevMeditations.map(meditation =>
            meditation._id === editingMeditation._id ? updatedMeditation : meditation
          )
        );
        setFilteredMeditations(prevFiltered => 
          prevFiltered.map(meditation =>
            meditation._id === editingMeditation._id ? updatedMeditation : meditation
          )
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Meditation updated successfully!',
        });
      } else {
        const newMeditation = await createMeditationBreathingExercise(meditationData, fileToUpload);
        setMeditations(prevMeditations => [...prevMeditations, newMeditation]);
        setFilteredMeditations(prevFiltered => [...prevFiltered, newMeditation]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Meditation created successfully!',
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleCreateOrUpdateMeditation:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save meditation. Please try again.',
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
    setInstructionsList(Array.isArray(meditation.instructions) ? meditation.instructions : ['']);
    setFile({ uri: meditation.url });
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingMeditation(null);
    setName('');
    setDescription('');
    setFile(null);
    setInstructionsList(['']);
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructionsList(['']);
    setFile(null);
    setEditingMeditation(null);
  };

  const handleAddInstruction = () => {
    setInstructionsList([...instructionsList, '']);
  };

  const handleInstructionChange = (index, value) => {
    const newInstructionsList = [...instructionsList];
    newInstructionsList[index] = value;
    setInstructionsList(newInstructionsList);
  };

  const handleRemoveInstruction = (index) => {
    const newInstructionsList = instructionsList.filter((_, i) => i !== index);
    setInstructionsList(newInstructionsList);
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.content}>
        <Text style={styles.header}>Meditation Management</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.openModalButton} onPress={handleOpenModal}>
            <Text style={styles.openModalButtonText}>Create Meditation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Meditations"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meditation List */}
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Video</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
            </View>
            {filteredMeditations.map((item) => (
              <View style={styles.tableRow} key={item._id}>
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
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditMeditation(item)}
                    >
                      <FontAwesome name="edit" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteMeditation(item._id)}
                    >
                      <FontAwesome name="trash" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Meditation */}
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
                  {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
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
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                />
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Meditation Video</Text>
                  <TouchableOpacity style={styles.uploadButton} onPress={handlePickVideo}>
                    <FontAwesome name="upload" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>
                      {editingMeditation ? 'Update Video' : 'Upload Video'}
                    </Text>
                  </TouchableOpacity>
                  {file ? (
                    <Video source={{ uri: file.uri }} style={styles.videoPreview} resizeMode="contain" repeat={true} paused={false} volume={0} />
                  ) : (
                    <Text style={styles.noVideoText}>No video selected</Text>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleCreateOrUpdateMeditation}
                  >
                    <Text style={styles.buttonText}>
                      {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    marginTop: 20, // Add margin to separate from video preview
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
  noVideoText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MeditationCRUD;