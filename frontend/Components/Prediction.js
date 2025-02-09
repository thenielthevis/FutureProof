import React, { useState, useEffect } from 'react';  
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { getPrediction } from '../API/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LineChart } from 'react-native-chart-kit'; 
import { ProgressChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

const Prediction = ({ navigation }) => {
  const [prediction, setPrediction] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1);

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
        setPrediction(response);
        setModalVisible(true);
      } catch (err) {
        setError(err.detail || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  const formatPrediction = (prediction) => {
    const diseaseLabels = prediction.predicted_diseases.map(item => item.condition);
    const diseaseData = prediction.predicted_diseases.map(item => parseInt(item.details.match(/\d+/)[0])) || [];

    const chartData = {
      labels: diseaseLabels, 
      datasets: [
        {
          data: diseaseData, // The actual data points
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`, // Line color
          strokeWidth: 2, // Line thickness
        },
      ],
    };

    return (
      <View style={styles.centerContent}>
        {step === 1 && (
          <>
            <Text style={styles.sectionHeader}>User Information</Text>
            <Text style={styles.details}>{prediction.user_info.details}</Text>

            <Text style={styles.sectionHeader}>Predicted Diseases</Text>
            {/* LineChart with Gradient */}
            <LineChart
              data={chartData}
              width={screenWidth * 0.8}
              height={220}
              chartConfig={{
                backgroundColor: '#1e2923',
                backgroundGradientFrom: '#1e2923',
                backgroundGradientTo: '#1e2923',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                fillShadowGradient: '#f6a8f0',  // Set shadow color
                fillShadowGradientOpacity: 0.4,  // Adjust shadow opacity
              }}
              bezier // Makes the line smooth
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            {/* Disease Information Progress Circles */}
            <View style={styles.circleContainer}>
              {diseaseLabels.map((label, index) => (
                <View key={index} style={styles.circleWrapper}>
                  <ProgressChart
                    data={{ data: [diseaseData[index] / 100] }} // Ensure data is between 0 and 1
                    width={120} // Adjust the size of the progress circle
                    height={120}
                    strokeWidth={12}
                    radius={50}
                    chartConfig={{
                      backgroundGradientFrom: '#2c3e50', // Dark background for circles
                      backgroundGradientTo: '#2c3e50', // Dark background for circles
                      color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`, // Progress circle color
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Label color
                      strokeWidth: 2,
                    }}
                    hideLegend={true} // Hide the legend since it's not needed here
                  />
                  <Text style={styles.circleText}>{label}</Text>
                  <Text style={styles.circleValue}>{diseaseData[index]}%</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.sectionHeader}>Positive Habits</Text>
            <View style={styles.bulletedList}>
              {prediction.positive_habits.map((item, index) => (
                <Text key={index} style={styles.bulletPoint}>• {item}</Text>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Areas for Improvement</Text>
            <View style={styles.bulletedList}>
              {prediction.areas_for_improvement.map((item, index) => (
                <Text key={index} style={styles.bulletPoint}>• {item}</Text>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Recommendations</Text>
            <View style={styles.bulletedList}>
              {prediction.recommendations.map((item, index) => (
                <Text key={index} style={styles.bulletPoint}>• {item}</Text>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Prediction</Text>
            <ScrollView style={styles.scrollView}>
              {formatPrediction(prediction)}
            </ScrollView>
            <View style={styles.buttonContainer}>
              {step === 1 && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              )}
              {step === 2 && (
                <>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.buttonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setModalVisible(!modalVisible);
                      navigation.navigate('Home');
                    }}
                  >
                    <Icon name="close" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#2c3e50',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: { fontSize: 28, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 20 },
  scrollView: { width: '100%' },
  sectionHeader: { fontSize: 22, fontWeight: 'bold', color: '#ecf0f1', marginTop: 20, marginBottom: 10 },
  predictionItem: { marginBottom: 20 },
  bulletPoint: { fontSize: 18, color: '#ecf0f1', marginBottom: 5 },
  details: { fontSize: 18, color: '#ecf0f1', marginBottom: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  nextButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  backButton: {
    backgroundColor: '#2980b9',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginRight: 10,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  error: { color: 'red', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Adjusted to evenly distribute the circles
    marginTop: 20,
    width: '100%',
    flexWrap: 'wrap',
  },
  circleWrapper: {
    width: 160, // Adjusted size
    height: 160, // Adjusted size
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  circleValue: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 20, // Adjusted font size
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
  },
});

export default Prediction;