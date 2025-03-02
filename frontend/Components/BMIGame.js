import React, { useState, useEffect, Suspense, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Image, Animated, PanResponder } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEquippedAssets } from '../API/assets_api'; // Re-add this import
import GameNavbar from '../Navbar/GameNavbar';

// Reusable Model Component with Color
function Model({ scale, uri, position }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);

  return <primitive object={scene} />;
}

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
  const [modelScale, setModelScale] = useState({ x: 3, y: 5, z: 4 }); // Initial scale for Underweight

  const modelScaleDefault = { x: 5, y: 5, z: 5 }; // 2x larger
  const modelPosition = { x: 0, y: -5, z: 0 }; // Adjusted position to move the model downwards

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

  const getModelScale = () => {
    switch (bmiCategory) {
      case 'Underweight':
        return modelScale;
      case 'Overweight':
        return { x: 6, y: 5, z: 6 };
      case 'Obese':
        return { x: 7, y: 5, z: 7 };
      default:
        return { x: 5, y: 5, z: 5 };
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
            x: Math.min(prevScale.x + 0.5, 5), // Increase width gradually until normal size
            y: prevScale.y,
            z: prevScale.z
          }));
        }
      } else {
        alert('Congratulations! You have completed the week.');
        setBmiCategory('Normal'); // Set BMI category to Normal after completing day 7
        setSelectedFood(null); // Clear selected food description
        setGameCompleted(true); // Set game completed state
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
      image: require('../assets/food/underbreakfast.png'),
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
      image: require('../assets/food/underlunch.png'),
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
      image: require('../assets/food/underdinner.png'),
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
    setSelectedFood(foodDescriptions[foodKey].description);
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
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb' position={modelPosition} />
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb' position={modelPosition} />
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961141/Eyes.001_uab6p6.glb' position={modelPosition} /> {/* Eyes */}
            <Model scale={getModelScale()} uri='https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/Nose.001_s4fxsi.glb' position={modelPosition}/> {/* Nose */}
            {selectedTop && <Model scale={getModelScale()} uri={selectedTop} position={modelPosition} />}
            {selectedBottom && <Model scale={getModelScale()} uri={selectedBottom} position={modelPosition} />}
            {selectedShoes && <Model scale={getModelScale()} uri={selectedShoes} position={modelPosition} />}
            {Object.keys(equippedAssets).map(assetType => (
              <Model
                key={assetType}
                scale={getModelScale()}
                uri={equippedAssets[assetType].url}
                position={modelPosition}
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
            <TouchableOpacity style={styles.button} onPress={() => alert('Overweight mode coming soon!')}>
              <Text style={styles.buttonText}>Overweight</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => alert('Obese mode coming soon!')}>
              <Text style={styles.buttonText}>Obese</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {bmiCategory === 'Underweight' && (
        <>
          <View style={styles.leftDescriptionContainer}>
            <Text style={styles.leftDescriptionText}>
              If you're underweight and want to reach a normal BMI, you should focus on nutrient-dense, high-calorie foods while maintaining a balanced diet. Here’s a structured high-calorie meal plan with specific foods to help you gain weight in a healthy way.
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
          <View style={styles.gameContainer}>
            <Text style={styles.dayText}>Day {day}</Text>
            <View style={styles.foodContainer}>
              <Animated.View
                {...panResponderBreakfast.panHandlers}
                style={panBreakfast.getLayout()}
                onMouseEnter={() => handleFoodHover('underbreakfast')}
                onMouseLeave={() => setHighlightedFood(null)}
              >
                <Image
                  source={require('../assets/food/underbreakfast.png')}
                  style={[
                    styles.foodImage,
                    highlightedFood === 'underbreakfast' && styles.highlightedFoodImage,
                  ]}
                />
              </Animated.View>
              <Animated.View
                {...panResponderLunch.panHandlers}
                style={panLunch.getLayout()}
                onMouseEnter={() => handleFoodHover('underlunch')}
                onMouseLeave={() => setHighlightedFood(null)}
              >
                <Image
                  source={require('../assets/food/underlunch.png')}
                  style={[
                    styles.foodImage,
                    highlightedFood === 'underlunch' && styles.highlightedFoodImage,
                  ]}
                />
              </Animated.View>
              <Animated.View
                {...panResponderDinner.panHandlers}
                style={panDinner.getLayout()}
                onMouseEnter={() => handleFoodHover('underdinner')}
                onMouseLeave={() => setHighlightedFood(null)}
              >
                <Image
                  source={require('../assets/food/underdinner.png')}
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
        </>
      )}

      {selectedFood && day < 7 && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{[selectedFood]}</Text>
        </View>
      )}

      {gameCompleted && (
        <View style={styles.completionTextContainer}>
          <Text style={styles.completionText}>Underweight to Normal BMI Completed!</Text>
          <TouchableOpacity style={styles.okButton} onPress={handleOkClick}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  eatingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: 10,
    zIndex: 1,
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
  completionTextContainer: {
    position: 'absolute',
    top: 90,
    alignItems: 'center',
    width: '100%',
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  okButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});