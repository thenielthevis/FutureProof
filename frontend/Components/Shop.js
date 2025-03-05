import React, { useState, useEffect, Suspense } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Text, 
  Alert, 
  ActivityIndicator, 
  TextInput
} from 'react-native';
import Slider from '@react-native-community/slider';  // Update this import
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameNavbar from '../Navbar/GameNavbar';
import { readAssets, buyAsset, purchaseItem, addOwnedAsset, getOwnedAssets, equipAsset, getEquippedAssets, unequipAsset } from '../API/assets_api'; // Import the API functions to fetch and buy assets
import { getUser } from '../API/user_api';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorPicker } from 'react-native-color-picker';
import tinycolor from 'tinycolor2';  // Add this import

// Update the Model component to properly handle base model and outfit parts
function Model({ bodyUri, headUri, outfitUri, eyesUri, noseUri, scale, position, color, isBaseModel = false }) {
  // Load base model parts
  const bodyModel = bodyUri ? useGLTF(bodyUri) : null;
  const headModel = headUri ? useGLTF(headUri) : null;
  const eyesModel = eyesUri ? useGLTF(eyesUri) : null;
  const noseModel = noseUri ? useGLTF(noseUri) : null;
  const outfitModel = outfitUri ? useGLTF(outfitUri) : null;

  useEffect(() => {
    return () => {
      // Cleanup loaded models
      if (bodyModel) bodyModel.scene.traverse((obj) => obj.dispose && obj.dispose());
      if (headModel) headModel.scene.traverse((obj) => obj.dispose && obj.dispose());
      if (eyesModel) eyesModel.scene.traverse((obj) => obj.dispose && obj.dispose());
      if (noseModel) noseModel.scene.traverse((obj) => obj.dispose && obj.dispose());
      if (outfitModel) outfitModel.scene.traverse((obj) => obj.dispose && obj.dispose());
    };
  }, [bodyUri, headUri, eyesUri, noseUri, outfitUri]);

  // Apply transformations to models
  const applyTransforms = (scene) => {
    if (scene) {
      scene.scale.set(scale.x, scale.y, scale.z);
      scene.position.set(position.x, position.y, position.z);
    }
    return scene;
  };

  // Apply color to outfit
  if (outfitModel && color) {
    outfitModel.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.color.set(color);
      }
    });
  }

  return (
    <group>
      {bodyModel && <primitive object={applyTransforms(bodyModel.scene)} />}
      {headModel && <primitive object={applyTransforms(headModel.scene)} />}
      {eyesModel && <primitive object={applyTransforms(eyesModel.scene)} />}
      {noseModel && <primitive object={applyTransforms(noseModel.scene)} />}
      {outfitModel && <primitive object={applyTransforms(outfitModel.scene)} />}
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
  const [selectedColor, setSelectedColor] = useState(null);
  const [assetColors, setAssetColors] = useState({});  // Add this new state
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hexInput, setHexInput] = useState(null);

  const handleColorChange = (h, s, b) => {
    const color = tinycolor({ h, s, b });
    const hexColor = color.toHexString();
    console.log('Color changed:', hexColor); // Add logging
    
    setHexInput(hexColor);
    setSelectedColor(hexColor);
    
    if (selectedOutfit) {
      setAssetColors(prev => {
        const updated = {
          ...prev,
          [selectedOutfit]: hexColor
        };
        console.log('Updated asset colors:', updated); // Add logging
        return updated;
      });
    }
  };

  const handleHexInput = (hex) => {
    const color = tinycolor(hex);
    if (color.isValid()) {
      const hsv = color.toHsv();
      setHue(hsv.h);
      setSaturation(hsv.s * 100);
      setBrightness(hsv.v * 100);
      setHexInput(hex);
      setSelectedColor(hex);
      
      if (selectedOutfit) {
        setAssetColors(prev => ({
          ...prev,
          [selectedOutfit]: hex
        }));
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch user data
        const token = await AsyncStorage.getItem('token');
        const userData = await getUser(token);
        setUser(userData);

        // Fetch owned assets
        const ownedAssets = await getOwnedAssets();
        setOwnedAssets(ownedAssets.asset_ids); // Assuming setOwnedAssets is a state setter for owned assets

        // Fetch equipped assets with their colors
        const equippedAssetsData = await getEquippedAssets();
        setEquippedAssets(equippedAssetsData);
        
        // Initialize assetColors with equipped assets' colors
        const initialColors = {};
        Object.entries(equippedAssetsData).forEach(([type, asset]) => {
          if (asset.url && asset.color) {
            initialColors[asset.url] = asset.color;
          }
        });
        setAssetColors(initialColors);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      const color = assetColors[selectedOutfit];
      await equipAsset(assetType, assetId, color); // Modified to include color
      Alert.alert('Success', 'Item equipped successfully!');
      setEquippedAssets(prevEquippedAssets => {
        const updatedEquippedAssets = { ...prevEquippedAssets };
        if (assetType === 'costume') {
          Object.keys(updatedEquippedAssets).forEach(type => {
            if (type !== 'costume') delete updatedEquippedAssets[type];
          });
        }
        updatedEquippedAssets[assetType] = { 
          _id: assetId, 
          url: assets.find(asset => asset._id.toString() === assetId).url,
          color: color
        };
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

  // Modified ColorSelector component
  const ColorSelector = () => {
    const colorSuggestions = [
      { value: null, label: 'Original' }, // First option resets to original
      { value: '#B22222', label: 'Red' },      // Firebrick (Muted Red)
      { value: '#228B22', label: 'Green' },    // Forest Green (Natural Green)
      { value: '#4169E1', label: 'Blue' },     // Royal Blue (Muted but rich)
      { value: '#CCCC00', label: 'Yellow' },   // Olive Yellow (Less vibrant)
      { value: '#8B008B', label: 'Magenta' },  // Dark Magenta (Deeper shade)
      { value: '#20B2AA', label: 'Cyan' },     // Light Sea Green (More natural cyan)
      { value: '#F5F5F5', label: 'White' },    // Whitesmoke (Softer white)
      { value: '#333333', label: 'Black' }     // Dark Gray (Softer than pure black)
    ];

    if (!selectedOutfit || !ownedAssets.includes(assets.find(asset => asset.url === selectedOutfit)?._id.toString())) {
      return null;
    }

    return (
      <View style={styles.colorSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {colorSuggestions.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorSuggestion,
                { 
                  backgroundColor: color.value || 'transparent',
                  borderWidth: !color.value ? 2 : 1,
                  borderColor: color.value || '#ddd',
                },
                selectedColor === color.value && styles.selectedColorSuggestion
              ]}
              onPress={() => {
                setSelectedColor(color.value);
                setAssetColors(prev => ({
                  ...prev,
                  [selectedOutfit]: color.value // null for original color
                }));
              }}
            >
              {!color.value && (
                <Text style={styles.originalColorText}>{color.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Modified handleCardPress to keep original color
  const handleCardPress = (asset) => {
    setSelectedOutfit(null);
    setTimeout(() => {
      setSelectedOutfit(asset.url);
      // Check if asset is equipped and has a color
      const equippedAsset = Object.values(equippedAssets).find(ea => ea.url === asset.url);
      if (equippedAsset && equippedAsset.color) {
        setSelectedColor(equippedAsset.color);
      } else {
        setSelectedColor(null); // Reset to original color
      }
    }, 10);
  };

  // Update the renderModel function to properly separate model rendering
  const renderModel = ({ assetType, ...props }) => {
    const modelProps = {
      ...props,
      color: props.outfitUri ? (
        equippedAssets[assetType]?.color || 
        assetColors[props.outfitUri] || 
        null
      ) : null
    };

    return <Model {...modelProps} />;
  };

  // Add helper function to check if asset is equipped
  const isAssetEquipped = (asset) => {
    return Object.values(equippedAssets).some(
      equipped => equipped._id === asset._id.toString()
    );
  };

  const handleUnequipAll = async () => {
    try {
      // Create a copy of currently equipped assets
      const assetsToUnequip = Object.keys(equippedAssets);
      
      // Unequip each asset one by one
      for (const assetType of assetsToUnequip) {
        await unequipAsset(assetType);
      }
      
      // Clear states after all unequip operations are complete
      setSelectedOutfit(null);
      setEquippedAssets({});
      
      Alert.alert('Success', 'All items unequipped successfully!');
    } catch (error) {
      console.error('Error unequipping all assets:', error);
      Alert.alert('Error', 'Failed to unequip all items.');
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
      <GameNavbar />
      <View style={styles.mainContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Game')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Main Content Container */}
        <View style={styles.contentWrapper}>
          {/* Left Half - 3D Model */}
          <View style={styles.leftHalf}>
            {/* Model Display */}
            <View style={styles.modelContainer}>
              <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} />
                <Suspense fallback={null}>
                  {/* Base Model */}
                  <Model
                    bodyUri={defaultBodyUri}
                    headUri={defaultHeadUri}
                    eyesUri={defaultEyesUri}
                    noseUri={defaultNoseUri}
                    scale={{ x: 2.3, y: 2.3, z: 2.3 }}
                    position={{ x: 0, y: -3.25, z: 0 }}
                    isBaseModel={true}
                  />

                  {/* Selected Outfit */}
                  {selectedOutfit && (
                    <Model
                      outfitUri={selectedOutfit}
                      scale={{ x: 2.3, y: 2.3, z: 2.3 }}
                      position={{ x: 0, y: -3.25, z: 0 }}
                      color={assetColors[selectedOutfit] || null}
                    />
                  )}

                  {/* Equipped Assets */}
                  {Object.entries(equippedAssets).map(([assetType, asset]) => (
                    <Model
                      key={`equipped-${assetType}`}
                      outfitUri={asset.url}
                      scale={{ x: 2, y: 2, z: 2 }}
                      position={{ x: 0, y: -2.6, z: 0 }}
                      color={asset.color}
                    />
                  ))}
                </Suspense>
                <OrbitControls />
              </Canvas>
            </View>
          </View>

          {/* Right Half - Shop Interface */}
          <View style={styles.rightHalf}>
            {/* Color Selector */}
            {selectedOutfit && ownedAssets.includes(
              assets.find(asset => asset.url === selectedOutfit)?._id.toString()
            ) && (
              <View style={styles.colorSelectorSticky}>
                <ColorSelector />
              </View>
            )}

            {/* Category and Items */}
            <View style={styles.shopContent}>
              <ScrollView style={styles.scrollContainer}>
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
                              onPress={() => handleCardPress(asset)}
                              style={[
                                styles.card,
                                selectedOutfit === asset?.url && styles.selectedCard,
                                isAssetEquipped(asset) && styles.equippedCard
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
                                      {isAssetEquipped(asset) ? (
                                        <TouchableOpacity
                                          style={styles.unequipButton}
                                          onPress={() => handleUnequip(asset.asset_type)}
                                        >
                                          <Text style={styles.unequipButtonText}>Unequip</Text>
                                        </TouchableOpacity>
                                      ) : (
                                        <TouchableOpacity
                                          style={styles.equipButton}
                                          onPress={() => handleEquip(asset.asset_type, asset._id.toString())}
                                        >
                                          <Text style={styles.equipButtonText}>Equip</Text>
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
                  
                  {/* Move ColorSelector inside ScrollView */}
                  <View style={styles.colorSelectorWrapper}>
                    <ColorSelector />
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    marginTop: 70, // Height of GameNavbar
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  leftHalf: {
    flex: 2,
    marginRight: 20,
  },
  rightHalf: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    borderRadius: 15,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  colorSelectorSticky: {
    backgroundColor: 'rgba(44, 62, 80, 0.98)',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  shopContent: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    paddingHorizontal: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  leftHalf: {
    flex: 2,
    paddingLeft: 20,
  },
  rightHalf: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    height: '100%',
    position: 'relative',
  },
  categoryButtonsContainer: {
    paddingVertical: 10,
    paddingBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 10,
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedCategoryButton: {
    backgroundColor: '#4CAF50', // Green color for selected category
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    width: '47%', // Adjust from 45% to 47% for better spacing
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    borderColor: 'gold',
    borderWidth: 3,
  },
  equippedCard: {
    backgroundColor: '#4CAF50', // Green color for equipped items
  },
  previewImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 5,
    borderRadius: 15,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#333',
  },
  buyButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  equipButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  equipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  unequipButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  unequipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  modelContainer: {
    width: '100%',
    height: '85%', // Reduce height to make room for controls
  },
  modelControlsContainer: {
    width: '100%',
    height: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
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
  colorSelectorWrapper: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  colorSelectorContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 1000,
  },
  colorWheelContainer: {
    height: 150,
    marginBottom: 10,
  },
  colorWheel: {
    flex: 1,
    width: '100%',
  },
  colorSuggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  colorSuggestion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorSuggestion: {
    borderWidth: 3,
    borderColor: '#000',
  },
  originalColorText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  hsbControls: {
    marginVertical: 15,
  },
  sbBox: {
    width: 200,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  sbGradient: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  sbSelector: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  sliderContainer: {
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 5,
  },
  hexInputContainer: {
    marginVertical: 10,
  },
  hexLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  hexInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: '#333',
  },
  unequipAllButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  unequipAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});