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
    marginTop: 100, // Increased to accommodate header
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
    color: '#fff',
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

  // Header Container styles
  headerContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerGif: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  rewardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
  },

  // Settings Modal styles
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '30%',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: '100%',
    gap: 10,
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Timer Selection Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    width: '30%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  timerOption: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  selectedTimer: {
    backgroundColor: '#3498db',
  },
  timerOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  coinRewardText: {
    color: '#ffd700',
    fontSize: 14,
    marginTop: 5,
  },
  challengeText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Add new next button styles
  nextFoodSetButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20,
    minWidth: 150,
    transform: [{ scale: 1.0 }],
  },
  nextFoodSetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextFoodSetButtonPressed: {
    transform: [{ scale: 0.95 }],
  },

  // Update mass indicator styles
  massIndicator: {
    position: 'absolute',
    top: '50%',
    right: '40%',
    backgroundColor: 'rgba(76, 175, 80, 0.9)', // Green background
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  massText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Add failure modal styles
  failureTitle: {
    fontSize: 28,
    color: '#e74c3c',
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  failureSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Add weight loss glow effect styles
  gainText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: '0 0 10px #4CAF50',
  },
  modelGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    zIndex: 1,
    pointerEvents: 'none',
  },
});
