import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Home from './Components/Home';
import Contacts from './Components/Contacts';
import Features from './Components/Features';
import About from './Components/About';
import Login from './Components/Login';
import Register from './Components/Register';

const Stack = createStackNavigator();

function CustomHeader({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // Track whether it's Login or Register

  const handleTogglePress = (targetPage) => {
    if (targetPage === 'Login') {
      setIsLogin(true);
      navigation.navigate('Login');
    } else {
      setIsLogin(false);
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView style={styles.headerContainer} edges={['top']}>
      <View style={styles.logoContainer}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.headerTitle}>FutureProof</Text>
        </TouchableOpacity>
      </View>

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

      <View style={styles.toggleContainer}>
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
          showsVerticalScrollIndicator={true}
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
              <Stack.Screen name="Register" component={Register} />
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3B32',
    padding: 16,
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
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  navLinkText: {
    fontSize: 18,
    color: '#F5F5F5',
    marginHorizontal: 16,
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
});

