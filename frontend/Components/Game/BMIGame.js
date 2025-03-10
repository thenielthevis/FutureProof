import React, { useState, useEffect, Suspense, useRef } from 'react';
import { View, TouchableOpacity, Text, Modal, Image, Animated, PanResponder } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api'; // Re-add this import
import GameNavbar from '../../Navbar/GameNavbar';
import BMIGameCongratulationsModal from './BMIGameCongratulationsModal'; // Import the new modal
import { Audio } from 'expo-av';
import UnderweightGame from './UnderweightGame';
import OverweightGame from './OverweightGame';
import ObeseGame from './ObeseGame';
import styles from '../../styles/gameStyles';

// Reusable Model Component with Color
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

const foodChoices = [
  { food1: { name: 'Apple (Medium, 100g)', calories: 52, image: require('../../assets/ObeseMode/1.png') }, food2: { name: 'Cheeseburger', calories: 303, image: require('../../assets/ObeseMode/2.png') } },
  { food1: { name: 'Caesar Salad (1 cup)', calories: 184, image: require('../../assets/ObeseMode/3.png') }, food2: { name: 'Slice of Pepperoni Pizza', calories: 298, image: require('../../assets/ObeseMode/4.png') } },
  { food1: { name: 'Banana (Medium, 118g)', calories: 105, image: require('../../assets/ObeseMode/5.png') }, food2: { name: 'Peanut Butter (1 tbsp)', calories: 96, image: require('../../assets/ObeseMode/6.png') } },
  { food1: { name: 'Grilled Chicken Breast (100g, skinless)', calories: 165, image: require('../../assets/ObeseMode/7.png') }, food2: { name: 'Baked Potato (100g, plain)', calories: 93, image: require('../../assets/ObeseMode/8.png') } },
  { food1: { name: 'Boiled Egg (Large)', calories: 68, image: require('../../assets/ObeseMode/9.png') }, food2: { name: 'Slice of Cheddar Cheese (28g)', calories: 113, image: require('../../assets/ObeseMode/10.png') } },
  { food1: { name: 'French Baguette (50g slice)', calories: 135, image: require('../../assets/ObeseMode/11.png') }, food2: { name: 'Brown Rice (100g, cooked)', calories: 110, image: require('../../assets/ObeseMode/12.png') } },
  { food1: { name: 'Salmon Sushi (1 piece, nigiri)', calories: 48, image: require('../../assets/ObeseMode/13.png') }, food2: { name: 'Whole Wheat Bread (1 slice, 28g)', calories: 69, image: require('../../assets/ObeseMode/14.png') } },
  { food1: { name: 'Almonds (10 pieces, 14g)', calories: 81, image: require('../../assets/ObeseMode/15.png') }, food2: { name: 'Cashews (10 pieces, 16g)', calories: 87, image: require('../../assets/ObeseMode/16.png') } },
  { food1: { name: 'Sirloin Steak (100g, grilled, lean)', calories: 206, image: require('../../assets/ObeseMode/17.png') }, food2: { name: 'Avocado (Half, 100g)', calories: 160, image: require('../../assets/ObeseMode/18.png') } },
  { food1: { name: 'Dark Chocolate (1 small piece, 10g, 85% cocoa)', calories: 60, image: require('../../assets/ObeseMode/19.png') }, food2: { name: 'Coconut Meat (10g, fresh)', calories: 65, image: require('../../assets/ObeseMode/20.png') } },
];

