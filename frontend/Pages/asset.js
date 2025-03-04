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
import Sidebar from './Sidebar';

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
            <Sidebar />
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
  quoteGrid: {
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
    marginLeft: 10,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 50,
    alignItems: 'center',
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    width: '60%',
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
    width: '60%',
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
    width: '80%',
    backgroundColor: '#fff',
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
  },
  modalHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  assetImage: {
    width: 80,
    height: 60,
    resizeMode: 'cover',
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