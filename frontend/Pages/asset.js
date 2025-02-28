import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Picker
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAsset, readAssets, updateAsset, deleteAsset } from '../API/assets_api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';

const AssetCRUD = () => {
  const navigation = useNavigation();
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null); // For image file
  const [glbFile, setGlbFile] = useState(null); // For GLB file
  const [price, setPrice] = useState('');
  const [assetType, setAssetType] = useState('top');
  const [editingAsset, setEditingAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assetsData = await readAssets();
        setAssets(assetsData);
        setFilteredAssets(assetsData);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };
    fetchAssets();
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
      const assetsWithImages = await Promise.all(
        assets.map(async (asset) => {
          if (asset.url) {
            try {
              const imageSrc = await convertImageToBase64(asset.url);
              return { ...asset, imageSrc };
            } catch (error) {
              console.error('Error converting image:', error);
              return { ...asset, imageSrc: null };
            }
          }
          return { ...asset, imageSrc: null };
        })
      );

      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center;">
              <h1 style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2 style="font-size: 16px; margin: 0;">Asset Report</h2>
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
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Price</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Type</th>
              </tr>
            </thead>
            <tbody>
              ${assetsWithImages.map((asset, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    ${asset.imageSrc ? `<img src="${asset.imageSrc}" alt="Asset" style="max-width: 80px; max-height: 60px;">` : 'No Image'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${asset.name || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${asset.description || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${asset.price || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${asset.asset_type || '-'}</td>
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
                img.onload = resolve;
                img.onerror = resolve;
              });
            })
          );
        };

        await waitForImages();
        const canvas = await html2canvas(container);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('asset-report.pdf');
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
        const fileName = `asset_${Date.now()}.png`;
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
        name: `asset_${Date.now()}.png`,
      });
    }
  };

  const handlePickGlbFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'model/gltf-binary',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const pickedFile = result;

        if (!pickedFile.name.toLowerCase().endsWith('.glb')) {
          console.error('Selected file is not a .glb file:', pickedFile);
          Alert.alert('Invalid File', 'Please select a valid .glb file.');
          return;
        }

        let fileUri = pickedFile.uri;

        if (Platform.OS !== 'web') {
          const fileName = `asset_${Date.now()}.glb`;
          fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          try {
            await FileSystem.moveAsync({
              from: pickedFile.uri,
              to: fileUri,
            });
          } catch (error) {
            console.error('Error moving file:', error);
            return;
          }
        }

        setGlbFile({
          uri: fileUri,
          type: 'model/gltf-binary',
          name: `asset_${Date.now()}.glb`,
        });
      } else {
        console.log('Document picking was canceled or failed.');
        Alert.alert('Canceled', 'Document picking was canceled or failed.');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'An error occurred while picking the file.');
    }
  };

  const handleCreateAsset = async () => {
    try {
      const newAsset = await createAsset({ name, description, price, assetType, file, imageFile: glbFile });
      setAssets([...assets, newAsset]);
      setFilteredAssets([...assets, newAsset]);
      setModalVisible(false);
      setName('');
      setDescription('');
      setFile(null);
      setGlbFile(null);  // Reset GLB file
      setPrice('');
      setAssetType('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Asset created successfully!',
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create asset. Please try again.',
      });
    }
  };

  const handleUpdateAsset = async () => {
    try {
      const updatedAsset = await updateAsset(editingAsset._id, { name, description, file, price, assetType });
      const updatedAssets = assets.map(asset => (asset._id === editingAsset._id ? updatedAsset : asset));
      setAssets(updatedAssets);
      setFilteredAssets(updatedAssets);
      setModalVisible(false);
      setEditingAsset(null);
      setName('');
      setDescription('');
      setFile(null);
      setPrice('');
      setAssetType('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Asset updated successfully!',
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update asset. Please try again.',
      });
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      await deleteAsset(assetId);
      const updatedAssets = assets.filter(asset => asset._id !== assetId);
      setAssets(updatedAssets);
      setFilteredAssets(updatedAssets);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Asset deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete asset. Please try again.',
      });
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setDescription(asset.description);
    setFile(null);
    setPrice(asset.price.toString());
    setAssetType(asset.asset_type);
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingAsset(null);
    setName('');
    setDescription('');
    setFile(null);
    setPrice('');
    setAssetType('');
    setModalVisible(true);
  };

  const handleSearch = () => {
    const filtered = assets.filter(asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAssets(filtered);
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
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.header}>Assets Management</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.openModalButton} onPress={handleOpenModal}>
            <Text style={styles.openModalButtonText}>Create Asset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Assets"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.assetGrid}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Image</Text>
              <Text style={styles.tableHeaderText}>Name</Text>
              <Text style={styles.tableHeaderText}>Description</Text>
              <Text style={styles.tableHeaderText}>Price</Text>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {filteredAssets.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Image source={{ uri: item.url }} style={styles.assetImage} />
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>{item.description}</Text>
                <Text style={styles.tableCell}>{item.price}</Text>
                <Text style={styles.tableCell}>{item.asset_type}</Text>
                <View style={styles.tableCell}>
                  <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditAsset(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteAsset(item._id)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

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
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter asset name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter asset description"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter asset price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type</Text>
                <Picker
                  selectedValue={assetType}
                  onValueChange={(itemValue) => setAssetType(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Top" value="top" />
              <Picker.Item label="Head" value="head" />
              <Picker.Item label="Bottom" value="bottom" />
            </Picker>
              </View>

              <View style={styles.inputGroup}>
  <Text style={styles.label}>Asset Image</Text>
  <TouchableOpacity style={styles.button} onPress={handlePickImage}>
    <Text style={styles.buttonText}>Pick Image</Text>
  </TouchableOpacity>
  {file ? (
    <Image source={{ uri: file.uri }} style={styles.imagePreview} />
  ) : (
    <Text style={styles.noImageText}>No image selected</Text>
  )}
</View>

<View style={styles.inputGroup}>
  <Text style={styles.label}>GLB File</Text>
  <TouchableOpacity style={styles.button} onPress={handlePickGlbFile}>
    <Text style={styles.buttonText}>Pick GLB File</Text>
  </TouchableOpacity>
  {glbFile ? (
    <Text style={styles.fileName}>{glbFile.name}</Text>
  ) : (
    <Text style={styles.noFileText}>No GLB file selected</Text>
  )}
</View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingAsset ? handleUpdateAsset : handleCreateAsset}
              >
                <Text style={styles.submitButtonText}>
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
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
  },
  sidebar: {
    width: 250,
    backgroundColor: '#003C2C',
    paddingVertical: 20,
  },
  sidebarCollapsed: {
    width: 80,
  },
  sidebarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sidebarText: {
    color: 'white',
    marginLeft: 10,
  },
  sidebarContent: {
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchCreateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  openModalButton: {
    backgroundColor: '#005C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  openModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#005C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#005C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
  },
  assetImage: {
    width: 80,
    height: 60,
    resizeMode: 'cover',
  },
  buttonEdit: {
    backgroundColor: '#005C3C',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  buttonDelete: {
    backgroundColor: '#d9534f',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  inputGroup: {
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#005C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#005C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    margin: 15,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default AssetCRUD;