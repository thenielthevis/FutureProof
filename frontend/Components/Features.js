import React, { useRef, useState } from 'react'; 
import { View, Text, StyleSheet, Image, Animated, Dimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const Features = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const featuresList = [
    { title: '', image: require('../assets/logo.png') },
    { title: '', image: require('../assets/gamified.png') },
    { title: '', image: require('../assets/nutrition.png') },
    { title: ' ', image: require('../assets/assessment.png') },
  ];

  // Duplicate the list to create an infinite effect
  const infiniteFeaturesList = [featuresList[featuresList.length - 1], ...featuresList, featuresList[0]];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleSlideChange = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);

    // Adjust index for infinite scroll
    if (index === 0) {
      scrollViewRef.current.scrollTo({ x: screenWidth * featuresList.length, animated: false });
      setCurrentIndex(featuresList.length - 1);
    } else if (index === infiniteFeaturesList.length - 1) {
      scrollViewRef.current.scrollTo({ x: screenWidth, animated: false });
      setCurrentIndex(0);
    } else {
      setCurrentIndex((index - 1 + featuresList.length) % featuresList.length);
    }
  };

  return (
    <LinearGradient
      colors={['#E8F5E9', '#72f2b8']}
      style={styles.container}
    >
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>            MOST POPULAR FEATURES</Text>
          </View>
        </View>

        {/* Carousel Section */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleSlideChange}
            initialScrollIndex={1} // Start at the first item in the original list
          >
            {infiniteFeaturesList.map((feature, index) => (
              <View key={index} style={styles.carouselItem}>
                <Animated.View
                  style={[
                    styles.featureImageContainer,
                    {
                      transform: [
                        {
                          scale: scrollX.interpolate({
                            inputRange: [
                              (index - 1) * screenWidth,
                              index * screenWidth,
                              (index + 1) * screenWidth,
                            ],
                            outputRange: [1, 1.1, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={feature.image}
                    style={styles.featureImage}
                  />
                </Animated.View>
                
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {featuresList.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index && styles.paginationDotActive,
                {
                  transform: [
                    {
                      scale: scrollX.interpolate({
                        inputRange: [
                          (index - 1) * screenWidth,
                          index * screenWidth,
                          (index + 1) * screenWidth,
                        ],
                        outputRange: [1, 1.5, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                  backgroundColor: currentIndex === index ? '#388E3C' : '#388E3C',
                },
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10, // Increased margin to create space between title and carousel
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1B5E20',
    fontFamily: 'serif', // Semi-formal font family
    fontStyle: 'italic', // Italic style
  },
  carouselContainer: {
    height: 500,
    marginBottom: 50, // Adjust space between carousel and pagination dots
  },
  carouselItem: {
    width: screenWidth - 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureImageContainer: {
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 10 }, // Shadow positioning
    shadowOpacity: 0.50, // Shadow intensity
    shadowRadius: 15, // Shadow blur
    elevation: 5, // Elevation for Android shadow
    marginBottom: 10, // Space between image and title
    borderRadius: 20, // Rounded corners for the container
  },
  featureImage: {
    width: 500,
    height: 500,
    borderRadius: 20, // Rounded corners for the image
    borderWidth: 5, // Border width
    borderColor: '#388E3C', // Border color (dark green)
  },
  featureTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 25,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1, // Adjusted to create space between carousel and pagination
  },
  paginationDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#388E3C', // Default light color for inactive dots
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#388E3C', // Dark Green for active dot
  },
});

export default Features;
