import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAvatar, readAvatars, updateAvatar, deleteAvatar } from '../API/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const AvatarCRUD = () => {
  const navigation = useNavigation();
  const [avatars, setAvatars] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [editingAvatar, setEditingAvatar] = useState(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const avatarsData = await readAvatars();
        setAvatars(avatarsData);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchAvatars();
  }, []);

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
        const fileName = `avatar_${Date.now()}.png`;
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
        name: `avatar_${Date.now()}.png`,
      });
    }
  };

  const handleCreateAvatar = async () => {
    try {
      const newAvatar = await createAvatar({ name, description, file });
      setAvatars([...avatars, newAvatar]);
      setName('');
      setDescription('');
      setFile(null);
    } catch (error) {
      console.error('Error creating avatar:', error);
    }
  };

  const handleUpdateAvatar = async () => {
    try {
      const updatedAvatar = await updateAvatar(editingAvatar._id, { name, description, file });
      setAvatars(avatars.map(avatar => (avatar._id === editingAvatar._id ? updatedAvatar : avatar)));
      setEditingAvatar(null);
      setName('');
      setDescription('');
      setFile(null);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    try {
      await deleteAvatar(avatarId);
      setAvatars(avatars.filter(avatar => avatar._id !== avatarId));
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  const handleEditAvatar = (avatar) => {
    setEditingAvatar(avatar);
    setName(avatar.name);
    setDescription(avatar.description);
    setFile(null);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.sidebarText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AvatarCRUD')}>
          <Text style={styles.sidebarText}>Avatars</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DailyRewardsCRUD')}>
          <Text style={styles.sidebarText}>Daily Rewards</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.header}>Avatar Management</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity style={styles.button} onPress={handlePickImage}>
            <Text style={styles.buttonText}>Pick an Image</Text>
          </TouchableOpacity>
          {file && <Image source={{ uri: file.uri }} style={styles.imagePreview} />}
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={editingAvatar ? handleUpdateAvatar : handleCreateAvatar}
          >
            <Text style={styles.buttonText}>{editingAvatar ? 'Update Avatar' : 'Create Avatar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar List */}
        <FlatList
          data={avatars}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.avatarItem}>
              <Image source={{ uri: item.url }} style={styles.avatarImage} />
              <View style={styles.avatarDetails}>
                <Text style={styles.avatarName}>{item.name}</Text>
                <Text style={styles.avatarDescription}>{item.description}</Text>
              </View>
              <View style={styles.avatarActions}>
                <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditAvatar(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteAvatar(item._id)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1A3B32',
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
  button: {
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonPrimary: {
    backgroundColor: '#1A3B32',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 5,
  },
  avatarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  avatarDetails: {
    flex: 1,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarDescription: {
    fontSize: 14,
    color: '#666',
  },
  avatarActions: {
    flexDirection: 'row',
  },
  buttonEdit: {
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 5,
    borderRadius: 5,
  },
});

export default AvatarCRUD;