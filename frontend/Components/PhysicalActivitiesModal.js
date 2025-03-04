import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Dimensions, FlatList, Image } from 'react-native';
import { getPhysicalActivities } from '../API/physical_activities_api';
import { claimRewards } from '../API/health_quiz_api';
import Video from 'react-native-video';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import PhysicalActivitiesCongratulationsModal from './PhysicalActivitiesCongratulationsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { usePlaybackState } from 'react-native-track-player';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PhysicalActivitiesModal = ({ visible, onClose, onBack }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState(null);
  const [restTime, setRestTime] = useState(20);
  const [isResting, setIsResting] = useState(false);
  const [sound, setSound] = useState();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [rewards, setRewards] = useState({ xp: 0, coins: 0 });
  const [startTime, setStartTime] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);

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
    if (started && activities.length > 0 && !isResting) {
      playVoiceOver();
    }
  }, [currentIndex, started, isResting]);

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
    let timer;
    if (isResting && restTime > 0) {
      timer = setTimeout(() => {
        setRestTime(restTime - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
      setRestTime(20);
      setStarted(true);
    }
    return () => clearTimeout(timer);
  }, [isResting, restTime]);

  useEffect(() => {
    if (started) {
      setStartTime(new Date());
    }
  }, [started]);

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setStarted(false);
    setCurrentIndex(0);
    setActivities([]);
  };

  const stopAudio = async () => {
    try {
      const isSetup = await TrackPlayer.isServiceRunning();
      if (isSetup) {
        await TrackPlayer.stop();
        await TrackPlayer.reset();
      }
    } catch (error) {
      console.warn("TrackPlayer stop failed:", error.message);
    }
    Speech.stop();
  };  

  const handleClose = async () => {
    await stopAudio();
    setCurrentIndex(0);
    setStarted(false);
    setCategory(null);
    setRestTime(20);
    setIsResting(false);
    setShowCongratulations(false);
    setRewards({ xp: 0, coins: 0 });
    setCompletedExercises([]);
    onClose();
  };

  const handleBack = async () => {
    await stopAudio();
    setCurrentIndex(0);
    setStarted(false);
    setCategory(null);
    setRestTime(20);
    setIsResting(false);
    setShowCongratulations(false);
    setRewards({ xp: 0, coins: 0 });
    setCompletedExercises([]);
    onBack();
  };

  const handleNavigation = async (direction) => {
    await playBellSound();
    Speech.stop();
    setIsResting(true);
    setRestTime(20);

    setCurrentIndex((prev) => {
      let newIndex = direction === 'next' ? prev + 1 : prev - 1;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= activities.length) newIndex = activities.length - 1;
      return newIndex;
    });
  };

  useEffect(() => {
    if (isResting) {
        setTimeout(() => {
            playPreviewVoiceOver();
        }, 500);
    }
}, [currentIndex, isResting]);

  const playPreviewVoiceOver = () => {
    if (activities.length > 0) {
      const exercise = activities[currentIndex];
      let text = "Next up! ";
      if (exercise.repetition !== null && exercise.repetition !== undefined) {
        text += `${exercise.repetition} `;
      }
      if (exercise.timer !== null && exercise.timer !== undefined) {
        text += `${exercise.timer} seconds `;
      }
      text += `${exercise.activity_name}.`;

      Speech.speak(text, {
        rate: 0.7,
        onDone: () => Speech.stop()
      });
    }
  };

  const playVoiceOver = () => {
    if (activities.length > 0 && !isResting) {
      const exercise = activities[currentIndex];
      let text = `${exercise.activity_name}. ${exercise.description}. Instructions: ${exercise.instructions.join(", ")}. Inhale, Exhale.`;

      Speech.speak(text, {
        rate: 0.7
      });
    }
  };

  const playBellSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/sound-effects/bell.mp3'));
    setSound(sound);
    await sound.playAsync();
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleFinish = async () => {
    const xpReward = 25;
    const coinReward = 50;
    const token = await AsyncStorage.getItem('token');
    
    setRewards({ xp: xpReward, coins: coinReward });
    await claimRewards(xpReward, coinReward, token);
  
    const endTime = new Date();
    const timeSpent = Math.round((endTime - startTime) / 60000);
  
    setCompletedExercises(activities.slice(0, currentIndex + 1));
  
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

  const filteredActivities = activities.filter(activity => activity.activity_type === category);

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButtonTopRight}>
              <FontAwesome name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} style={styles.backButtonTopLeft}>
              <FontAwesome name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeader}>Physical Activities</Text>
            {!category ? (
              <View style={styles.categoryContainer}>
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
                      {item.repetition !== null && item.repetition !== undefined && (
                        <Text style={styles.exerciseRepsPreview}>x{item.repetition}</Text>
                      )}
                      {item.timer !== null && item.timer !== undefined && (
                        <Text style={styles.exerciseTimerPreview}>{item.timer} sec</Text>
                      )}
                    </View>
                  )}
                />
                <TouchableOpacity style={styles.startButton} onPress={() => { setStarted(true); playVoiceOver(); }}>
                  <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {isResting ? (
                  <View style={styles.restContainer}>
                    <Text style={styles.restText}>{restTime}s</Text>
                    <Image source={require('../assets/timer.gif')} style={styles.timerGif} />
                    <Text style={styles.exerciseTextPreviewScreen}>{filteredActivities[currentIndex].activity_name}</Text>
                    {filteredActivities[currentIndex].repetition !== null && filteredActivities[currentIndex].repetition !== undefined && (
                      <Text style={styles.exerciseRepsPreviewScreen}>x{filteredActivities[currentIndex].repetition}</Text>
                    )}
                    {filteredActivities[currentIndex].timer !== null && filteredActivities[currentIndex].timer !== undefined && (
                      <Text style={styles.exerciseTimerPreview}>{filteredActivities[currentIndex].timer} sec</Text>
                    )}
                    <View style={styles.restButtonsContainer}>
                      <TouchableOpacity style={styles.restButton} onPress={() => setRestTime(restTime + 20)}>
                        <Text style={styles.buttonText}>+20 seconds</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.restButton} onPress={() => setRestTime(0)}>
                        <Text style={styles.buttonText}>Skip</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.exerciseItem}>
                      <Video
                        source={{ uri: filteredActivities[currentIndex].url }}
                        resizeMode="cover"
                        style={styles.video}
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
                    <View style={styles.navigationButtons}>
                      <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => handleNavigation('prev')}>
                        <FontAwesome name="arrow-left" size={30} color="#fff" />
                      </TouchableOpacity>
                      <View style={styles.footerContainer}>
                        <View style={styles.footerCoin}>
                          <FontAwesome5 name="coins" size={20} color="gold" />
                          <Text style={styles.footerText}>50</Text>
                        </View>
                        <View style={styles.footerStar}>
                          <FontAwesome5 name="star" size={20} color="gold" />
                          <Text style={styles.footerText}>25</Text>
                        </View>
                      </View>
                      {currentIndex === filteredActivities.length - 1 ? (
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
              </>
            )}
          </View>
        </View>
      </Modal>
      {showCongratulations && (
        <PhysicalActivitiesCongratulationsModal
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
  categoryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  categoryButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', width: '30%' },
  exerciseListItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', maxHeight: 100, height: 100 },
  videoPreview: { width: 130, height: 130, marginTop: 50 },
  startButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  video: { width: '100%', height: '100%', resizeMode: 'cover' },
  exerciseItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', width: '100%', height: 300 },
  exerciseText: { color: '#fff', fontSize: 20, fontWeight: 'bold', },
  exerciseTextPreview: { color: 'black', fontSize: 16, fontWeight: 'bold', },
  exerciseRepsPreview: { color: 'dimgray', fontSize: 14, },
  exerciseTimerPreview: { color: 'dimgray', fontSize: 14, },
  descriptionContainer: { padding: 10, borderRadius: 8 },
  descriptionText: { fontSize: 14, color: '#fff', marginBottom: 5 },
  descriptionHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  instructionsHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  instructionText: { fontSize: 14, color: '#fff' },
  navButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, margin: 10 },
  navigationButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  restContainer: { alignItems: 'center', justifyContent: 'center' },
  restText: { fontSize: 24, color: '#fff', marginBottom: 10 },
  restButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  restButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, marginHorizontal: 10 },
  exerciseTextPreviewScreen: { color: '#fff', fontSize: 20, fontWeight: 'bold', },
  exerciseRepsPreviewScreen: { color: '#fff', fontSize: 16, },
  timerGif: { width: '100%', height: undefined, aspectRatio: 1, marginBottom: 20, resizeMode: 'contain', },
  finishButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, margin: 10, justifyContent: 'center', alignItems: 'center', width: '50px' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 5, marginLeft: 20, marginRight: 20 },  
  footerCoin: { flex: 1, alignItems: 'center', margin: 10 },  
  footerStar: { flex: 1, alignItems: 'center', margin: 10 },  
  footerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },    
});

export default PhysicalActivitiesModal;
