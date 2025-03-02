import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, Picker, ScrollView, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAchievement, readAchievements, updateAchievement, deleteAchievement } from '../API/achievements_api';
import { readAvatars, getAvatar } from '../API/avatar_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const AchievementsCRUD = () => {
  const navigation = useNavigation();
  const [achievements, setAchievements] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coins, setCoins] = useState('');
  const [xp, setXp] = useState('');
  const [requirements, setRequirements] = useState('');
  const [avatar, setAvatar] = useState('');
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [avatarImages, setAvatarImages] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const achievementsData = await readAchievements();
        setAchievements(achievementsData);
      } catch (error) {
        console.error('Error fetching achievements:', error);
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

    fetchAchievements();
    fetchAvatars();
  }, []);

  useEffect(() => {
    const fetchAvatarImages = async () => {
      try {
        const images = {};
        for (const achievement of achievements) {
          if (achievement.avatar_id) {
            const avatarData = await getAvatar(achievement.avatar_id);
            images[achievement.avatar_id] = avatarData.url;
          }
        }
        setAvatarImages(images);
      } catch (error) {
        console.error('Error fetching avatar images:', error);
      }
    };

    fetchAvatarImages();
  }, [achievements]);

  const handleCreateAchievement = async () => {
    try {
      const newAchievement = await createAchievement({
        name,
        description,
        coins: Number(coins), // Ensure numbers
        xp: Number(xp), // Ensure numbers
        requirements,
        avatar_id: avatar ? String(avatar) : null, // Convert avatar to string or null
      });

      setAchievements([...achievements, newAchievement]);
      setName('');
      setDescription('');
      setCoins('');
      setXp('');
      setRequirements('');
      setAvatar('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement created successfully!',
      });
    } catch (error) {
      console.error('Error creating achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create achievement. Please try again.',
      });
    }
  };

  const handleUpdateAchievement = async () => {
    try {
      const updatedAchievement = await updateAchievement(editingAchievement._id, {
        name,
        description,
        coins: Number(coins), // Ensure numbers
        xp: Number(xp), // Ensure numbers
        requirements,
        avatar_id: avatar ? String(avatar) : null, // Convert avatar to string or null
      });

      const updatedAchievements = achievements.map(achievement => (achievement._id === editingAchievement._id ? updatedAchievement : achievement));
      setAchievements(updatedAchievements);
      setEditingAchievement(null);
      setName('');
      setDescription('');
      setCoins('');
      setXp('');
      setRequirements('');
      setAvatar('');
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement updated successfully!',
      });
    } catch (error) {
      console.error('Error updating achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update achievement. Please try again.',
      });
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    try {
      await deleteAchievement(achievementId);
      const updatedAchievements = achievements.filter(achievement => achievement._id !== achievementId);
      setAchievements(updatedAchievements);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Achievement deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting achievement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete achievement. Please try again.',
      });
    }
  };

  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement);
    setName(achievement.name);
    setDescription(achievement.description);
    setCoins(achievement.coins);
    setXp(achievement.xp);
    setRequirements(achievement.requirements);
    setAvatar(achievement.avatar_id);
    setModalVisible(true);
  };

  const handleOpenModal = () => {
    setEditingAchievement(null);
    setName('');
    setDescription('');
    setCoins('');
    setXp('');
    setRequirements('');
    setAvatar('');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#003C2C', '#005C3C']} style={styles.sidebar}>
        <View style={styles.sidebarTop}>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
            <FontAwesome name="home" size={24} color="white" />
            <Text style={styles.sidebarText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
            <FontAwesome name="dashboard" size={24} color="white" />
            <Text style={styles.sidebarText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
            <FontAwesome name="user" size={24} color="white" />
            <Text style={styles.sidebarText}>Avatars</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
            <FontAwesome5 name="gift" size={24} color="white" />
            <Text style={styles.sidebarText}>Daily Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AchievementsCRUD')}>
            <FontAwesome5 name="trophy" size={24} color="white" />
            <Text style={styles.sidebarText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.header}>Achievements Management</Text>

        <View style={styles.searchCreateContainer}>
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.openModalButtonText}>Create Achievement</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Name</Text>
            <Text style={styles.tableHeaderText}>Description</Text>
            <Text style={styles.tableHeaderText}>Coins</Text>
            <Text style={styles.tableHeaderText}>XP</Text>
            <Text style={styles.tableHeaderText}>Requirements</Text>
            <Text style={styles.tableHeaderText}>Avatar</Text>
            <Text style={styles.tableHeaderText}>Actions</Text>
          </View>
          {achievements.map((item) => (
            <View style={styles.tableRow} key={item._id}>
              <Text style={styles.tableCell}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={styles.tableCell}>{item.coins}</Text>
              <Text style={styles.tableCell}>{item.xp}</Text>
              <Text style={styles.tableCell}>{item.requirements}</Text>
              <View style={styles.tableCell}>
                {item.avatar_id && avatarImages[item.avatar_id] ? (
                  <Image source={{ uri: avatarImages[item.avatar_id] }} style={styles.avatarImage} />
                ) : (
                  <Text>No Avatar</Text>
                )}
              </View>
              <View style={styles.tableCell}>
                <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditAchievement(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteAchievement(item._id)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

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
                <Text style={styles.modalHeaderText}>{editingAchievement ? 'Update Achievement' : 'Create Achievement'}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter achievement name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter achievement description"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Coins</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter coin amount"
                  value={coins}
                  onChangeText={setCoins}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>XP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter XP amount"
                  value={xp}
                  onChangeText={setXp}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Requirements</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter requirements"
                  value={requirements}
                  onChangeText={setRequirements}
                />
              </View>

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

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={editingAchievement ? handleUpdateAchievement : handleCreateAchievement}
              >
                <Text style={styles.buttonText}>{editingAchievement ? 'Update Achievement' : 'Create Achievement'}</Text>
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
  },
  openModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default AchievementsCRUD;