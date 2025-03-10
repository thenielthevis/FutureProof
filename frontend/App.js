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
import Register from './Components/Register';
import Prediction from './Components/Prediction';
import Navbar from './Navbar/Navbar';
import Toast from 'react-native-toast-message';
import Game from './Components/Game';
import Profile from './Components/Profile';
import Admin from './Pages/Admin';
import AvatarCRUD from './Pages/AvatarCRUD';
import DailyRewardsCRUD from './Pages/DailyRewardsCRUD';
import AchievementsCRUD from './Pages/AchievementsCRUD';
import Assessments from './Pages/Assessments';
import Shop from './Components/Shop';
import DailyRewards from './Components/DailyRewards';
import TaskModal from './Components/TaskModal';
import AssetsCRUD from './Pages/AssetsCRUD';
import QuotesCRUD from './Pages/QuotesCRUD';
import { UserStatusProvider } from './Context/UserStatusContext';
import { UserLevelProvider } from './Context/UserLevelContext'; // Import the UserLevelProvider
import PhysicalActivitiesCRUD from './Pages/PhysicalActivitiesCRUD';
import MeditationCRUD from './Pages/MeditationCRUD';
import UserDashboard from './Components/userDashboard';
import BMIGame from './Components/Game/BMIGame';
import UsersManagement from './Pages/UsersManagement';
import MainMenu from './Components/Game/MainMenu';
import UnderweightGame from './Components/Game/UnderweightGame';
import NormalGame from './Components/Game/NormalGame';
import OverweightGame from './Components/Game/OverweightGame';
import ObeseGame from './Components/Game/ObeseGame';

const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

export default function App() {
  return (
    <UserLevelProvider>
      <UserStatusProvider>
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
                  <Stack.Screen name="Register" component={Register} />
                  <Stack.Screen name="Admin" component={Admin} />
                  <Stack.Screen name="AvatarCRUD" component={AvatarCRUD} />
                  <Stack.Screen name="DailyRewardsCRUD" component={DailyRewardsCRUD} />
                  <Stack.Screen name="AchievementsCRUD" component={AchievementsCRUD} />
                  <Stack.Screen name="Assessments" component={Assessments} />
                  <Stack.Screen name="Shop" component={Shop} />
                  <Stack.Screen name="DailyRewards" component={DailyRewards} />
                  <Stack.Screen name="TaskModal" component={TaskModal} />
                  <Stack.Screen name="AssetsCRUD" component={AssetsCRUD} />
                  <Stack.Screen name="QuotesCRUD" component={QuotesCRUD} />
                  <Stack.Screen name="PhysicalActivitiesCRUD" component={PhysicalActivitiesCRUD} />
                  <Stack.Screen name="MeditationCRUD" component={MeditationCRUD} />
                  <Stack.Screen name="UserDashboard" component={UserDashboard} />
                  <Stack.Screen name="BMIGame" component={BMIGame} />
                  <Stack.Screen name="UsersManagement" component={UsersManagement} />
                  <Stack.Screen name="MainMenu" component={MainMenu} options={{ headerShown: false }} />
                  <Stack.Screen name="UnderweightGame" component={UnderweightGame} />
                  <Stack.Screen name="NormalGame" component={NormalGame} />
                  <Stack.Screen name="OverweightGame" component={OverweightGame} />
                  <Stack.Screen name="ObeseGame" component={ObeseGame} />
                </Stack.Navigator>
              </NavigationContainer>
            </ScrollView>
            <Toast />
          </SafeAreaView>
        </SafeAreaProvider>
      </UserStatusProvider>
    </UserLevelProvider>
  );
}
