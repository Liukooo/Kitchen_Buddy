import React, { useEffect, useState } from 'react';

import {
  Alert,
  FlatList,
  TouchableOpacity
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

// Local imports
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { styles } from "@/components/ui/Styles";
import { Ingredient } from '@/constants/Ingredient';
import { Categories, Locations, Types } from '@/constants/Options';
import {
  getByCategoryOrConfection,
  getByLocation,
  getMissingData,
  getRecentlyAdded
} from '@/scripts/Functions';

// Defines navigation type
type RootStackParamList = {
  InfoIngredient: undefined;
  modifyIngredient: { ingredient: Ingredient };
};

// Defines navigation props
type NavigationProps = StackNavigationProp<RootStackParamList, "InfoIngredient">;

const InfoIngredientsScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedConfection, setSelectedConfection] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // Track the active query
  const navigation = useNavigation<NavigationProps>();

  // Fetches Ingredients from AsyncStorage and applys filters
  useFocusEffect(
    React.useCallback(() => {
      const fetchIngredients = async () => {
        const storedIngredients = await AsyncStorage.getItem('ingredients');
        if (storedIngredients) {
          const parsedIngredients: Ingredient[] = JSON.parse(storedIngredients);
          setIngredients(parsedIngredients);
          setFilteredIngredients(parsedIngredients);
        }
      };
      fetchIngredients();
    }, [])
  );

  // Applys filters when a filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedLocation, selectedConfection, activeFilter]);

  // Applys filters
  const applyFilters = () => {
    let results = ingredients;

    // Applys button filters first for Missing Data and Recently Added
    if (activeFilter === 'missing') {
      results = getMissingData(ingredients);
    } else if (activeFilter === 'recent') {
      results = getRecentlyAdded(ingredients);
    }

    // Applys dropdown filters on top of button filters
    if (selectedCategory) {
      results = getByCategoryOrConfection(results, selectedCategory, '');
    }
    if (selectedLocation) {
      results = getByLocation(results, selectedLocation);
    }
    if (selectedConfection) {
      results = getByCategoryOrConfection(results, '', selectedConfection);
    }

    setFilteredIngredients(results);
  };

  // Resets all filters
  const clearFilters = () => {
    setActiveFilter('all'); // Resets button filters
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedConfection('');
    setFilteredIngredients(ingredients); // Shows all ingredients
  };

  // Handles the Button Edit Ingredient
  const handleEditIngredient = (ingredient: Ingredient) => {
    Alert.alert(
      "Edit Ingredient",
      `You selected: ${ingredient.name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => navigation.navigate("modifyIngredient", { ingredient }),
        },
      ]
    );
  };

  // Handles Button Delete Ingredient
  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    Alert.alert(
      "Delete Ingredient?",
      `Are you sure you want to delete ${ingredient.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedIngredients = ingredients.filter((i) => i !== ingredient);
            await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
            setIngredients(updatedIngredients);
            setFilteredIngredients(updatedIngredients);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Title */}
        <ThemedText type="title">Explore Ingredients</ThemedText>
      {/* Buttons */}
      <ThemedView style={styles.content}>
        <ThemedView style={styles.buttonContainer}>

          {/* Recently */}
          <TouchableOpacity
            style={[styles.primaryButton, activeFilter === 'recent' && styles.secondaryButton]}
            onPress={() => setActiveFilter('recent')}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.buttonText}>Recently Added</ThemedText>
          </TouchableOpacity>

          {/* Missing */}
          <TouchableOpacity
            style={[styles.primaryButton, activeFilter === 'missing' && styles.secondaryButton]}
            onPress={() => setActiveFilter('missing')}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.buttonText}>Missing Data</ThemedText>
          </TouchableOpacity>

          {/* Reset */}
          <TouchableOpacity
            style={[styles.primaryButton, styles.dangerButton]}
            onPress={clearFilters}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.buttonText}>Clear Filters</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Category */}
        <ThemedText type="label">Category:</ThemedText>
        <Picker
          selectedValue={selectedCategory}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        >
          {Categories.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        {/* Location */}
        <ThemedText type="label">Location:</ThemedText>
        <Picker
          selectedValue={selectedLocation}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedLocation(itemValue)}
        >
          {Locations.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        {/* Confection Type */}
        <ThemedText type="label">Confection Type:</ThemedText>
        <Picker
          selectedValue={selectedConfection}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedConfection(itemValue)}
        >
          {Types.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        {/* Ingredients */}
        <FlatList
          data={filteredIngredients}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => (
            <ThemedView style={styles.item}>

              {/* Ingredient Info */}
              <ThemedText style={styles.itemText}>
                {item.name} | {item.category} | {item.location} | {item.type}
              </ThemedText>
      
              {/* Icons on the right */}
              <ThemedView style={styles.iconContainer}>
                {/* Modify Icon */}
                <TouchableOpacity onPress={() => handleEditIngredient(item)}>
                  <IconSymbol name="pencil" size={20} color="#007bff" style={styles.icon} />
                </TouchableOpacity>
      
                {/* Delete Icon */}
                <TouchableOpacity onPress={() => handleDeleteIngredient(item)}>
                  <IconSymbol name="trash" size={20} color="#dc3545" style={styles.icon} />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}
        />
      </ThemedView>
    </ThemedView>
  );
};

export default InfoIngredientsScreen;