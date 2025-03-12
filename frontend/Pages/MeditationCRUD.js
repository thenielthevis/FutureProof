import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Button, Animated, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createMeditationBreathingExercise, getMeditationBreathingExercises, updateMeditationBreathingExercise, deleteMeditationBreathingExercise } from '../API/meditation_api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      // Convert all meditation videos/images to base64
      const meditationsWithImages = await Promise.all(
        meditations.map(async (meditation) => {
          try {
            const imageSrc = await convertImageToBase64(meditation.url);
            return { ...meditation, imageSrc };
          } catch (error) {
            console.error('Error converting image:', error);
            return { ...meditation, imageSrc: null };
          }
        })
      );

      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      // Calculate how many meditations per page - changed from 7 to 3
      const MEDITATIONS_PER_PAGE = 3;
      const totalPages = Math.ceil(meditationsWithImages.length / MEDITATIONS_PER_PAGE);
      
      // Create header content that will appear on each page
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h4>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Meditation & Breathing Exercises Report</h2>
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
            
            <div style="margin-top: 20px;">
              <h3>Benefits of Meditation & Breathing Exercises</h3>
              <p>Regular meditation and breathing practice has been shown to:</p>
              <ul>
                <li>Reduce stress and anxiety</li>
                <li>Improve focus and concentration</li>
                <li>Enhance emotional well-being</li>
                <li>Lower blood pressure</li>
                <li>Improve sleep quality</li>
                <li>Boost immune system function</li>
              </ul>
              <p>Our guided meditation exercises help users develop mindfulness and create a foundation for better health outcomes.</p>
            </div>
          </div>
        </div>
      `;

      // Generate pages for meditations with pagination
      let meditationPages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * MEDITATIONS_PER_PAGE;
        const pageMeditations = meditationsWithImages.slice(startIdx, startIdx + MEDITATIONS_PER_PAGE);
        
        const pageContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>Meditation & Breathing Exercises ${i > 0 ? `(Page ${i + 1})` : ''}</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Name</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Description</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageMeditations.map((meditation, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                      <td style="padding: 12px; border: 1px solid #ddd; width: 20%;">
                        <div>
                          <strong>${meditation.name || '-'}</strong>
                        </div>
                        <div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 5px; margin-top: 8px; display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10B981">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </td>
                      <td style="padding: 12px; border: 1px solid #ddd; width: 40%;">${meditation.description || '-'}</td>
                      <td style="padding: 12px; border: 1px solid #ddd; width: 40%;">
                        ${Array.isArray(meditation.instructions) && meditation.instructions.length > 0 ? 
                          `<ol style="margin: 0; padding-left: 16px;">
                            ${meditation.instructions.map(instruction => 
                              `<li>${instruction}</li>`
                            ).join('')}
                          </ol>` 
                          : 'No instructions provided'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        meditationPages.push(pageContent);
      }

      // Combine all pages with page breaks
      const allPages = [
        firstPageContent,
        ...meditationPages
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
          const pages = [firstPageContent, ...meditationPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save('meditation-exercises-report.pdf');
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
      
      // Refresh the meditations list
      const refreshedMeditations = await getMeditationBreathingExercises();
      setMeditations(refreshedMeditations);
      setFilteredMeditations(refreshedMeditations);
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
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
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

        <ScrollView style={styles.tableWrapper}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 0.7}]}>Video</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Name</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Description</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredMeditations.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <View style={[styles.tableCell, {flex: 0.7}]}>
                  <Video
                    source={{ uri: item.url }}
                    style={styles.videoThumbnail}
                    resizeMode="contain"
                    repeat={true}
                    paused={true}
                    volume={0}
                  />
                </View>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.name}</Text>
                <Text style={[styles.tableCell, {flex: 2}, styles.descriptionCell]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.editBtn]} 
                      onPress={() => handleEditMeditation(item)}
                    >
                      <FontAwesome name="pencil" size={14} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.deleteBtn]} 
                      onPress={() => {
                        setSelectedMeditation(item._id);
                        setDeleteModalVisible(true);
                      }}
                    >
                      <FontAwesome name="trash" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
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

        {/* Create/Update Modal */}
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
                    placeholder="Enter meditation description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                {/* Instructions Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Instructions</Text>
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
                </View>

                {/* Video Upload Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Meditation Video</Text>
                  <TouchableOpacity style={styles.fileButton} onPress={handlePickVideo}>
                    <FontAwesome5 name="video" size={16} color="white" />
                    <Text style={styles.fileButtonText}>
                      {editingMeditation ? 'Change Video' : 'Upload Video'}
                    </Text>
                  </TouchableOpacity>
                  {file && (
                    <View style={styles.previewContainer}>
                      <Video 
                        source={{ uri: file.uri }} 
                        style={styles.videoPreview} 
                        resizeMode="contain" 
                        repeat={true}
                        paused={false}
                        volume={0}
                      />
                      <TouchableOpacity 
                        style={styles.removePreviewBtn} 
                        onPress={() => setFile(null)}
                      >
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
                  onPress={editingMeditation ? handleCreateOrUpdateMeditation : handleCreateOrUpdateMeditation}
                >
                  <Text style={styles.submitButtonText}>
                    {editingMeditation ? 'Update Meditation' : 'Create Meditation'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      {/* Delete Confirmation Modal */}
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
                Are you sure you want to delete this meditation?
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
                  if (selectedMeditation) {
                    handleDeleteMeditation(selectedMeditation);
                    setDeleteModalVisible(false);
                  } else {
                    Toast.show({
                      type: 'error',
                      text1: 'Error',
                      text2: 'No meditation selected for deletion',
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
  header: {
    fontSize: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchCreateContainer: {
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
    justifyContent: 'center', // Add this for better centering
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
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
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
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButton: {
    backgroundColor: '#10B981',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  editBtn: {
    backgroundColor: '#3498db',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  deleteModal_overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  deleteModal_content: {
    width: '100%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deleteModal_headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteModal_body: {
    padding: 20,
  },
  deleteModal_text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
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
  },
  deleteModal_cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  deleteModal_deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
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

export default MeditationCRUD;