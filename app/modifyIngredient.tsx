import React, { useEffect, useState } from 'react';

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
import { Categories, Locations, Types, Status } from '@/constants/Options';
import DatePicker from '@/components/DatePicker';
import { useRipeness } from "@/hooks/useRipeness";
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

  const [initialStatus] = useState(ingredient.status);
  const [initialExpirationDate] = useState(new Date(ingredient.expirationDate))
  const [hasBeenFrozen, setHasBeenFrozen] = useState(false); // Tracks if frozen was applied
  const [hasBeenRipped, setHasBeenRipped] = useState(false); // Tracks if ripe was applied
  const [isChecked, setIsChecked] = useState(false); // Tracks if ingredient was checked
  const [isOpened, setIsOpened] = useState(ingredient.isOpened || false);
  const [isExactDate, setIsExactDate] = useState(!!ingredient.expirationDate);
  const [commonEstimate, setCommonEstimate] = useState(ingredient.expirationDate || "");
  const [expirationDate, setExpirationDate] = useState(
    ingredient.expirationDate ? new Date(ingredient.expirationDate) : new Date()
  );
  const [modifiedIngredient, setModifiedIngredient] = useState<Ingredient>({ ...ingredient});

  const { confection, setConfection, ripeness, setRipeness, isFresh } = useRipeness(ingredient.type || "", ingredient.status);

  const today = new Date();
  const now = today.toISOString(); 

  const daysRemaining = Math.ceil((initialExpirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Updates ripeness info when it changes
  useEffect(() => {
    // If ripeness status has changed and confection type is fresh
    if (modifiedIngredient.status !== ripeness && modifiedIngredient.type === "fresh") {
      setModifiedIngredient((prev) => ({
        ...prev,
        status: ripeness,
        // Tracks when ripeness changes
        ripenessChangedAt: now,
        // Updates last checked time
        lastCheckedAt: now,
      }));
      // When ripeness status changes the checking is automatic
      setIsChecked(true);
    }
  }, [ripeness]);
  

  // Sets the ingredient as opened and shortens its expiration date based on how many days remain
  const handleOpenChanges = (newValue: boolean) => {
    if (newValue) {
      const newExpirationDate = new Date(initialExpirationDate);
  
      let shouldShowAlert = false;
  
      if (daysRemaining > 7) {
        // Set expiration to exactly 7 days from today
        newExpirationDate.setDate(today.getDate() + 7);
        shouldShowAlert = true;
      } else if (daysRemaining > 0) {
        // Cut the remaining time in half
        newExpirationDate.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining / 2)));
        shouldShowAlert = true;
      } 
      // Remaining ingredient are already expired and do nothing/no alert
  
      if (shouldShowAlert) {
        Alert.alert(
          `Item has been opened! 🔓`,
          `The expiration date has been adjusted to: ${newExpirationDate.toISOString().split("T")[0]}.\nWould you like to proceed?`,
          [
            {
              text: "YES",
              onPress: () => {
                setIsOpened(true);
                setExpirationDate(newExpirationDate);
                setModifiedIngredient((prev) => ({
                  ...prev,
                  isOpened: true,
                  expirationDate: newExpirationDate.toISOString().split("T")[0],
                }));
              },
            },
            {
              text: "NO",
              onPress: () => {
                setIsOpened(false);
              },
              style: "cancel",
            },
          ],
          { cancelable: false }
        );
      } else {
        // Updates the state silently
        setIsOpened(true);
        setModifiedIngredient((prev) => ({ ...prev, isOpened: true }));
      }
    } else {
      // Reset state when toggling off
      setIsOpened(false);
      setExpirationDate(initialExpirationDate);
      setModifiedIngredient((prev) => ({
        ...prev,
        isOpened: false,
        expirationDate: initialExpirationDate.toISOString().split("T")[0],
      }));
    }
  };
  
  // Updates last checked time when user manually checks ripeness
  const handleCheckRipeness = () => {
    setIsChecked(true)
    setModifiedIngredient((prev) => ({
      ...prev,
      lastCheckedAt: now,
    }));
  };

  // Freezes ingredient only once if changing from a fresh type to frozen and extends expiration by 6 months
  const handleTypeChanges = (newType: string) => {
    setConfection(newType);
  
    setModifiedIngredient((prev) => {
      // Now changing to frozen?
      const isNowFrozen = newType === "frozen"; 
      // Copy the initial expiration date
      const frozenExpiration = new Date(initialExpirationDate);
  
      let updatedExpirationDate = prev.expirationDate;
      let resetRipeness = prev.status;
      let resetCheckedAt = prev.lastCheckedAt;
  
      // Resets ripeness if type leaves fresh
      if (!(newType === "fresh")) {
        resetRipeness = "";
        resetCheckedAt = "";
        setIsChecked(false);
      }
  
      // If now is set as frozen, before was fresh and was not already frozen
      if (prev.type === "fresh" && isNowFrozen && !hasBeenFrozen) {
        // Extends expiration date by 6 months
        frozenExpiration.setMonth(frozenExpiration.getMonth() + 6);
  
        updatedExpirationDate = frozenExpiration.toISOString().split("T")[0];
        setExpirationDate(frozenExpiration);
        setHasBeenFrozen(true);
  
        Alert.alert(
          `Item has been frozen! 🧊`,
          `The expiration date has been updated to: ${updatedExpirationDate}`
        );
      } 

      // Reverts expiration date if switching away from frozen
      else if (!isNowFrozen && hasBeenFrozen) {
        updatedExpirationDate = initialExpirationDate.toISOString().split("T")[0];
        setExpirationDate(initialExpirationDate);
        setHasBeenFrozen(false);
      }
  
      // Updated values
      return {
        ...prev,
        type: newType,
        status: resetRipeness,
        lastCheckedAt: resetCheckedAt,
        expirationDate: updatedExpirationDate,
      };
    });
  };

  const handleRipnessChanges = (newRipeness: string) => {
    setRipeness(newRipeness);
    setIsChecked(true);

    setModifiedIngredient((prev) => {
      // Now changing to frozen?
      const isNowRipe = newRipeness === "ripe";
      // Copy the current expiration date
      const ripeExpiration = new Date(expirationDate);

      let updatedExpirationDate = prev.expirationDate;
  
      // Check if transitioning from 'unripe' to 'ripe'
      if (initialStatus === "unripe" && isNowRipe && !hasBeenRipped) {
        
        if (daysRemaining > 7) {
          ripeExpiration.setDate(today.getDate() + 7);
        } else if (daysRemaining > 0) {
          ripeExpiration.setDate(today.getDate() + Math.max(1, Math.floor(daysRemaining / 2)));
        }

        updatedExpirationDate = ripeExpiration.toISOString().split("T")[0];
        setHasBeenRipped(true);
  
        Alert.alert(
          "Ripeness Updated 🍌",
          `The expiration date has been adjusted to: ${updatedExpirationDate}`
        );
      }

      // Reverts expiration date if switching away from ripe
      else if (!isNowRipe && hasBeenRipped) {
        updatedExpirationDate = initialExpirationDate.toISOString().split("T")[0];
        setExpirationDate(initialExpirationDate);
        setHasBeenRipped(false);
      }
  
      setExpirationDate(new Date(updatedExpirationDate));

      return {
        ...prev,
        status: newRipeness,
        expirationDate: updatedExpirationDate,
        lastCheckedAt: now,
      };
    });
  }
  
  // Handles Button Save Changes
  const handleSaveChanges = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem('ingredients');
      let ingredients: Ingredient[] = storedIngredients ? JSON.parse(storedIngredients) : [];
      
      const updatedIngredient = {
        ...modifiedIngredient,
        type: confection,
        status: isFresh ? ripeness : "",
        ripenessChangedAt: modifiedIngredient.ripenessChangedAt,
        lastCheckedAt: modifiedIngredient.lastCheckedAt,
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
        maxLength={20}
        onChangeText={(text) => setModifiedIngredient((prev) => ({ ...prev, name: text }))}
        placeholder="Ingredient Name"
      />

      {/* Brand */}
      <TextInput
        style={styles.input}
        value={modifiedIngredient.brand}
        maxLength={20}
        onChangeText={(itemValue) => setModifiedIngredient((prev) => ({ ...prev, brand: itemValue }))}
        placeholder="Brand Name"
      />

      {/* Category */}
      <Picker
        selectedValue={modifiedIngredient.category}
        style={styles.picker}
        onValueChange={(itemValue) => setModifiedIngredient((prev) => ({ ...prev, category: itemValue }))}
      >
        {Categories.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Location */}
      <Picker
        selectedValue={modifiedIngredient.location}
        style={styles.picker}
        onValueChange={(itemValue) => setModifiedIngredient((prev) => ({ ...prev, location: itemValue }))}
      >
        {Locations.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Confection Type */}
      <Picker
        selectedValue={modifiedIngredient.type}
        style={styles.picker}
        onValueChange={handleTypeChanges}
      >
        {Types.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
      </Picker>

      {/* Ripeness Status */}
      {isFresh && (
        <>
          <Picker 
          selectedValue={modifiedIngredient.status}
           style={styles.picker} 
           onValueChange={handleRipnessChanges}>
            {Status.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
          </Picker>
        </>
      )}

      {/* Check */}
      {isFresh && modifiedIngredient.status && (
        <ThemedView style={styles.switchContainer}>
          <ThemedText>Checked?</ThemedText>
          <Switch
            value={isChecked}
            onValueChange={handleCheckRipeness}
            trackColor={{ false: "#ccc", true: "#81b0ff" }}
          />
        </ThemedView>
      )}
      
      {/* Switch for Open */}
      <ThemedView style={styles.switchContainer}>
        <ThemedText>Opened?</ThemedText>
        <Switch
          value={isOpened}
          onValueChange={handleOpenChanges}
          trackColor={{ false: "#ccc", true: "#81b0ff" }}
        />
      </ThemedView>
      
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