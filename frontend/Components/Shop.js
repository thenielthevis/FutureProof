import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameNavbar from '../Navbar/GameNavbar';
import { readAssets, buyAsset, getUser } from '../API/api'; // Import the API functions to fetch and buy assets
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// Load 3D model component
function Model({ bodyUri, headUri, outfitUri, eyesUri, noseUri, scale, position }) {
  const body = useGLTF(bodyUri);
  const head = useGLTF(headUri);
  const outfit = outfitUri ? useGLTF(outfitUri) : null;
  const eyes = useGLTF(eyesUri);
  const nose = useGLTF(noseUri);

  body.scene.scale.set(scale.x, scale.y, scale.z);
  body.scene.position.set(position.x, position.y, position.z);

  head.scene.scale.set(scale.x, scale.y, scale.z);
  head.scene.position.set(position.x, position.y, position.z); // Adjust head position

  eyes.scene.scale.set(scale.x, scale.y, scale.z);
  eyes.scene.position.set(position.x, position.y, position.z); // Adjust eyes position

  nose.scene.scale.set(scale.x, scale.y, scale.z);
  nose.scene.position.set(position.x, position.y, position.z); // Adjust nose position

  if (outfit) {
    outfit.scene.scale.set(scale.x, scale.y, scale.z);
    outfit.scene.position.set(position.x, position.y, position.z); // Adjust outfit position
  }

  return (
    <>
      <primitive object={body.scene} />
      <primitive object={head.scene} />
      <primitive object={eyes.scene} />
      <primitive object={nose.scene} />
      {outfit && <primitive object={outfit.scene} />}
    </>
  );
}

export default function Shop() {
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [assets, setAssets] = useState([]);
  const [defaultBodyUri, setDefaultBodyUri] = useState('');
  const [defaultHeadUri, setDefaultHeadUri] = useState('');
  const [defaultEyesUri, setDefaultEyesUri] = useState('');
  const [defaultNoseUri, setDefaultNoseUri] = useState('');
  const [user, setUser] = useState({ coins: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null); // State to track selected category
  const navigation = useNavigation(); // Hook for navigation

  useEffect(() => {
    // Fetch assets from the backend
    const fetchAssets = async () => {
      try {
        const fetchedAssets = await readAssets();

        // Extract Body, Head, Eyes, and Nose URIs but exclude them from the selection cards
        const bodyAsset = fetchedAssets.find(asset => asset.name === 'Body');
        const headAsset = fetchedAssets.find(asset => asset.name === 'Head');
        const eyesAsset = fetchedAssets.find(asset => asset.name === 'Eyes');
        const noseAsset = fetchedAssets.find(asset => asset.name === 'Nose');

        if (bodyAsset) setDefaultBodyUri(bodyAsset.url);
        if (headAsset) setDefaultHeadUri(headAsset.url);
        if (eyesAsset) setDefaultEyesUri(eyesAsset.url);
        if (noseAsset) setDefaultNoseUri(noseAsset.url);

        // Filter out Body, Head, Eyes, and Nose from selection cards
        const filteredAssets = fetchedAssets.filter(asset => asset.name !== 'Body' && asset.name !== 'Head' && asset.name !== 'Eyes' && asset.name !== 'Nose');
        setAssets(filteredAssets);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchAssets();
    fetchUserData();
  }, []);

  // Group assets by asset_type
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
      acc[asset.asset_type] = [];
    }
    acc[asset.asset_type].push(asset);
    return acc;
  }, {});

  const handleBuy = async () => {
    try {
      const selectedAsset = assets.find(asset => asset.url === selectedOutfit);
      if (user.coins < selectedAsset.price) {
        Alert.alert('Insufficient Coins', 'You do not have enough coins to purchase this item.');
        return;
      }

      await buyAsset(selectedOutfit);
      Alert.alert('Success', 'Item purchased successfully!');
      setUser(prevUser => ({ ...prevUser, coins: prevUser.coins - selectedAsset.price }));
      setSelectedOutfit(null); // Reset selected outfit after purchase
    } catch (error) {
      console.error('Error buying asset:', error);
      Alert.alert('Error', 'Failed to purchase item.');
    }
  };

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <GameNavbar /> {/* Navbar added here */}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Left Half - 3D Model */}
      <View style={styles.leftHalf}>
        {/* Model Display */}
        <View style={styles.modelContainer}>
          <Canvas>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Suspense fallback={null}>
              <Model
                bodyUri={defaultBodyUri}
                headUri={defaultHeadUri}
                eyesUri={defaultEyesUri}
                noseUri={defaultNoseUri}
                outfitUri={selectedOutfit}
                scale={{ x: 3, y: 3, z: 3 }} // Reduced scale to 3x
                position={{ x: 0, y: -3.6, z: 0 }} // Adjusted position to bring the model downwards
              />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </View>
      </View>

      {/* Right Half - Category Buttons and Cards */}
      <View style={styles.rightHalf}>
        <ScrollView contentContainerStyle={styles.categoryButtonsContainer}>
          {Object.keys(groupedAssets).map((assetType) => (
            <View key={assetType}>
              <TouchableOpacity
                style={[styles.categoryButton, selectedCategory === assetType && styles.selectedCategoryButton]}
                onPress={() => setSelectedCategory(assetType)}
              >
                <Text style={styles.categoryButtonText}>{assetType.toUpperCase()}</Text>
              </TouchableOpacity>
              {selectedCategory === assetType && (
                <View style={styles.cardsContainer}>
                  {groupedAssets[assetType].map((asset, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedOutfit(null); // Reset first
                        setTimeout(() => setSelectedOutfit(asset ? asset.url : null), 10); // Then update after a short delay
                      }}
                      style={[styles.card, selectedOutfit === asset?.url && styles.selectedCard]}
                      disabled={!asset}
                    >
                      {asset ? (
                        <>
                          <Image source={{ uri: asset.image_url }} style={styles.previewImage} />
                          <View style={styles.priceContainer}>
                            <Ionicons name="logo-bitcoin" size={16} color="gold" />
                            <Text style={styles.priceText}>{asset.price}</Text>
                          </View>
                        </>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Buy Button */}
        {selectedOutfit && (
          <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
            <Text style={styles.buyButtonText}>Buy</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftHalf: {
    flex: 2,
    paddingLeft: 20,
  },
  rightHalf: {
    flex: 1,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  categoryButtonsContainer: {
    paddingVertical: 10,
    marginTop: 50
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  categoryButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#4CAF50', // Green color for selected category
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    width: '45%',
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
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: '50%',
    left: 20,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
    zIndex: 10,
    transform: [{ translateY: -25 }], // Adjust to center vertically
  },
});