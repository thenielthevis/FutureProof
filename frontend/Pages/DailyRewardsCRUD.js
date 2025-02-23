import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, Picker, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDailyReward, readDailyRewards, updateDailyReward, deleteDailyReward, readAvatars, getAvatar } from '../API/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleCreateReward = async () => {
    try {
      const newReward = await createDailyReward({ day, coins, avatar, top, bottom, shoes });
      setRewards([...rewards, newReward]);
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
    } catch (error) {
      console.error('Error creating daily reward:', error);
    }
  };

  const handleUpdateReward = async () => {
    try {
      const updatedReward = await updateDailyReward(editingReward._id, { day, coins, avatar, top, bottom, shoes });
      setRewards(rewards.map(reward => (reward._id === editingReward._id ? updatedReward : reward)));
      setEditingReward(null);
      setDay('');
      setCoins('');
      setAvatar('');
      setTop('');
      setBottom('');
      setShoes('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating daily reward:', error);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    try {
      await deleteDailyReward(rewardId);
      setRewards(rewards.filter(reward => reward._id !== rewardId));
    } catch (error) {
      console.error('Error deleting daily reward:', error);
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
      setRewards(filtered);  // Update state with filtered rewards
    } catch (error) {
      console.error('Error fetching daily rewards:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            .avatar-image { width: 100px; height: 100px; object-fit: cover; }
            .button { background-color: #3498db; color: white; padding: 5px 10px; text-align: center; border-radius: 5px; text-decoration: none; }
            .button.delete { background-color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Avatar List</h1>
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${avatarsWithBase64.map(avatar => `
                <tr>
                  <td>${avatar.base64Image ? `<img src="${avatar.base64Image}" class="avatar-image" />` : 'No image'}</td>
                  <td>${avatar.name}</td>
                  <td>${avatar.description}</td>
                  <td>
                    <a href="#" class="button">Edit</a>
                    <a href="#" class="button delete">Delete</a>
                  </td>
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
      <View style={styles.content}>
        <Text style={styles.header}>Daily Rewards Management</Text>

        {/* Search and Create Reward Button */}
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.openModalButtonText}>Create Reward</Text>
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
    fontSize: 15,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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