import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExpiringSoon, Ingredient } from '../../scripts/ingredientQueries';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const ExpiringSoonScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      const storedIngredients = await AsyncStorage.getItem('ingredients');
      if (storedIngredients) {
        const parsedIngredients: Ingredient[] = JSON.parse(storedIngredients);
        setIngredients(getExpiringSoon(parsedIngredients, 3)); // Show items expiring in ≤ 3 days
      }
    };

    fetchIngredients();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Expiring Soon</ThemedText>
      </ThemedView>
      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <ThemedView style={styles.item}>
            <ThemedText>{item.name} - Expires on: {item.expirationDate}</ThemedText>
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
    gap: 16,
    overflow: 'hidden',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});

export default ExpiringSoonScreen;

  
