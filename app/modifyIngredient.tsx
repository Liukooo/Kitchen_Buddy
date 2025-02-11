import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ingredient } from '@/scripts/ingredientQueries';
import { Categories, Locations, Types } from '@/constants/Options';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Define navigation type
type RootStackParamList = {
  modifyIngredient: { ingredient: Ingredient };
};

const ModifyIngredientScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'modifyIngredient'>>();
  const route = useRoute();
  const { ingredient } = route.params as { ingredient: Ingredient };

  const [modifiedIngredient, setModifiedIngredient] = useState<Ingredient>({ ...ingredient });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date(ingredient.expirationDate));

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") return setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Keep only YYYY-MM-DD
      setModifiedIngredient({ ...modifiedIngredient, expirationDate: formattedDate });
    }
    setShowDatePicker(false);
  };

  const handleSaveChanges = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem('ingredients');
      let ingredients: Ingredient[] = storedIngredients ? JSON.parse(storedIngredients) : [];
      
      const updatedIngredients = ingredients.map((item) => 
        item.name === ingredient.name ? modifiedIngredient : item
      );
      
      await AsyncStorage.setItem('ingredients', JSON.stringify(updatedIngredients));
      Alert.alert('Success 🎉', 'Ingredient updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update ingredient');
    }
  };

  const handleDiscardChanges = () => {
    Alert.alert('Discard Changes?', 'Are you sure you want to discard changes?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', onPress: () => navigation.goBack(), style: 'destructive' }
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Modify Ingredient</ThemedText>

      {/* Name */}
      <TextInput
        style={styles.input}
        value={modifiedIngredient.name}
        onChangeText={(text) => setModifiedIngredient({ ...modifiedIngredient, name: text })}
        placeholder="Ingredient Name"
      />

      {/* Category */}
      <Picker
        selectedValue={modifiedIngredient.category}
        style={styles.picker}
        onValueChange={(itemValue) => setModifiedIngredient({ ...modifiedIngredient, category: itemValue })}
      >
        {Categories.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Location */}
      <Picker
        selectedValue={modifiedIngredient.location}
        style={styles.picker}
        onValueChange={(itemValue) => setModifiedIngredient({ ...modifiedIngredient, location: itemValue })}
      >
        {Locations.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Confection Type */}
      <Picker
        selectedValue={modifiedIngredient.type}
        style={styles.picker}
        onValueChange={(itemValue) => setModifiedIngredient({ ...modifiedIngredient, type: itemValue })}
      >
        {Types.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Date Selection */}
      <>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText style={styles.dateButtonText}>Pick Expiration Date</ThemedText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={expirationDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <ThemedText style={styles.buttonText}>Save</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscardChanges}>
          <ThemedText style={styles.buttonText}>Discard</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight || 0,
    flex: 1,
    padding: 20,
    gap: 12,
  },
  input: {
    backgroundColor: "white",
    height: 50,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    color: "black",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  picker: {
    height: 50,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  dateButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 5, alignItems: "center", marginBottom: 16 },
  dateButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ModifyIngredientScreen;