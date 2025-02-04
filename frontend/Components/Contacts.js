import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library

const { width, height } = Dimensions.get('window');

const Contacts = ({ navigation }) => {
  return (
    <ScrollView 
    contentContainerStyle={[styles.scrollViewContent, { minHeight: height }]}
    showsVerticalScrollIndicator={false}
  >
      <View style={styles.container}>
        {/* Background Section */}
        <View style={styles.slantedBackground}>
          <LinearGradient
            colors={['#E8F5E9', '#72f2b8']} // Green gradient colors
            style={styles.gradient}
          />
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>
              Have questions or need assistance? Get in touch with us today!
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.contactButtonText}>Reach Out</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Details Section with Image on Right */}
          <View style={styles.detailsWrapper}>
            <View style={styles.detailsSection}>
              <View style={styles.detailBox}>
                <Icon
                  name="email"
                  size={Platform.OS === 'web' ? 30 : 40}
                  color="#4CAF50"
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.detailTitle}>Email Us</Text>
                  <Text style={styles.detailText}>support@example.com</Text>
                </View>
              </View>
              <View style={styles.detailBox}>
                <Icon
                  name="phone"
                  size={Platform.OS === 'web' ? 30 : 40}
                  color="#4CAF50"
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.detailTitle}>Call Us</Text>
                  <Text style={styles.detailText}>+1 (800) 123-4567</Text>
                </View>
              </View>
              <View style={styles.detailBox}>
                <Icon
                  name="location-on"
                  size={Platform.OS === 'web' ? 30 : 40}
                  color="#4CAF50"
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.detailTitle}>Visit Us</Text>
                  <Text style={styles.detailText}>123 Greenway Blvd, Suite 456</Text>
                </View>
              </View>
            </View>

            {/* Image Section on the Right */}
            <Image
              source={require('../assets/about.gif')} // Replace with your image URL or local path
              style={styles.contactImage}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
    minHeight: height, // Ensure the container takes at least the full height of the screen
  },
  slantedBackground: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 5,
    height: '50%',
    transform: [{ skewY: '-25deg' }],
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 50 : 100, // Adjusted to move the content down
  },
  title: {
    fontSize: Platform.OS === 'web' ? 40 : 50,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 10, // Increased margin to move title down
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 25,
    color: '#388E3C',
    textAlign: 'center',
    marginBottom: 20, // Increased margin to move subtitle down
  },
  contactButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  contactButtonText: {
    fontSize: Platform.OS === 'web' ? 18 : 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  detailsWrapper: {
    flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column', // Align details on the left and image on the right
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  detailsSection: {
    width: Platform.OS === 'web' && width > 768 ? '60%' : '100%', // Take up 60% of the screen width
    marginRight: Platform.OS === 'web' && width > 768 ? 20 : 0, // Reduced margin to bring the details section closer to the image
  },
  detailBox: {
    backgroundColor: '#75f2b9',
    padding: Platform.OS === 'web' ? 15 : 25,
    marginBottom: 20,
    borderRadius: 15,
    width: '100%', // Take full width for better spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row', // Change to row to align icon and text side by side
    alignItems: 'center', // Aligns the icon and text vertically in the center
  },
  icon: {
    marginRight: 15, // Adds space between the icon and text
    fontSize: Platform.OS === 'web' ? 30 : 50, // Increased icon size here
  },
  textContainer: {
    justifyContent: 'center', // Center the text vertically
    alignItems: 'flex-start', // Align text to the left
    flex: 1,
  },
  detailTitle: {
    fontSize: Platform.OS === 'web' ? 24 : 30,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'left', // Align the title to the left
  },
  detailText: {
    fontSize: Platform.OS === 'web' ? 18 : 20,
    color: '#4CAF50',
    textAlign: 'left', // Align the text to the left
  },
  contactImage: {
    width: Platform.OS === 'web' && width > 768 ? 500 : 300, // Adjusted image width
    height: Platform.OS === 'web' && width > 768 ? 500 : 300, // Adjusted image height
    borderRadius: 15, // Optional: to round the corners of the image
    marginTop: Platform.OS === 'web' && width > 768 ? 0 : 20, // Add margin on mobile
  },
});

export default Contacts;