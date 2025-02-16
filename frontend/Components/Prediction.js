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
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768; // Check if the screen width is less than 768px (mobile)

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
    const diseaseLabels = prediction.predicted_diseases?.map((item) => item.condition) || [];
    const diseaseData = prediction.predicted_diseases?.map((item) => parseInt(item.details.match(/\d+/)?.[0] || 0)) || [];

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
            {/* User Information Section */}
            <Text style={styles.sectionHeader}>User Information</Text>
            <View style={styles.userDetailsContainer}>
              <Text style={styles.userDetailsText}>{prediction.user_info?.details || 'No details available'}</Text>
            </View>

            <Text style={styles.sectionHeader}>Predicted Diseases</Text>
            {/* LineChart with Gradient */}
            {isMobile ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={screenWidth * 1.5} // Make the chart wider for scrolling
                  height={350} // Increased height to accommodate labels
                  chartConfig={{
                    backgroundColor: '#2c3e50',
                    backgroundGradientFrom: '#2c3e50',
                    backgroundGradientTo: '#2c3e50',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Ensure text is visible
                    fillShadowGradient: '#f6a8f0', // Set shadow color
                    fillShadowGradientOpacity: 0.4, // Adjust shadow opacity
                    propsForLabels: {
                      rotation: -45, // Rotate labels to make them horizontal
                      fontSize: 10, // Increase font size for better readability
                      fontWeight: 'bold',
                      dx: 8, // Add padding to prevent clipping
                      dy: 1, // Add padding to prevent clipping
                      textAnchor: 'middle', // Center the text
                      wordWrap: 'break-word', // Break long labels
                    },
                  }}
                  bezier // Makes the line smooth
                  style={{
                    marginVertical: 15,
                    borderRadius: 16,
                    paddingRight: 20, // Add padding to prevent clipping
                  }}
                />
              </ScrollView>
            ) : (
               <ScrollView horizontal >
              <LineChart
              data={chartData}
              width={screenWidth * 0.6}
              height={220}
              chartConfig={{
                backgroundColor: '#2c3e50',
                backgroundGradientFrom: '#2c3e50',
                backgroundGradientTo: '#2c3e50',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Ensure text is visible
                fillShadowGradient: '#f6a8f0', // Set shadow color
                fillShadowGradientOpacity: 0.4, // Adjust shadow opacity
              }}
              bezier // Makes the line smooth
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            </ScrollView>
            )}
            {/* Disease Information Progress Circles */}
            {isMobile ? (
              <View style={styles.circleContainerMobile}>
                {diseaseLabels.map((label, index) => (
                  <View key={index} style={styles.circleWrapperMobile}>
                    <ProgressChart
                      data={{ data: [diseaseData[index] / 100] }} // Ensure data is between 0 and 1
                      width={100} // Adjust size for mobile
                      height={100}
                      strokeWidth={12}
                      radius={40} // Adjust radius for mobile
                      chartConfig={{
                        backgroundGradientFrom: '#2c3e50', // Dark background for circles
                        backgroundGradientTo: '#2c3e50', // Dark background for circles
                        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`, // Progress circle color
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Ensure text is visible
                        strokeWidth: 2,
                      }}
                      hideLegend={true} // Hide the legend since it's not needed here
                    />
                    <Text style={styles.circleText} numberOfLines={3} ellipsizeMode="tail">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.circleContainer}>
                {diseaseLabels.map((label, index) => (
                  <View key={index} style={styles.circleWrapper}>
                    <ProgressChart
                      data={{ data: [diseaseData[index] / 100] }} // Ensure data is between 0 and 1
                      width={120} // Desktop size
                      height={120}
                      strokeWidth={12}
                      radius={50} // Desktop radius
                      chartConfig={{
                        backgroundGradientFrom: '#2c3e50', // Dark background for circles
                        backgroundGradientTo: '#2c3e50', // Dark background for circles
                        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`, // Progress circle color
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Ensure text is visible
                        strokeWidth: 2,
                      }}
                      hideLegend={true} // Hide the legend since it's not needed here
                    />
                    <Text style={styles.circleText} >
                      {label}
                    </Text>
                    <Text style={styles.circleValue}>{diseaseData[index]}%</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {step === 2 && (
          <>
            {/* Positive Habits, Areas for Improvement, and Recommendations in Columns */}
            <View style={isMobile ? styles.columnsContainerMobile : styles.columnsContainer}>
              {/* Positive Habits Column */}
              <View style={styles.column}>
                <Text style={styles.sectionHeader}>Positive Habits</Text>
                <View style={styles.bulletedList}>
                  {prediction.positive_habits?.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <Icon name="check-circle" size={18} color="#27ae60" style={styles.bulletIcon} />
                      <Text style={styles.bulletPoint}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Areas for Improvement Column */}
              <View style={styles.column}>
                <Text style={styles.sectionHeader}>Areas for Improvement</Text>
                <View style={styles.bulletedList}>
                  {prediction.areas_for_improvement?.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <Icon name="exclamation-circle" size={18} color="#e67e22" style={styles.bulletIcon} />
                      <Text style={styles.bulletPoint}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recommendations Column */}
              <View style={styles.column}>
                <Text style={styles.sectionHeader}>Recommendations</Text>
                <View style={styles.bulletedList}>
                  {prediction.recommendations?.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <Icon name="lightbulb-o" size={18} color="#3498db" style={styles.bulletIcon} />
                      <Text style={styles.bulletPoint}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#ffffff', '#72f2b8']} style={styles.loadingContainer}> {/* Added Gradient for Loading */}
        <ActivityIndicator size="large" color="black" /> {/* Changed ActivityIndicator color to white */}
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#ffffff', '#72f2b8']} style={styles.container}> {/* Added Linear Gradient here */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, isMobile && styles.modalViewMobile]}>
            {/* Tab Navigation at the Top - Styled Like Folder Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, step === 1 && styles.activeTab]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.tabText, step === 1 && styles.activeTabText]}>User Info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, step === 2 && styles.activeTab]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.tabText, step === 2 && styles.activeTabText]}>Insights</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHeader}>Prediction</Text>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false} // Hide scrollbar
            >
              {formatPrediction(prediction)}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(!modalVisible);
                navigation.navigate('Game');
              }}
            >
              <Icon name="close" size={20} color="#fff" />
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }, // Gradient Loading style
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isMobile ? 20 : 0, // Add margin on top for mobile
  },
  
  modalView: {
    width: isMobile ? '100%' : '70%', // Full width for mobile, smaller for desktop
    height: isMobile ? '90%' : '70%', // Slightly less height for mobile, smaller for desktop
    backgroundColor: '#2c3e50',
    borderRadius: isMobile ? 0 : 20, // No border radius for mobile
    padding: 20,
    marginTop: isMobile ? 20 : 50, // Add margin on top for mobile
    marginBottom: isMobile ? 20 : 50, // Add margin at the bottom for mobile
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
  modalViewMobile: {
    marginTop: 40, // Additional top margin for mobile
  },
  modalHeader: { fontSize: 28, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 20 },
  scrollView: { width: '100%' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 10, textAlign: 'center' },
  userDetailsContainer: {
    width: isMobile ? '100%' : '90%', // Full width for mobile
    padding: 15,
    backgroundColor: '#34495e',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  userDetailsText: {
    fontSize: 16,
    color: '#ecf0f1',
    lineHeight: 24,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  columnsContainerMobile: {
    flexDirection: 'column', // Stack columns vertically for mobile
    width: '100%',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    marginHorizontal: isMobile ? 0 : 5, // No horizontal margin for mobile
    marginBottom: isMobile ? 20 : 0, // Add bottom margin for mobile
  },
  bulletedList: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#34495e',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bulletIcon: {
    marginRight: 10,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#ecf0f1',
    flexShrink: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
  },
  buttonText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  error: { color: 'red', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  circleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
    flexWrap: 'wrap',
  },
  circleContainerMobile: {
    flexDirection: 'column', // Stack circles vertically for mobile
    marginTop: 80,
    paddingHorizontal: 10,
  },
  circleWrapper: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  circleWrapperMobile: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginHorizontal: 10, // Add horizontal margin for mobile
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
    width: 100, // Fixed width to ensure text wraps properly
  },
  circleValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: isMobile ? '60%' : '40%', // Make the tab longer on mobile
    backgroundColor: '#2c3e50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#4189E5',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#1e3a5f',
  },
  tabText: { fontSize: 16, color: '#B0C4DE' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  mobileChartContainer: {
    height: 300,
    width: '100%',
    alignItems: 'center',
    marginBottom: 60,
  },
});

export default Prediction;