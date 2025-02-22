import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAvatar, readAvatars, updateAvatar, deleteAvatar } from '../API/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';


const AvatarCRUD = () => {
  const navigation = useNavigation();
  const [avatars, setAvatars] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [filteredAvatars, setFilteredAvatars] = useState([]); // State for filtered avatars
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // State for sidebar visibility

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const avatarsData = await readAvatars();
        setAvatars(avatarsData);
        setFilteredAvatars(avatarsData); // Initialize filtered avatars
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchAvatars();
  }, []);

  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    let avatarsWithBase64 = await Promise.all(
      avatars.map(async (avatar) => {
        const base64Image = avatar.url ? await convertImageToBase64(avatar.url) : null;
        return { ...avatar, base64Image };
      })
    );
  
    const tuLogo = "YOUR_TU_LOGO_BASE64"; // Replace with Base64-encoded TU Logo
    const rightLogo = "YOUR_RIGHT_LOGO_BASE64"; // Replace with Base64-encoded Right Logo
  
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            h2 { font-size: 16px; margin-top: 0; }
            .header-line { border-bottom: 2px solid black; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .avatar-image { width: 50px; height: 50px; object-fit: cover; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${tuLogo}" class="logo" />
            <div>
              <h1>FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2>Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines</h2>
            </div>
            <img src="${rightLogo}" class="logo" />
          </div>
          <div class="header-line"></div>
          <h3>AVATAR MANAGEMENT</h3>
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${avatarsWithBase64.map(avatar => `
                <tr>
                  <td>${avatar.base64Image ? `<img src="${avatar.base64Image}" class="avatar-image" />` : 'No image'}</td>
                  <td>${avatar.name}</td>
                  <td>${avatar.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };
  

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
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
      setFilteredAvatars([...avatars, newAvatar]); // Update filtered avatars
      setModalVisible(false); // Close modal after creation
      setName('');
      setDescription('');
      setFile(null);
    } catch (error) {
      console.error('Error creating avatar:', error);
    }
  };

  const handleUpdateAvatar = async () => {
    try {
      const updatedAvatar = await updateAvatar(editingAvatar._id, { name, description, file });
      setAvatars(avatars.map(avatar => (avatar._id === editingAvatar._id ? updatedAvatar : avatar)));
      setFilteredAvatars(avatars.map(avatar => (avatar._id === editingAvatar._id ? updatedAvatar : avatar))); // Update filtered avatars
      setModalVisible(false); // Close modal after update
      setEditingAvatar(null);
      setName('');
      setDescription('');
      setFile(null);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    try {
      await deleteAvatar(avatarId);
      const updatedAvatars = avatars.filter(avatar => avatar._id !== avatarId);
      setAvatars(updatedAvatars);
      setFilteredAvatars(updatedAvatars); // Update filtered avatars
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  const handleEditAvatar = (avatar) => {
    setEditingAvatar(avatar);
    setName(avatar.name);
    setDescription(avatar.description);
    setFile(null);
    setModalVisible(true); // Open modal for editing
  };

  const handleOpenModal = () => {
    setEditingAvatar(null);
    setName('');
    setDescription('');
    setFile(null);
    setModalVisible(true); // Open modal for creating
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
      <View style={styles.sidebarTop}>
        <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
          <FontAwesome name="bars" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {!sidebarCollapsed && (
        <View style={styles.sidebarContent}>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
            <FontAwesome name="dashboard" size={24} color="white" />
            <Text style={styles.sidebarText}>DASHBOARD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
            <FontAwesome name="home" size={24} color="white" />
            <Text style={styles.sidebarText}>home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
            <FontAwesome name="user" size={24} color="white" />
            <Text style={styles.sidebarText}>Avatars</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
            <FontAwesome5 name="gift" size={24} color="white" />
            <Text style={styles.sidebarText}>Daily Rewards</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>

      {/* Main Content */}
      <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.content}>
      <Text style={styles.header}>Avatar Management</Text>

        {/* Search and Create Avatar Button */}
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.openModalButtonText}>Create Avatar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
          >
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Avatars"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
               style={styles.searchButton}
               onPress={handleSearch}
             >
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
              <LinearGradient
                colors={['#1A3B32', '#2E7D32']}
                style={styles.modalHeader}
              >
                <Text style={styles.modalHeaderText}>{editingAvatar ? 'Update Avatar' : 'Create Avatar'}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </LinearGradient>

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
              />
              <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                <Text style={styles.buttonText}>Pick an Image</Text>
              </TouchableOpacity>
              {file && <Image source={{ uri: file.uri }} style={styles.imagePreview} />}

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={editingAvatar ? handleUpdateAvatar : handleCreateAvatar}
              >
                <Text style={styles.buttonText}>{editingAvatar ? 'Update Avatar' : 'Create Avatar'}</Text>
              </TouchableOpacity>

      
            </View>
          </View>
        </Modal>
     
      </LinearGradient>
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
    alignItems: 'row',
    justifyContent: 'flex-start',
  },
  sidebarItem: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 25,
    marginLeft: 10,
    alignItems: 'center',
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
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
  },
  form: {
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
  buttonSecondary: {
    backgroundColor: '#ff0000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    alignItems: 'center',
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
  avatarCard: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 20, // Increased padding for larger card
    borderRadius: 10, // Increased border radius for a rounded effect
    borderColor: '#333', // Bold border color
    borderWidth: 2, // Bold border width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center', // Center align content
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center', // Center name
  },
  avatarDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center', // Center description
  },
  avatarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', // Full width for buttons
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
    width: '50%',
    backgroundColor: '#1A3B32', // Dark green background
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    backgroundColor: '#2E7D32', // Light green background
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
  },
  openModalButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: 120, // Smaller button width
  },
  openModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    alignItems: 'center',
  },
  searchCreateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#fff',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
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
  modalHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    alignItems: 'center',
    color: '#fff',
    
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sidebarCollapsed: {
    width: 80, // Adjust this width as per your design needs
  },
  sidebarContent: {
    width: '100%',
    alignItems: 'top',
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    padding: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nameColumn: {
    flex: 2,
    textAlign: 'left',
  },
  descColumn: {
    flex: 3,
    textAlign: 'left',
  },
  actionColumn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  }
});

export default AvatarCRUD;
