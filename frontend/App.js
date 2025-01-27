import React, { useState } from 'react';  
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Home from './Components/Home';
import Login from './Components/Login';
import Register from './Components/Register';

const Stack = createStackNavigator();

function CustomHeader({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // Track whether it's Login or Register

  // Function to handle the toggle click and navigate accordingly
  const handleTogglePress = (targetPage) => {
    if (targetPage === 'Login') {
      setIsLogin(true); // Set the state to login
      navigation.navigate('Login'); // Navigate to Login
    } else {
      setIsLogin(false); // Set the state to register
      navigation.navigate('Register'); // Navigate to Register
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Logo and clickable FutureProof title */}
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/logo.png')} // Replace with the path to your logo
          style={styles.logo}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.headerTitle}>FutureProof</Text>
        </TouchableOpacity>
      </View>

      {/* Centered navigation links */}
      <View style={styles.navLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navLinkText}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navLinkText}>Features</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navLinkText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle for Login and Register */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleBackground}>
          {/* Handle the toggle click */}
          <TouchableOpacity
            style={[styles.toggleCircle, isLogin ? styles.circleLeft : styles.circleRight]}
            onPress={() => handleTogglePress(isLogin ? 'Register' : 'Login')} // Toggle logic
          />
          <View style={styles.toggleTextContainer}>
            <Text style={[styles.toggleText, isLogin && styles.activeText]} onPress={() => handleTogglePress('Login')}>Login</Text>
            <Text style={[styles.toggleText, !isLogin && styles.activeText]} onPress={() => handleTogglePress('Register')}>Register</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          header: ({ navigation }) => <CustomHeader navigation={navigation} />,
        }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3B32', // Dark green background
    padding: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50, // Adjust size to fit your design
    height: 40,
    marginRight: 8, // Space between logo and title
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F5F5F5',
  },
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'center', // Center navigation links
    flex: 1, // Take up the remaining space between logo and buttons
  },
  navLinkText: {
    fontSize: 18,
    color: '#F5F5F5',
    marginHorizontal: 16, // Space between links
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBackground: {
    width: 143, // Increased width to fit the text inside the toggle
    height: 40,
    borderRadius: 20, // Fully rounded edges
    backgroundColor: '#E0E0E0', // Light gray background
    position: 'relative',
    marginRight: 8,
    justifyContent: 'center', // Center the text vertically inside the background
  },
  toggleCircle: {
    width: 72,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
    backgroundColor: '#c1ff72', // Light green
    top: 2,
  },
  circleLeft: {
    left: 2, // Positioned on the left for Login
  },
  circleRight: {
    left: 70, // Positioned on the right for Register
  },
  toggleTextContainer: {
    position: 'absolute',
    top: 8, // Center text vertically
    left: 12, // Move the text right for better alignment
    right: 5, // Space for both texts
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1, // Ensure the text is in front of the toggle
  },
  toggleText: {
    fontSize: 16,
    color: '#1A3B32', // Dark green text
    fontWeight: '600',
  },
  activeText: {
    color: '#1A3B32', // Light green when active
  },
});
