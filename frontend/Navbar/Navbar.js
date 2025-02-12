import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigationState } from '@react-navigation/native';
import GameNavbar from './GameNavbar';

const { width } = Dimensions.get('window');
const isMobile = width < 768; // Define mobile breakpoint

export default function Navbar({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Controls Logout Popup

  const currentRoute = useNavigationState(state => state.routes[state.index].name);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      }
    };
    checkToken();
  }, []);

  const handleTogglePress = (targetPage) => {
    if (targetPage === 'Login') {
      setIsLogin(true);
      navigation.navigate('Login');
    } else {
      setIsLogin(false);
      navigation.navigate('Register');
    }
  };

  const handleLogoutPress = async () => {
    setModalVisible(true); // Show the logout modal
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setIsLoggedIn(false);

      // Toast message for logout success
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully!',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 30 : 60,
      });

      // Close the modal
      setModalVisible(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      console.error('Logout error:', err);
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 30 : 60,
      });
    }
  };

  if (currentRoute === 'Game') {
    return <GameNavbar />;
  }

  // Desktop Navigation
  const renderDesktopNav = () => (
    <View style={styles.navLinksContainer}>
      <View style={styles.navLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('About')}>
          <Text style={styles.navLinkText}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Features')}>
          <Text style={styles.navLinkText}>Features</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Contacts')}>
          <Text style={styles.navLinkText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Login/Register Toggle */}
      <View style={styles.toggleContainer}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Prediction')}>
              <Icon name="gamepad" size={24} color="#f0fdf7" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, isLogin && styles.activeSegment]}
              onPress={() => handleTogglePress('Login')}
            >
              <Text style={[styles.segmentText, isLogin && styles.activeSegmentText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, !isLogin && styles.activeSegment]}
              onPress={() => handleTogglePress('Register')}
            >
              <Text style={[styles.segmentText, !isLogin && styles.activeSegmentText]}>Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Mobile Navigation
  const renderMobileNav = () => (
    <>
      <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)} style={styles.hamburgerButton}>
        <Icon name="bars" size={24} color="#f0fdf7" />
      </TouchableOpacity>

      {/* Dropdown Menu for Mobile */}
      {isMenuOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => navigation.navigate('About')}>
            <Text style={styles.dropdownMenuItem}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Features')}>
            <Text style={styles.dropdownMenuItem}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.dropdownMenuItem}>Contact Us</Text>
          </TouchableOpacity>
          {isLoggedIn ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('Prediction')}>
                <Text style={styles.dropdownMenuItem}>Prediction</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogoutPress}>
                <Text style={styles.dropdownMenuItem}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => handleTogglePress('Login')}>
                <Text style={styles.dropdownMenuItem}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleTogglePress('Register')}>
                <Text style={styles.dropdownMenuItem}>Register</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.headerContainer} edges={['top']}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.headerTitle}>FutureProof</Text>
        </TouchableOpacity>
      </View>

      {/* Render Desktop or Mobile Navigation */}
      {isMobile ? renderMobileNav() : renderDesktopNav()}

      {/* Logout Confirmation Popup */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Are you sure you want to logout?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3B32',
    padding: 16,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 40,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F5F5F5',
  },
  navLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to the right
    alignItems: 'center',
    flex: 1, // Ensure it takes up available space
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLinkText: {
    fontSize: 18,
    color: '#F5F5F5',
    marginHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 600, // Adjusted spacing for logout/login button
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf7',
    borderRadius: 20,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSegment: {
    backgroundColor: '#388E3C',
  },
  segmentText: {
    fontSize: 16,
    color: '#1A3B32',
    fontWeight: '600',
  },
  activeSegmentText: {
    color: '#f0fdf7',
  },
  iconButton: {
    marginRight: 16,
  },
  logoutButton: {
    backgroundColor: '#388E3C',
    padding: 10,
    borderRadius: 18,
  },
  logoutText: {
    color: '#f0fdf7',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30, 
    borderRadius: 10,
    width: 350, 
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 26, 
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 15, // Border radius added for round corners
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
  },
  cancelButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hamburgerButton: {
    padding: 10,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1A3B32',
    borderRadius: 8,
    padding: 10,
    width: 150,
    zIndex: 1000,
  },
  dropdownMenuItem: {
    fontSize: 16,
    color: '#F5F5F5',
    paddingVertical: 8,
  },
});