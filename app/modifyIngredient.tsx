import React, { useMemo, useState } from 'react';

import {
  Alert,
  Switch,
  TextInput,
  TouchableOpacity
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Local imports
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ingredient } from '@/constants/Ingredient';
import { styles } from "@/components/ui/Styles";
import { Categories, Locations, Types } from '@/constants/Options';
import DatePicker from '@/components/DatePicker';
import { getEstimatedDate } from '@/scripts/Functions';


// Define navigation type
type RootStackParamList = {
  modifyIngredient: { ingredient: Ingredient };
};

const ModifyIngredientScreen: React.FC = () => {
  // Defines navigation props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'modifyIngredient'>>();

  const route = useRoute();
  const { ingredient } = route.params as { ingredient: Ingredient };

  const [modifiedIngredient, setModifiedIngredient] = useState<Ingredient>({ ...ingredient });
  const [isExactDate, setIsExactDate] = useState(!!ingredient.expirationDate);
  const [commonEstimate, setCommonEstimate] = useState(ingredient.expirationDate || "");
  const [expirationDate, setExpirationDate] = useState(
    ingredient.expirationDate ? new Date(ingredient.expirationDate) : new Date()
  );

  // Handles Button Save Changes
  const handleSaveChanges = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem('ingredients');
      let ingredients: Ingredient[] = storedIngredients ? JSON.parse(storedIngredients) : [];
      
      const updatedIngredient = {
        ...modifiedIngredient,
        expirationDate: isExactDate ? expirationDate.toISOString().split("T")[0] : getEstimatedDate(commonEstimate),
      };

      const updatedIngredients = ingredients.map((item) => 
        item.name === ingredient.name ? updatedIngredient : item
      );
      
      await AsyncStorage.setItem('ingredients', JSON.stringify(updatedIngredients));
      Alert.alert('Success 🎉', 'Ingredient updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update ingredient');
    }
  };

  // Handles Button Discard Changes
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

      {/* Brand */}
      <TextInput
        style={styles.input}
        value={modifiedIngredient.brand}
        onChangeText={(itemValue) => setModifiedIngredient({ ...modifiedIngredient, brand: itemValue })}
        placeholder="Brand Name"
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

      {/* Switch for Exact Date */}
      <ThemedView style={styles.switchContainer}>
        <ThemedText>Exact Date</ThemedText>
        <Switch value={isExactDate} onValueChange={setIsExactDate} trackColor={{ false: "#ccc", true: "#81b0ff" }}/>
      </ThemedView>

      {/* Date Selection */}
      {isExactDate ? (
          <DatePicker 
            date={expirationDate} 
            onDateChange={(date) => {
              setExpirationDate(date);
              setModifiedIngredient({
                ...modifiedIngredient, 
                expirationDate: date.toISOString().split("T")[0]
              });
            }}  
          />
        ) : (
          <>
            <ThemedText type="label">Estimated Expiration:</ThemedText>
            <Picker 
              selectedValue={commonEstimate} 
              style={styles.picker} 
              onValueChange={(itemValue) => {
                setCommonEstimate(itemValue); 
                setModifiedIngredient({ 
                  ...modifiedIngredient, 
                  expirationDate: getEstimatedDate(itemValue) 
                });
              }}
            >
              <Picker.Item label="Select Date" value="" />
              <Picker.Item label="2 days from now" value="2 days" />
              <Picker.Item label="1 week from now" value="1 week" />
              <Picker.Item label="10 days from now" value="10 days" />
              <Picker.Item label="1 month from now" value="1 month" />
            </Picker>
          </>
        )}

      {/* Buttons */}
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.successButton} onPress={handleSaveChanges}>
          <ThemedText style={styles.buttonText}>Save</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDiscardChanges}>
          <ThemedText style={styles.buttonText}>Discard</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default ModifyIngredientScreen;