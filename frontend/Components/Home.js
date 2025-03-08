import React, { useRef, Suspense, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Image, Modal, Platform, TouchableWithoutFeedback, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from 'react-native-vector-icons';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigationState } from '@react-navigation/native';
import { getUser } from '../API/user_api';
import { getAvatar } from '../API/avatar_api';
import GameNavbar from '../Navbar/GameNavbar';
import Features from './Features';
import About from './About';
import Contacts from './Contacts';
import UserDashboard from './userDashboard';

// Reusable Model Component with Color
function Model({ scale, uri, position, color }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);

  if (color) {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color) });
      }
    });
  }

  return <primitive object={scene} />;
}

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const Home = ({ navigation }) => {
  const scrollViewRef = useRef();
  const aboutRef = useRef();
  const featuresRef = useRef();
  const contactRef = useRef();

  const scrollToSection = (section) => {
    let offset = 0;
    switch (section) {
      case 'about':
        offset = aboutRef.current?.offsetTop || 0;
        break;
      case 'features':
        offset = featuresRef.current?.offsetTop || 0;
        break;
      case 'contact':
        offset = contactRef.current?.offsetTop || 0;
        break;
      default:
        offset = 0;
    }
    scrollViewRef.current.scrollTo({
      y: offset,
      animated: true,
    });
  };

  const modelScale = { x: 3, y: 3, z: 3 };
  const modelPosition = { x: 0, y: 0.5, z: 0 };

  // Add these state variables inside your Home component
  const [cardScales] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]);

  // Add this state near your other state declarations in the Home component
  const [activeCardIndex, setActiveCardIndex] = useState(null);

  // Modify the animateCard function
  const animateCard = (index) => {
    setActiveCardIndex(index); // Set active card
    Animated.sequence([
      Animated.spring(cardScales[index], {
        toValue: 1.1,
        useNativeDriver: true,
        friction: 3,
        tension: 40
      }),
      Animated.spring(cardScales[index], {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40
      })
    ]).start(() => {
      // Reset active card after animation
      setTimeout(() => setActiveCardIndex(null), 300);
    });
  };

  // Navbar component
  const Navbar = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [tokenExpiredModalVisible, setTokenExpiredModalVisible] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    const currentRoute = useNavigationState(state => state.routes[state.index].name);

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            console.error('No token found');
            return;
          }
          const userData = await getUser(token);
          setUserRole(userData.role);
          setIsLoggedIn(true);
          if (userData.default_avatar) {
            const avatarResponse = await getAvatar(userData.default_avatar);
            setAvatarUrl(avatarResponse.url);
            console.log('Avatar URL:', avatarResponse.url); // Debug log
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }, []);

    const handleLogoutPress = async () => {
      setModalVisible(true);
    };

    const handleLogout = async () => {
      try {
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
        Toast.show({
          type: 'success',
          text1: 'Logged out successfully!',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 30 : 60,
        });
        setModalVisible(false);
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

    const handleTokenExpiredLogout = async () => {
      try {
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
        setTokenExpiredModalVisible(false);
        navigation.navigate('Login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    const handleProfileNavigation = (destination) => {
      navigation.navigate(destination);
      setProfileModalVisible(false);
    };

    if (currentRoute === 'Game') {
      return <GameNavbar />;
    }

    // Desktop Navigation
    const renderDesktopNav = () => (
      <View style={styles.navLinksContainer}>
        <LinearGradient colors={['#77f3bb']} style={styles.navLinks}>
          <TouchableOpacity onPress={() => scrollToSection('about')}>
            <Text style={styles.navLinkText}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection('features')}>
            <Text style={styles.navLinkText}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection('contact')}>
            <Text style={styles.navLinkText}>Contact Us</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.toggleContainer}>
          {isLoggedIn ? (
            <View style={styles.profileContainer}>
              <TouchableOpacity onPress={() => setProfileModalVisible(true)}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <FontAwesome name="user" size={24} color="#f0fdf7" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segmentButton, isLogin && styles.activeSegment]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.segmentText, isLogin && styles.activeSegmentText]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, !isLogin && styles.activeSegment]}
                onPress={() => navigation.navigate('Register')}
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
      <View style={styles.mobileNavContainer}>
        <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)} style={styles.hamburgerButton}>
          <Icon name="bars" size={24} color="#f0fdf7" />
        </TouchableOpacity>

        {isLoggedIn && (
          <TouchableOpacity
            style={styles.profileIconMobile}
            onPress={() => setProfileModalVisible(true)}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <FontAwesome name="user" size={24} color="#f0fdf7" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <TouchableOpacity onPress={() => scrollToSection('home')}>
            <Text style={styles.headerTitle}>FutureProof</Text>
          </TouchableOpacity>
        </View>

        {isMobile ? renderMobileNav() : renderDesktopNav()}

        {/* Profile Modal */}
        <Modal visible={profileModalVisible} transparent={true} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.profilemodalContent}>
                {userRole === 'admin' && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleProfileNavigation('Admin')}
                  >
                    <Icon name="cogs" size={20} color="#f0fdf7" />
                    <Text style={styles.dropdownText}>Admin</Text>
                  </TouchableOpacity>
                )}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleProfileNavigation('UserDashboard')}
                  >
                    <Icon name="dashboard" size={20} color="#f0fdf7" />
                    <Text style={styles.dropdownText}>Dashboard</Text>
                  </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    navigation.navigate('Game');
                    setProfileModalVisible(false);
                  }}
                >
                  <Icon name="gamepad" size={20} color="#f0fdf7" />
                  <Text style={styles.dropdownText}>Game</Text>
                </TouchableOpacity>
               
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleLogoutPress();
                    setProfileModalVisible(false);
                  }}
                >
                  <Icon name="sign-out" size={20} color="#f0fdf7" />
                  <Text style={styles.dropdownText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

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

        {/* Token Expired Popup */}
        <Modal visible={tokenExpiredModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Your session has expired. Please log in again.</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleTokenExpiredLogout}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <Navbar navigation={navigation} />
      <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.scrollViewContent, { minHeight: height }]} showsVerticalScrollIndicator={false}>
        {/* Home Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Gamifying Wellness: Track, Assess, and Thrive Every Day</Text>
            <Text style={styles.subtitle}>
              FutureProof uses AI to provide predictive health insights and preventive wellness solutions, helping you stay ahead of potential health risks and optimize your well-being.
            </Text>
            <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('UserDashboard')}>
              <Text style={styles.joinButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* 3D Model */}
          <View style={styles.sceneContainer}>
            <Canvas camera={{ position: [50, 0, 0] }}>
              <ambientLight intensity={2} />
              <pointLight position={[0, 5, 10]} />
              <Suspense fallback={null}>
                <Model scale={modelScale} uri={Asset.fromModule(require('../assets/a.glb')).uri} position={modelPosition} />
              </Suspense>
              <OrbitControls
                enableDamping
                maxPolarAngle={Math.PI / 1.5}
                minDistance={3}
                maxDistance={3}
              />
            </Canvas>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section} ref={featuresRef}>
          <View style={styles.features}>
            {/* Feature 1 */}
            <View style={styles.featureBox}>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Gamified</Text>
                <Text style={styles.featureDescription}>
                  Engage in a fun, interactive experience that turns health goals into rewarding challenges, making wellness enjoyable and motivating.
                </Text>
              </View>
              <Image source={require('../assets/gamified.gif')} style={styles.featureImage} />
            </View>

            {/* Feature 2 */}
            <View style={styles.featureBox}>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Nutritional Tracking</Text>
                <Text style={styles.featureDescription}>
                  Easily track your daily food intake and gain valuable insights into your nutrition to help you make healthier choices.
                </Text>
              </View>
              <Image source={require('../assets/nutrition.gif')} style={styles.featureImage} />
            </View>

            {/* Feature 3 */}
            <View style={styles.featureBox}>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Daily Assessment</Text>
                <Text style={styles.featureDescription}>
                  Receive personalized daily assessments to monitor your progress, identify health trends, and optimize your wellness journey.
                </Text>
              </View>
              <Image source={require('../assets/assessment.gif')} style={styles.featureImage} />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section} ref={aboutRef}>
          <About />
        </View>

        {/* Another Features Section */}
        <View style={styles.section} ref={featuresRef}>
          <Features />
        </View>

        {/* Contact Section */}
        <View style={styles.section} ref={contactRef}>
          <Contacts />
        </View>




        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            
            The Minds behind FutureProof</Text>
          <View style={styles.teamContainer}>
            <Animated.View style={[styles.teamMemberCard, activeCardIndex === 0 && styles.activeTeamCard, { transform: [{ scale: cardScales[0] }] }]}>
              <TouchableOpacity onPress={() => animateCard(0)}>
              <View style={styles.imageWrapper}>
  <Image 
    source={require('../assets/member/team1.jpg')} 
    style={styles.teamMemberImage} 
  />
  <TouchableOpacity style={styles.overlay} activeOpacity={0.8}>
    <Text style={styles.overlayText}>Backend Development</Text>
  </TouchableOpacity>

                </View>
                <Text style={[styles.teamMemberName, activeCardIndex === 0 && styles.activeText]}>
                  Rene Cian Baloloy
                </Text>
                <Text style={[styles.teamMemberRole, activeCardIndex === 0 && styles.activeText]}>
                  Backend Developer
                </Text>
                <View style={styles.socialLinks}>
              
     
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.teamMemberCard, activeCardIndex === 1 && styles.activeTeamCard, { transform: [{ scale: cardScales[1] }] }]}>
              <TouchableOpacity onPress={() => animateCard(1)}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={require('../assets/member/team2.jpg')} 
                    style={styles.teamMemberImage} 
                  />
                 <TouchableOpacity style={styles.overlay} activeOpacity={0.8}>
                    <Text style={styles.overlayText}>UI/UX Design</Text>
                    </TouchableOpacity>
                  </View>
   
                <Text style={[styles.teamMemberName, activeCardIndex === 1 && styles.activeText]}>
                  Rean Joy Cicat
                </Text>
                <Text style={[styles.teamMemberRole, activeCardIndex === 1 && styles.activeText]}>
                  UI/UX Designer
                </Text>
                <View style={styles.socialLinks}>
             
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.teamMemberCard, activeCardIndex === 2 && styles.activeTeamCard, { transform: [{ scale: cardScales[2] }] }]}>
              <TouchableOpacity onPress={() => animateCard(2)}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={require('../assets/member/team3.png')} 
                    style={styles.teamMemberImage} 
                  />
             <TouchableOpacity style={styles.overlay} activeOpacity={0.8}>
                    <Text style={styles.overlayText}>Frontend Development</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.teamMemberName, activeCardIndex === 2 && styles.activeText]}>
                  Mark Al Bartolome
                </Text>
                <Text style={[styles.teamMemberRole, activeCardIndex === 2 && styles.activeText]}>
                  Frontend Developer
                </Text>
                <View style={styles.socialLinks}>
                
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.teamMemberCard, activeCardIndex === 3 && styles.activeTeamCard, { transform: [{ scale: cardScales[3] }] }]}>
              <TouchableOpacity onPress={() => animateCard(3)}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={require('../assets/member/team4.jpg')} 
                    style={styles.teamMemberImage} 
                  />
                <TouchableOpacity style={styles.overlay} activeOpacity={0.8}>
                    <Text style={styles.overlayText}>Full Stack Development</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.teamMemberName, activeCardIndex === 3 && styles.activeText]}>
                  Daniel Davis
                </Text>
                <Text style={[styles.teamMemberRole, activeCardIndex === 3 && styles.activeText]}>
                  Full Stack Developer
                </Text>
                <View style={styles.socialLinks}>
                
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
       
        {/* Footer Section */}
