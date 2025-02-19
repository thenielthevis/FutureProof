import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768; // Adjust this value based on your needs

const Features = () => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [fontSizeAnim] = useState(new Animated.Value(isMobile ? 18 : 24)); // Adjusted for mobile
  const [fontColorAnim] = useState(new Animated.Value(1));
  const [fontSizeAnime] = useState(new Animated.Value(isMobile ? 30 : 40)); // Adjusted for mobile

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isMobile ? 1.2 : 1.5, // Reduced scaling for mobile
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontSizeAnim, {
        toValue: isMobile ? 22 : 28, // Adjusted for mobile
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontColorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontSizeAnim, {
        toValue: isMobile ? 18 : 24, // Adjusted for mobile
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontColorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollViewContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Icons */}
        <View style={styles.backgroundIcons}>
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={styles.iconBackground} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 100, left: 50 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 200, left: 100 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 300, left: 150 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 100, right: 50 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 220, right: 100 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 350, right: 150 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 350, top: 150 }]} />
          <FontAwesome name="leaf" size={150} color="#e2f5e7" style={[styles.iconBackground, { top: 500, top: 500 }]} />
        </View>

        {/* Huge Title */}
        <Text style={styles.hugeTitle}>Discover Our Features</Text>

        {/* Features Container */}
        <View style={styles.featuresContainer}>
          {/* Nutritional Tracking */}
          <View style={[styles.featureContainer, isMobile ? styles.mobileFeatureRow : styles.alternateRow]}>
            <View style={styles.textContainer}>
              <Animated.Text
                style={[
                  styles.featureTitle,
                  {
                    fontSize: fontSizeAnim,
                    fontWeight: 'bold',
                    color: fontColorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#388E3C', '#388E3C'],
                    }),
                  },
                ]}
              >
                Nourish Your Body
              </Animated.Text>
              <Text style={styles.featureDescription}>
                Easily track your daily food intake and gain valuable insights into your nutrition. By regularly monitoring your eating habits, you can identify patterns, make healthier choices, and ensure that you maintain a balanced diet that contributes to your overall well-being.
              </Text>
            </View>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
            >
              <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Image
                  source={require('../assets/f-1.gif')}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Separator Line */}
          <View style={styles.separator} />

          {/* Daily Assessment */}
          <View style={[styles.featureContainer, isMobile ? styles.mobileFeatureRow : styles.dailyAssessmentRow]}>
            <View style={styles.textContainer}>
              <Animated.Text
                style={[
                  styles.featureTitle,
                  {
                    fontSize: fontSizeAnim,
                    fontWeight: 'bold',
                    color: fontColorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#388E3C', '#388E3C'],
                    }),
                  },
                ]}
              >
                Track Your Progress
              </Animated.Text>
              <Text style={styles.featureDescription}>
                Receive personalized daily assessments based on your health data and habits. These assessments help you monitor health trends over time, so you can make adjustments to optimize your wellness.
              </Text>
            </View>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
            >
              <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Image
                  source={require('../assets/f-2.gif')}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Separator Line */}
          <View style={styles.separator} />

          {/* Gamified */}
          <View style={[styles.featureContainer, isMobile ? styles.mobileFeatureRow : styles.alternateRow]}>
            <View style={styles.textContainer}>
              <Animated.Text
                style={[
                  styles.featureTitle,
                  {
                    fontSize: fontSizeAnim,
                    fontWeight: 'bold',
                    color: fontColorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#388E3C', '#388E3C'],
                    }),
                  },
                ]}
              >
                Wellness Challenges
              </Animated.Text>
              <Text style={styles.featureDescription}>
                Engage in a fun and interactive experience that turns your health goals into rewarding challenges. This feature uses game-like mechanics to motivate you to stay on track with your wellness journey.
              </Text>
            </View>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
            >
              <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Image
                  source={require('../assets/f-3.gif')}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: isMobile ? 20 : 50,
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    opacity: 0.2,
    position: 'absolute',
  },
  hugeTitle: {
    fontSize: isMobile ? 40 : 60,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  featuresContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 1,
    marginBottom: isMobile ? 30 : 1,
    width: isMobile ? '100%' : '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
  },
  mobileFeatureRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternateRow: {
    flexDirection: isMobile ? 'column' : 'row-reverse',
  },
  dailyAssessmentRow: {
    justifyContent: isMobile ? 'center' : 'flex-end',
  },
  textContainer: {
    flex: 1,
    marginLeft: isMobile ? 0 : 10,
    marginRight: isMobile ? 0 : 10,
    marginBottom: isMobile ? 20 : 0,
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    width: isMobile ? 120 : 200,
    height: isMobile ? 120 : 200,
    borderWidth: 5,
    borderColor: '#388E3C',
    borderRadius: 15,
    padding: 5,
  },
  featureTitle: {
    fontSize: isMobile ? 24 : 50,
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: isMobile ? 14 : 20,
    color: '#388E3C',
    textAlign: 'justify',
    padding: 16,
  },
  separator: {
    height: 2,
    backgroundColor: '#ffffff',
    width: '80%',
    marginVertical: 20, // Adjust spacing as needed
  },
});

export default Features;