import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Picker, Animated, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAsset, readAssets, updateAsset, deleteAsset } from '../API/assets_api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';
import RNBlobUtil from "react-native-blob-util";

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);

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
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      const assetsWithImages = await Promise.all(
        assets.map(async (asset) => {
          if (asset.image_url) {
            try {
              const imageSrc = await convertImageToBase64(asset.image_url);
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

      // Calculate how many assets per page (you can adjust this number)
      const ASSETS_PER_PAGE = 7;
      const totalPages = Math.ceil(assetsWithImages.length / ASSETS_PER_PAGE);
      
      // Create header and footer content that will appear on each page
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h4>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Assets Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
      `;

      // Create first page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
        </div>
      `;

      // Generate pages for assets with pagination
      let assetPages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * ASSETS_PER_PAGE;
        const pageAssets = assetsWithImages.slice(startIdx, startIdx + ASSETS_PER_PAGE);
        
        const pageContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>Assets Inventory ${i > 0 ? `(Page ${i + 1})` : ''}</h3>
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
                  ${pageAssets.map((asset, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                        ${asset.imageSrc ? `<img src="${asset.imageSrc}" alt="${asset.name}" style="width: 80px; height: 80px; object-fit: cover; display: block; margin: 0 auto;">` : 'No Image'}
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
          </div>
        `;
        
        assetPages.push(pageContent);
      }

      // Combine all pages with page breaks
      const allPages = [
        firstPageContent,
        ...assetPages
      ].join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        try {
          // For web platform - use jsPDF directly with separate pages
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            // Set a fixed width to match A4 dimensions (595.28pt is standard A4 width)
            container.style.width = '595.28pt';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
            try {
              // Wait for images to load
              await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
              
              // Use a fixed scale (1.0) to prevent zooming out
              const canvas = await html2canvas(container, {
                scale: 1.0, // Use natural scale
                useCORS: true,
                logging: false
              });
              
              // Always use the full page width
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              
              // Add new page if it's not the first page
              if (pageNum > 0) pdf.addPage();
              
              // Add image with proper sizing
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0), 
                'JPEG', 
                0, 0, 
                pdfWidth, 
                canvas.height * (pdfWidth / canvas.width)
              );
            } finally {
              document.body.removeChild(container);
            }
          };
          
          // Process each page
          const pages = [firstPageContent, ...assetPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save('assets-report.pdf');
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        // For mobile platforms
        try {
          const { uri } = await Print.printToFileAsync({ 
            html: allPages,
            base64: false,
            width: 612, // Standard 8.5" x 11" page width in points
            height: 792 // Standard 8.5" x 11" page height in points
          });
          await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleExportPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
  
      // ✅ Fix: Check for `canceled` instead of `type`
      if (result.canceled) {
        console.log('Document picking was canceled.');
        Alert.alert('Canceled', 'Document picking was canceled.');
        return;
      }
  
      const pickedFile = result.assets[0]; // ✅ Fix: Use `assets[0]` (Expo SDK 49+)
  
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
  
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'An error occurred while picking the file.');
    }
  };

  const handleCreateAsset = async () => {
    try {
      setModalVisible(false);
  
      // Ensure required fields are provided
      if (!name || !price || !assetType) {
        Alert.alert("Missing Fields", "Please fill in all required fields.");
        return;
      }
  
      // ✅ Create FormData for multipart request
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description || "");
      formData.append("price", price);
      formData.append("asset_type", assetType);
  
      // ✅ Append Image file (if selected)
      if (file && file.uri) {
        // Create Blob from file URI (for web compatibility)
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        formData.append("image_file", blob, file.name || `image_${Date.now()}.png`);
      } else {
        Alert.alert("Image Required", "Please select an image file.");
        return;
      }
  
      // ✅ Append GLB file (if selected)
      if (glbFile && glbFile.uri) {
        // Create Blob from file URI (for web compatibility)
        const response = await fetch(glbFile.uri);
        const blob = await response.blob();
        
        formData.append("file", blob, glbFile.name || `asset_${Date.now()}.glb`);
      } else {
        Alert.alert("GLB File Required", "Please select a valid .glb file.");
        return;
      }
  
      // ✅ Log the FormData before sending (for debugging)
      console.log("Submitting FormData:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
  
      // ✅ Call API with FormData
      const newAsset = await createAsset(formData);
  
      // ✅ Update state
      setAssets([...assets, newAsset]);
      setFilteredAssets([...assets, newAsset]);
      setModalVisible(false);
  
      // ✅ Reset form fields
      setName("");
      setDescription("");
      setFile(null);
      setGlbFile(null);
      setPrice("");
      setAssetType("");
  
      // ✅ Show success message
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Asset created successfully!",
      });
    } catch (error) {
      console.error("Error creating asset:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create asset. Please try again.",
      });
    }
  };  
  
  const handleUpdateAsset = async () => {
    try {
      if (!editingAsset || !editingAsset._id) {
        console.error('No asset selected for update');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No asset selected for update',
        });
        return;
      }
  
      console.log('Updating asset with ID:', editingAsset._id); // Debug log
  
      setModalVisible(false);
      const updatedAsset = await updateAsset(editingAsset._id, {
        name,
        description,
        file,
        price,
        assetType
      });
  
      const updatedAssets = assets.map(asset => 
        asset._id === editingAsset._id ? updatedAsset : asset
      );
      
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
      if (!assetId) {
        console.error('No asset ID provided for deletion');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid asset selected for deletion',
        });
        return;
      }
  
      console.log('Deleting asset with ID:', assetId); // Debug log
  
      setDeleteModalVisible(false);
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
    if (!asset || !asset._id) {
      console.error('Invalid asset or asset ID');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid asset selected for editing',
      });
      return;
    }
    
    console.log('Editing asset:', asset); // Debug log
    
    setEditingAsset(asset);
    setName(asset.name || '');
    setDescription(asset.description || '');
    setFile(null);
    setPrice(asset.price ? asset.price.toString() : '');
    setAssetType(asset.asset_type || '');
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
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.price.toString().includes(searchQuery)
    );
    setFilteredAssets(filtered);
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
          <Text style={styles.pageTitle}>Assets Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Asset</Text>
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
            placeholder="Search assets by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tableWrapper}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 0.7}]}>Image</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Name</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Description</Text>
              <Text style={[styles.tableHeaderText, {flex: 0.7}]}>Price</Text>
              <Text style={[styles.tableHeaderText, {flex: 0.7}]}>Type</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredAssets.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <View style={[styles.tableCell, {flex: 0.7}]}>
                  <Image source={{ uri: item.image_url }} style={styles.assetImage} />
                </View>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.name}</Text>
                <Text style={[styles.tableCell, {flex: 2}, styles.descriptionCell]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.7}]}>{item.price}</Text>
                <Text style={[styles.tableCell, {flex: 0.7}]}>
                  <View style={[styles.badgeContainer, 
                    item.asset_type === 'head' ? styles.badgeHead : 
                    item.asset_type === 'top' ? styles.badgeTop : styles.badgeBottom]}>
                    <Text style={styles.badgeText}>{item.asset_type}</Text>
                  </View>
                </Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditAsset(item)}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => {
                      console.log("Delete button clicked!");
                      setSelectedAsset(item._id);
                      setDeleteModalVisible(true);
                    }}
                  >
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredAssets.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="box-open" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No assets found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new asset</Text>
              </View>
            )}
          </View>
        </ScrollView>

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
                  {editingAsset ? 'Update Asset' : 'Create New Asset'}
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
                    placeholder="Enter asset name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter asset description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter asset price"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={assetType}
                      onValueChange={(itemValue) => setAssetType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Costume" value="costume" />
                      <Picker.Item label="Top" value="top" />
                      <Picker.Item label="Head" value="head" />
                      <Picker.Item label="Hair" value="hair" />
                      <Picker.Item label="Bottom" value="bottom" />
                      <Picker.Item label="Shoes" value="shoes" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.fileInputsRow}>
                  <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                    <Text style={styles.inputLabel}>Asset Image</Text>
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

                  <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                    <Text style={styles.inputLabel}>GLB File</Text>
                    <TouchableOpacity style={styles.fileButton} onPress={handlePickGlbFile}>
                      <FontAwesome5 name="cube" size={16} color="white" />
                      <Text style={styles.fileButtonText}>Select GLB File</Text>
                    </TouchableOpacity>
                    {glbFile && (
                      <View style={styles.filePreview}>
                        <FontAwesome5 name="file-alt" size={24} color="#10B981" />
                        <Text style={styles.fileName} numberOfLines={1}>{glbFile.name}</Text>
                        <TouchableOpacity onPress={() => setGlbFile(null)}>
                          <FontAwesome name="times-circle" size={20} color="#ff4d4d" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
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
                  onPress={editingAsset ? handleUpdateAsset : handleCreateAsset}
                >
                  <Text style={styles.submitButtonText}>
                    {editingAsset ? 'Update Asset' : 'Create Asset'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                  Are you sure you want to delete this asset?
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
                    if (selectedAsset) {
                      handleDeleteAsset(selectedAsset);
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No asset selected for deletion',
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
      {/* Add Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Generating PDF...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fc',
  },
  // Modern Sidebar styles
  sidebar: {
    width: 240,
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarTop: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    width: '100%',
  },
  sidebarBrand: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collapseButton: {
    position: 'absolute',
    right: 5,
  },
  sidebarLogoCollapsed: {
    marginTop: 10,
    marginBottom: 20,
  },
  sidebarContent: {
    flex: 1,
  },
  menuGroup: {
    marginBottom: 22,
  },
  menuLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  sidebarIconOnly: {
    alignItems: 'center',
    paddingVertical: 12,
    width: 60,
    marginBottom: 1,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  sidebarText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 10,
  },
  collapsedMenuItems: {
    alignItems: 'center',
  },
  
  // Main content styles
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
  
  // Table styles
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
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  descriptionCell: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  assetImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeHead: {
    backgroundColor: 'rgba(219, 39, 119, 0.1)',
  },
  badgeTop: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeBottom: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  
  // Modal styles
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 5,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  fileInputsRow: {
    flexDirection: 'row',
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
    width: 100,
    height: 150,
    borderRadius: 6,
    alignSelf: 'center',
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
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  fileName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
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

  //Delete Modal
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
    color: '#B91C1C', // Dark Red for danger
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default AssetCRUD;