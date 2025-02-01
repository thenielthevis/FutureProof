import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Importing FontAwesome icon set

const Features = () => {
  const [scaleAnim] = useState(new Animated.Value(1)); // Initial scale for image
  const [glowAnim] = useState(new Animated.Value(0)); // Initial glow opacity for image
  const [fontSizeAnim] = useState(new Animated.Value(24)); // Increased initial font size for text
  const [fontColorAnim] = useState(new Animated.Value(1)); // Font color animation (1 is for green)
  const [fontSizeAnime] = useState(new Animated.Value(40)); // Initial font size

  const handlePressIn = () => {
    // Animate scaling, glowing, font size, and font color when pressed
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 2, // Scale the image to 1.2 times
        friction: 3,  // Set friction for smooth scaling
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1, // Make the glow fully visible
        duration: 300,
        useNativeDriver: false, // glow opacity cannot be done with native driver
      }),
      Animated.timing(fontSizeAnim, {
        toValue: 28, // Increase font size more
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontColorAnim, {
        toValue: 0, // Change font color to a darker shade (0 is for dark color)
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Reset the scale, glow, font size, and font color when the press ends
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, // Reset scale to 1 (normal size)
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0, // Remove the glow
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontSizeAnim, {
        toValue: 24, // Reset font size to normal
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fontColorAnim, {
        toValue: 1, // Reset font color to original green
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#72f2b8']} style={styles.container}>
      {/* Repeated Visible Icons as Background */}
      <View style={styles.backgroundIcons}>
        {/* Multiple repeated icons filling up the background */}
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={styles.iconBackground} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 100, left: 50}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 200, left: 100}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 300, left: 150}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 100, right: 50}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 220, right: 100}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 350, right: 150}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 350, top: 150}]} />
        <FontAwesome name="leaf" size={150} color="#4CAF50" style={[styles.iconBackground, {top: 500, top: 500}]} />
        {/* You can add more icons to fill the entire screen */}
      </View>

      <Animated.Text
        style={[
          styles.featureTitle,
          {
            fontSize: fontSizeAnime, // Animated font size (you can adjust this value)
            fontStyle: 'italic', // Italic style
            fontWeight: 'bold',
            textAlign: 'center', // Center the text horizontally
            color: '#2E7D32', // Dark green color
            textShadowColor: '#2E7D32', // Dark green shadow color
            textShadowOffset: { width: 0, height: 0 }, // No offset for the shadow
            textShadowRadius: 15, // Apply a radius to the glow effect (increased for a stronger glow)
            marginTop: 30, // Adds space at the top, can adjust as needed
          },
        ]}
      >
        Learn More about our Features
      </Animated.Text>

      <View style={styles.featuresContainer}>
        {/* Nutritional Tracking */}
        <View style={[styles.featureRow, styles.alternateRow]}>
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.featureTitle,
                {
                  fontSize: fontSizeAnim, // Animated font size
                  fontStyle: 'italic', // Italic style
                  fontWeight: 'bold',
                  color: fontColorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#2E7D32', '#000'], // Change from green to black on press
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
            style={[styles.iconContainer, {transform: [{scale: scaleAnim}]}]}
          >
            <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <Image
                source={require('../assets/f-1.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Daily Assessment */}
        <View style={[styles.featureRow, styles.dailyAssessmentRow]}>
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.featureTitle,
                {
                  fontSize: fontSizeAnim, // Animated font size
                  fontStyle: 'italic', // Italic style
                  fontWeight: 'bold',
                  color: fontColorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#2E7D32', '#000'], // Change from green to black on press
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
            style={[styles.iconContainer, {transform: [{scale: scaleAnim}]}]}
          >
            <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <Image
                source={require('../assets/f-2.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Gamified */}
        <View style={[styles.featureRow, styles.alternateRow]}>
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.featureTitle,
                {
                  fontSize: fontSizeAnim, // Animated font size
                  fontStyle: 'italic', // Italic style
                  fontWeight: 'bold',
                  color: fontColorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#2E7D32', '#000'], // Change from green to black on press
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
            style={[styles.iconContainer, {transform: [{scale: scaleAnim}]}]}
          >
            <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <Image
                source={require('../assets/f-3.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Keep the icons behind the content
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    opacity: 0.5, // Make the background icons visible
    position: 'absolute',
  },
  featuresContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 1,
    marginBottom: 1,
    width: '70%',
  },
  alternateRow: {
    flexDirection: 'row-reverse',
  },
  dailyAssessmentRow: {
    justifyContent: 'flex-end',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    width: 200,
    height: 200,
    borderWidth: 5,
    borderColor: '#4CAF50',
    borderRadius: 15,
    padding: 5,
  },
  dailyAssessmentIcon: {
    marginLeft: 10,
  },
  featureTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'left',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 20,
    color: '#2A3D3A', // Darker green for description
    textAlign: 'left',
  },
});

export default Features;
