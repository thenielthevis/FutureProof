import React, { useState, useEffect, Suspense, useRef, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';
import GameNavbar from '../../Navbar/GameNavbar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatusContext } from '../../Context/UserStatusContext';
import { UserLevelContext } from '../../Context/UserLevelContext';
import { createTaskCompletion } from '../../API/task_completion_api';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

// Reusable Model Component with Color
function Model({ scale, uri, position, rotation, color }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);

  if (color) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.color.set(color);
      }
    });
  }

  return <primitive object={scene} />;
}

// Update obstacle assets array with Cloudinary URLs
const OBSTACLE_ASSETS = [
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332946/1_rfy5gy.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332938/2_utctlo.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332936/3_l6uct8.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332935/4_k2le01.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332937/5_s4iqyz.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332947/6_sfezyt.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332945/7_cg9uw6.glb',
  'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1741332944/8_xxkuzg.glb'
];

// Add this before the Obstacle component
const obstacleCounter = { current: 0 };

// Replace the existing Obstacle component with this version
function Obstacle({ position }) {
  // Use useRef to maintain a stable asset index for this obstacle instance
  const assetIndex = useRef(obstacleCounter.current % OBSTACLE_ASSETS.length);
  
  // Increment the counter only once when the component is created
  useEffect(() => {
    obstacleCounter.current += 1;
  }, []);
  
  const { scene } = useGLTF(OBSTACLE_ASSETS[assetIndex.current]);
  
  return (
    <primitive 
      object={scene} 
      position={[position.x, position.y, position.z]}
      scale={[8, 8, 8]}  // Increased from [2, 2, 2] to [4, 4, 4]
      rotation={[0, 5, 0]}  // Changed from [0, Math.PI, 0] to [0, 0, 0] to face front
    />
  );
}

// Add preloader for all models
function ModelPreloader() {
  OBSTACLE_ASSETS.forEach(url => useGLTF.preload(url));
  useGLTF.preload('https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb');
  useGLTF.preload('https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb');
  useGLTF.preload('https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb');
  useGLTF.preload('https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb');
  return null;
}

