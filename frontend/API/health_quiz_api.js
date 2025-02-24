import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Set the API base URL based on the platform
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.68.65:8000'  // Android Emulator
  : 'http://localhost:8000';  // iOS Simulator and Web

////////////// HEALTH QUIZ
// Get a random health quiz
export const getRandomQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/health_quiz/random`);
      return response.data;
    } catch (error) {
      console.error('Error getting random questions:', error.response ? error.response.data : error);
      throw error.response ? error.response.data : { detail: 'An error occurred' };
    }
  };
  
  // Submit quiz answers
  export const submitQuiz = async (userId, answers, token) => {
    try {
      const response = await axios.post(`${API_URL}/health_quiz/submit`, {
        user_id: userId,
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          is_correct: answer.is_correct,
        })),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error.response ? error.response.data : error);
      throw error.response ? error.response.data : { detail: 'An error occurred' };
    }
  };
  
  export const claimRewards = async (coins, xp, token) => {
    const response = await axios.post(
      `${API_URL}/health_quiz/claim_rewards`,
      { coins, xp },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  };