import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // Common styles
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
    height: '60%',
    position: 'relative',
    marginTop: 150,
  },

  // Modal styles
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

  // Button styles
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

  // Underweight game styles
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
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderRadius: 10,
  },
  foodIconContainer: {
    cursor: 'pointer',
  },
  descriptionContainer: {
    position: 'absolute',
    right: 20,
    top: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },

  // Overweight game styles
  typingGameContainer: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  word: {
    fontSize: 18,
    padding: 5,
    margin: 2,
    borderRadius: 5,
  },
  untypedWord: {
    color: 'white',
  },
  currentWord: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
  },
  correctWord: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    color: 'white',
  },
  wrongWord: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    color: 'white',
  },
  typingInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    fontSize: 16,
  },
  finishLine: {
    position: 'absolute',
    bottom: 150, // Adjust this value to align with the feet of the human model
    right: 150,
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },

  // Obese game styles
  obeseModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  foodChoiceGameContainer: {
    width: '40%',
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  modelWrapper: {
    width: '60%',
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cardLayout: {
    width: '100%',
    marginBottom: 15,
    padding: 15,
  },
  foodImageContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  foodChoiceButton: {
    width: '100%',
    alignItems: 'center',
  },
  foodChoiceButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  foodChoiceText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  foodChoiceContainer: {
    width: '100%',
    marginBottom: 20,
  },
  foodCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
  },
  correctCard: {
    backgroundColor: 'green',
  },
  wrongCard: {
    backgroundColor: 'red',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  timerText: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 100, // 5 times bigger
    color: 'white',
    fontWeight: 'bold',
  },
});
