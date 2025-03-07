import React, { Suspense } from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/native';
import styles from '../styles/gameStyles';
import { useGLTF } from '@react-three/drei/native';

// Add Model component from BMIGame
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

export default function ObeseGame({ 
  foodChoices,
  currentFoodSet,
  handleFoodChoice,
  selectedFoodCalories,
  handleNextFoodSet,
  score,
  modelScale,
  modelPosition,
  getModelRotation,
  equippedAssets,
  selectedTop,
  selectedBottom,
  selectedShoes
}) {
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
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} rotation={getModelRotation()} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} rotation={getModelRotation()} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} rotation={getModelRotation()} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} rotation={getModelRotation()} />
            {selectedTop && <Model scale={modelScale} uri={selectedTop} position={modelPosition} rotation={getModelRotation()} />}
            {selectedBottom && <Model scale={modelScale} uri={selectedBottom} position={modelPosition} rotation={getModelRotation()} />}
            {selectedShoes && <Model scale={modelScale} uri={selectedShoes} position={modelPosition} rotation={getModelRotation()} />}
            {Object.keys(equippedAssets).map(assetType => (
              <Model
                key={assetType}
                scale={modelScale}
                uri={equippedAssets[assetType].url}
                position={modelPosition}
                rotation={getModelRotation()}
              />
            ))}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
      </View>
    </View>
  );
}