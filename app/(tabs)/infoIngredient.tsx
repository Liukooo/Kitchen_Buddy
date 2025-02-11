import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  getMissingData,
  getRecentlyAdded,
  getByCategoryOrConfection,
  getByLocation,
  Ingredient,
} from '@/scripts/ingredientQueries';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect  } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  InfoIngredient: undefined;
  modifyIngredient: { ingredient: Ingredient };
};

type NavigationProps = StackNavigationProp<RootStackParamList, "InfoIngredient">;

const InfoIngredientsScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedConfection, setSelectedConfection] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // Track the active query

  const navigation = useNavigation<NavigationProps>();

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

  const applyFilters = () => {
    let results = ingredients;

    // Apply button filters first (Missing Data / Recently Added)
    if (activeFilter === 'missing') {
      results = getMissingData(ingredients);
    } else if (activeFilter === 'recent') {
      results = getRecentlyAdded(ingredients);
    }

    // Apply dropdown filters on top of button filters
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

  // Apply filters when a filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedLocation, selectedConfection, activeFilter]);

  // Function to reset all filters
  const clearFilters = () => {
    setActiveFilter('all'); // Reset button filters
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedConfection('');
    setFilteredIngredients(ingredients); // Show all ingredients
  };

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

  // Delete ingredients
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore Ingredients</ThemedText>
      </ThemedView>
      {/* Buttons */}
      <ThemedView style={styles.buttonRow}>

        {/* Recently */}
        <TouchableOpacity
          style={[styles.button, activeFilter === 'recent' && styles.activeButton]}
          onPress={() => setActiveFilter('recent')}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.buttonText}>Recently Added</ThemedText>
        </TouchableOpacity>

        {/* Missing */}
        <TouchableOpacity
          style={[styles.button, activeFilter === 'missing' && styles.activeButton]}
          onPress={() => setActiveFilter('missing')}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.buttonText}>Missing Data</ThemedText>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearFilters}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.clearButtonText}>Clear Filters</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Category */}
      <ThemedText style={styles.label}>Category:</ThemedText>
      <Picker
        selectedValue={selectedCategory}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
      >
        <Picker.Item label="All Categories" value="" />
        <Picker.Item label="Fruit" value="fruit" />
        <Picker.Item label="Vegetable" value="vegetable" />
        <Picker.Item label="Dairy" value="dairy" />
        <Picker.Item label="Fish" value="fish" />
        <Picker.Item label="Meat" value="meat" />
        <Picker.Item label="Beverage" value="beverage" />
      </Picker>

      {/* Location */}
      <ThemedText style={styles.label}>Location:</ThemedText>
      <Picker
        selectedValue={selectedLocation}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedLocation(itemValue)}
      >
        <Picker.Item label="All Locations" value="" />
        <Picker.Item label="Fridge" value="fridge" />
        <Picker.Item label="Freezer" value="freezer" />
        <Picker.Item label="Pantry" value="pantry" />
      </Picker>

      {/* Type */}
      <ThemedText style={styles.label}>Confection Type:</ThemedText>
      <Picker
        selectedValue={selectedConfection}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedConfection(itemValue)}
      >
        <Picker.Item label="All Confections" value="" />
        <Picker.Item label="Fresh" value="fresh" />
        <Picker.Item label="Canned" value="canned" />
        <Picker.Item label="Frozen" value="frozen" />
        <Picker.Item label="Cured" value="cured" />
      </Picker>

      {/* Ingredients */}
      <FlatList
        data={filteredIngredients}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <ThemedView style={styles.item}>

            {/* Ingredient Info */}
            <ThemedText style={styles.itemText}>
              {item.name} - {item.category} - {item.location} - {item.type}
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
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight || 0,
    flex: 1,
    padding: 32,
    gap: 12,
    overflow: 'hidden',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around'},
  button: { 
    backgroundColor: '#007bff', 
    padding: 12, 
    borderRadius: 5, 
    alignItems: 'center', 
    flex: 1, 
    marginHorizontal: 5 
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  activeButton: { backgroundColor: '#0056b3' },
  clearButton: { backgroundColor: '#dc3545' },
  clearButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  label: { fontSize: 18, marginTop: 10, marginBottom: 5 },
  picker: { backgroundColor: 'white', height: 50, borderWidth: 0.5, marginBottom: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  iconContainer: {
    flexDirection: "row",
    marginRight: 10,
  },
  icon: {
    marginHorizontal: 5,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
});

export default InfoIngredientsScreen;