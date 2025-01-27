import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Home = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#E8F5E9', '#72f2b8']} // Gradient colors
      style={styles.container}
    >
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Gamifying Wellness: Track, Assess, and Thrive Every Day</Text>
            <Text style={styles.subtitle}>
              FutureProof uses AI to provide predictive health insights and preventive wellness
              solutions, helping you stay ahead of potential health risks and optimize your
              well-being.
            </Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => navigation.navigate('Register')} // Replace 'Register' with your actual screen name
            >
              <Text style={styles.joinButtonText}>Join Now!</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require('../assets/video.gif')} // Correct relative path to your GIF
            style={styles.headerGif}
          />
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          {/* Feature 1 */}
          <View style={styles.featureBox}>
            <TouchableOpacity style={styles.nextIcon}>
              <Text style={styles.nextIconText}>{"<"}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.nextIcon}>
              <Text style={styles.nextIconText}>{"<"}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.nextIcon}>
              <Text style={styles.nextIconText}>{"<"}</Text>
            </TouchableOpacity>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row', // Align the header content horizontally
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10, // Add some margin for spacing from the GIF
    marginTop: 1, // Adjust the space from the top
  },
  title: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#388E3C',
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#c1ff72',
    height: 40, // Set a fixed height
    width: 200, // Set a fixed width
    borderRadius: 25,
    justifyContent: 'center', // Center the text vertically
    alignItems: 'center', // Center the text horizontally
    display: 'flex', // Make sure the container behaves like a flexbox
  },
  joinButtonText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center', // Ensure the text is centered horizontally
  },
  headerGif: {
    width: 700, // Increased the width of the GIF
    height: 400, // Increased the height of the GIF
    marginRight: 20, // Add some margin to the right for spacing
  },
  features: {
    flexDirection: 'row-reverse', // Place images on the right
    justifyContent: 'space-between',
    marginTop: 1,
  },
  featureBox: {
    width: '30%',
    height: '150%',
    alignItems: 'flex-start', // Align the content to the left
    backgroundColor: '#C8E6C9', // Light green for the boxes
    padding: 10,
    borderRadius: 10,
    borderColor: '#1B5E20', // Border color
    borderWidth: 3, // Border thickness
    flexDirection: 'row', // Arrange the icon and content horizontally
    paddingRight: 20, // Add space between the text and the image
    marginBottom: 20, // Add space between feature boxes
    position: 'relative', // Allow absolute positioning of the icon
  },
  featureContent: {
    flex: 1, // Allow the content to take up the remaining space
    paddingLeft: 10, // Add some space between the icon and the content
  },
  featureImage: {
    width: 120, // Keep the width of the image
    height: 120, // Keep the height of the image
    position: 'absolute', // Absolute positioning
    bottom: 1, // Distance from the bottom
    right: 1, // Distance from the right
  },
  
  
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'left', // Center align the title
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'left', // Center align the description
    color: '#4CAF50',
    marginBottom: 8, // Add some space between the description and image
  },
  nextIcon: {
    backgroundColor: '#81C784', // Same color as the button
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Position it at the bottom left
    bottom: 5, // Set distance from the bottom
    left: 20, // Set distance from the left
  },
  nextIconText: {
    color: '#1B5E20',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Home;
