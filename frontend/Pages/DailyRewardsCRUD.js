import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, Picker } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDailyReward, readDailyRewards, updateDailyReward, deleteDailyReward, readAvatars, getAvatar } from '../API/api';
import { FontAwesome5 } from '@expo/vector-icons';

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
        <Text style={styles.header}>Daily Rewards Management</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Day"
            value={day}
            onChangeText={setDay}
          />
          <TextInput
            style={styles.input}
            placeholder="Coins"
            value={coins}
            onChangeText={setCoins}
          />
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
          <TextInput
            style={styles.input}
            placeholder="Top ID"
            value={top}
            onChangeText={setTop}
          />
          <TextInput
            style={styles.input}
            placeholder="Bottom ID"
            value={bottom}
            onChangeText={setBottom}
          />
          <TextInput
            style={styles.input}
            placeholder="Shoes ID"
            value={shoes}
            onChangeText={setShoes}
          />
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={editingReward ? handleUpdateReward : handleCreateReward}
          >
            <Text style={styles.buttonText}>{editingReward ? 'Update Reward' : 'Create Reward'}</Text>
          </TouchableOpacity>
        </View>

        {/* Reward List */}
        <FlatList
          data={rewards}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.rewardItem}>
              <Text style={styles.rewardText}>Day: {item.day}</Text>
              <View style={styles.rewardText}>
                <FontAwesome5 name="coins" size={14} color="gold" />
                <Text> {item.coins}</Text>
              </View>
              {item.avatar && avatarImages[item.avatar] ? (
                <Image source={{ uri: avatarImages[item.avatar] }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.rewardText}>No Avatar</Text>
              )}
              <Text style={styles.rewardText}>Top ID: {item.top}</Text>
              <Text style={styles.rewardText}>Bottom ID: {item.bottom}</Text>
              <Text style={styles.rewardText}>Shoes ID: {item.shoes}</Text>
              <View style={styles.rewardActions}>
                <TouchableOpacity style={styles.buttonEdit} onPress={() => handleEditReward(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDelete} onPress={() => handleDeleteReward(item._id)}>
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
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
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
  },
  buttonDelete: {
    backgroundColor: '#e74c3c',
    padding: 5,
    borderRadius: 5,
  },
});

export default DailyRewardsCRUD;