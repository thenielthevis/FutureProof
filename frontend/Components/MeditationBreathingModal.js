import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Dimensions, FlatList, Image } from 'react-native';
import { getMeditationBreathingExercises, claimRewards } from '../API/api';
import { FontAwesome } from '@expo/vector-icons';
import Video from 'react-native-video';
import TrackPlayer, { usePlaybackState } from 'react-native-track-player';
import * as Speech from 'expo-speech';
import MeditationCongratulationsModal from './MeditationCongratulationsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MeditationBreathingModal = ({ visible, onClose, onBack }) => {
  const [meditations, setMeditations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [rewards, setRewards] = useState({ xp: 0, coins: 0 });
  const playbackState = usePlaybackState();
  const [startTime, setStartTime] = useState(null); // State to track the start time
  const [completedExercises, setCompletedExercises] = useState([]); // State to track completed exercises

  useEffect(() => {
    const fetchMeditations = async () => {
      try {
        const meditationData = await getMeditationBreathingExercises();
        setMeditations(meditationData);
      } catch (err) {
        setError(err.detail || 'Failed to load meditations.');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchMeditations();
      setupTrackPlayer();
    }
  }, [visible]);

  useEffect(() => {
    if (started && meditations.length > 0) {
      playVoiceOver();
    }
  }, [currentIndex, started]);

  useEffect(() => {
    return () => {
      stopAudio();
      Speech.stop();
    };
  }, []);

  // Ensure it runs when the page is unloading
  useEffect(() => {
  const handleBeforeUnload = () => {
    Speech.stop();
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, []);

  useEffect(() => {
    if (started) {
      setStartTime(new Date()); // Set the start time when the session starts
    }
  }, [started]);

  const setupTrackPlayer = async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      if (queue.length === 0) {  // If queue is empty, initialize the player
        await TrackPlayer.setupPlayer();
        await TrackPlayer.add({
          id: '1',
          url: require('../assets/relaxing-music.mp3'),
          title: 'Relaxing Music',
          artist: 'Unknown',
        });
      }
    } catch (error) {
      console.error("Error setting up TrackPlayer:", error);
    }
  };  

  const togglePlayback = async () => {
    try {
      const state = await TrackPlayer.getPlaybackState();
  
      if (state.isPlaying) {
        await TrackPlayer.pause();
        setPlaying(false);
      } else {
        await TrackPlayer.play();
        setPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };  

  const handleClose = async () => {
    await stopAudio();
    await TrackPlayer.reset();
    setCurrentIndex(0);
    setStarted(false);
    setPlaying(false);
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
            if (newIndex >= meditations.length) newIndex = meditations.length - 1;
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
    if (meditations.length > 0) {
      const exercise = meditations[currentIndex];
      const text = `${exercise.name}. ${exercise.description}. Instructions: ${exercise.instructions.join(", ")}. Breathe in, breathe out.`;
  
      Speech.speak(text, { 
        rate: 0.7, 
        onDone: () => Speech.stop()
      });
    }
  };
   
  const stopAudio = async () => {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
    Speech.stop();
  };

  const handleFinish = async () => {
    const xpReward = 25;
    const coinReward = 50;
    const token = await AsyncStorage.getItem('token');
    
    setRewards({ xp: xpReward, coins: coinReward });
    await claimRewards(xpReward, coinReward, token);
  
    const endTime = new Date();
    const timeSpent = Math.round((endTime - startTime) / 60000);
  
    setCompletedExercises(meditations.slice(0, currentIndex + 1));
  
    onClose();  
    stopAudio();
  
    setTimeout(() => {
      setShowCongratulations(true);
    }, 300);
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

  return (
    <>
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButtonTopRight}>
          <FontAwesome name="close" size={20} color="#fff" />
        </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.backButtonTopLeft}>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalHeader}>Meditation & Breathing Exercises</Text>
          {!started ? (
            <>
              <FlatList
                data={meditations}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.exerciseListItem}>
                    <Video
                      source={{ uri: item.url }}
                      style={styles.videoPreview}
                      resizeMode="contain"
                      repeat={true}
                      paused={false}
                    />
                    <Text style={styles.exerciseTextPreview}>{item.name}</Text>
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
                      source={{ uri: meditations[currentIndex].url }}
                      style={styles.video}
                      resizeMode="contain"
                      repeat={true}
                      paused={false}
                    />
                    <Text style={styles.exerciseText}>{meditations[currentIndex].name}</Text>
                  </View>
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionHeader}>Description:</Text>
                    <Text style={styles.descriptionText}>{meditations[currentIndex].description}</Text>
                    <Text style={styles.instructionsHeader}>Instructions:</Text>
                    {meditations[currentIndex].instructions.map((instruction, idx) => (
                      <Text key={idx} style={styles.instructionText}>• {instruction}</Text>
                    ))}
                  </View>
                </>
              )}
              <View style={styles.navigationButtons}>
              <TouchableOpacity onPress={togglePlayback} style={styles.musicButton}>
                <FontAwesome name={playing ? "pause" : "play"} size={20} color="#fff" />
                <Text style={styles.buttonText}>Play Music</Text>
              </TouchableOpacity>
          <TouchableOpacity style={styles.voiceButton} onPress={playVoiceOver}>
                  <FontAwesome name="volume-up" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Play Voiceover</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.navButton} 
                  onPress={() => handleNavigation('prev')}>
                  <FontAwesome name="arrow-left" size={30} color="#fff" />
                </TouchableOpacity>
                {currentIndex === meditations.length - 1 ? (
                  <TouchableOpacity 
                    style={styles.finishButton} 
                    onPress={handleFinish}>
                    <Text style={styles.buttonText}>Finish</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.navButton} 
                    onPress={() => handleNavigation('next')}>
                    <FontAwesome name="arrow-right" size={30} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
    {showCongratulations && (
      <MeditationCongratulationsModal
        visible={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        rewards={rewards}
        exercises={completedExercises}
        timeSpent={Math.round((new Date() - startTime) / 60000)} // Pass the time spent
      />
    )}
  </>
  );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, width: '50%', maxHeight: 'auto', position: 'relative' },
    modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#fff' },
    closeButtonTopRight: { position: 'absolute', top: 10, right: 10, backgroundColor: '#c0392b', padding: 5, borderRadius: 15 },
    backButtonTopLeft: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3498db', padding: 5, borderRadius: 15 },
    exerciseListItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', maxHeight: 100, height: 100 },
    videoPreview: { width: 100, height: 100, marginBottom: 5 },
    video: { width: 400, height: 400 },
    startButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    exerciseItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', maxHeight: 400, height: 400 },
    exerciseText: { color: 'black', fontSize: 20, fontWeight: 'bold', },
    exerciseTextPreview: { color: 'black', fontSize: 16, fontWeight: 'bold', },
    descriptionContainer: { padding: 10, borderRadius: 8 },
    descriptionText: { fontSize: 14, color: '#fff', marginBottom: 5 },
    descriptionHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    instructionsHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    instructionText: { fontSize: 14, color: '#fff' },
    navButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, margin: 10 },
    navigationButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    musicButton: { position: 'absolute', top: 10, right: 50, backgroundColor: '#2980b9', padding: 5, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },  
    voiceButton: { position: 'absolute', top: 10, left: 50, backgroundColor: '#8e44ad', padding: 5, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    breathingGif: { width: '100%', height: 500, alignSelf: 'center', marginBottom: 20, padding: 10, borderRadius: 8, },
    finishButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, margin: 10, justifyContent: 'center', alignItems: 'center', width: '50px' },
  });

export default MeditationBreathingModal;
