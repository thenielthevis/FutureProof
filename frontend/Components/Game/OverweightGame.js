import React, { useState, Suspense, useEffect } from 'react';
import { View, TouchableOpacity, Text, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { getEquippedAssets } from '../../API/assets_api';
import styles from '../../styles/gameStyles';

// Model Component
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

const levels = [
  "I promise to commit to a healthier lifestyle and make better food choices every day.",
  "I will incorporate regular exercise into my routine, whether it's walking, jogging, or hitting the gym.",
  "I will stay consistent with my goals, even when progress seems slow or difficult.",
  "I will drink more water and cut down on sugary drinks to help my body stay hydrated and healthy.",
  "I will prioritize portion control and mindful eating to avoid overeating.",
  "I will get enough sleep each night to support my metabolism and overall well-being.",
  "I will stay motivated by tracking my progress and celebrating small victories along the way."
];

export default function OverweightGame() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [typedWords, setTypedWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [modelPositionX, setModelPositionX] = useState(-15);
  const [modelScale] = useState({ x: 2, y: 2, z: 2 });
  const [equippedAssets, setEquippedAssets] = useState({});
  const modelPosition = { x: modelPositionX, y: -1, z: 0 };
  const modelRotation = [0, Math.PI / 2, 0]; // Facing right

  useEffect(() => {
    const fetchEquippedAssets = async () => {
      try {
        const assets = await getEquippedAssets();
        setEquippedAssets(assets);
      } catch (error) {
        console.error('Error fetching equipped assets:', error);
      }
    };

    fetchEquippedAssets();
  }, []);

  const handleTyping = (text) => {
    setTypedText(text);
    const words = text.trim().split(" ");
    const levelWords = levels[currentLevel].split(" ");
    
    setTypedWords(words);
    setCurrentWordIndex(words.length - 1);
    
    // Calculate progress based on correct words only
    const correctWords = words.filter((word, index) => 
      index < levelWords.length && word === levelWords[index]
    );
    
    setModelPositionX(-15 + (correctWords.length / levelWords.length) * 30);
  };

  const handleNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setTypedText("");
      setModelPositionX(-15); // Reset position for next level
    }
  };

  const getWordStyle = (word, index) => {
    const levelWords = levels[currentLevel].split(" ");
    const typedWords = typedText.trim().split(" ");
    
    if (index >= typedWords.length) {
      return styles.untypedWord;
    }
    
    if (index === typedWords.length - 1) {
      return styles.currentWord;
    }
    
    if (typedWords[index] === levelWords[index]) {
      return styles.correctWord;
    }
    
    return styles.wrongWord;
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <View style={styles.sceneContainer}>
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            {/* Base Model */}
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
            
            {/* Equipped Assets */}
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
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
      </View>

      <View style={styles.typingGameContainer}>
        <Text style={styles.levelText}>Level {currentLevel + 1}</Text>
        <View style={styles.sentenceContainer}>
          {levels[currentLevel].split(" ").map((word, index) => (
            <Text key={index} style={[styles.word, getWordStyle(word, index)]}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <TextInput
          style={styles.typingInput}
          value={typedText}
          onChangeText={handleTyping}
          placeholder="Type the sentence here..."
        />
        <TouchableOpacity
          style={[styles.nextLevelButton, { opacity: typedText.trim() === levels[currentLevel] ? 1 : 0.5 }]}
          onPress={handleNextLevel}
          disabled={typedText.trim() !== levels[currentLevel]}
        >
          <Text style={styles.nextLevelButtonText}>Next Level</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}