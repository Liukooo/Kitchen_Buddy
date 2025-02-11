import React from 'react';

import { TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';

// Local imports
import { ThemedView } from '@/components/ThemedView';
import { styles } from "@/components/ui/Styles";
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.containerHome}>
      <ThemedText type='title'>Kitchen Buddy 🍽️</ThemedText>
      <ThemedText type='subtitle'>Track your ingredients with ease!</ThemedText>
      <TouchableOpacity 
        style={styles.getStartedButton} 
        onPress={() => router.push('/(tabs)/addIngredient')}
      >
        <ThemedText style={styles.buttonText}>Get Started</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}