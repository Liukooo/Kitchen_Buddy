import React, { useState } from "react";
import { StatusBar, TextInput, Button, Alert, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

type Ingredient = {
  name: string;
  category: string;
  location: string;
  type: string;
  expirationDate: string;
};

const ModifyIngredient = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ingredient = route.params as Ingredient;

  const [name, setName] = useState(ingredient.name);
  const [category, setCategory] = useState(ingredient.category);
  const [location, setLocation] = useState(ingredient.location);
  const [type, setType] = useState(ingredient.type);
  const [expirationDate, setExpirationDate] = useState(ingredient.expirationDate);

  const handleSave = () => {
    // Implement the update logic (e.g., update local state)
    Alert.alert("Updated", `Ingredient ${name} has been updated!`);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Edit Ingredient</ThemedText>
        </ThemedView>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Category" />
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
      <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Confection type" />
      <TextInput style={styles.input} value={expirationDate} onChangeText={setExpirationDate} placeholder="Expiration Date" />
      <Button title="Save Changes" onPress={handleSave} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: StatusBar.currentHeight || 0,
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
  input: { backgroundColor: "white", height: 50, paddingHorizontal: 5, marginBottom: 16, color: "black" },
});

export default ModifyIngredient;