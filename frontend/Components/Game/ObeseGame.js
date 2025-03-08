import React, { Suspense, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/native';
import styles from '../../styles/gameStyles';
import { useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';

// Add Model component from BMIGame
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

// Add food choices data inside component
const foodChoices = [
  { food1: { name: 'Apple (Medium, 100g)', calories: 52, image: require('../../assets/ObeseMode/1.png') }, food2: { name: 'Cheeseburger', calories: 303, image: require('../../assets/ObeseMode/2.png') } },
  { food1: { name: 'Caesar Salad (1 cup)', calories: 184, image: require('../../assets/ObeseMode/3.png') }, food2: { name: 'Slice of Pepperoni Pizza', calories: 298, image: require('../../assets/ObeseMode/4.png') } },
  // ...add more food choices as needed...
];

export default function ObeseGame() {
  const [currentFoodSet, setCurrentFoodSet] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedFoodCalories, setSelectedFoodCalories] = useState(null);
  const [equippedAssets, setEquippedAssets] = useState({});

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

  // Add model configuration
  const modelScale = { x: 5, y: 3, z: 5 };
  const modelPosition = { x: 0, y: -3, z: 0 };
  const modelRotation = [0, 0, 0];

  const handleFoodChoice = (food) => {
    const correctChoice = Math.min(foodChoices[currentFoodSet].food1.calories, foodChoices[currentFoodSet].food2.calories);
    if (food.calories === correctChoice) {
      setScore(score + 1);
    }
    setSelectedFoodCalories({
      food1: foodChoices[currentFoodSet].food1.calories,
      food2: foodChoices[currentFoodSet].food2.calories
    });
  };

  const handleNextFoodSet = () => {
    if (currentFoodSet < foodChoices.length - 1) {
      setCurrentFoodSet(currentFoodSet + 1);
      setSelectedFoodCalories(null);
    }
  };

  const getCardStyle = (food) => {
    if (selectedFoodCalories === null) {
      return styles.foodCard;
    }
    const correctChoice = Math.min(foodChoices[currentFoodSet].food1.calories, foodChoices[currentFoodSet].food2.calories);
    if (food.calories === correctChoice) {
      return [styles.foodCard, styles.correctCard];
    } else if (food.calories === selectedFoodCalories.food1 || food.calories === selectedFoodCalories.food2) {
      return [styles.foodCard, styles.wrongCard];
    }
    return styles.foodCard;
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <View style={styles.obeseModeContainer}>
        <View style={styles.foodChoiceGameContainer}>
          <Text style={styles.foodChoiceText}>Choose the lower calorie food:</Text>
          <View style={styles.foodChoiceContainer}>
            <View style={[getCardStyle(foodChoices[currentFoodSet].food1), styles.cardLayout]}>
              <TouchableOpacity style={styles.foodChoiceButton} onPress={() => handleFoodChoice(foodChoices[currentFoodSet].food1)}>
                <View style={styles.foodImageContainer}>
                  <Image source={foodChoices[currentFoodSet].food1.image} style={styles.foodImage} />
                </View>
                <Text style={styles.foodChoiceButtonText}>{foodChoices[currentFoodSet].food1.name}</Text>
                <Text style={styles.calorieText}>Calories: {foodChoices[currentFoodSet].food1.calories}</Text>
              </TouchableOpacity>
            </View>
            <View style={[getCardStyle(foodChoices[currentFoodSet].food2), styles.cardLayout]}>
              <TouchableOpacity style={styles.foodChoiceButton} onPress={() => handleFoodChoice(foodChoices[currentFoodSet].food2)}>
                <View style={styles.foodImageContainer}>
                  <Image source={foodChoices[currentFoodSet].food2.image} style={styles.foodImage} />
                </View>
                <Text style={styles.foodChoiceButtonText}>{foodChoices[currentFoodSet].food2.name}</Text>
                <Text style={styles.calorieText}>Calories: {foodChoices[currentFoodSet].food2.calories}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.nextFoodSetButton} onPress={handleNextFoodSet}>
            <Text style={styles.nextFoodSetButtonText}>Next</Text>
          </TouchableOpacity>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.modelWrapper}>
          <Canvas camera={{ position: [0, 0, 10] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Suspense fallback={null}>
              {/* Base Model */}
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} rotation={modelRotation} />
              <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} rotation={modelRotation} />

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
      </View>
    </LinearGradient>
  );
}