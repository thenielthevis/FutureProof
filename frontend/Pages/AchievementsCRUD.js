import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView, Modal, Alert, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAchievement, readAchievements, updateAchievement, deleteAchievement } from '../API/achievements_api';
import { readAvatars, getAvatar } from '../API/avatar_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [headerAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const achievementsData = await readAchievements();
        setAchievements(achievementsData);
        setFilteredAchievements(achievementsData);
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
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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
      setFilteredAchievements([...filteredAchievements, newAchievement]);
      setModalVisible(false);
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

      const updatedAchievements = achievements.map(achievement => 
        (achievement._id === editingAchievement._id ? updatedAchievement : achievement)
      );
      setAchievements(updatedAchievements);
      setFilteredAchievements(updatedAchievements);
      setModalVisible(false);
      setEditingAchievement(null);
      setName('');
      setDescription('');
      setCoins('');
      setXp('');
      setRequirements('');
      setAvatar('');
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
      setFilteredAchievements(updatedAchievements);
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
    setCoins(achievement.coins.toString());
    setXp(achievement.xp.toString());
    setRequirements(achievement.requirements);
    setAvatar(achievement.avatar_id || '');
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
  
  const handleSearch = () => {
    const filtered = achievements.filter(achievement =>
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.requirements.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAchievements(filtered);
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
          <Text style={styles.pageTitle}>Achievements Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
              <FontAwesome5 name="plus" size={14} color="white" />
              <Text style={styles.actionButtonText}>Create Achievement</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search achievements by name or description..."
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
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Name</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Description</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Coins</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>XP</Text>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Requirements</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Avatar</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Actions</Text>
            </View>
            
            {filteredAchievements.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.name}</Text>
                <Text style={[styles.tableCell, {flex: 2}, styles.descriptionCell]} numberOfLines={2}>{item.description}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.coins}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.xp}</Text>
                <Text style={[styles.tableCell, {flex: 2}, styles.descriptionCell]} numberOfLines={2}>{item.requirements}</Text>
                <View style={[styles.tableCell, {flex: 1}]}>
                  {item.avatar_id && avatarImages[item.avatar_id] ? (
                    <Image source={{ uri: avatarImages[item.avatar_id] }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.noAvatarText}>No Avatar</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.actionCell, {flex: 1}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => handleEditAchievement(item)}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]} 
                    onPress={() => 
                      Alert.alert(
                        "Confirm Delete",
                        "Are you sure you want to delete this achievement?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", onPress: () => handleDeleteAchievement(item._id), style: "destructive" }
                        ]
                      )
                    }
                  >
                    <FontAwesome name="trash" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredAchievements.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="trophy" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No achievements found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search or create a new achievement</Text>
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
                  {editingAchievement ? 'Update Achievement' : 'Create New Achievement'}
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
                    placeholder="Enter achievement name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter achievement description"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                    <Text style={styles.inputLabel}>Coins</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter coin amount"
                      value={coins}
                      onChangeText={setCoins}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, {flex: 1}]}>
                    <Text style={styles.inputLabel}>XP</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter XP amount"
                      value={xp}
                      onChangeText={setXp}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Requirements</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter requirements"
                    value={requirements}
                    onChangeText={setRequirements}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar</Text>
                  <View style={styles.avatarSelector}>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity 
                        style={[styles.avatarOption, !avatar && styles.avatarOptionSelected]}
                        onPress={() => setAvatar('')}
                      >
                        <View style={styles.emptyAvatarBox}>
                          <FontAwesome5 name="ban" size={20} color="#ccc" />
                        </View>
                        <Text style={styles.avatarOptionText}>None</Text>
                      </TouchableOpacity>
                      
                      {avatars.map((avatarItem) => (
                        <TouchableOpacity 
                          key={avatarItem._id}
                          style={[
                            styles.avatarOption, 
                            avatar === avatarItem._id && styles.avatarOptionSelected
                          ]}
                          onPress={() => setAvatar(avatarItem._id)}
                        >
                          <Image 
                            source={{ uri: avatarItem.url }} 
                            style={styles.avatarOptionImage} 
                          />
                          <Text style={styles.avatarOptionText} numberOfLines={1}>
                            {avatarItem.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
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
                  onPress={editingAchievement ? handleUpdateAchievement : handleCreateAchievement}
                >
                  <Text style={styles.submitButtonText}>
                    {editingAchievement ? 'Update Achievement' : 'Create Achievement'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noAvatarText: {
    color: '#9CA3AF',
    fontSize: 12,
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 0,
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
  avatarSelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  avatarOption: {
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 4,
  },
  avatarOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  avatarOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  emptyAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarOptionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
    width: 70,
    textAlign: 'center',
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
});

export default AchievementsCRUD;