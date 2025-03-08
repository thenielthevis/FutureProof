import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView } from 'react-native';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TutorialModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const TutorialOptions = [
    {
      title: "Status Bars",
      content: [
        { type: 'image', source: require('../assets/Tutorial/1.png') },
        { type: 'image', source: require('../assets/Tutorial/2.png') },
        { type: 'image', source: require('../assets/Tutorial/3.png') },
        { type: 'image', source: require('../assets/Tutorial/4.png') },
        { type: 'image', source: require('../assets/Tutorial/5.png') },
        { type: 'image', source: require('../assets/Tutorial/6.png') },
        { type: 'image', source: require('../assets/Tutorial/7.png') },
        { type: 'image', source: require('../assets/Tutorial/8.png') },
        { type: 'image', source: require('../assets/Tutorial/9.png') },
      ]
    },
    {
      title: "Main Menu Icons",
      content: [
        { type: 'image', source: require('../assets/Tutorial/10.png') },
        { type: 'image', source: require('../assets/Tutorial/12.png') },
        { type: 'image', source: require('../assets/Tutorial/20.png') },
        { type: 'image', source: require('../assets/Tutorial/21.png') },
        { type: 'image', source: require('../assets/Tutorial/22.png') },
        { type: 'image', source: require('../assets/Tutorial/23.png') },
      ]
    },
    {
      title: "User Dashboard",
      content: [
        { type: 'image', source: require('../assets/Tutorial/13.png') },
        { type: 'image', source: require('../assets/Tutorial/14.png') },
        { type: 'image', source: require('../assets/Tutorial/15.png') },
        { type: 'image', source: require('../assets/Tutorial/16.png') },
        { type: 'image', source: require('../assets/Tutorial/17.png') },
      ]
    },
    {
      title: "Mini-games",
      content: [
        { type: 'image', source: require('../assets/Tutorial/18.png') },
        { type: 'image', source: require('../assets/Tutorial/19.png') },
      ]
    }
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (selectedOption !== null && currentIndex < TutorialOptions[selectedOption].content.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (selectedOption !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBack = () => {
    setSelectedOption(null);
    setCurrentIndex(0);
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButtonTopRight} onPress={onClose}>
            <FontAwesome name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>
            {selectedOption !== null ? TutorialOptions[selectedOption].title : "Tutorial"}
          </Text>

          {selectedOption !== null ? (
            <View style={styles.carouselContainer}>
              <TouchableOpacity style={styles.backButtonTopLeft} onPress={handleBack}>
                <Text style={styles.buttonText}>Back to Menu</Text>
              </TouchableOpacity>
              
              {TutorialOptions[selectedOption].content[currentIndex].type === 'image' ? (
                <Image 
                  source={TutorialOptions[selectedOption].content[currentIndex].source} 
                  style={styles.mediaContent}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.videoContainer}>
                  <Video
                    source={TutorialOptions[selectedOption].content[currentIndex].source}
                    style={styles.videoContent}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay
                    isLooping
                  />
                </View>
              )}

              <View style={styles.navigationControls}>
                <TouchableOpacity 
                  style={[styles.navButton, currentIndex === 0 && styles.disabledButton]} 
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <FontAwesome name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                
                <Text style={styles.pageIndicator}>
                  {currentIndex + 1} / {TutorialOptions[selectedOption].content.length}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.navButton, currentIndex === TutorialOptions[selectedOption].content.length - 1 && styles.disabledButton]} 
                  onPress={handleNext}
                  disabled={currentIndex === TutorialOptions[selectedOption].content.length - 1}
                >
                  <FontAwesome name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              <View style={styles.optionsGrid}>
                {TutorialOptions.map((option, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect(index)}
                  >
                    <Text style={styles.optionText}>{option.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2c3e50',
    width: width * 0.5,
    height: height * 0.85,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
  },
  closeButtonTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#c0392b',
    padding: 5,
    borderRadius: 15,
    zIndex: 1,
  },
  optionsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 25,
    paddingHorizontal: 15,
    borderRadius: 12,
    margin: 10,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContent: {
    width: '100%',
    height: '80%',
    borderRadius: 8,
  },
  videoContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoContent: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 15,
  },
  navButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 16,
    color: '#fff',
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  backButtonTopLeft: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
});

export default TutorialModal;