<View style={styles.footer}>
  <View style={styles.footerContent}>
    <View style={styles.footerSection}>
      <Image source={require('../assets/logo.png')} style={styles.footerLogo} />
      <Text style={styles.footerTitle}>FutureProof</Text>
      <Text style={styles.footerText}>
      Embrace the Bear Within—Strong, Resilient, Future-Ready
      </Text>
    </View>
    <View style={styles.footerLinksContainer}>
      <View style={styles.footerColumn}>
        <View style={styles.footerLinkSection}>
          <Text style={styles.footerLinkTitle}>Quick Links</Text>
          <TouchableOpacity onPress={() => scrollToSection('about')}>
            <Text style={styles.footerLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection('features')}>
            <Text style={styles.footerLink}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection('contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
          <Text style={[styles.footerLinkTitle, { marginTop: 30 }]}>Technologies we Used</Text>
          <View style={styles.techLogos}>
            <Image source={require('../assets/tech/1.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/2.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/3.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/4.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/5.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/6.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/7.png')} style={styles.techLogo} />
            <Image source={require('../assets/tech/8.png')} style={styles.techLogo} />
          </View>
        </View>
      </View>
      <View style={styles.footerLinkSection}>
        <Text style={styles.footerLinkTitle}>Connect</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}onPress={() => Linking.openURL('https://github.com/thenielthevis/FutureProof')}>GitHub</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink} onPress={() => Linking.openURL('mailto:davmarrearen@gmail.com')}>Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
  
  {/* Move footerBottom outside of footerContent */}
  <View style={[styles.footerBottom, { marginTop: 'auto' }]}>
    <Text style={styles.copyright}>
      © {new Date().getFullYear()} FutureProof. All rights reserved.
    </Text>
    <View style={styles.footerSocial}>
      <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://github.com/thenielthevis/FutureProof')}>
        <Icon name="github" size={20} color="#ffffff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('mailto:davmarrearen@gmail.com')}>
        <Icon name="envelope" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  </View>