export default function Game() {
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedHead, setSelectedHead] = useState(null);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedShoes, setSelectedShoes] = useState(null);
  const [equippedAssets, setEquippedAssets] = useState({});
  const [bmiCategory, setBmiCategory] = useState(null); // State to track BMI category
  const [day, setDay] = useState(1); // State to track the current day
  const [modalVisible, setModalVisible] = useState(true); // State to control the visibility of the initial modal
  const [foodDragged, setFoodDragged] = useState(false); // State to track if food has been dragged
  const [highlightedFood, setHighlightedFood] = useState(null); // State to track highlighted food
  const [eating, setEating] = useState(false); // State to track if the user is eating
  const [selectedFood, setSelectedFood] = useState(null); // State to track selected food item
  const [gameCompleted, setGameCompleted] = useState(false); // State to track if the game is completed
  const [modelScale, setModelScale] = useState({ x: 5, y: 5, z: 5 }); // Initial scale for normal BMI
  const modelScaleObese = { x: 5, y: 3, z: 5 }; // Initial scale for Obese
  const [currentLevel, setCurrentLevel] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [modelPositionX, setModelPositionX] = useState(-15); // Initial position for Overweight
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [rewards, setRewards] = useState({ xp: 100, coins: 50 }); // Example rewards
  const [currentFoodSet, setCurrentFoodSet] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedFoodCalories, setSelectedFoodCalories] = useState(null);
  const [sound, setSound] = useState();

  const modelScaleDefault = { x: 5, y: 5, z: 5 }; // 2x larger
  const modelPosition = { x: 0, y: -5, z: 0 }; // Adjusted position to move the model downwards
  const modelScaleUnderweight = { x: 3, y: 5, z: 5 }; // 7x slimmer for Underweight

  const panBreakfast = useRef(new Animated.ValueXY()).current;
  const panLunch = useRef(new Animated.ValueXY()).current;
  const panDinner = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    // Fetch equipped assets
    const fetchEquippedAssets = async () => {
      try {
        const equippedAssets = await getEquippedAssets();
        setEquippedAssets(equippedAssets);
      } catch (error) {
        console.error('Error fetching equipped assets:', error);
      }
    };

    fetchEquippedAssets();
  }, []);

  useEffect(() => {
    if (bmiCategory === 'Underweight') {
      setModelScale(modelScaleUnderweight); // Start with slimmer model
    } else if (bmiCategory === 'Obese') {
      setModelScale({ x: 5, y: 3, z: 5 }); // Start with wider model for Obese
    } else {
      setModelScale({ x: 5, y: 5, z: 5 }); // Reset to default scale
    }
  }, [bmiCategory]);

  const getModelScale = () => {
    switch (bmiCategory) {
      case 'Underweight':
        return modelScale; // Use the current model scale for Underweight
      case 'Overweight':
        return { x: 2, y: 2, z: 2 }; // Smaller scale for Overweight
      case 'Obese':
        return modelScale; // Use the separate model scale for Obese
      default:
        return { x: 5, y: 5, z: 5 };
    }
  };
  

  const getModelRotation = () => {
    switch (bmiCategory) {
      case 'Overweight':
        return [0, Math.PI / 2, 0]; // Rotate model to face right
      default:
        return [0, 0, 0];
    }
  };

  const getModelPosition = () => {
    switch (bmiCategory) {
      case 'Overweight':
        return { x: modelPositionX, y: -1, z: 0 }; // Changed y from -2 to -1 to move model upward
      case 'Obese':
        return { x: 0, y: -3, z: 0 }; // Adjust position for Obese
      default:
        return modelPosition;
    }
  };

  const handleFoodDrag = () => {
    setFoodDragged(true);
  };

const handleNextDay = () => {
  if (foodDragged) {
    if (day < 7) {
      setDay(day + 1);
      setFoodDragged(false);
      if (bmiCategory === 'Underweight') {
        setModelScale(prevScale => ({
          x: Math.min(prevScale.x + 0.3, 5), // Increase width gradually until normal size (5 is the normal width)
          y: prevScale.y,
          z: prevScale.z
        }));
      }
    } else {
      alert('Congratulations! You have completed the week.');
      setBmiCategory('Normal'); // Set BMI category to Normal after completing day 7
      setSelectedFood(null); // Clear selected food description
      setGameCompleted(true); // Set game completed state
      setShowCongratulations(true); // Show congratulations modal
    }
  } else {
    alert('Please drag the food items before proceeding to the next day.');
  }
};

  const handleOkClick = () => {
    setGameCompleted(false);
    setModalVisible(true);
  };

  const createPanResponder = (pan) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.moveY < 400) { // Example drop area condition
          handleFoodDrag();
        }
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    });
  };

  const panResponderBreakfast = createPanResponder(panBreakfast);
  const panResponderLunch = createPanResponder(panLunch);
  const panResponderDinner = createPanResponder(panDinner);

  const foodDescriptions = {
    underbreakfast: {
      image: require('../../assets/food/underbreakfast.png'),
      description: `Breakfast (High-Calorie & Protein-Rich)
✅ Oatmeal with Peanut Butter & Banana
1 cup oats cooked with milk
1 tbsp peanut butter
1 sliced banana
Handful of nuts (almonds, walnuts, or cashews)
1 boiled egg or scrambled eggs with cheese
📌 Calories: 600-700 kcal`,
    },
    underlunch: {
      image: require('../../assets/food/underlunch.png'),
      description: `Lunch (Balanced & High-Calorie)
✅ Grilled Chicken with Brown Rice & Avocado
150g grilled chicken breast
1 cup cooked brown rice/quinoa
½ avocado
1 cup steamed vegetables (broccoli, carrots, or spinach)
Drizzle of olive oil
📌 Calories: 700-800 kcal`,
    },
    underdinner: {
      image: require('../../assets/food/underdinner.png'),
      description: `Dinner (High-Protein & Fiber-Rich)
✅ Salmon with Mashed Sweet Potatoes & Greens
150g grilled salmon
1 cup mashed sweet potatoes
1 serving steamed kale/spinach with olive oil
📌 Calories: 600-700 kcal`,
    },
  };

  const handleFoodHover = (foodKey) => {
    if (bmiCategory === 'Underweight' && foodDescriptions[foodKey]) {
      setHighlightedFood(foodKey);
      setSelectedFood(foodDescriptions[foodKey].description);
    }
  };

  const [typedWords, setTypedWords] = useState([]); // Add this state
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // Add this state

  const handleTyping = (text) => {
    setTypedText(text);
    const words = text.trim().split(" ");
    const levelWords = levels[currentLevel].split(" ");
    
    // Update typed words array
    setTypedWords(words);
    
    // Find current word being typed
    setCurrentWordIndex(words.length - 1);
    
    // Calculate progress based on correct words only
    const correctWords = words.filter((word, index) => 
      index < levelWords.length && word === levelWords[index]
    );
    
    setModelPositionX(-15 + (correctWords.length / levelWords.length) * 30);
  };

  const getWordStyle = (word, index) => {
    const levelWords = levels[currentLevel].split(" ");
    
    if (index >= typedWords.length) {
      return styles.untypedWord;
    }
    
    if (index === currentWordIndex) {
      return styles.currentWord;
    }
    
    if (typedWords[index] === levelWords[index]) {
      return styles.correctWord;
    }
    
    return styles.wrongWord;
  };

  const handleNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setTypedText("");
      setModelPositionX(-15); // Reset position for next level
    } else {
      setShowCongratulations(true); // Show congratulations modal
    }
  };

