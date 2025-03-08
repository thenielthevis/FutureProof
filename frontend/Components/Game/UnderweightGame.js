import React, { useState, useRef, useEffect, Suspense } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Animated } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../../API/assets_api';

// Keep Model component
function Model({ scale, uri, position, rotation }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} />;
}

const UnderweightGame = ({ setGameCompleted, setBmiCategory }) => {
  const [day, setDay] = useState(1);
  const [foodDragged, setFoodDragged] = useState(false);
  const [highlightedFood, setHighlightedFood] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [eating, setEating] = useState(false);
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
  const modelScale = { x: 3, y: 5, z: 5 }; // Slim model for underweight
  const modelPosition = { x: 0, y: -5, z: 0 };
  const modelRotation = [0, 0, 0];

  // Pan responder setup
  const panBreakfast = useRef(new Animated.ValueXY()).current;
  const panLunch = useRef(new Animated.ValueXY()).current;
  const panDinner = useRef(new Animated.ValueXY()).current;

  const handleFoodDrag = () => {
    setFoodDragged(true);
    setEating(true);
    setTimeout(() => {
      setEating(false);
    }, 2000);
  };

  const handleNextDay = () => {
    if (foodDragged) {
      if (day < 7) {
        setDay(prevDay => prevDay + 1);
        setFoodDragged(false);
      } else {
        alert('Congratulations! You have completed the week.');
        setBmiCategory('Normal');
        setSelectedFood(null);
        setGameCompleted(true);
      }
    } else {
      alert('Please drag the food items before proceeding to the next day.');
    }
  };

  const createPanResponder = (pan) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.moveY < 400) {
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
    setHighlightedFood(foodKey);
    setSelectedFood(foodDescriptions[foodKey]?.description);
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <View style={styles.leftDescriptionContainer}>
        <Text style={styles.leftDescriptionText}>
          If you're underweight and want to reach a normal BMI, you should focus on nutrient-dense, high-calorie foods while maintaining a balanced diet. Here's a structured high-calorie meal plan with specific foods to help you gain weight in a healthy way.
          {'\n\n'}
          Key Principles for Healthy Weight Gain:
          {'\n'}
          Increase Calories: Aim for 500-700 extra kcal/day to gain weight gradually.
          {'\n'}
          Prioritize Protein: 1.2-2.0g/kg body weight daily to support muscle growth.
          {'\n'}
          Healthy Fats & Carbs: Focus on whole foods with healthy fats and complex carbs.
          {'\n'}
          Frequent Meals: Eat 5-6 meals/day, including snacks.
        </Text>
      </View>

      <View style={styles.sceneContainer}>
        {/* Add Canvas for 3D Model */}
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} rotation={modelRotation} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} rotation={modelRotation} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} rotation={modelRotation} />
            <Model scale={modelScale} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition} rotation={modelRotation} />
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

        {/* Game UI */}
        <View style={styles.gameContainer}>
          <Text style={styles.dayText}>Day {day}</Text>
          <View style={styles.foodContainer}>
            <Animated.View
              {...panResponderBreakfast.panHandlers}
              style={[
                panBreakfast.getLayout(),
                styles.foodIconContainer
              ]}
              onMouseEnter={() => handleFoodHover('underbreakfast')}
              onMouseLeave={() => handleFoodHover(null)}
            >
              <Image
                source={require('../../assets/food/underbreakfast.png')}
                style={[
                  styles.foodImage,
                  highlightedFood === 'underbreakfast' && styles.highlightedFoodImage,
                ]}
              />
            </Animated.View>
            <Animated.View
              {...panResponderLunch.panHandlers}
              style={[
                panLunch.getLayout(),
                styles.foodIconContainer
              ]}
              onMouseEnter={() => handleFoodHover('underlunch')}
              onMouseLeave={() => handleFoodHover(null)}
            >
              <Image
                source={require('../../assets/food/underlunch.png')}
                style={[
                  styles.foodImage,
                  highlightedFood === 'underlunch' && styles.highlightedFoodImage,
                ]}
              />
            </Animated.View>
            <Animated.View
              {...panResponderDinner.panHandlers}
              style={[
                panDinner.getLayout(),
                styles.foodIconContainer
              ]}
              onMouseEnter={() => handleFoodHover('underdinner')}
              onMouseLeave={() => handleFoodHover(null)}
            >
              <Image
                source={require('../../assets/food/underdinner.png')}
                style={[
                  styles.foodImage,
                  highlightedFood === 'underdinner' && styles.highlightedFoodImage,
                ]}
              />
            </Animated.View>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextDay} disabled={eating}>
            <Text style={styles.nextButtonText}>Next Day</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedFood && day < 7 && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{selectedFood}</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  leftDescriptionContainer: {
    position: 'absolute',
    left: 20,
    top: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
    width: '30%',
  },
  leftDescriptionText: {
    fontSize: 16,
    color: '#000',
  },
  gameContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  dayText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  foodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  foodImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  highlightedFoodImage: {
    borderColor: 'yellow',
    borderWidth: 2,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    position: 'absolute',
    right: 20,
    top: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
    width: '30%',
  },
  descriptionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default UnderweightGame;