import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createMeditationBreathingExercise, getMeditationBreathingExercises, updateMeditationBreathingExercise, deleteMeditationBreathingExercise } from '../API/meditation_api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
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

  const handleOpenModal = () => {
    setEditingMeditation(null);
    setName('');
    setDescription('');
    setFile(null);
    setInstructions('');
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
        <ScrollView contentContainerStyle={styles.meditationGrid}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Image</Text>
              <Text style={styles.tableHeaderText}>Name</Text>
              <Text style={styles.tableHeaderText}>Description</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {filteredMeditations.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Image source={{ uri: item.url }} style={styles.meditationImage} />
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>{item.description}</Text>
                <View style={styles.tableCell}>
                  <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditMeditation(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteMeditation(item._id)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
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
              <LinearGradient colors={['#1A3B32', '#1A3B32']} style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>
                  {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meditation name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meditation description"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Instructions Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instructions</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meditation instructions"
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>

              {/* Image Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meditation Image</Text>
                <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                  <Text style={styles.buttonText}>Pick an Image</Text>
                </TouchableOpacity>
                {file ? (
                  <Image source={{ uri: file.uri }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.noImageText}>No image selected</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={editingMeditation ? handleUpdateMeditation : handleCreateMeditation}
              >
                <Text style={styles.buttonText}>
                  {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
                </Text>
              </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    width: '100%',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: '#3b88c3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 5,
  },
  meditationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    padding: 15,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginLeft: 120,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 150,
  },
  meditationImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    alignSelf: 'center',
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    width: '45%',
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
    width: '45%',
    alignItems: 'center',
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
    width: 120,
  },
  openModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 1,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
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
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '50%',
    backgroundColor: '#1A3B32',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    backgroundColor: '#2E7D32',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
  },
  sidebarCollapsed: {
    width: 80,
  },
  sidebarContent: {
    width: '100%',
    alignItems: 'flex-start',
  },
  inputGroup: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  noImageText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 8,
  },
});
export default MeditationCRUD;