const handleFoodChoice = (food) => {
  const correctChoice = Math.min(foodChoices[currentFoodSet].food1.calories, foodChoices[currentFoodSet].food2.calories);
  if (food.calories === correctChoice) {
    setScore(score + 1);
    if (bmiCategory === 'Obese') {
      setModelScale(prevScale => ({
        x: Math.max(prevScale.x - 0.2, 3), // Decrease width gradually until normal size
        y: prevScale.y,
        z: prevScale.z
      }));
    }
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
  } else {
    setShowCongratulations(true);
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

    const playEatingSound = async () => {
     const { sound } = await Audio.Sound.createAsync(require('../../assets/food/eating.mp3'));
      setSound(sound);
      await sound.playAsync();
   };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <GameNavbar />
      <View style={styles.sceneContainer}>
        {eating && <Text style={styles.eatingText}>Eating...</Text>}
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={getModelPosition()} rotation={getModelRotation()} />
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={getModelPosition()} rotation={getModelRotation()} />
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={getModelPosition()} rotation={getModelRotation()} /> {/* Eyes */}
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={getModelPosition()} rotation={getModelRotation()} /> {/* Nose */}
            {selectedTop && <Model scale={getModelScale()} uri={selectedTop} position={getModelPosition()} rotation={getModelRotation()} />}
            {selectedBottom && <Model scale={getModelScale()} uri={selectedBottom} position={getModelPosition()} rotation={getModelRotation()} />}
            {selectedShoes && <Model scale={getModelScale()} uri={selectedShoes} position={getModelPosition()} rotation={getModelRotation()} />}
            {Object.keys(equippedAssets).map(assetType => (
              <Model
                key={assetType}
                scale={getModelScale()}
                uri={equippedAssets[assetType].url}
                position={getModelPosition()}
                rotation={getModelRotation()}
              />
            ))}
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI} minDistance={10} maxDistance={15} />
        </Canvas>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Road to Normal BMI!</Text>
            <Text style={styles.modalSubtitle}>Select a mode:</Text>
            <TouchableOpacity style={styles.button} onPress={() => { setBmiCategory('Underweight'); setModalVisible(false); }}>
              <Text style={styles.buttonText}>Underweight</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { setBmiCategory('Overweight'); setModalVisible(false); }}>
              <Text style={styles.buttonText}>Overweight</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { setBmiCategory('Obese'); setModalVisible(false); }}>
              <Text style={styles.buttonText}>Obese</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {bmiCategory === 'Underweight' && (
        <UnderweightGame
          day={day}
          handleNextDay={handleNextDay}
          eating={eating}
          panResponderBreakfast={panResponderBreakfast}
          panResponderLunch={panResponderLunch}
          panResponderDinner={panResponderDinner}
          panBreakfast={panBreakfast}
          panLunch={panLunch}
          panDinner={panDinner}
          handleFoodHover={handleFoodHover}
          highlightedFood={highlightedFood}
          selectedFood={selectedFood}
        />
      )}

      {bmiCategory === 'Overweight' && (
        <OverweightGame
          currentLevel={currentLevel}
          levels={levels}
          typedText={typedText}
          handleTyping={handleTyping}
          handleNextLevel={handleNextLevel}
        />
      )}

      {bmiCategory === 'Obese' && (
        <ObeseGame
          foodChoices={foodChoices}
          currentFoodSet={currentFoodSet}
          handleFoodChoice={handleFoodChoice}
          selectedFoodCalories={selectedFoodCalories}
          handleNextFoodSet={handleNextFoodSet}
          score={score}
          modelScale={getModelScale()}
          modelPosition={getModelPosition()}
          getModelRotation={getModelRotation}
          equippedAssets={equippedAssets}
          selectedTop={selectedTop}
          selectedBottom={selectedBottom}
          selectedShoes={selectedShoes}
        />
      )}

      {gameCompleted && (
        <View style={styles.completionTextContainer}>
          <Text style={styles.completionText}>Underweight to Normal BMI Completed!</Text>
          <TouchableOpacity style={styles.okButton} onPress={handleOkClick}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCongratulations && (
        <BMIGameCongratulationsModal
          visible={showCongratulations}
          onClose={() => setShowCongratulations(false)}
          rewards={rewards}
        />
      )}
    </LinearGradient>
  );
}