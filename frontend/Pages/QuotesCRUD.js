import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Alert, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createQuote, readQuotes, updateQuote, deleteQuote } from '../API/quotes_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import Toast from 'react-native-toast-message';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Sidebar from './Sidebar';

const QuotesCRUD = () => {
  const navigation = useNavigation();
  const [quotes, setQuotes] = useState([]);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [editingQuote, setEditingQuote] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const quotesData = await readQuotes();
        setQuotes(quotesData);
        setFilteredQuotes(quotesData);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }
    };
    fetchQuotes();

    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
              <h2 style="font-size: 16px; margin: 0;">Quotes Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Text</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Author</th>
              </tr>
            </thead>
            <tbody>
              ${quotes.map((quote, index) => `
                <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                  <td style="padding: 12px; border: 1px solid #ddd;">${quote.text || '-'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${quote.author || '-'}</td>
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
        pdf.save('quotes_report.pdf');
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

  const handleCreateQuote = async () => {
    try {
      console.log('Creating quote with text:', text, 'and author:', author); // Log input data
      const newQuote = await createQuote({ text, author });
      setQuotes([...quotes, newQuote]);
      setFilteredQuotes([...quotes, newQuote]);
      setModalVisible(false);
      setText('');
      setAuthor('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Quote created successfully!',
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create quote. Please try again.',
      });
    }
  };

  const handleUpdateQuote = async () => {
    try {
      console.log('Updating quote with text:', text, 'and author:', author); // Log input data
      const updatedQuote = await updateQuote(editingQuote._id, { text, author });
      const updatedQuotes = quotes.map(quote => (quote._id === editingQuote._id ? updatedQuote : quote));
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      setModalVisible(false);
      setEditingQuote(null);
      setText('');
      setAuthor('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Quote updated successfully!',
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update quote. Please try again.',
      });
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    try {
      await deleteQuote(quoteId);
      const updatedQuotes = quotes.filter(quote => quote._id !== quoteId);
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Quote deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete quote. Please try again.',
      });
    }
  };

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setText(quote.text);
    setAuthor(quote.author);
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingQuote(null);
    setText('');
    setAuthor('');
    setModalVisible(true);
  };

  const handleSearch = () => {
    const filtered = quotes.filter(quote =>
      quote.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.author && quote.author.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredQuotes(filtered);
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
          <Text style={styles.pageTitle}>Quotes Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Quote</Text>
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
            placeholder="Search quotes by text or author..."
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
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Text</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Author</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredQuotes.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={[styles.tableCell, {flex: 2}]}>{item.text}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.author}</Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditQuote(item)}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => {
                      setSelectedQuote(item._id);
                      setDeleteModalVisible(true);
                    }}
                  >
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredQuotes.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="quote-right" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No quotes found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new quote</Text>
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
                  {editingQuote ? 'Update Quote' : 'Create New Quote'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Text</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter quote text"
                    value={text}
                    onChangeText={setText}
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Author</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter author name"
                    value={author}
                    onChangeText={setAuthor}
                  />
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
                  onPress={editingQuote ? handleUpdateQuote : handleCreateQuote}
                >
                  <Text style={styles.submitButtonText}>
                    {editingQuote ? 'Update Quote' : 'Create Quote'}
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
                  Are you sure you want to delete this quote?
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
                    if (selectedQuote) {
                      handleDeleteQuote(selectedQuote);
                      setDeleteModalVisible(false);
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No quote selected for deletion',
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
    </View>
  );
};

const additionalStyles = {
  // Delete Modal Styles
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
    color: '#B91C1C',
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fc',
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
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  ...additionalStyles
});

export default QuotesCRUD;