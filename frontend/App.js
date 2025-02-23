import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { ScrollView, Platform, Dimensions } from 'react-native';
import Home from './Components/Home';
import Contacts from './Components/Contacts';
import Features from './Components/Features';
import About from './Components/About';
import Login from './Components/Login';
import Logout from './Components/Logout';
import Register from './Components/Register';
import Prediction from './Components/Prediction';
import Navbar from './Navbar/Navbar';
import Toast from 'react-native-toast-message';
import Game from './Components/Game';
import Profile from './Components/Profile';
import Admin from './Pages/Admin';
import AvatarCRUD from './Pages/AvatarCRUD';
import DailyRewardsCRUD from './Pages/DailyRewardsCRUD';
import Shop from './Components/Shop';
import DailyRewards from './Components/DailyRewards';
import TaskModal from './Components/TaskModal';

const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView 
          style={{ backgroundColor: 'white', width: width, height: Platform.OS === 'web' ? '100vh' : height }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === 'web' ? false : true}
        >
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false, // Disable the header to use the Navbar from Home.js
              }}
            >
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="About" component={About} />
              <Stack.Screen name="Contacts" component={Contacts} />
              <Stack.Screen name="Features" component={Features} />
              <Stack.Screen name="Prediction" component={Prediction} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Game" component={Game} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Logout" component={Logout} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Admin" component={Admin} />
              <Stack.Screen name="AvatarCRUD" component={AvatarCRUD} />
              <Stack.Screen name="DailyRewardsCRUD" component={DailyRewardsCRUD} />
              <Stack.Screen name="Shop" component={Shop} />
              <Stack.Screen name="DailyRewards" component={DailyRewards} />
              <Stack.Screen name="TaskModal" component={TaskModal} />
            </Stack.Navigator>
          </NavigationContainer>
        </ScrollView>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
