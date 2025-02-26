import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAvatar, readAvatars, updateAvatar, deleteAvatar } from '../API/avatar_api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';


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
      mediaTypes: ImagePicker.MediaType.Images, 
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
      await deleteAvatar(avatarId); // Call the API to delete the avatar
      const updatedAvatars = avatars.filter(avatar => avatar._id !== avatarId); // Remove the avatar from the local state
      setAvatars(updatedAvatars);
      setFilteredAvatars(updatedAvatars);
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
        text2: 'Failed to delete avatar. Please try again.',
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

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <LinearGradient colors={['#003C2C', '#005C3C']} style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
            <View style={styles.sidebar}>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
                <Text style={styles.sidebarText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
                <Text style={styles.sidebarText}>Avatars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
                <Text style={styles.sidebarText}>Daily Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('quotes')}>
                    <FontAwesome name="quote-left" size={24} color="white" />
                    <Text style={styles.sidebarText}>Quotes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('asset')}>
                    <FontAwesome name="quote-left" size={24} color="white" />
                    <Text style={styles.sidebarText}>Assets</Text>
                  </TouchableOpacity>
            </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.header}>Avatars Management</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.openModalButton} onPress={handleOpenModal}>
            <Text style={styles.openModalButtonText}>Create Avatar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Avatars"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar List */}
        <ScrollView contentContainerStyle={styles.avatarGrid}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Image</Text>
              <Text style={styles.tableHeaderText}>Name</Text>
              <Text style={styles.tableHeaderText}>Description</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {filteredAvatars.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Image source={{ uri: item.url }} style={styles.avatarImage} />
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>{item.description}</Text>
                <View style={styles.tableCell}>
                  <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditAvatar(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteAvatar(item._id)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal for Create/Update Avatar */}
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
                  {editingAvatar ? 'Update Avatar' : 'Create Avatar'}
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
                  placeholder="Enter avatar name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter avatar description"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Image Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Avatar Image</Text>
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
                onPress={editingAvatar ? handleUpdateAvatar : handleCreateAvatar}
              >
                <Text style={styles.buttonText}>
                  {editingAvatar ? 'Update Avatar' : 'Create Avatar'}
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
  avatarGrid: {
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
  avatarImage: {
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
export default AvatarCRUD;