export default function NormalGame() {
  const navigation = useNavigation(); // Add this at the top level
  const [equippedAssets, setEquippedAssets] = useState({});
  const [currentLane, setCurrentLane] = useState(1); // 0: left, 1: center, 2: right
  const [transitioning, setTransitioning] = useState(false); // We'll keep this but won't use delay
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1); // Add level state
  const [ballSpeed, setBallSpeed] = useState(0.2); // Add ball speed state
  const animationFrameId = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [xpReward] = useState(10);
  const [coinsReward] = useState(50);
  const [baseCoinsReward] = useState(10); // Base coins per level
  const [totalCoins, setTotalCoins] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);
  const [currentCoinsReward, setCurrentCoinsReward] = useState(10); // Display coins in header
  const { updateBattery } = useContext(UserStatusContext);
  const { addXP } = useContext(UserLevelContext);
  const [gameStartTime] = useState(new Date());
  const [sound, setSound] = useState();
  
  // Add sound effect functions
  const playLevelUpSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound-effects/menu-select.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing level up sound:', error);
    }
  };

  const playSuccessSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound-effects/menu-select.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const playGameOverSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound-effects/try-again.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing game over sound:', error);
    }
  };

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    const fetchEquippedAssets = async () => {
      try {
        const assets = await getEquippedAssets();
        setEquippedAssets(assets);
        
        // Preload equipped asset models
        await Promise.all(
          Object.values(assets).map(asset => 
            new Promise(resolve => {
              useGLTF.preload(asset.url);
              resolve();
            })
          )
        );
        
        setAssetsLoaded(true);
        setTimeout(() => setIsLoading(false), 2000); // Give extra time for models to process
      } catch (error) {
        console.error('Error fetching equipped assets:', error);
        setIsLoading(false);
      }
    };

    fetchEquippedAssets();
  }, []);

  const LANE_POSITIONS = {
    0: -7, // Moved left lane further left
    1: 0,  // Center lane
    2: 7,  // Moved right lane further right
  };

  const handleLaneChange = (direction) => {
    const newLane = Math.max(0, Math.min(2, currentLane + direction));
    if (newLane !== currentLane) {
      setCurrentLane(newLane);
    }
  };

  // Improved key event handling
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key.toLowerCase()) { // Convert to lowercase to handle both cases
        case 'arrowleft':
        case 'a':
          if (currentLane > 0) {
            handleLaneChange(-1);
          }
          break;
        case 'arrowright':
        case 'd':
          if (currentLane < 2) {
            handleLaneChange(1);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLane]); // Remove transitioning from dependencies

  const modelScale = { x: 2.5, y: 2.5, z: 2.5 };
  const modelPosition = { 
    x: LANE_POSITIONS[currentLane],
    y: -5, 
    z: 9  // Model's z-position is 9
  };
  const modelRotation = [0, Math.PI, 0];

  // Modify circle spawning logic to be truly endless
  useEffect(() => {
    if (gameOver) return;
    
    const spawnCircle = () => {
      const lane = Math.floor(Math.random() * 3);
      const newCircle = {
        id: Date.now(),
        position: { x: LANE_POSITIONS[lane], y: 0, z: -20 },
        lane
      };
      setCircles(prev => [...prev, newCircle]);
    };

    const spawnInterval = setInterval(spawnCircle, Math.max(2000 - (level * 50), 400));
    return () => clearInterval(spawnInterval);
  }, [gameOver]);

  // Optimize game loop with better collision detection
  useEffect(() => {
    let frameId;
    let isActive = true;

    const updateGame = () => {
      if (!isActive || gameOver) return;

      setCircles(prevCircles => {
        const updatedCircles = prevCircles
          .map(circle => ({
            ...circle,
            position: {
              ...circle.position,
              z: circle.position.z + ballSpeed
            }
          }))
          .filter(circle => {
            // Only check for collision in a smaller range for more precise detection
            const isCollision = 
              circle.position.z >= 8.5 && 
              circle.position.z <= 9.5 && 
              circle.lane === currentLane;

            if (isCollision) {
              handleGameOver();
              return false;
            }

            // Keep circles that haven't gone too far past the player
            return circle.position.z < 20;
          });

        // Score only increases when obstacles are passed safely
        const passedObstacles = prevCircles.filter(circle => 
          circle.position.z > 10 && 
          !updatedCircles.find(uc => uc.id === circle.id)
        ).length;

        if (passedObstacles > 0) {
          setScore(prev => {
            const newScore = prev + passedObstacles;
            if (newScore % 10 === 0) {
              setLevel(l => l + 1);
              setBallSpeed(speed => Math.min(speed + 0.05, 1.0));
            }
            return newScore;
          });
        }

        return updatedCircles;
      });

      frameId = requestAnimationFrame(updateGame);
    };

    frameId = requestAnimationFrame(updateGame);

    return () => {
      isActive = false;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [currentLane, gameOver]);

  // Add game over cleanup
  useEffect(() => {
    if (gameOver) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, [gameOver]);

  // Modify restart logic in Game Over overlay
  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setCircles([]);
    setCurrentLane(1);
    setLevel(1);
    setBallSpeed(0.2);
    obstacleCounter.current = 0; // Reset the counter
  };

  const handleRestartGame = async () => {
    try {
      handleRestart();
      setShowSettings(false);
    } catch (error) {
      console.error('Error restarting game:', error);
    }
  };

  const handleBackToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainMenu' }],
    });
  };

  const handleQuit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Game' }],
    });
  };

  // Add handleGameOver function
  const handleGameOver = () => {
    setGameOver(true);
    // Stop any ongoing game processes
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setCircles([]); // Clear circles
    // Calculate final rewards
    const finalCoins = totalCoins; // Coins accumulated during gameplay
    setTotalCoins(finalCoins);
    playGameOverSound();
  };

  // Modify the game loop with proper collision handling
  useEffect(() => {
    let frameId;
    let isActive = true;

    const updateGame = () => {
      if (!isActive || gameOver) return;

      setCircles(prevCircles => {
        const updatedCircles = prevCircles
          .map(circle => ({
            ...circle,
            position: {
              ...circle.position,
              z: circle.position.z + ballSpeed
            }
          }))
          .filter(circle => {
            // Improved collision detection with better range
            const isInCollisionRange = 
              circle.position.z >= 8.5 && 
              circle.position.z <= 9.5 && 
              circle.lane === currentLane;

            if (isInCollisionRange && !gameOver) {
              handleGameOver();
              return false;
            }

            // Keep circles that haven't gone too far past the player
            return circle.position.z < 20;
          });

        // Score only increases when obstacles are passed safely
        const passedObstacles = prevCircles.filter(circle => 
          circle.position.z > 10 && 
          !updatedCircles.find(uc => uc.id === circle.id)
        ).length;

        if (passedObstacles > 0) {
          setScore(prev => {
            const newScore = prev + passedObstacles;
            if (newScore % 10 === 0) {
              setLevel(l => l + 1);
              setBallSpeed(speed => Math.min(speed + 0.05, 1.0));
            }
            return newScore;
          });
        }

        return updatedCircles;
      });

      frameId = requestAnimationFrame(updateGame);
      animationFrameId.current = frameId;
    };

    frameId = requestAnimationFrame(updateGame);
    animationFrameId.current = frameId;

    return () => {
      isActive = false;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [currentLane, gameOver, ballSpeed]);

  // Add this after the existing score update logic in updateGame function
  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      // Update coins when leveling up
      setTotalCoins(prev => prev + (baseCoinsReward * level));
    }
  }, [score, level]);

  // Add new reward claiming function
  const handleClaimRewards = async () => {
    try {
      if (!rewardsClaimed) {
        const userId = await AsyncStorage.getItem('userId');
        
        // Use totalCoins instead of currentCoinsReward for the final reward
        const taskCompletionData = {
          user_id: userId,
          task_type: 'normal_game',
          time_spent: Math.floor(getTimeSpent()),
          coins_received: parseInt(totalCoins),  // Use accumulated totalCoins
          xp_received: parseInt(xpReward),
          date_completed: new Date().toISOString()
        };

        // Send task completion first
        await createTaskCompletion(taskCompletionData);
        
        // Then update battery and XP
        await updateBattery(10);
        await addXP(xpReward);
        
        setRewardsClaimed(true);
        await playSuccessSound();
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards. Please try again.');
    }
  };

  // Add function to get time spent
  const getTimeSpent = () => {
    const endTime = new Date();
    return Math.floor((endTime - gameStartTime) / 60000); // Convert to minutes
  };

  // Update coins when level changes
  useEffect(() => {
    setCurrentCoinsReward(baseCoinsReward * level);
  }, [level]);

  // Update the score/level effect to include sound and proper coin tracking
  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      const newLevel = Math.floor(score / 10) + 1;
      setLevel(newLevel);
      setBallSpeed(speed => Math.min(speed + 0.05, 1.0));
      
      // Update total coins (accumulative)
      const levelCoins = baseCoinsReward * newLevel;
      setTotalCoins(prev => prev + levelCoins);
      setCurrentCoinsReward(levelCoins); // Update displayed coins
      
      playLevelUpSound();
    }
  }, [score]);

  if (isLoading) {
    return (
      <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ModelPreloader />
          <Text style={styles.loadingText}>Loading Game Assets...</Text>
          {!assetsLoaded && <Text style={styles.loadingSubText}>Preparing models...</Text>}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      {/* Enhanced Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash" size={20} color="#FFD700" />
              <Text style={styles.statValue}>{currentCoinsReward}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.statValue}>{xpReward}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>Game Settings</Text>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleRestartGame}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.settingsText}>Restart Game</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleBackToMain}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.settingsText}>Back to Main Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleQuit}
            >
              <Ionicons name="exit" size={24} color="#fff" />
              <Text style={styles.settingsText}>Quit Game</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Replace Game Over overlay with Failure Modal */}
      <Modal
        visible={gameOver}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGameOver(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <Text style={styles.failureTitle}>Game Over!</Text>
            <Text style={styles.failureStats}>Final Score: {score}</Text>
            <Text style={styles.failureStats}>Level Reached: {level}</Text>
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Rewards Earned:</Text>
              <Text style={styles.rewardsText}>🌟 {xpReward} XP</Text>
              <Text style={styles.rewardsText}>💰 {currentCoinsReward} Coins</Text>
              <Text style={styles.timeSpentText}>Time: {getTimeSpent()} minutes</Text>
            </View>
            {!rewardsClaimed ? (
              <TouchableOpacity 
                style={styles.claimButton} 
                onPress={handleClaimRewards}
              >
                <Ionicons name="gift" size={24} color="#fff" />
                <Text style={styles.claimButtonText}>Claim Rewards</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.claimedText}>Rewards Claimed!</Text>
                <Text style={styles.chooseOptionText}>Choose your next action:</Text>
              </>
            )}
            <View style={styles.modalDivider} />
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleRestartGame}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.settingsText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsOption} 
              onPress={handleBackToMain}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.settingsText}>Back to Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 15, 25], fov: 50 }}> {/* Adjusted camera position to compensate */}
          <ambientLight intensity={1.0} /> {/* Increased ambient light */}
          <directionalLight position={[0, 10, 5]} intensity={1.5} />
          <spotLight
            position={[0, 20, 0]}
            angle={0.5}
            penumbra={1}
            intensity={0.8}
            castShadow
          />
          
          {/* Floor for better depth perception */}
          <mesh position={[0, -5.1, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 50]} />
            <meshStandardMaterial color="#2a2a2a" /> {/* Darker grey for floor */}
          </mesh>

          {/* Lane markers with improved visibility */}
          {[-7, 0, 7].map((x) => (
            <React.Fragment key={`lane-${x}`}>
              {/* Main lane path */}
              <mesh position={[x, -5, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2, 40]} />
                <meshStandardMaterial color="#e0e0e0" opacity={0.7} transparent /> {/* Light grey-white */}
              </mesh>
              
              {/* Lane borders */}
              <mesh position={[x - 1.5, -5, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 40]} />
                <meshStandardMaterial color="#f5f5f5" opacity={0.9} transparent /> {/* Lighter grey-white */}
              </mesh>
              <mesh position={[x + 1.5, -5, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 40]} />
                <meshStandardMaterial color="#f5f5f5" opacity={0.9} transparent /> {/* Lighter grey-white */}
              </mesh>

              {/* Distance markers */}
              {[-30, -20, -10, 0].map((z) => (
                <mesh key={`marker-${x}-${z}`} position={[x, -4.9, z]}>
                  <planeGeometry args={[1.8, 0.3]} />
                  <meshStandardMaterial color="#ffffff" opacity={0.6} transparent /> {/* Pure white with lower opacity */}
                </mesh>
              ))}
            </React.Fragment>
          ))}

          {/* Replace Circle components with Obstacle components */}
          {circles.map(circle => (
            <Obstacle key={circle.id} position={circle.position} />
          ))}

          <Suspense fallback={null}>
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' 
              position={modelPosition} 
              rotation={modelRotation} 
            />
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' 
              position={modelPosition} 
              rotation={modelRotation} 
            />
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' 
              position={modelPosition} 
              rotation={modelRotation} 
            />
            <Model 
              scale={modelScale} 
              uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' 
              position={modelPosition} 
              rotation={modelRotation} 
            />
            {Object.entries(equippedAssets).map(([assetType, asset]) => (
              <Model
                key={assetType}
                scale={modelScale}
                uri={asset.url}
                position={modelPosition}
                rotation={modelRotation}
                color={asset.color}
              />
            ))}
          </Suspense>
          <OrbitControls 
            enableDamping 
            maxPolarAngle={Math.PI / 2.5} 
            minPolarAngle={Math.PI / 4}
            minDistance={15} 
            maxDistance={25}
          />
        </Canvas>
      </View>
      
      {/* Updated control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, currentLane === 0 && styles.disabledButton]} 
          onPress={() => currentLane > 0 && handleLaneChange(-1)}
          disabled={currentLane === 0}
        >
          <Text style={styles.controlButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlButton, currentLane === 2 && styles.disabledButton]} 
          onPress={() => currentLane < 2 && handleLaneChange(1)}
          disabled={currentLane === 2}
        >
          <Text style={styles.controlButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
       alignItems: 'center',
    width: '100%',
    height: '100%',
    marginTop: 90, // Increased to account for header height
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 10,
    width: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scoreText: {
    fontSize: 24,
    color: 'white',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
  },
  levelText: {
    fontSize: 24,
    color: 'white',
    marginTop: 10,
  },
  gameOverContainer: undefined,
  gameOverText: undefined,
  finalScoreText: undefined,
  finalLevelText: undefined,
  restartButton: undefined,
  restartButtonText: undefined,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
  },
  loadingSubText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: 'rgba(20, 36, 59, 0.9)',
    padding: 10,
    position: 'absolute',
    top: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    minWidth: 100,
  },
  verticalDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: '#8F9BB3',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 24,
    color: 'white',
    marginTop: 10,
  },
  gameOverContainer: undefined,
  gameOverText: undefined,
  finalScoreText: undefined,
  finalLevelText: undefined,
  restartButton: undefined,
  restartButtonText: undefined,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
  },
  loadingSubText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
  },
  scoreAndLevel: {
    flexDirection: 'column',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  rewardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 10,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '30%',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: '100%',
    gap: 10,
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statGroup: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  failureTitle: {
    fontSize: 28,
    color: '#e74c3c',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  failureStats: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  rewardsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  rewardsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardsText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 5,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    justifyContent: 'center',
    gap: 10,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  claimedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginVertical: 10,
  },
  timeSpentText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    opacity: 0.8,
  },
  chooseOptionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
