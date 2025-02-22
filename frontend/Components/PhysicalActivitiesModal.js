import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Dimensions, FlatList, Image } from 'react-native';
import { getPhysicalActivities } from '../API/api';
import { FontAwesome } from '@expo/vector-icons';
import Video from 'react-native-video';
import * as Speech from 'expo-speech';
import TrackPlayer, { usePlaybackState } from 'react-native-track-player';

const { width } = Dimensions.get('window');

const PhysicalActivitiesModal = ({ visible, onClose, onBack }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState(null);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
        try {
            const activityData = await getPhysicalActivities();
            console.log('Fetched activities:', activityData);

            // Filter activities based on the selected category
            const filteredData = activityData.filter(activity => activity.activity_type === category);
            setActivities(filteredData);
        } catch (err) {
            setError(err.detail || 'Failed to load activities.');
        } finally {
            setLoading(false);
        }
    };

    if (visible) {
        fetchActivities();
    }
}, [visible, category]);

  useEffect(() => {
    if (started && activities.length > 0) {
      playVoiceOver();
    }
  }, [currentIndex, started]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      Speech.stop();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setStarted(false);
    setCurrentIndex(0);
    setActivities([]);
    };

  const stopAudio = async () => {
    // await TrackPlayer.stop();
    // await TrackPlayer.reset();
    Speech.stop();
  };
  
  const handleClose = async () => {
    await stopAudio();
    // await TrackPlayer.reset();
    setCurrentIndex(0);
    setStarted(false);
    onClose();
  }; 

  const handleNavigation = (direction) => {
    Speech.stop();
    setShowGif(true);

    setTimeout(() => {
      Speech.speak("Inhale", { rate: 0.7 });
      setTimeout(() => {
        Speech.speak("Exhale", { rate: 0.7 });
        setTimeout(() => {
          setShowGif(false);
          setCurrentIndex((prev) => {
            let newIndex = direction === 'next' ? prev + 1 : prev - 1;
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= activities.length) newIndex = activities.length - 1;
            return newIndex;
          });
          setTimeout(() => {
            playVoiceOver();
          }, 500);
        }, 5000);
      }, 5000);
    }, 500);
  };

  const playVoiceOver = () => {
    if (activities.length > 0) {
      const exercise = activities[currentIndex];
      let text = `${exercise.activity_name}. ${exercise.description}. Instructions: ${exercise.instructions.join(", ")}.`;

      if (exercise.activity_type === category) {
        Speech.speak(text, { 
          rate: 0.7, 
          onDone: () => Speech.stop()
        });
      }
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const filteredActivities = activities.filter(activity => activity.activity_type === category);

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButtonTopRight}>
            <FontAwesome name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.backButtonTopLeft}>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalHeader}>Physical Activities</Text>
          {!category ? (
            <View style={styles.categoryContainer}>
              {/* <TouchableOpacity style={styles.categoryButton} onPress={() => handleCategorySelect('Gardening')}>
                <Text style={styles.buttonText}>Gardening</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.categoryButton} onPress={() => handleCategorySelect('Workout')}>
                <Text style={styles.buttonText}>Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryButton} onPress={() => handleCategorySelect('Zumba')}>
                <Text style={styles.buttonText}>Zumba</Text>
              </TouchableOpacity>
            </View>
          ) : !started ? (
            <>
              <FlatList
                data={filteredActivities}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.exerciseListItem}>
                    <Video
                      source={{ uri: item.url }}
                      style={styles.videoPreview}
                      resizeMode="contain"
                      repeat={true}
                      paused={false}
                      volume={0}
                    />
                    <Text style={styles.exerciseTextPreview}>{item.activity_name}</Text>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.startButton} onPress={() => setStarted(true)}>
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {showGif ? (
                <Image source={require('../assets/meditation/inhale-exhale.gif')} style={styles.breathingGif} />
              ) : (
                <>
                  <View style={styles.exerciseItem}>
                    <Video
                      source={{ uri: filteredActivities[currentIndex].url }}
                      style={styles.video}
                      resizeMode="contain"
                      repeat={true}
                      paused={false}
                    />
                  </View>
                  <View style={styles.descriptionContainer}>
                  <Text style={styles.exerciseText}>{filteredActivities[currentIndex].activity_name}</Text>
                    <Text style={styles.descriptionHeader}>Description:</Text>
                    <Text style={styles.descriptionText}>{filteredActivities[currentIndex].description}</Text>
                    <Text style={styles.instructionsHeader}>Instructions:</Text>
                    {filteredActivities[currentIndex].instructions.map((instruction, idx) => (
                      <Text key={idx} style={styles.instructionText}>• {instruction}</Text>
                    ))}
                  </View>
                </>
              )}
              <View style={styles.navigationButtons}>
                <TouchableOpacity 
                  style={styles.navButton} 
                  onPress={() => handleNavigation('prev')}>
                  <FontAwesome name="arrow-left" size={30} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.navButton} 
                  onPress={() => handleNavigation('next')}>
                  <FontAwesome name="arrow-right" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, width: '50%', maxHeight: 'auto', position: 'relative' },
    modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#fff' },
    closeButtonTopRight: { position: 'absolute', top: 10, right: 10, backgroundColor: '#c0392b', padding: 5, borderRadius: 15 },
    backButtonTopLeft: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3498db', padding: 5, borderRadius: 15 },
    categoryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    categoryButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', width: '30%' },
    exerciseListItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', maxHeight: 100, height: 100 },
    videoPreview: { width: 100, height: 100, marginTop: 50 },
    startButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    video: { width: '100%', height: '100%' },
    exerciseItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', width: '100%', height: 400 },
    exerciseText: { color: '#fff', fontSize: 20, fontWeight: 'bold', },
    exerciseTextPreview: { color: 'black', fontSize: 16, fontWeight: 'bold', },
    descriptionContainer: { padding: 10, borderRadius: 8 },
    descriptionText: { fontSize: 14, color: '#fff', marginBottom: 5 },
    descriptionHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    instructionsHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    instructionText: { fontSize: 14, color: '#fff' },
    navButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, margin: 10 },
    navigationButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    breathingGif: { width: '100%', height: 500, alignSelf: 'center', marginBottom: 20, padding: 10, borderRadius: 8, },
});

export default PhysicalActivitiesModal;
