import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExpiringSoon, Ingredient } from '../../scripts/ingredientQueries';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect } from 'expo-router';

const ExpiringSoonScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchIngredients = async () => {
        const storedIngredients = await AsyncStorage.getItem('ingredients');
        if (storedIngredients) {
          const parsedIngredients: Ingredient[] = JSON.parse(storedIngredients);
          setIngredients(getExpiringSoon(parsedIngredients, 3)); // Show items expiring in ≤ 3 days
        }
      };

      fetchIngredients();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Expiring Soon</ThemedText>
      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <ThemedView style={styles.itemContainer}>
            <ThemedText style={styles.itemText}>{item.name}</ThemedText>
            <ThemedText style={styles.itemSubText}>Expires on: {item.expirationDate}</ThemedText>
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
    padding: 20,
  },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  itemText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black"
  },
  itemSubText: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
});

export default ExpiringSoonScreen;