import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Picker } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDailyReward, readDailyRewards, updateDailyReward, deleteDailyReward, readAvatars } from '../API/api';

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
      <View style={styles.content}>
        <Text style={styles.contentText}>Daily Rewards Management</Text>
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
            style={styles.button}
            onPress={editingReward ? handleUpdateReward : handleCreateReward}
          >
            <Text style={styles.buttonText}>{editingReward ? 'Update Reward' : 'Create Reward'}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={rewards}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.rewardItem}>
              <Text style={styles.rewardText}>Day: {item.day}</Text>
              <Text style={styles.rewardText}>Coins: {item.coins}</Text>
              <Text style={styles.rewardText}>Avatar ID: {item.avatar}</Text>
              <Text style={styles.rewardText}>Top ID: {item.top}</Text>
              <Text style={styles.rewardText}>Bottom ID: {item.bottom}</Text>
              <Text style={styles.rewardText}>Shoes ID: {item.shoes}</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEditReward(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteReward(item._id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
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
  contentText: {
    fontSize: 24,
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
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2E7D32',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 14,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 5,
    borderRadius: 5,
  },
});

export default DailyRewardsCRUD;
