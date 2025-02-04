import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { getPrediction } from '../API/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Gamification = ({ navigation }) => {
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const response = await getPrediction(token);
        setPrediction(response.diseases);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Prediction</Text>
      <Text style={styles.prediction}>{prediction}</Text>
      <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  prediction: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  error: { color: 'red', fontSize: 18, textAlign: 'center', marginBottom: 20 },
});

export default Gamification;