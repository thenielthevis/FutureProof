import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For icons

// Load 3D model component
function Model({ uri, scale, position }) {
  const { scene } = useGLTF(uri);
  scene.scale.set(scale.x, scale.y, scale.z);
  scene.position.set(position.x, position.y, position.z);
  return <primitive object={scene} />;
}

export default function Shop() {
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const navigation = useNavigation(); // Hook for navigation

  // Human model (Cloudinary URLs)
  const humanModel = 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961165/NakedFullBody_jaufkc.glb';
  const headModel = 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961163/Head.001_p5sjoz.glb';

  // Outfit options (with preview images and Cloudinary URLs)
  const outfitOptions = [
    { id: 1, label: "Outfit 001", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961166/Outfit.001_ltaosl.glb', preview: { uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963242/outfit1_xpdkme.png' } },
    { id: 2, label: "Outfit 002", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961168/Outfit.002_fppb7h.glb', preview: { uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963244/outfit2_ohvmrf.png' } },
    { id: 3, label: "Outfit 003", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961167/Outfit.003_u5v8zx.glb', preview: { uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963245/outfit3_zd9w6v.png' } },
    { id: 4, label: "Outfit 004", uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739961167/Outfit.004_puxvvl.glb', preview: { uri: 'https://res.cloudinary.com/dv4vzq7pv/image/upload/v1739963246/outfit4_mdrzhk.png' } },
  ];

  // Ensure grid layout with empty cards for alignment
  const totalCards = 20;
  const filledCards = outfitOptions.length;
  const emptyCards = totalCards - filledCards;
  const allCards = [...outfitOptions, ...Array(emptyCards).fill(null)];

  return (
    <View style={styles.container}>
      
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Outfit Selection */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {allCards.map((outfit, index) => (
          <TouchableOpacity 
          key={index} 
          onPress={() => {
            setSelectedOutfit(null); // Reset first
            setTimeout(() => setSelectedOutfit(outfit ? outfit.uri : null), 10); // Then update after a short delay
          }}
          style={[styles.card, selectedOutfit === outfit?.uri && styles.selectedCard]} 
          disabled={!outfit} 
        >
            {outfit ? (
              <>
                <Image source={outfit.preview} style={styles.previewImage} />
                <View style={styles.priceContainer}>
                  <Ionicons name="logo-bitcoin" size={16} color="gold" />
                  <Text style={styles.priceText}>10</Text>
                </View>
              </>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Buy Button */}
      {selectedOutfit && (
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      )}

      {/* Model Display */}
      <View style={styles.modelContainer}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            <Model uri={humanModel} scale={{ x: 2, y: 2, z: 2 }} position={{ x: 0, y: -1.5, z: 0 }} />
            <Model uri={headModel} scale={{ x: 2, y: 2, z: 2 }} position={{ x: 0, y: -1.5, z: 0 }} />
            {selectedOutfit && <Model uri={selectedOutfit} scale={{ x: 2, y: 2, z: 2 }} position={{ x: 0, y: -1.5, z: 0 }} />}
          </Suspense>
          <OrbitControls />
        </Canvas>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  gridContainer: {
    width: '50%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 30,
  },
  card: {
    width: '22%',
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: 'gold',
    borderWidth: 3,
  },
  previewImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#333',
  },
  buyButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modelContainer: {
    width: '50%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
    zIndex: 10,
  },
});

