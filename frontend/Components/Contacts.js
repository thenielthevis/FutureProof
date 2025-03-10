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
        {/* Huge Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.hugeTitle}>Contact Us</Text>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>For Any Concerns or Inquiries</Text>
            <Text style={styles.subtitle}>
              Have questions or need assistance? Get in touch with us today!
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.contactButtonText} onPress={() => Linking.openURL('mailto:davmarrearen@gmail.com')}>Reach Out</Text>
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
                  <Text style={styles.detailText}>FutureProof@gmail.com</Text>
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
    flex: 1,
    position: 'relative',
    minHeight: height, // Ensure the container takes at least the full height of the screen
    backgroundColor: 'transparent', // Make the background transparent
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 20 : 40,
  },
  hugeTitle: {
    fontSize: Platform.OS === 'web' ? 80 : 60,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
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
    color: '#ffffff',
    marginBottom: 10,
    marginTop: Platform.OS === 'web' ? 0 : 0, // Adjust this value to move the title upwards
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 25,
    color: '#ffffff',
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
    left: 875,
    width: '30%',
    height: '100%',
    zIndex: 0,
  },
  detailBox: {
    backgroundColor: '#ffffff',
    padding: Platform.OS === 'web' ? 10 : 15,
    marginBottom: 20,
    marginLeft: 35,
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