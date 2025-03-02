import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView, Text, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameNavbar from '../Navbar/GameNavbar';
import { readAssets, buyAsset, purchaseItem, addOwnedAsset, getOwnedAssets, equipAsset, getEquippedAssets, unequipAsset } from '../API/assets_api'; // Import the API functions to fetch and buy assets
import { getUser } from '../API/user_api';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

function Model({ bodyUri, headUri, outfitUri, eyesUri, noseUri, scale, position }) {
  if (!bodyUri || !headUri || !eyesUri || !noseUri) {
    console.error("Missing required model URIs", { bodyUri, headUri, eyesUri, noseUri, outfitUri });
    return null; // Prevents the model from rendering if URIs are missing
  }

  const { scene: bodyScene } = useGLTF(bodyUri, true);
  const { scene: headScene } = useGLTF(headUri, true);
  const { scene: eyesScene } = useGLTF(eyesUri, true);
  const { scene: noseScene } = useGLTF(noseUri, true);
  const outfitScene = outfitUri ? useGLTF(outfitUri, true).scene : null;

  bodyScene.scale.set(scale.x, scale.y, scale.z);
  bodyScene.position.set(position.x, position.y, position.z);
  headScene.scale.set(scale.x, scale.y, scale.z);
  headScene.position.set(position.x, position.y, position.z);
  eyesScene.scale.set(scale.x, scale.y, scale.z);
  eyesScene.position.set(position.x, position.y, position.z);
  noseScene.scale.set(scale.x, scale.y, scale.z);
  noseScene.position.set(position.x, position.y, position.z);

  if (outfitScene) {
    outfitScene.scale.set(scale.x, scale.y, scale.z);
    outfitScene.position.set(position.x, position.y, position.z);
  }

  return (
    <group>
      <primitive object={bodyScene} />
      <primitive object={headScene} />
      <primitive object={eyesScene} />
      <primitive object={noseScene} />
      {outfitScene && <primitive object={outfitScene} />}
    </group>
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
  const [loading, setLoading] = useState(true); // Loading state
  const [ownedAssets, setOwnedAssets] = useState([]); // State to track owned assets
  const [equippedAssets, setEquippedAssets] = useState({}); // State to track equipped assets
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
      } finally {
        setLoading(false); // Set loading to false after fetching assets
      }
    };

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        setUser(userData);

        // Fetch owned assets
        const ownedAssets = await getOwnedAssets();
        setOwnedAssets(ownedAssets.asset_ids); // Assuming setOwnedAssets is a state setter for owned assets

        // Fetch equipped assets
        const equippedAssets = await getEquippedAssets();
        setEquippedAssets(equippedAssets || {}); // Ensure equippedAssets is an object
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

      console.log('Selected asset for purchase:', selectedAsset); // Log selected asset
      await buyAsset(selectedAsset._id.toString());
      await addOwnedAsset(selectedAsset._id.toString()); // Add the asset to owned assets
      Alert.alert('Success', 'Item purchased successfully!');
      setUser(prevUser => ({ ...prevUser, coins: prevUser.coins - selectedAsset.price }));
      setSelectedOutfit(null); // Reset selected outfit after purchase
      setOwnedAssets(prevOwnedAssets => [...prevOwnedAssets, selectedAsset._id.toString()]); // Update owned assets state
    } catch (error) {
      console.error('Error buying asset:', error);
      Alert.alert('Error', 'Failed to purchase item.');
    }
  };

  const handleEquip = async (assetType, assetId) => {
    try {
      console.log('Equipping asset:', assetType, assetId); // Log equipping action
      await equipAsset(assetType, assetId);
      Alert.alert('Success', 'Item equipped successfully!');
      setEquippedAssets(prevEquippedAssets => {
        const updatedEquippedAssets = { ...prevEquippedAssets };
        if (assetType === 'costume') {
          // Deselect other items when a costume is equipped
          Object.keys(updatedEquippedAssets).forEach(type => {
            if (type !== 'costume') {
              delete updatedEquippedAssets[type];
            }
          });
        }
        updatedEquippedAssets[assetType] = { _id: assetId, url: assets.find(asset => asset._id.toString() === assetId).url };
        return updatedEquippedAssets;
      });
    } catch (error) {
      console.error('Error equipping asset:', error);
      Alert.alert('Error', 'Failed to equip item.');
    }
  };

  const handleUnequip = async (assetType) => {
    try {
      console.log('Unequipping asset:', assetType); // Log unequipping action
      await unequipAsset(assetType);
      Alert.alert('Success', 'Item unequipped successfully!');
      setEquippedAssets(prevEquippedAssets => {
        const updatedEquippedAssets = { ...prevEquippedAssets };
        delete updatedEquippedAssets[assetType];
        return updatedEquippedAssets;
      }); // Update equipped assets state
    } catch (error) {
      console.error('Error unequipping asset:', error);
      Alert.alert('Error', 'Failed to unequip item.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#14243b', '#77f3bb']} style={styles.container}>
      <GameNavbar /> {/* Navbar added here */}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Game')}>
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
                scale={{ x: 2.5, y: 2.5, z: 2.5 }}
                position={{ x: 0, y: -3, z: 0 }}
              />
              {Object.keys(equippedAssets).map(assetType => (
                <Model
                  key={assetType}
                  bodyUri={defaultBodyUri}
                  headUri={defaultHeadUri}
                  eyesUri={defaultEyesUri}
                  noseUri={defaultNoseUri}
                  outfitUri={equippedAssets[assetType].url}
                  scale={{ x: 2, y: 2, z: 2 }}
                  position={{ x: 0, y: -2.6, z: 0 }}
                />
              ))}
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
                      style={[
                        styles.card,
                        selectedOutfit === asset?.url && styles.selectedCard,
                        equippedAssets[asset.asset_type] && equippedAssets[asset.asset_type]._id === asset._id.toString() && styles.equippedCard
                      ]}
                      disabled={!asset}
                    >
                      {asset ? (
                        <>
                          <Image source={{ uri: asset.image_url }} style={styles.previewImage} />
                          <View style={styles.priceContainer}>
                            <Ionicons name="logo-bitcoin" size={16} color="gold" />
                            <Text style={styles.priceText}>{asset.price}</Text>
                          </View>
                          {ownedAssets.includes(asset._id.toString()) ? (
                            <>
                              <TouchableOpacity
                                style={styles.equipButton}
                                onPress={() => handleEquip(asset.asset_type, asset._id.toString())}
                              >
                                <Text style={styles.equipButtonText}>Equip</Text>
                              </TouchableOpacity>
                              {equippedAssets[asset.asset_type] && equippedAssets[asset.asset_type]._id === asset._id.toString() && (
                                <TouchableOpacity
                                  style={styles.unequipButton}
                                  onPress={() => handleUnequip(asset.asset_type)}
                                >
                                  <Text style={styles.unequipButtonText}>Unequip</Text>
                                </TouchableOpacity>
                              )}
                            </>
                          ) : (
                            <TouchableOpacity
                              style={styles.buyButton}
                              onPress={handleBuy}
                              disabled={ownedAssets.includes(asset._id.toString())}
                            >
                              <Text style={styles.buyButtonText}>Buy</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
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
    marginTop: 70
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
    height: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    padding: 10,
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
  equippedCard: {
    backgroundColor: '#4CAF50', // Green color for equipped items
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
    backgroundColor: '#ff9800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  equipButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  equipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  unequipButton: {
    backgroundColor: '#f44336',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  unequipButtonText: {
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});