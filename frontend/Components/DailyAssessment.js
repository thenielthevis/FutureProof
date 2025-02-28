import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { generateDailyAssessment } from '../API/daily_assessment_api';
import { FontAwesome } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { UserStatusContext } from '../Context/UserStatusContext';

const DailyAssessment = ({ visible, onClose, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const { updateHealth } = useContext(UserStatusContext);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await generateDailyAssessment();
      setAssessmentData(response.assessment?.data);
      console.log('Daily assessment:', response.assessment?.data);
      if (response.assessment?.data?.updated_predictions) {
        console.log('Updating health with predictions:', response.assessment.data.updated_predictions);
      }
    } catch (error) {
      console.error('Error fetching daily assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (assessmentData?.updated_predictions) {
      updateHealth(assessmentData.updated_predictions);
    }
    onClose();
  };

  const getColor = (change) => {
    if (change < 0) return 'green'; // Decreased likelihood
    if (change > 0) return 'red'; // Increased likelihood
    return 'blue'; // No change
  };

  const renderBarChart = () => {
    if (!assessmentData?.updated_predictions) return null;

    const labels = assessmentData.updated_predictions.map(pred => pred.condition);
    const oldData = assessmentData.updated_predictions.map(pred => pred.old_percentage);
    const newData = assessmentData.updated_predictions.map(pred => pred.new_percentage);
    const colors = assessmentData.updated_predictions.map(pred => getColor(pred.new_percentage - pred.old_percentage));

    return (
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: oldData,
              colors: oldData.map((_, index) => () => colors[index]),
            },
            {
              data: newData,
              colors: newData.map((_, index) => () => colors[index]),
            },
          ],
        }}
        width={1000}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#1E2923',
          backgroundGradientTo: '#08130D',
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          barPercentage: 0.5,
        }}
        style={{ marginVertical: 10 }}
        fromZero
        showValuesOnTopOfBars
      />
    );
  };

return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonTopRight}>
                    <FontAwesome name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onBack} style={styles.backButtonTopLeft}>
                    <FontAwesome name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalHeader}>Daily Assessment</Text>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Analyzing Via GroqCloud Llama 3.2 Model</Text>
                    </View>
                )}

                {!assessmentData ? (
                    <>
                        <Text style={styles.introductionText}>
                            The <Text style={styles.boldText}>Daily Assessment</Text> is designed to help you track and improve your overall well-being by analyzing your daily habits and health-related activities. Using advanced AI, it evaluates your progress based on several key factors, including:
                        </Text>
                        <Text style={styles.listItem}>• <Text style={styles.boldText}>Task Summary</Text>: Your completed activities, such as physical workouts, meditation, and nutritional tracking.</Text>
                        <Text style={styles.listItem}>• <Text style={styles.boldText}>Nutritional Analysis</Text>: Your responses to health-related questions about diet, sleep, stress levels, and exercise habits.</Text>
                        <Text style={styles.introductionText}>By regularly completing your daily tasks and tracking your progress, you can make informed decisions to achieve better health outcomes. Stay consistent, and take control of your future well-being!</Text>
                        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                            <Text style={styles.buttonText}>Analyze</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <ScrollView style={styles.dataContainer}>
                        <Text style={styles.subtitle}>Updated Predictions</Text>
                        {renderBarChart()}
                        {assessmentData.updated_predictions?.map((prediction, index) => (
                            <Text key={index} style={styles.dataText}>
                                • {prediction.condition}: {prediction.old_percentage}% → {prediction.new_percentage}%, {prediction.reason}
                            </Text>
                        ))}

                        <Text style={styles.subtitle}>Task Summary</Text>
                        {assessmentData.task_summary?.map((task, index) => (
                            <Text key={index} style={styles.dataText}>• {task.task_type}: {task.time_spent ?? 'N/A'} mins, {task.coins_received} coins</Text>
                        ))}

                        <Text style={styles.subtitle}>Recommendations</Text>
                        <View style={styles.bulletedList}>
                            {assessmentData.recommendations?.map((rec, index) => (
                                <Text key={index} style={styles.dataText}>• {rec}</Text>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>
        </View>
    </Modal>
);
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, width: '50%', maxHeight: '80%', position: 'relative' },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#fff' },
  closeButtonTopRight: { position: 'absolute', top: 10, right: 10, backgroundColor: '#c0392b', padding: 5, borderRadius: 15 },
  backButtonTopLeft: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3498db', padding: 5, borderRadius: 15 },
  introductionText: { fontSize: 18, color: '#fff', marginBottom: 10, textAlign: 'center' },
  listItem: { fontSize: 16, color: '#fff', marginLeft: 10, marginBottom: 5 },
  boldText: { fontWeight: 'bold' },
  analyzeButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  continueButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#fff' },
  dataContainer: { marginTop: 20, maxHeight: 400 },
  dataText: { color: '#ecf0f1', marginBottom: 5 },
  loadingContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 14, fontWeight: 'bold' },
  bulletedList: { marginLeft: 10 },
});

export default DailyAssessment;
