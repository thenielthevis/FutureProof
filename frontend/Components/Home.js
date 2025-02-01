import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const Home = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#E8F5E9', '#72f2b8']} // Gradient colors
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* GIF on Top for Mobile */}
          {isMobile && (
            <Image
              source={require('../assets/video.gif')} // Correct relative path to your GIF
              style={styles.headerGif}
            />
          )}

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Gamifying Wellness: Track, Assess, and Thrive Every Day</Text>
            <Text style={styles.subtitle}>
              FutureProof uses AI to provide predictive health insights and preventive wellness
              solutions, helping you stay ahead of potential health risks and optimize your
              well-being.
            </Text>
            <View style={styles.joinButtonContainer}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => navigation.navigate('Register')} // Replace 'Register' with your actual screen name
              >
                <Text style={styles.joinButtonText}>Join Now!</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* GIF on Right for Desktop */}
          {!isMobile && (
            <Image
              source={require('../assets/video.gif')} // Correct relative path to your GIF
              style={styles.headerGif}
            />
          )}
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          {/* Feature 1 */}
          <View style={styles.featureBox}>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Gamified</Text>
              <Text style={styles.featureDescription}>
                Engage in a fun, interactive experience that turns health goals into rewarding
                challenges, making wellness enjoyable and motivating.
              </Text>
            </View>
            <Image
              source={require('../assets/gamified.png')}
              style={styles.featureImage}
            />
          </View>

          {/* Feature 2 */}
          <View style={styles.featureBox}>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Nutritional Tracking</Text>
              <Text style={styles.featureDescription}>
                Easily track your daily food intake and gain valuable insights into your nutrition to
                help you make healthier choices.
              </Text>
            </View>
            <Image
              source={require('../assets/nutrition.png')}
              style={styles.featureImage}
            />
          </View>

          {/* Feature 3 */}
          <View style={styles.featureBox}>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Daily Assessment</Text>
              <Text style={styles.featureDescription}>
                Receive personalized daily assessments to monitor your progress, identify health
                trends, and optimize your wellness journey.
              </Text>
            </View>
            <Image
              source={require('../assets/assessment.png')}
              style={styles.featureImage}
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: isMobile ? 10 : 16,
  },
  header: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: isMobile ? 0 : 10,
    marginTop: isMobile ? 10 : 0,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  title: {
    fontSize: isMobile ? 28 : 45,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 16,
    textAlign: isMobile ? 'center' : 'left',
  },
  subtitle: {
    fontSize: isMobile ? 16 : 20,
    color: '#388E3C',
    marginBottom: 16,
    textAlign: isMobile ? 'center' : 'left',
  },
  joinButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#c1ff72',
    height: 40,
    width: isMobile ? '80%' : 200,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 7,
  },
  joinButtonText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  headerGif: {
    width: isMobile ? width * 0.9 : 700,
    height: isMobile ? 200 : 400,
    marginRight: isMobile ? 0 : 20,
    marginBottom: isMobile ? 20 : 0,
  },
  features: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  featureBox: {
    width: isMobile ? '100%' : '30%',
    backgroundColor: '#C8E6C9',
    padding: 15,
    borderRadius: 30,
    borderColor: '#1B5E20',
    borderWidth: 3,
    marginBottom: 20,
    alignItems: 'center',
  },
  featureContent: {
    width: '100%',
    marginBottom: 10,
  },
  featureImage: {
    width: 120,
    height: 120,
    marginTop: 10,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 8,
  },
});

export default Home;