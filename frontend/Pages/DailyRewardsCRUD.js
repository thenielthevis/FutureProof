import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, Picker, ScrollView, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDailyReward, readDailyRewards, updateDailyReward, deleteDailyReward, readAvatars, getAvatar } from '../API/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

const DailyRewardsCRUD = () => {
  const navigation = useNavigation();
  const [rewards, setRewards] = useState([]);
  const [day, setDay] = useState('');
  const [coins, setCoins] = useState('');
  const [avatar, setAvatar] = useState('');
  const [top, setTop] = useState('');
  const [bottom, setBottom] = useState('');
  const [shoes, setShoes] = useState('');
  const [editingReward, setEditingReward] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [avatarImages, setAvatarImages] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // State for sidebar visibility
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [filteredAvatars, setFilteredAvatars] = useState([]); // State for filtered avatars

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const rewardsData = await readDailyRewards();
        setRewards(rewardsData);
        setFilteredAvatars(rewardsData); // Initialize filteredAvatars with all rewards
      } catch (error) {
        console.error('Error fetching daily rewards:', error);
      }
    };

    const fetchAvatars = async () => {
      try {
        const avatarsData = await readAvatars();
        setAvatars(avatarsData);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchRewards();
    fetchAvatars();
  }, []);

  useEffect(() => {
    const fetchAvatarImages = async () => {
      try {
        const images = {};
        for (const reward of rewards) {
          if (reward.avatar) {
            const avatarData = await getAvatar(reward.avatar);
            images[reward.avatar] = avatarData.url;
          }
        }
        setAvatarImages(images);
      } catch (error) {
        console.error('Error fetching avatar images:', error);
      }
    };

    fetchAvatarImages();
  }, [rewards]);

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
      const rewardsWithImages = await Promise.all(
        rewards.map(async (reward) => {
          if (reward.avatar && avatarImages[reward.avatar]) {
            const imageSrc = await convertImageToBase64(avatarImages[reward.avatar]);
            return { ...reward, imageSrc };
          }
          return { ...reward, imageSrc: null }; // No image available
        })
      );
  
      // HTML content for the PDF
      const logo1 = "https://i.ibb.co/GQygLXT9/tuplogo.png";
      const logo2 = "https://i.ibb.co/YBStKgFC/logo-2.png";
     
        // Convert logo URLs to base64
    const logo1Base64 = await convertImageToBase64(logo1);
    const logo2Base64 = await convertImageToBase64(logo2);

     
      const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center;">
            <h1 style="style="font-size: 20px; margin: 0; color: red;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
             <h2 style="font-size: 16px; margin: 0;">Daily Rewards Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Avatar</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Day</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Coins</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Top ID</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Bottom ID</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Shoes ID</th>
            </tr>
          </thead>
          <tbody>
            ${rewardsWithImages.map((reward, index) => `
              <tr style="background-color: ${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                <td style="padding: 12px; border: 1px solid #ddd;">
                  ${reward.imageSrc ? `<img src="${reward.imageSrc}" alt="Avatar" style="max-width: 80px; max-height: 60px;">` : 'No Image'}
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.day || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.coins || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.top || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.bottom || '-'}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${reward.shoes || '-'}</td>
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
        pdf.save('daily-reward-report.pdf'); // Save the PDF
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

  const handleCreateReward = async () => {
    try {
      const newReward = await createDailyReward({ day, coins, avatar, top, bottom, shoes });
      setRewards([...rewards, newReward]);
      setFilteredAvatars([...rewards, newReward]); // Update filteredAvatars
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
    Toast.show({
           type: 'success',
           text1: 'Success',
           text2: 'Reward created successfully!',
         });
       } catch (error) {
         console.error('Error creating reward:', error);
         Toast.show({
           type: 'error',
           text1: 'Error',
           text2: 'Failed to create reward. Please try again.',
         });
       }
     };

  const handleUpdateReward = async () => {
    try {
      const updatedReward = await updateDailyReward(editingReward._id, { day, coins, avatar, top, bottom, shoes });
      const updatedRewards = rewards.map(reward => (reward._id === editingReward._id ? updatedReward : reward));
      setRewards(updatedRewards);
      setFilteredAvatars(updatedRewards); // Update filteredAvatars
      setEditingReward(null);
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
      setModalVisible(false);
      Toast.show({
           type: 'success',
           text1: 'Success',
           text2: 'Reward updated successfully!',
         });
       } catch (error) {
         console.error('Error updating reward:', error);
         Toast.show({
           type: 'error',
           text1: 'Error',
           text2: 'Failed to update reward. Please try again.',
         });
       }
     };

  const handleDeleteReward = async (rewardId) => {
    try {
      await deleteDailyReward(rewardId);
      const updatedRewards = rewards.filter(reward => reward._id !== rewardId);
      setRewards(updatedRewards);
      setFilteredAvatars(updatedRewards); // Update filteredAvatars
   Toast.show({
           type: 'success',
           text1: 'Success',
           text2: 'Reward deleted successfully!',
         });
       } catch (error) {
         console.error('Error deleting reward:', error);
         Toast.show({
           type: 'error',
           text1: 'Error',
           text2: 'Failed to delete reward. Please try again.',
         });
       }
     };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setDay(reward.day);
    setCoins(reward.coins);
    setAvatar(reward.avatar);
    setTop(reward.top);
    setBottom(reward.bottom);
    setShoes(reward.shoes);
    setModalVisible(true); 
  };

  const handleOpenModal = () => {
    setEditingReward(null);
    setDay('');
    setCoins('');
    setAvatar('');
    setTop('');
    setBottom('');
    setShoes('');
    setModalVisible(true); // Open modal for creating
  };

  const handleSearch = async () => {
    try {
      const rewardsData = await readDailyRewards(); // Fetch the original rewards list
      const filtered = rewardsData.filter(reward => {
        const dayMatch = String(reward.day).toLowerCase().includes(searchQuery.toLowerCase());
        const coinsMatch = reward.coins.toString().includes(searchQuery);
        return dayMatch || coinsMatch;
      });
      setFilteredAvatars(filtered);  // Update state with filtered rewards
    } catch (error) {
      console.error('Error fetching daily rewards:', error);
    }
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
          </View>
        )}
      </LinearGradient>

      {/* Main Content with Gradient Background */}
      <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.content}>
        <Text style={styles.header}>Daily Rewards Management</Text>

        {/* Search and Create Reward Button */}
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.openModalButtonText}>Create Reward</Text>
          </TouchableOpacity>
        
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
        <Text style={styles.exportButtonText}>Export PDF</Text>
      </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Day or Coins"
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

        {/* Reward List */}
        <ScrollView contentContainerStyle={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Day</Text>
            <Text style={styles.tableHeaderText}>Coins</Text>
            <Text style={styles.tableHeaderText}>Avatar</Text>
            <Text style={styles.tableHeaderText}>Top ID</Text>
            <Text style={styles.tableHeaderText}>Bottom ID</Text>
            <Text style={styles.tableHeaderText}>Shoes ID</Text>
            <Text style={styles.tableHeaderText}>Actions</Text>
          </View>
          {rewards.map((item) => (
            <View style={styles.tableRow} key={item._id}>
              <Text style={styles.tableCell}>{item.day}</Text>
              <View style={styles.tableCell}>
                <FontAwesome5 name="coins" size={14} color="gold" />
                <Text> {item.coins}</Text>
              </View>
              <View style={styles.tableCell}>
                {item.avatar && avatarImages[item.avatar] ? (
                  <Image source={{ uri: avatarImages[item.avatar] }} style={styles.avatarImage} />
                ) : (
                  <Text>No Avatar</Text>
                )}
              </View>
              <Text style={styles.tableCell}>{item.top}</Text>
              <Text style={styles.tableCell}>{item.bottom}</Text>
              <Text style={styles.tableCell}>{item.shoes}</Text>
              <View style={styles.tableCell}>
                <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditReward(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteReward(item._id)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Modal for Create/Update Reward */}
        <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <LinearGradient
        colors={['#1A3B32', '#1A3B32']}
        style={styles.modalHeader}
      >
        <Text style={styles.modalHeaderText}>{editingReward ? 'Update Reward' : 'Create Reward'}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Day Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Day</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter day number"
          value={day}
          onChangeText={setDay}
        />
      </View>

      {/* Coins Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Coins</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter coin amount"
          value={coins}
          onChangeText={setCoins}
        />
      </View>

      {/* Avatar Picker */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Avatar</Text>
        <Picker
          selectedValue={avatar}
          style={styles.picker}
          onValueChange={(itemValue) => setAvatar(itemValue)}
        >
          <Picker.Item label="Select Avatar" value="" />
          {avatars.map((avatar) => (
            <Picker.Item key={avatar._id} label={avatar.name} value={avatar._id} />
          ))}
        </Picker>
      </View>

      {/* Top ID Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Top ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter top clothing ID"
          value={top}
          onChangeText={setTop}
        />
      </View>

      {/* Bottom ID Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bottom ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter bottom clothing ID"
          value={bottom}
          onChangeText={setBottom}
        />
      </View>

      {/* Shoes ID Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Shoes ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter shoes ID"
          value={shoes}
          onChangeText={setShoes}
        />
      </View>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={editingReward ? handleUpdateReward : handleCreateReward}
      >
        <Text style={styles.buttonText}>{editingReward ? 'Update Reward' : 'Create Reward'}</Text>
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
    justifyContent: 'flex-start',
  },
  sidebarCollapsed: {
    width: 80,
    padding: 20,
   
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
  },
  sidebarTop: {
    width: '100%', 
    alignItems: 'flex-end',
  },
  sidebarContent: {
    width: '100%',
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
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
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
  rewardItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  rewardText: {
    fontSize: 14,
    marginBottom: 5,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  rewardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
    width: 100,
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 5,
    borderRadius: 5,
    width: 100,
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
    marginLeft: 50,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  openModalButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  
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

  inputGroup: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    color: '#fff',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500',
  },
  // Update input and picker to remove individual margins
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default DailyRewardsCRUD;