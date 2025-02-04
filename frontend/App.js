import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Home from './Components/Home';
import Contacts from './Components/Contacts';
import Features from './Components/Features';
import About from './Components/About';
import Login from './Components/Login';
import Register from './Components/Register';
import Gamification from './Components/Gamification';
import Logout from './Components/Logout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

function CustomHeader({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    navigation.navigate('Logout');
    setIsLoggedIn(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle menu visibility
  };

  return (
    <SafeAreaView style={styles.headerContainer} edges={['top']}>
      {/* Logo and Title */}
      <View style={styles.logoContainer}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.headerTitle}>FutureProof</Text>
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu (Mobile Only) */}
      {isMobile && (
        <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerMenu}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
      )}

      {/* Dropdown Menu (Mobile Only) */}
      {isMobile && isMenuOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => { navigation.navigate('About'); setIsMenuOpen(false); }}>
            <Text style={styles.dropdownItem}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('Features'); setIsMenuOpen(false); }}>
            <Text style={styles.dropdownItem}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('Contacts'); setIsMenuOpen(false); }}>
            <Text style={styles.dropdownItem}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Links (Desktop Only) */}
      {!isMobile && (
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
      )}

      {/* Login/Register Toggle */}
      <View style={styles.toggleContainer}>
        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.toggleBackground}>
            <TouchableOpacity
              style={[styles.toggleCircle, isLogin ? styles.circleLeft : styles.circleRight]}
              onPress={() => handleTogglePress(isLogin ? 'Register' : 'Login')}
            />
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleText, isLogin && styles.activeText]} onPress={() => handleTogglePress('Login')}>
                Login
              </Text>
              <Text style={[styles.toggleText, !isLogin && styles.activeText]} onPress={() => handleTogglePress('Register')}>
                Register
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === 'web' ? false : true}
        >
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                header: ({ navigation }) => <CustomHeader navigation={navigation} />,
              }}
            >
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="About" component={About} />
              <Stack.Screen name="Contacts" component={Contacts} />
              <Stack.Screen name="Features" component={Features} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Logout" component={Logout} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Gamification" component={Gamification} />
            </Stack.Navigator>
          </NavigationContainer>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: 'white',
    width: width,
    height: Platform.OS === 'web' ? '100vh' : height,
  },
  headerContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3B32',
    padding: 16,
    width: width,
    position: 'relative', // Needed for absolute positioning of dropdown
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isMobile ? 10 : 0,
  },
  logo: {
    width: 50,
    height: 40,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: 'bold',
    color: '#F5F5F5',
  },
  hamburgerMenu: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#F5F5F5',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60, // Position below the hamburger icon
    right: 16,
    backgroundColor: '#2C4A3E',
    borderRadius: 8,
    padding: 10,
    zIndex: 10, // Ensure it appears above other elements
  },
  dropdownItem: {
    fontSize: 16,
    color: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  navLinkText: {
    fontSize: isMobile ? 16 : 18,
    color: '#F5F5F5',
    marginHorizontal: isMobile ? 8 : 16,
    marginVertical: isMobile ? 4 : 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBackground: {
    width: 143,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    position: 'relative',
    marginRight: 8,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 72,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
    backgroundColor: '#c1ff72',
    top: 2,
  },
  circleLeft: {
    left: 2,
  },
  circleRight: {
    left: 70,
  },
  toggleTextContainer: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  toggleText: {
    fontSize: 16,
    color: '#1A3B32',
    fontWeight: '600',
  },
  activeText: {
    color: '#1A3B32',
  },
  logoutButton: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 5,
  },
  logoutText: {
    color: '#1A3B32',
    fontWeight: '600',
  },
});