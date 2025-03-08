import React, { useState, useEffect, Suspense, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';
import GameNavbar from '../../Navbar/GameNavbar';

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
  const [isPlaying, setIsPlaying] = useState(false); // Add isPlaying state

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
              setGameOver(true);
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

  const handlePlay = () => {
    setIsPlaying(true);
  };

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

  if (!isPlaying) {
    return (
      <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Welcome to the Game!</Text>
          <Text style={styles.instructionSubText}>Press PLAY to start</Text>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlay}
          >
            <Text style={styles.playButtonText}>PLAY</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <GameNavbar />
      <View style={styles.sceneContainer}>
        {/* Score and Level display */}
        <View style={styles.statsContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.levelText}>Level: {level}</Text>
        </View>
        
        {/* Game Over overlay */}
        {gameOver && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <Text style={styles.finalScoreText}>Final Score: {score}</Text>
            <Text style={styles.finalLevelText}>Final Level: {level}</Text>
            <TouchableOpacity 
              style={styles.restartButton}
              onPress={handleRestart}
            >
              <Text style={styles.restartButtonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        )}

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
    marginTop: 150,
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
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  levelText: {
    fontSize: 24,
    color: 'white',
    marginTop: 10,
  },
  gameOverContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 2,
  },
  gameOverText: {
    fontSize: 32,
    color: 'white',
    marginBottom: 10,
  },
  finalScoreText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  finalLevelText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 15,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 18,
  },
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
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 32,
    color: 'white',
    marginBottom: 20,
  },
  instructionSubText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
  },
});
