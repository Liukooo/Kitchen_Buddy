import React, { useState } from 'react';

import { FlatList } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// Local imports
import { getExpiringSoon } from '@/scripts/Functions';
import { Ingredient } from '@/constants/Ingredient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { styles } from "@/components/ui/Styles";
import { Status } from '@/constants/Options';

const ExpiringSoonScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Fetches Ingredients from AsyncStorage and adds to the list only Expiring Soon
  useFocusEffect(
  React.useCallback(() => {
      const fetchIngredients = async () => {
        const storedIngredients = await AsyncStorage.getItem('ingredients');
        if (storedIngredients) {
          const parsedIngredients: Ingredient[] = JSON.parse(storedIngredients);
          const expiringSoon = getExpiringSoon(parsedIngredients, 7);

          // Sorts ingredients by expiration date
          const sortedIngredients = expiringSoon.sort((a, b) =>
            new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
          );

          setIngredients(sortedIngredients);
        }
      };

      fetchIngredients();
    }, [])
  );


  return (
    <ThemedView style={styles.container}>
      {/* Title */}
      <ThemedText type="title">Expiring Soon</ThemedText>
      {/* List of Expiring Soon Ingredients */}
      <ThemedView style={styles.content}>
        <FlatList
          data={ingredients}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => {
            const today = new Date();
            const expirationDate = new Date(item.expirationDate);
            const isExpired = expirationDate < today;
            const statusLabel = Status.find((s) => s.value === item.status)?.label || item.status;

            return (
              <ThemedView style={styles.itemContainer}>
                <ThemedText style={styles.itemTitle}>{item.name}</ThemedText>

              {/* Expiration Date */}
                {isExpired ? (
                  <ThemedText style={styles.itemDangerText}>Expired on: {item.expirationDate}</ThemedText>
                ) : (
                  <ThemedText style={styles.itemSubText}>Expires on: {item.expirationDate}</ThemedText>
                )}

              {/* Ripeness Status */}
                {item.status && (
                  <>
                    <ThemedText style={styles.itemSubText}>Status: {statusLabel}</ThemedText>
                  </>
                )}
              
              {/* Opened Ingredients */}
                {item.isOpened && (
                  <ThemedText style={styles.itemDangerText}>OPENED</ThemedText>
                )}

              {/* Opened Ingredients */}
                {item.lastCheckedAt && (
                  <ThemedText style={styles.itemSubText}>
                    Last checked: {new Date(item.lastCheckedAt).toLocaleDateString()}
                  </ThemedText>
                )}

                {!item.lastCheckedAt || (new Date().getTime() - new Date(item.lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24) > 3 && (
                  <ThemedText style={styles.itemDangerText}>
                    Needs checking! ⚠️
                  </ThemedText>
                )}
                
              </ThemedView>
            );
          }}
        />
      </ThemedView>
    </ThemedView>
  );
};

export default ExpiringSoonScreen;