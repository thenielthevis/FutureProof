import React from 'react';
import { View, TouchableOpacity, Text, Animated, Image } from 'react-native';
import styles from '../styles/gameStyles';

export default function UnderweightGame({ day, handleNextDay, eating, panResponderBreakfast, panResponderLunch, panResponderDinner, panBreakfast, panLunch, panDinner, handleFoodHover, highlightedFood, selectedFood }) {
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

  return (
    <>
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
              source={require('../assets/food/underbreakfast.png')}
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
              source={require('../assets/food/underlunch.png')}
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
      {selectedFood && day < 7 && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{selectedFood}</Text>
        </View>
      )}
    </>
  );
}