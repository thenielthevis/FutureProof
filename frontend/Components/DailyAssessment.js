import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, ScrollView, Animated } from 'react-native';
import { generateDailyAssessment, checkAssessmentRequirements } from '../API/daily_assessment_api';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { UserStatusContext } from '../Context/UserStatusContext';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const DailyAssessment = ({ visible, onClose, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [requirements, setRequirements] = useState(null);
  const { updateHealth } = useContext(UserStatusContext);

  useEffect(() => {
    const checkRequirements = async () => {
      try {
        const reqStatus = await checkAssessmentRequirements();
        setRequirements(reqStatus);
      } catch (error) {
        console.error('Error checking requirements:', error);
      }
    };
    checkRequirements();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const reqStatus = await checkAssessmentRequirements();
      setRequirements(reqStatus);
      
      if (!reqStatus.requirements_met) {
        setShowRequirements(true);
        Toast.show({
          type: 'error',
          text1: 'Missing Requirements',
          text2: 'Please complete all required tasks before proceeding',
          visibilityTime: 4000,
          position: 'top'
        });
        setLoading(false);
        return;
      }

      const response = await generateDailyAssessment();
      setAssessmentData(response.assessment?.data);
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check requirements or generate assessment',
        visibilityTime: 4000,
        position: 'top'
      });
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

  const calculateTaskSummary = (tasks) => {
    const summary = tasks.reduce((acc, task) => {
        if (!acc[task.task_type]) {
            acc[task.task_type] = {
                count: 0,
                total_time: 0,
                total_coins: 0
            };
        }
        acc[task.task_type].count += 1;
        acc[task.task_type].total_time += task.time_spent || 0;
        acc[task.task_type].total_coins += task.coins_received || 0;
        return acc;
    }, {});

    return Object.entries(summary).map(([type, data]) => ({
        task_type: type,
        count: data.count,
        total_time: data.total_time,
        total_coins: data.total_coins
    }));
};

const renderRequirements = () => (
  <View style={styles.requirementsContainer}>
    <Text style={styles.requirementsTitle}>Assessment Requirements</Text>
    <View style={styles.requirementsList}>
      <View style={styles.requirementItem}>
        <FontAwesome5 
          name={requirements?.requirements_status.has_predictions ? "check-circle" : "times-circle"} 
          size={20} 
          color={requirements?.requirements_status.has_predictions ? "#2ecc71" : "#e74c3c"} 
        />
        <Text style={[styles.requirementText, 
          !requirements?.requirements_status.has_predictions && styles.requirementTextError]}>
          Initial Health Prediction
        </Text>
      </View>
      <View style={styles.requirementItem}>
        <FontAwesome5 
          name={requirements?.requirements_status.has_tasks ? "check-circle" : "times-circle"} 
          size={20} 
          color={requirements?.requirements_status.has_tasks ? "#2ecc71" : "#e74c3c"} 
        />
        <Text style={[styles.requirementText, 
          !requirements?.requirements_status.has_tasks && styles.requirementTextError]}>
          Daily Tasks Completion
        </Text>
      </View>
      <View style={styles.requirementItem}>
        <FontAwesome5 
          name={requirements?.requirements_status.has_nutrition ? "check-circle" : "times-circle"} 
          size={20} 
          color={requirements?.requirements_status.has_nutrition ? "#2ecc71" : "#e74c3c"} 
        />
        <Text style={[styles.requirementText, 
          !requirements?.requirements_status.has_nutrition && styles.requirementTextError]}>
          Nutritional Tracking
        </Text>
      </View>
    </View>
  </View>
);

const renderContent = () => {
  if (showRequirements && requirements) {
    return (
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.requirementsScroll}
          contentContainerStyle={styles.requirementsScrollContent}
        >
          <View style={styles.requirementsHeader}>
            <FontAwesome5 name="exclamation-circle" size={40} color="#e74c3c" />
            <Text style={styles.requirementsTitle}>Missing Requirements</Text>
            <Text style={styles.requirementsSubtitle}>Please complete the following:</Text>
          </View>
          
          <View style={styles.requirementsList}>
            {!requirements.requirements_status.has_predictions && (
              <View style={styles.requirementCard}>
                <FontAwesome5 name="chart-line" size={24} color="#e74c3c" />
                <Text style={styles.requirementTitle}>Initial Health Prediction</Text>
                <Text style={styles.requirementDescription}>
                  Complete your initial health assessment to establish baseline predictions
                </Text>
              </View>
            )}
            
            {!requirements.requirements_status.has_tasks && (
              <View style={styles.requirementCard}>
                <FontAwesome5 name="tasks" size={24} color="#e74c3c" />
                <Text style={styles.requirementTitle}>Daily Tasks</Text>
                <Text style={styles.requirementDescription}>
                  Complete at least one task for today to track your progress
                </Text>
              </View>
            )}
            
            {!requirements.requirements_status.has_nutrition && (
              <View style={styles.requirementCard}>
                <FontAwesome5 name="apple-alt" size={24} color="#e74c3c" />
                <Text style={styles.requirementTitle}>Nutritional Tracking</Text>
                <Text style={styles.requirementDescription}>
                  Log your daily nutritional information for accurate assessment
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.backToHomeButton} 
          onPress={() => setShowRequirements(false)}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Back to Overview</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.introHeader}>
        <FontAwesome5 name="heartbeat" size={40} color="#fff" />
        <Text style={styles.introTitle}>Your Daily Health Check</Text>
      </View>

      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <FontAwesome5 name="tasks" size={24} color="#fff" />
          <Text style={styles.featureTitle}>Task Summary</Text>
          <Text style={styles.featureDescription}>Track your daily activities and achievements</Text>
        </View>
        <View style={styles.featureCard}>
          <FontAwesome5 name="apple-alt" size={24} color="#fff" />
          <Text style={styles.featureTitle}>Nutrition Analysis</Text>
          <Text style={styles.featureDescription}>Monitor your diet and eating habits</Text>
        </View>
        <View style={styles.featureCard}>
          <FontAwesome5 name="chart-pie" size={24} color="#fff" />
          <Text style={styles.featureTitle}>Health Predictions</Text>
          <Text style={styles.featureDescription}>AI-powered health risk assessment</Text>
        </View>
        <View style={styles.featureCard}>
          <FontAwesome5 name="lightbulb" size={24} color="#fff" />
          <Text style={styles.featureTitle}>Recommendations</Text>
          <Text style={styles.featureDescription}>Personalized health suggestions</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.analyzeButton} 
        onPress={handleAnalyze}
      >
        <FontAwesome5 name="play-circle" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Start Analysis</Text>
      </TouchableOpacity>
    </>
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

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingGradient}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.loadingText}>Analyzing Via GroqCloud llama-3.3-70b-versatile Model</Text>
                            <View style={styles.modelFeatures}>
                                <View style={styles.featureItem}>
                                    <FontAwesome5 name="brain" size={24} color="#fff" />
                                    <Text style={styles.featureText}>AI Analysis</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <FontAwesome5 name="chart-line" size={24} color="#fff" />
                                    <Text style={styles.featureText}>Health Tracking</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <FontAwesome5 name="pills" size={24} color="#fff" />
                                    <Text style={styles.featureText}>Health Insights</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : !assessmentData ? (
                    <View style={styles.introContainer}>
                        {renderContent()}
                    </View>
                ) : (
                    <ScrollView style={styles.dataContainer}>
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="chart-line" size={24} color="#fff" />
                                <Text style={[styles.subtitle, { marginLeft: 10 }]}>Updated Predictions</Text>
                            </View>
                            {renderBarChart()}
                            <View style={styles.predictionsList}>
                                {assessmentData.updated_predictions?.map((prediction, index) => (
                                    <View key={index} style={styles.predictionItem}>
                                        <View style={styles.predictionHeader}>
                                            <Text style={styles.conditionText}>{prediction.condition}</Text>
                                            <View style={styles.percentageChange}>
                                                <Text style={[styles.percentageText, 
                                                    { color: prediction.new_percentage > prediction.old_percentage ? '#e74c3c' : '#2ecc71' }]}>
                                                    {prediction.old_percentage}% → {prediction.new_percentage}%
                                                </Text>
                                                <FontAwesome5 
                                                    name={prediction.new_percentage > prediction.old_percentage ? 'arrow-up' : 'arrow-down'} 
                                                    size={16} 
                                                    color={prediction.new_percentage > prediction.old_percentage ? '#e74c3c' : '#2ecc71'} 
                                                />
                                            </View>
                                        </View>
                                        <Text style={styles.reasonText}>{prediction.reason}</Text>
                                        {prediction.evidence && (
                                            <View style={styles.evidenceContainer}>
                                                <FontAwesome5 name="book-medical" size={16} color="#3498db" />
                                                <Text style={styles.evidenceText}>{prediction.evidence}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="tasks" size={24} color="#fff" />
                                <Text style={[styles.subtitle, { marginLeft: 10 }]}>Task Summary</Text>
                            </View>
                            <View style={styles.taskGrid}>
                                {calculateTaskSummary(assessmentData.task_summary || []).map((task, index) => (
                                    <View key={index} style={styles.taskCard}>
                                        <FontAwesome5 
                                            name={task.task_type === 'health_quiz' ? 'question-circle' : 
                                                 task.task_type === 'nutritional_tracking' ? 'apple-alt' : 'dumbbell'} 
                                            size={24} 
                                            color="#fff" 
                                        />
                                        <Text style={styles.taskCount}>{task.count}x {task.task_type}</Text>
                                        <View style={styles.taskDetails}>
                                            <View style={styles.taskStat}>
                                                <FontAwesome5 name="clock" size={16} color="#fff" />
                                                <Text style={styles.taskStatText}>{task.total_time} mins</Text>
                                            </View>
                                            <View style={styles.taskStat}>
                                                <FontAwesome5 name="coins" size={16} color="gold" />
                                                <Text style={styles.taskStatText}>{task.total_coins}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="apple-alt" size={24} color="#fff" />
                                <Text style={[styles.subtitle, { marginLeft: 10 }]}>Nutritional Analysis</Text>
                            </View>
                            {assessmentData.nutritional_analysis?.questions_answers?.map((qa, index) => (
                                <View key={index} style={styles.qaCard}>
                                    <Text style={styles.questionText}>{qa.question}</Text>
                                    <Text style={styles.answerText}>{qa.answer}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="lightbulb" size={24} color="#fff" />
                                <Text style={[styles.subtitle, { marginLeft: 10 }]}>Recommendations</Text>
                            </View>
                            {assessmentData.recommendations?.map((rec, index) => (
                                <View key={index} style={styles.recommendationCard}>
                                    <FontAwesome5 name="check-circle" size={20} color="#2ecc71" style={styles.recommendationIcon} />
                                    <View style={styles.recommendationContent}>
                                        <Text style={styles.recommendationText}>{rec.recommendation}</Text>
                                        <Text style={styles.basisText}>{rec.basis}</Text>
                                        {rec.reference && (
                                            <View style={styles.referenceContainer}>
                                                <FontAwesome5 name="external-link-alt" size={14} color="#3498db" />
                                                <Text style={styles.referenceText}>{rec.reference}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
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
  modalContent: { 
    backgroundColor: '#2c3e50', 
    padding: 20, 
    borderRadius: 15, 
    width: '60%', 
    maxHeight: '80%', 
    position: 'relative',
    overflow: 'hidden' // Add this to prevent content overflow
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  modelFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
  },
  featureItem: {
    alignItems: 'center',
    padding: 15,
  },
  featureText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  introContainer: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  introHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  featureDescription: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  analyzeButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  predictionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentageChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    marginRight: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reasonText: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  taskType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  taskStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatText: {
    color: '#fff',
    marginLeft: 5,
  },
  qaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  questionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  answerText: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  taskCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  evidenceText: {
    color: '#3498db',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 10,
  },
  basisText: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: 4,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  referenceText: {
    color: '#3498db',
    fontSize: 12,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  requirementsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  requirementsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  requirementsList: {
    width: '100%',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  requirementText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  requirementTextError: {
    color: '#e74c3c',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.7,
  },
  requirementsHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  requirementsSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  requirementCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  requirementTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  requirementDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 5,
  },
  backToHomeButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  requirementsScroll: {
    flex: 1,
    width: '100%',
    maxHeight: '70vh', // Limit height to prevent modal overflow
  },
  requirementsContainer: {
    padding: 10,
    alignItems: 'center',
  },
  requirementsList: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  requirementCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 15, // Add spacing between cards
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  requirementsScroll: {
    flex: 1,
    width: '100%'
  },

  requirementsScrollContent: {
    paddingBottom: 20
  },

  requirementsContainer: {
    width: '100%'
  },

  requirementsHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10
  },

  requirementsList: {
    width: '100%',
    paddingHorizontal: 10
  },

  backToHomeButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 10
  },
});

export default DailyAssessment;
