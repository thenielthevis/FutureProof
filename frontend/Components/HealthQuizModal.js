import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Animated, Easing, Dimensions } from 'react-native';
import { getRandomQuestions, submitQuiz, claimRewards } from '../API/api';  // Import the new API function
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';  // Import ConfettiCannon

const { width, height } = Dimensions.get("window");

const HealthQuizModal = ({ visible, onClose, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const COINS_PER_CORRECT_ANSWER = 2;
  const XP_FOR_QUIZ_COMPLETION = 25;
  const coinAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false); // Add state for confetti
  const confettiRef = useRef(null); // Ref for confetti cannon

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsData = await getRandomQuestions();
        setQuestions(questionsData);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchQuestions();
    }
  }, [visible]);

  useEffect(() => {
    if (score !== null) {
      setShowConfetti(true); // Show confetti when quiz is completed
    }
  }, [score]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentQuestionIndex].correct_answer;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    if (isCorrect) {
      animateCoins();
    }

    setTimeout(() => {
      handleNextQuestion(answer);
    }, 1500); // Delay to show the color change and text
  };

  const animateCoins = () => {
    Animated.timing(coinAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      setCoins(coins + 2); // Add 2 coins for each correct answer
      coinAnimation.setValue(0); // Reset animation value
    });
  };

  const handleNextQuestion = async (answer) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].selectedAnswer = answer;
    setQuestions(updatedQuestions);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswerStatus(null);
      fadeAnimation.setValue(0); // Reset fade animation value
    } else {
      // Ensure all questions have a selected answer before calculating the score
      const allAnswered = updatedQuestions.every(q => q.selectedAnswer !== null);
      if (!allAnswered) {
        setError('Please answer all questions before submitting.');
        return;
      }

      // Calculate the score
      const totalScore = updatedQuestions.reduce((score, q) => {
        return score + (q.selectedAnswer === q.correct_answer ? 1 : 0);
      }, 0);

      // Claim rewards
      try {
        const token = await AsyncStorage.getItem('token');
        const coinsEarned = totalScore * COINS_PER_CORRECT_ANSWER;
        const response = await claimRewards(coinsEarned, XP_FOR_QUIZ_COMPLETION, token);
        console.log('Rewards claimed successfully:', response);
        setTotalCoins(response.coins);
        setTotalXp(response.xp);
        setScore(totalScore);
        setShowConfetti(true); // Show confetti when quiz is completed
      } catch (err) {
        console.error('Error occurred:', err);
        setError(err.detail || 'An error occurred');
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

  if (score !== null) {
    return (
      <>
        <Modal visible={visible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.congratulationsText}>Congratulations!</Text>
              <Text style={styles.successText}>You've successfully completed the health quiz.</Text>
              <Text style={styles.scoreText}>Total Score: {score}/{questions.length}</Text>
              <Text style={styles.coinsText}>
                <FontAwesome5 name="coins" size={20} color="gold" /> + {coins} Coins
              </Text>
              <Text style={styles.xpText}>
                <FontAwesome5 name="star" size={20} color="gold" /> + {XP_FOR_QUIZ_COMPLETION} XP
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {showConfetti && (
          <View style={styles.confettiContainer}>
            <ConfettiCannon ref={confettiRef} count={200} origin={{ x: width / 2, y: height / 2 }} explosionSpeed={300} fallSpeed={2000} fadeOut={true}/>
          </View>
        )}
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const coinTranslateY = coinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100], // Adjust the range as needed
  });

  const coinOpacity = coinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0], // Fade out the coin
  });

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonTopRight}>
              <FontAwesome name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onBack} style={styles.backButtonTopLeft}>
              <FontAwesome name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.questionContainer}>
              {answerStatus && (
                <Animated.Text style={[answerStatus === 'correct' ? styles.correctText : styles.incorrectText, { opacity: fadeAnimation }]}>
                  {answerStatus === 'correct' ? 'CORRECT' : 'INCORRECT'}
                </Animated.Text>
              )}
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && answerStatus === 'incorrect' && styles.incorrectOptionButton,
                    option === currentQuestion.correct_answer && answerStatus === 'incorrect' && styles.correctOptionButton,
                    selectedAnswer === option && answerStatus === 'correct' && styles.correctOptionButton,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={answerStatus !== null}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {selectedAnswer === option && answerStatus === 'correct' && (
                    <Animated.View style={[styles.coinAnimation, { transform: [{ translateY: coinTranslateY }], opacity: coinOpacity }]}>
                      <FontAwesome5 name="coins" size={20} color="gold" />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.footerContainer}>
              <View style={styles.footerColumn}>
                <FontAwesome5 name="coins" size={20} color="gold" />
                <Text style={styles.footerText}>{coins} Coins</Text>
              </View>
              <View style={styles.footerColumn}>
                <FontAwesome5 name="question" size={20} color="red" />
                <Text style={styles.footerText}>
                  {currentQuestionIndex + 1}/{questions.length}
                </Text>
              </View>
              <View style={styles.footerColumn}>
                <FontAwesome5 name="star" size={20} color="gold" />
                <Text style={styles.footerText}>+25 XP</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#fff',
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    height: 150, // Adjust height as needed
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  correctText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '48%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  incorrectText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E74C3C',
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '45%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '49.5%', // Adjust width to fit 2 columns
    height: 80, // Adjust height as needed
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctOptionButton: {
    backgroundColor: '#4CAF50',
  },
  incorrectOptionButton: {
    backgroundColor: '#E74C3C',
  },
  optionText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  closeButtonTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#c0392b',
    padding: 5,
    borderRadius: 15,
  },
  backButtonTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  successText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  coinAnimation: {
    position: 'absolute',
    top: '50%', // Adjust the position as needed
    left: '50%', // Adjust the position as needed
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  footerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  congratulationsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4CAF50',
  },
  confettiCannon: {
    position: 'absolute',
    zIndex: 1000,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    transform: [{ translateY: 800 }],
  },
});

export default HealthQuizModal;
