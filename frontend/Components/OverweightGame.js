import React from 'react';
import { View, TouchableOpacity, Text, TextInput } from 'react-native';
import styles from '../styles/gameStyles';

export default function OverweightGame({ currentLevel, levels, typedText, handleTyping, handleNextLevel }) {
  const getWordStyle = (word, index) => {
    const levelWords = levels[currentLevel].split(" ");
    const typedWords = typedText.trim().split(" ");
    
    if (index >= typedWords.length) {
      return styles.untypedWord;
    }
    
    if (index === typedWords.length - 1) {
      return styles.currentWord;
    }
    
    if (typedWords[index] === levelWords[index]) {
      return styles.correctWord;
    }
    
    return styles.wrongWord;
  };

  return (
    <View style={styles.typingGameContainer}>
      <Text style={styles.levelText}>Level {currentLevel + 1}</Text>
      <View style={styles.sentenceContainer}>
        {levels[currentLevel].split(" ").map((word, index) => (
          <Text key={index} style={[styles.word, getWordStyle(word, index)]}>
            {word}{' '}
          </Text>
        ))}
      </View>
      <TextInput
        style={styles.typingInput}
        value={typedText}
        onChangeText={handleTyping}
        placeholder="Type the sentence here..."
      />
      <TouchableOpacity
        style={[styles.nextLevelButton, { opacity: typedText.trim() === levels[currentLevel] ? 1 : 0.5 }]}
        onPress={handleNextLevel}
        disabled={typedText.trim() !== levels[currentLevel]}
      >
        <Text style={styles.nextLevelButtonText}>Next Level</Text>
      </TouchableOpacity>
    </View>
  );
}