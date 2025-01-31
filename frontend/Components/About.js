import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const About = () => {
    return (
        <LinearGradient
          colors={['#E8F5E9', '#72f2b8']} // Gradient colors
          style={styles.container}
        >
          <View style={styles.container}>
            {/* Main Layout */}
            <View style={styles.mainLayout}>
              {/* Our Success Stories & Mission Section */}
              <View style={styles.leftSection}>
                <Text style={styles.sectionTitle}>Our Success Stories & Mission</Text>
                <Text style={styles.sectionText}>
                  We have impacted thousands of lives by providing cutting-edge AI-driven health insights.
                  Our mission is to revolutionize the way people approach wellness and prevention.
                </Text>
              </View>
              
              {/* GIF Section */}
              <View style={styles.centerSection}>
                <Image
                  source={require('../assets/about.gif')} // Correct relative path to your GIF
                  style={styles.headerGif}
                />
              </View>
              
              {/* About Us Section */}
              <View style={styles.rightSection}>
                <Text style={styles.title}>About Us</Text>
                <Text style={styles.subtitle}>
                  FutureProof leverages AI to provide predictive health insights and preventive wellness
                  solutions, ensuring you stay ahead of potential health risks while optimizing your
                  well-being.
                </Text>
              </View>
            </View>

            {/* Our Values Section */}
            <View style={styles.valuesSection}>
              <Text style={styles.valuesTitle}>Our Values</Text>
              <View style={styles.valuesContainer}>
                <View style={styles.valueBox}>
                  <MaterialIcons name="room-service" size={40} color="#2E7D32" />
                  <Text style={styles.valueTitle}>Service</Text>
                  <Text style={styles.valueDescription}>
                    To deliver an elevated level of service to our clients in a fun and respectful way.
                  </Text>
                </View>
                <View style={styles.valueBox}>
                  <MaterialIcons name="verified-user" size={40} color="#2E7D32" />
                  <Text style={styles.valueTitle}>Trust</Text>
                  <Text style={styles.valueDescription}>
                    To create a trustworthy relationship that is built on respect, honesty, and dependability.
                  </Text>
                </View>
                <View style={styles.valueBox}>
                  <MaterialIcons name="favorite" size={40} color="#2E7D32" />
                  <Text style={styles.valueTitle}>Love</Text>
                  <Text style={styles.valueDescription}>
                    And to meet the needs of our clients in a skillful way that shows the love we have for
                    our purpose — to serve others.
                  </Text>
                </View>
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
  mainLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  leftSection: {
    width: '30%',
    padding: 10,
    alignSelf: 'flex-end', // Moved to top right
  },
  centerSection: {
    width: '30%',
    alignItems: 'center',
  },
  rightSection: {
    width: '30%',
    padding: 10,
    alignSelf: 'flex-start', // Moved to bottom left
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textShadowColor: 'rgba(46, 125, 50, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    fontFamily: 'Georgia', // Semi-formal font
    fontStyle: 'italic', // Italic style
  },
  subtitle: {
    fontSize: 25,
    color: '#388E3C',
    fontFamily: 'serif', // Semi-formal font family
    fontStyle: 'italic', // Italic style
  },
  headerGif: {
    width: 400,
    height: 400,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 1,
    textShadowColor: 'rgba(46, 125, 50, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'left',
    fontFamily: 'Georgia', // Semi-formal font
    fontStyle: 'italic', // Italic style
  },
  sectionText: {
    fontSize: 25,
    color: '#4CAF50',
    fontFamily: 'serif', // Semi-formal font family
    fontStyle: 'italic', // Italic style
  },
  valuesSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  valuesTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textShadowColor: 'rgba(46, 125, 50, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'center',
    fontFamily: 'Georgia', // Semi-formal font
    fontStyle: 'italic', // Italic style
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
    borderColor: '#2E7D32',
    borderWidth: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  valueTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
    fontFamily: 'Georgia', // Semi-formal font
    fontStyle: 'italic', // Italic style
  },
  valueDescription: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
    fontFamily: 'serif', // Semi-formal font family
   
  },
  glitterIcon: {
    textShadowColor: 'rgba(46, 125, 50, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
});

export default About;
