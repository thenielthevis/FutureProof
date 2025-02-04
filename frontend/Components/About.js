import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const About = () => {
  const isWeb = Platform.OS === 'web';

  return (
    <LinearGradient
      colors={['#E8F5E9', '#72f2b8']} // Gradient colors
      style={styles.container}
    >
      {isWeb ? (
      <ScrollView 
      contentContainerStyle={[styles.scrollViewContent, { minHeight: height }]}
      showsVerticalScrollIndicator={false}
    >
          <View style={styles.mainLayout}>
            {/* Left Section */}
            <View style={styles.leftSection}>
              <Text style={styles.sectionTitle}>Our Success Stories & Mission</Text>
              <Text style={styles.sectionText}>
                We have impacted thousands of lives by providing cutting-edge AI-driven health insights.
                Our mission is to revolutionize the way people approach wellness and prevention.
              </Text>
            </View>

            {/* Center Section */}
            <View style={styles.centerSection}>
              <Image
                source={require('../assets/about.gif')} // Correct relative path to your GIF
                style={styles.headerGif}
              />
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              <Text style={styles.title}>About Us</Text>
              <Text style={styles.subtitle}>
                FutureProof leverages AI to provide predictive health insights and preventive wellness
                solutions, ensuring you stay ahead of potential health risks while optimizing your
                well-being.
              </Text>
            </View>
          </View>

          {/* Values Section */}
          <View style={styles.valuesSection}>
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
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.mobileContainer}>
          {/* Mobile Layout */}
          <View style={styles.mobileMainLayout}>
            {/* About Us Section */}
            <View style={styles.mobileSection}>
              <Text style={styles.title}>About Us</Text>
              <Text style={styles.subtitle}>
                FutureProof leverages AI to provide predictive health insights and preventive wellness
                solutions, ensuring you stay ahead of potential health risks while optimizing your
                well-being.
              </Text>
            </View>

            {/* GIF Section */}
            <View style={styles.mobileSection}>
              <Image
                source={require('../assets/about.gif')} // Correct relative path to your GIF
                style={styles.headerGif}
              />
            </View>

            {/* Success Stories & Mission Section */}
            <View style={styles.mobileSection}>
              <Text style={styles.sectionTitle}>Our Success Stories & Mission</Text>
              <Text style={styles.sectionText}>
                We have impacted thousands of lives by providing cutting-edge AI-driven health insights.
                Our mission is to revolutionize the way people approach wellness and prevention.
              </Text>
            </View>

            {/* Values Section */}
            <View style={styles.mobileSection}>
              <View style={styles.mobileValuesContainer}>
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
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Platform.OS === 'web' ? 24 : 16,
  },
  mobileContainer: {
    flexGrow: 1,
    padding: 16,
  },
  mainLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 40,
    padding: 16,
  },
  leftSection: {
    width: width > 768 ? '30%' : '100%',
    padding: 10,
    alignSelf: width > 768 ? 'flex-end' : 'center',
  },
  centerSection: {
    width: width > 768 ? '30%' : '100%',
    alignItems: 'center',
  },
  rightSection: {
    width: width > 768 ? '30%' : '100%',
    padding: 10,
    alignSelf: width > 768 ? 'flex-start' : 'center',
  },
  title: {
    fontSize: width > 768 ? 50 : 35,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width > 768 ? 25 : 18,
    color: '#388E3C',
    textAlign: 'justify',
    lineHeight: 24,
  },
  headerGif: {
    width: width > 768 ? 400 : 300,
    height: width > 768 ? 400 : 300,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: width > 768 ? 40 : 30,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionText: {
    fontSize: width > 768 ? 25 : 18,
    color: '#388E3C',
    textAlign: 'justify',
    lineHeight: 24,
  },
  valuesSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  valuesContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    justifyContent: 'space-around',
    width: '100%',
  },
  mobileValuesContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    width: width > 768 ? '30%' : '80%',
    alignItems: 'center',
    borderColor: '#2E7D32',
    borderWidth: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    marginBottom: width > 768 ? 0 : 20,
  },
  valueTitle: {
    fontSize: width > 768 ? 22 : 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  valueDescription: {
    fontSize: width > 768 ? 18 : 14,
    color: '#388E3C',
    textAlign: 'justify',
    lineHeight: 20,
  },
  mobileMainLayout: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileSection: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default About;