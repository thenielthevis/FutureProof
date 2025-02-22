import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Button } from 'react-native';
import { createNutritionalTracking, getNutritionalTrackingQuestions, submitNutritionalTrackingResponses } from '../API/api';
import { FontAwesome } from '@expo/vector-icons';

const NutritionalTrackingModal = ({ visible, onClose, onBack }) => {
  const [questionsAnswers, setQuestionsAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(false);
    }
  }, [visible]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const questionData = await getNutritionalTrackingQuestions();
      setQuestionsAnswers(questionData.questions_answers);
      setStarted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    const updatedQuestionsAnswers = [...questionsAnswers];
    updatedQuestionsAnswers[currentQuestionIndex].answer = currentResponse;
    setQuestionsAnswers(updatedQuestionsAnswers);

    try {
      await submitNutritionalTrackingResponses({
        question_index: currentQuestionIndex,
        answer: currentResponse
      });
      setCurrentResponse('');
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit response.');
    }
  };

  const handlePreviousQuestion = () => {
    const updatedQuestionsAnswers = [...questionsAnswers];
    updatedQuestionsAnswers[currentQuestionIndex].answer = currentResponse;
    setQuestionsAnswers(updatedQuestionsAnswers);
    setCurrentResponse(questionsAnswers[currentQuestionIndex - 1].answer);
    setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
  };

  const handleSubmit = async () => {
    const updatedQuestionsAnswers = [...questionsAnswers];
    updatedQuestionsAnswers[currentQuestionIndex].answer = currentResponse;
    setQuestionsAnswers(updatedQuestionsAnswers);

    try {
      await submitNutritionalTrackingResponses({
        question_index: currentQuestionIndex,
        answer: currentResponse
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit response.');
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

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonTopRight}>
            <FontAwesome name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.backButtonTopLeft}>
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalHeader}>Nutritional Tracking</Text>
          {!started ? (
            <>
              <Text style={styles.introductionText}>
                Be honest and transparent with your answers. This will help us track your nutrition and health better.
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.questionText}>{questionsAnswers[currentQuestionIndex].question}</Text>
              <TextInput
                style={styles.input}
                value={currentResponse}
                onChangeText={setCurrentResponse}
                placeholder="Type your response here"
                multiline
              />
              <View style={styles.navigationButtons}>
                {currentQuestionIndex > 0 && (
                  <TouchableOpacity style={styles.navButton} onPress={handlePreviousQuestion}>
                    <FontAwesome name="arrow-left" size={30} color="#fff" />
                  </TouchableOpacity>
                )}
                {currentQuestionIndex < questionsAnswers.length - 1 ? (
                  <TouchableOpacity style={styles.navButton} onPress={handleNextQuestion}>
                    <FontAwesome name="arrow-right" size={30} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Submit</Text>
                  </TouchableOpacity>
                )}
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
  modalContent: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, width: '50%', maxHeight: '80%', position: 'relative' },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#fff' },
  closeButtonTopRight: { position: 'absolute', top: 10, right: 10, backgroundColor: '#c0392b', padding: 5, borderRadius: 15 },
  backButtonTopLeft: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3498db', padding: 5, borderRadius: 15 },
  introductionText: { fontSize: 18, color: '#fff', marginBottom: 20, textAlign: 'center' },
  questionText: { fontSize: 18, color: '#fff', marginBottom: 10 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, height: 100, textAlignVertical: 'top' },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  navButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8 },
  startButton: { backgroundColor: '#2980b9', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitButton: { backgroundColor: '#2980b9', padding: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10 },
});

export default NutritionalTrackingModal;
