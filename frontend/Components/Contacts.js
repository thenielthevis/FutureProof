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
              source={require('../assets/contact.gif')} // Replace with your image URL or local path
              style={styles.contactImage}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 10,
    position: 'relative',
    minHeight: height, // Ensure the container takes at least the full height of the screen
  },
  slantedBackground: {
    position: 'absolute',
    top: 0, // Adjust the top to move the background upwards
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
    marginTop: Platform.OS === 'web' ? 20 : 40, // Reduced to shift header up
  },
  title: {
    fontSize: Platform.OS === 'web' ? 40 : 50,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 10,
    marginTop: Platform.OS === 'web' ? 0 : 0, // Adjust this value to move the title upwards
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 25,
    color: '#388E3C',
    textAlign: 'center',
    marginBottom: 20,
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
    flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    position: 'relative',
  },
  detailsSection: {
    width: Platform.OS === 'web' && width > 768 ? '60%' : '100%',
    marginRight: Platform.OS === 'web' && width > 768 ? 0 : 0,
    zIndex: 1,
  },
  contactImage: {
    position: 'absolute',
    top: 0,
    left: 750,
    width: '55%',
    height: '180%',
    borderRadius: 15,
    zIndex: 0,
  },
  detailBox: {
    backgroundColor: '#75f2b9',
    padding: Platform.OS === 'web' ? 10 : 15,
    marginBottom: 20,
    borderRadius: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    zIndex: 2,
  },
  icon: {
    marginRight: 15,
    fontSize: Platform.OS === 'web' ? 30 : 50,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
  },
  detailTitle: {
    fontSize: Platform.OS === 'web' ? 24 : 30,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'left',
  },
  detailText: {
    fontSize: Platform.OS === 'web' ? 18 : 20,
    color: '#4CAF50',
    textAlign: 'left',
  },
});

export default Contacts;
