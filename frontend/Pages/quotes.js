import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Alert, Platform
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
        <Text style={styles.header}>Quotes Management</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.openModalButton} onPress={handleOpenModal}>
            <Text style={styles.openModalButtonText}>Create Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Quotes"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.quoteGrid}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Text</Text>
              <Text style={styles.tableHeaderText}>Author</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {filteredQuotes.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={styles.tableCell}>{item.text}</Text>
                <Text style={styles.tableCell}>{item.author}</Text>
                <View style={styles.tableCell}>
                  <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditQuote(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteQuote(item._id)}>
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
                  {editingQuote ? 'Update Quote' : 'Create Quote'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Text</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quote text"
                  value={text}
                  onChangeText={setText}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Author</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter author name"
                  value={author}
                  onChangeText={setAuthor}
                />
              </View>

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={editingQuote ? handleUpdateQuote : handleCreateQuote}
              >
                <Text style={styles.buttonText}>
                  {editingQuote ? 'Update Quote' : 'Create Quote'}
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
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 25,
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    width: '70%',
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
    width: '70%',
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
});

export default QuotesCRUD;