import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import HealthQuizModal from './HealthQuizModal';
import MeditationBreathingModal from './MeditationBreathingModal';

const TaskModal = ({ visible, onClose }) => {
  const [healthQuizVisible, setHealthQuizVisible] = useState(false);
  const [meditationbreathingVisible, setMeditationBreathingVisible] = useState(false);

  const handleHealthQuiz = () => {
    setHealthQuizVisible(true);
    onClose();
  };

  const handleMeditationBreathing = () => {
    setMeditationBreathingVisible(true);
    onClose();
  };

  const handleBackToTaskModal = () => {
    setHealthQuizVisible(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonTopRight}>
              <FontAwesome name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeader}>Select a Task</Text>
            <View style={styles.taskContainer}>
              <TouchableOpacity style={styles.taskButton} onPress={handleHealthQuiz}>
                <FontAwesome name="question-circle" size={20} color="#4CAF50" />
                <Text style={styles.buttonText}>Health Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.taskButton} onPress={handleMeditationBreathing}>
                <FontAwesome name="medkit" size={20} color="#4CAF50" />
                <Text style={styles.buttonText}>Meditation and Breathing Exercises</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.taskButton}>
                <FontAwesome name="heartbeat" size={20} color="#4CAF50" />
                <Text style={styles.buttonText}>Physical Activities</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.taskButton}>
                <FontAwesome name="apple" size={20} color="#4CAF50" />
                <Text style={styles.buttonText}>Nutritional Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Health Quiz Modal */}
      <HealthQuizModal visible={healthQuizVisible} onClose={() => setHealthQuizVisible(false)} onBack={handleBackToTaskModal} />
      {/* Meditation Breathing Modal */}
      <MeditationBreathingModal visible={meditationbreathingVisible} onClose={() => setMeditationBreathingVisible(false)} onBack={handleBackToTaskModal}  meditationBreathingIds={meditationbreathingVisible} />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '50%',
    maxHeight: '80%',
    position: 'relative',
  },
  modalHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  taskContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(245, 245, 245)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '49.5%', // Adjust width to fit 2 columns
    justifyContent: 'center',
    height: '150px',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  closeButtonTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#c0392b',
    padding: 5,
    borderRadius: 15,
  },
});

export default TaskModal;