</View>
   


      </ScrollView>

      
    </LinearGradient>
    
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: isMobile ? 20 : 40,
    paddingBottom: 0,
    paddingLeft: 0, // Remove left padding
    paddingRight: 0, // Remove right padding
  },
  section: {
    marginBottom: 40,
    paddingHorizontal: 20, // Add horizontal padding to sections
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: isMobile ? 0 : 40,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  title: {
    fontSize: isMobile ? 28 : 48,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: isMobile ? 'center' : 'left',
    lineHeight: isMobile ? 34 : 56,
  },
  subtitle: {
    fontSize: isMobile ? 16 : 20,
    color: '#ffffff',
    marginBottom: 32,
    textAlign: 'justify',
    lineHeight: 24,
    paddingHorizontal: isMobile ? 10 : 0,
  },
  joinButton: {
    backgroundColor: '#388E3C',
    height: 50,
    width: isMobile ? '100%' : 240,
    maxWidth: 400,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 15,
  },
  joinButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: isMobile ? 18 : 20,
  },
  sceneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? width * 0.9 : width * 0.7, // Increased width for larger model
    height: isMobile ? 300 : 500, // Increased height for larger model
    borderRadius: 20,
    marginVertical: isMobile ? 10 : 0,
  },
  headerGif: {
    width: isMobile ? width * 0.9 : width * 0.5,
    height: isMobile ? 220 : 400,
    borderRadius: 20,
    marginVertical: isMobile ? 10 : 0,
  },
  features: {
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  featureBox: {
    flex: isMobile ? 0 : 1,
    width: isMobile ? '100%' : '30%',
    minWidth: 300,
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 30,
    borderColor: '#1B5E20',
    borderWidth: 3,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  featureContent: {
    width: '100%',
    marginBottom: 20,
  },
  featureImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  featureTitle: {
    fontSize: isMobile ? 22 : 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: isMobile ? 15 : 16,
    textAlign: 'justify',
    color: '#ffffff',
    lineHeight: 22,
  },
  aboutSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  valuesSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  valuesContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    width: isMobile ? '80%' : '30%',
    alignItems: 'center',
    borderColor: '#2E7D32',
    borderWidth: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    marginBottom: 20,
  },
  valueTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  valueDescription: {
    fontSize: isMobile ? 14 : 18,
    color: '#388E3C',
    textAlign: 'justify',
    lineHeight: 20,
  },
  contactSection: {
    padding: 40,
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  contactButtonText: {
    fontSize: isMobile ? 18 : 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  detailsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  detailsSection: {
    width: '60%',
  },
  detailBox: {
    backgroundColor: '#75f2b9',
    padding: 15,
    marginBottom: 20,
    marginLeft: 35,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    borderRadius: 5,
    borderWidth: 0,
  },
  icon: {
    marginRight: 15,
    fontSize: 40,
  },
  detailTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'left',
  },
  detailText: {
    fontSize: 20,
    color: '#4CAF50',
    textAlign: 'left',
  },
  contactImage: {
    width: '30%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: isMobile ? 20 : 50,
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    opacity: 0.5,
    position: 'absolute',
  },
  featuresContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 1,
    marginBottom: isMobile ? 30 : 1,
    width: isMobile ? '100%' : '70%',
  },
  mobileFeatureRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternateRow: {
    flexDirection: isMobile ? 'column' : 'row-reverse',
  },
  dailyAssessmentRow: {
    justifyContent: isMobile ? 'center' : 'flex-end',
  },
  textContainer: {
    flex: 1,
    marginLeft: isMobile ? 0 : 10,
    marginRight: isMobile ? 0 : 10,
    marginBottom: isMobile ? 20 : 0,
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    width: isMobile ? 120 : 200,
    height: isMobile ? 120 : 200,
    borderWidth: 5,
    borderColor: '#388E3C',
    padding: 5,
  },
  featureTitle: {
    fontSize: isMobile ? 24 : 50,
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: isMobile ? 14 : 20,
    color: '#388E3C',
    textAlign: 'justify',
    padding: 16,
  },
  separator: {
    height: 2,
    backgroundColor: '#388E3C',
    width: '80%',
    marginVertical: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f0fdf7',
  },
  navLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLinks: {
    flexDirection: 'row',
    marginRight: 20,
  },
  navLinkText: {
    fontSize: 20,
    color: '#f0fdf7',
    marginHorizontal: 10,
    fontWeight: '600'
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f0fdf7',
    borderRadius: 5,
  },
  segmentButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  activeSegment: {
    backgroundColor: '#f0fdf7',
  },
  segmentText: {
    fontSize: 16,
    color: '#f0fdf7',
  },
  activeSegmentText: {
    color: '#14243b',
  },
  iconButton: {
    marginHorizontal: 10,
  },
  logoutButton: {
    backgroundColor: '#f00',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 20,
    color: '#ffffff',
  },
  hamburgerButton: {
    padding: 10,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#14243b',
    borderRadius: 5,
    margin: 10,
    padding: 10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    height: 100,
    width: 100,
  },
  dropdownMenuItem: {
    fontSize: 24,
    color: '#f0fdf7',
    fontWeight: '600',
    borderColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    width: 100,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '25%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profilemodalContent: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#14243b',
    borderRadius: 10, // Increased border radius
    padding: 15, // Increased padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(25, 47, 66, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  profileContainer: {
    position: 'relative',
     // Ensure the profile container is on top
      },
      profileDropdown: {
        position: 'absolute',
        bottom: 50, // Lowered the absolute position
        right: 0,
        backgroundColor: '#14243b',
        borderRadius: 10, // Increased border radius
        padding: 15, // Increased padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      },
      dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Increased padding
    paddingHorizontal: 15, // Increased padding
  },
  dropdownText: {
    color: '#ffffff',
    marginLeft: 10, // Increased margin
    fontSize: 18, // Increased font size
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: '#ffffff',
    borderWidth: 2,
    
  },
  mobileNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  profileIconMobile: {
    marginRight: 10,
  },
  profileDropdownMobile: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#14243b',
    borderRadius: 5,
    padding: 10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: isMobile ? 40 : 60,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  
  },

  teamContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 20,
  },
  teamMemberCard: {
    
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: isMobile ? '100%' : 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ translateY: 0 }],
    transition: 'transform 0.3s ease',
    '&:hover': {
      '& .overlay': {
        opacity: 1, // Show on hover
      }
    }
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 100, // Make it perfectly circular
    width: 200, // Match the image width
    height: 200, // Match the image height
    borderWidth: 4, // Add thick border
    borderColor: '#388E3C', // Green border color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  teamMemberImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100, // Make image circular to match wrapper
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 36, 59, 0.7)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0, // Start invisible
    transition: '0.3s ease',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  teamMemberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14243b',
    marginBottom: 5,
    textAlign: 'center', // Add this line
    width: '100%', // Add this line
  },
  teamMemberRole: {
    fontSize: 16,
    color: '#388E3C',
    marginBottom: 15,
    textAlign: 'center', // Add this line
    width: '100%', // Add this line
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the social buttons
    alignItems: 'center',
    width: '100%',
    gap: 15,
    marginTop: 10,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeTeamCard: {
    backgroundColor: '#1B5E20', // Dark green background when active
  },
  activeText: {
    color: '#ffffff', // White text for active card
  },

  // Add to your StyleSheet
  techLogosContainer: {
    marginTop: 20,
    width: isMobile ? '100%' : '30%', // Match footerSection width
    alignItems: 'flex-start', // Align content to the left like footerSection
    paddingHorizontal: 20,
  },
  
  techLogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Align to the left
    gap: 15,
    marginTop: 15,
  },
  techLogo: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    opacity: 0.8,
  },
  
  footer: {
    backgroundColor: 'rgba(25, 47,66, 0.50)',
    paddingTop: 40,
    paddingBottom: 0, // Remove bottom padding
    marginTop: 40,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    marginBottom: -40,
    marginHorizontal: -40,
    alignSelf: 'stretch',
    width: '105vw',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 300,
  },
  
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional: slightly darker background
    marginTop: 'auto', // Push to bottom
  },
  
  footerContent: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  footerSection: {
    maxWidth: isMobile ? '100%' : '30%',
    marginBottom: isMobile ? 30 : 0,
  },
  footerLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 20,
  },
  footerLinksContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 40,
  },
  footerLinkSection: {
    marginBottom: isMobile ? 20 : 0,
  },
  footerLinkTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 10,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional: slightly darker background
    marginTop: 'auto', // Push to bottom
  },
  copyright: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: isMobile ? 15 : 5,
  },
  footerSocial: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the icons
    width: '100%', // Take full width
    gap: 40, // Increase gap between social icons
  },
  
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerColumn: {
    flex: 1,
  },
});

export default Home;