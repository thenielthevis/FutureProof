import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const Home = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#E8F5E9', '#72f2b8']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollViewContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          {isMobile && (
            <Image
              source={require('../assets/video.gif')}
              style={[styles.headerGif, { marginBottom: 20 }]}
            />
          )}

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Gamifying Wellness: Track, Assess, and Thrive Every Day</Text>
            <Text style={styles.subtitle}>
              FutureProof uses AI to provide predictive health insights and preventive wellness
              solutions, helping you stay ahead of potential health risks and optimize your
              well-being.
            </Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.joinButtonText}>Join Now!</Text>
            </TouchableOpacity>
          </View>

          {!isMobile && (
            <Image
              source={require('../assets/video.gif')}
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
    padding: isMobile ? 20 : 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: isMobile ? 0 : 40,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  title: {
    fontSize: isMobile ? 28 : 48,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 16,
    textAlign: isMobile ? 'center' : 'left',
    lineHeight: isMobile ? 34 : 56,
  },
  subtitle: {
    fontSize: isMobile ? 16 : 20,
    color: '#388E3C',
    marginBottom: 32,
    textAlign: 'justify',
    lineHeight: 24,
    paddingHorizontal: isMobile ? 10 : 0,
  },
  joinButton: {
    backgroundColor: '#c1ff72',
    height: 50,
    width: isMobile ? '100%' : 240,
    maxWidth: 400,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonText: {
    color: '#1B5E20',
    fontWeight: '700',
    fontSize: isMobile ? 18 : 20,
  },
  headerGif: {
    width: isMobile ? width * 0.9 : width * 0.5,
    height: isMobile ? 220 : 400,
    borderRadius: 20,
    marginVertical: isMobile ? 10 : 0,
  },
  features: {
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  featureBox: {
    flex: isMobile ? 0 : 1,
    width: isMobile ? '100%' : '30%',
    minWidth: 300,
    backgroundColor: '#C8E6C9',
    padding: 25,
    borderRadius: 30,
    borderColor: '#1B5E20',
    borderWidth: 3,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  featureContent: {
    width: '100%',
    marginBottom: 20,
  },
  featureImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  featureTitle: {
    fontSize: isMobile ? 22 : 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: isMobile ? 15 : 16,
    textAlign: 'justify',
    color: '#4CAF50',
    lineHeight: 22,
  },
});

export default Home;