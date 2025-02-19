import React, { useEffect, useRef, useState } from 'react';

import {
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
import { showConfirmation, showAlert } from "@/components/ShowAlert";
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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "modifyIngredient">>();

  const route = useRoute();
  const { ingredient } = route.params as { ingredient: Ingredient };

  const [initialStatus] = useState<string | undefined>(ingredient.status);
  const [initialExpirationDate] = useState<Date>(new Date(ingredient.expirationDate))
  const [hasBeenFrozen, setHasBeenFrozen] = useState<boolean>(false); // Tracks if frozen was applied
  const [hasBeenRipped, setHasBeenRipped] = useState<boolean>(false); // Tracks if ripe was applied
  const [isChecked, setIsChecked] = useState<boolean>(false); // Tracks if ingredient was checked
  const [isOpened, setIsOpened] = useState<boolean>(ingredient.isOpened || false);
  const [isExactDate, setIsExactDate] = useState<boolean>(!!ingredient.expirationDate);
  const [commonEstimate, setCommonEstimate] = useState<string>(ingredient.expirationDate || "");
  const [expirationDate, setExpirationDate] = useState<Date>(
    ingredient.expirationDate ? new Date(ingredient.expirationDate) : new Date()
  );
  const [modifiedIngredient, setModifiedIngredient] = useState<Ingredient>({ ...ingredient});

  const { confection, setConfection, ripeness, setRipeness, isFresh } = useRipeness(ingredient.type || "", ingredient.status);

  const today = new Date();
  const now = today.toISOString();
  const nowRef = useRef(new Date().toISOString());

  const daysRemaining = Math.max(0, Math.ceil((initialExpirationDate.getTime() - today.getTime()) / 86400000));

  // Updates ripeness info when it changes
  useEffect(() => {
    // If ripeness status has changed and confection type is fresh
    if (modifiedIngredient.type === "fresh" && modifiedIngredient.status !== ripeness) {
      setModifiedIngredient((prev) => updateCheckedIngredient(prev, true, nowRef.current));
      // When ripeness status changes the checking is automatic
      setIsChecked(true);
    }
    else if (modifiedIngredient.type !== "fresh") {
      // If the ingredient is no longer fresh, reset the checked state
      setModifiedIngredient((prev) => updateCheckedIngredient(prev, false, ""));
      setIsChecked(false);
    }
  }, [ripeness, modifiedIngredient.type]);

  // Updates Ingredients Type and freezes ingredient only once if changing from a fresh type to frozen and extends expiration by 6 months
  const updateIngredientType = (ingredient: Ingredient, newType: string, initialExpirationDate: Date, hasBeenFrozen: boolean): Ingredient => {
    const isNowFrozen = newType === "frozen";
    const frozenExpiration = new Date(initialExpirationDate);
  
    let updatedExpirationDate = ingredient.expirationDate;
    let resetRipeness = ingredient.status;
    let resetCheckedAt = ingredient.lastCheckedAt;
  
    // Reset ripeness if switching away from fresh
    if (newType !== "fresh") {
        resetRipeness = "";
        resetCheckedAt = "";
    }
  
    // If switching to frozen for the first time
    if (ingredient.type === "fresh" && isNowFrozen && !hasBeenFrozen) {
        frozenExpiration.setMonth(frozenExpiration.getMonth() + 6);
        updatedExpirationDate = frozenExpiration.toISOString().split("T")[0];

        showAlert(`Item has been frozen! 🧊`, `The expiration date has been updated to: ${updatedExpirationDate}`);
    } 
    // If switching away from frozen, revert to initial expiration date
    else if (!isNowFrozen && hasBeenFrozen) {
        updatedExpirationDate = initialExpirationDate.toISOString().split("T")[0];
    }

    return {
        ...ingredient,
        type: newType,
        status: resetRipeness,
        lastCheckedAt: resetCheckedAt,
        expirationDate: updatedExpirationDate,
    };
  };

  // Handles changing of Type and updates state
  const handleTypeChanges = (newType: string) => {
    setConfection(newType);

    setModifiedIngredient((prev) => {
        const updatedIngredient = updateIngredientType(prev, newType, initialExpirationDate, hasBeenFrozen);
        
        // Separate state updates for side effects
        if (newType === "frozen" && prev.type === "fresh" && !hasBeenFrozen) {
            setHasBeenFrozen(true);
            setExpirationDate(new Date(updatedIngredient.expirationDate));
        } else if (prev.type === "frozen" && newType !== "frozen") {
            setHasBeenFrozen(false);
            setExpirationDate(initialExpirationDate);
        }

        return updatedIngredient;
    });
  };

  //Updates ripeness and adjusts expiration date if transitioning from "unripe" to "ripe"
  const updateIngredientRipeness = (
    ingredient: Ingredient, 
    newRipeness: string, 
    initialStatus: string | undefined, 
    daysRemaining: number,
    today: Date
  ): Ingredient => {
    const isNowRipe = newRipeness === "ripe";
    const ripeExpiration = new Date(ingredient.expirationDate);
    let updatedExpirationDate = ingredient.expirationDate;
  
    // If transitioning from "unripe" to "ripe" and hasn't been ripened before
    if (initialStatus === "unripe" && isNowRipe) {
      if (daysRemaining > 7) {
        ripeExpiration.setDate(today.getDate() + 7);
      } else if (daysRemaining > 0) {
        ripeExpiration.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining / 2)));
      }
      updatedExpirationDate = ripeExpiration.toISOString().split("T")[0];
    }
  
    return {
      ...ingredient,
      status: newRipeness,
      expirationDate: updatedExpirationDate,
      lastCheckedAt: today.toISOString(),
    };
  };

  // Handles changing Ripeness and updates state
  const handleRipenessChange = (newRipeness: string) => {
    setRipeness(newRipeness);
    setIsChecked(true);
  
    setModifiedIngredient((prev) => {
      const updatedIngredient = updateIngredientRipeness(prev, newRipeness, initialStatus, daysRemaining, today);
  
      // Separate state updates for side effects
      if (initialStatus === "unripe" && newRipeness === "ripe" && !hasBeenRipped) {
        setHasBeenRipped(true);
        setExpirationDate(new Date(updatedIngredient.expirationDate));
  
        showAlert("Ripeness Updated 🍌",
          `The expiration date has been adjusted to: ${updatedIngredient.expirationDate}`
        );
      } else if (newRipeness !== "ripe" && hasBeenRipped) {
        setHasBeenRipped(false);
        setExpirationDate(initialExpirationDate);
      }
  
      return updatedIngredient;
    });
  };  

  // Updates ingredient as "opened" and shortens its expiration date accordingly
  const updateOpenedIngredient = (
    ingredient: Ingredient, 
    isOpened: boolean, 
    initialExpirationDate: Date, 
    daysRemaining: number, 
    today: Date
  ): { updatedIngredient: Ingredient; newExpirationDate: Date | null } => {
    
    if (isOpened) {
      const newExpirationDate = new Date(initialExpirationDate);
      
       // Adjust expiration date based on how long is left
      if (daysRemaining > 7) {
        newExpirationDate.setDate(today.getDate() + 7);
      } else if (daysRemaining > 0) {
        newExpirationDate.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining / 2)));
      } else {
        return { updatedIngredient: { ...ingredient, isOpened: true }, newExpirationDate: null }; // No change if already expired
      }
      
      return {
        updatedIngredient: {
          ...ingredient,
          isOpened: true,
          expirationDate: newExpirationDate.toISOString().split("T")[0],
        },
        newExpirationDate,
      };
    } 
    
    // Reset to original expiration if closed again
    return {
      updatedIngredient: {
        ...ingredient,
        isOpened: false,
        expirationDate: initialExpirationDate.toISOString().split("T")[0],
      },
      newExpirationDate: initialExpirationDate,
    };
  };

  // Handles switching an ingredient to "opened" and updating expiration
  const handleOpenedChange = (newValue: boolean) => {
    setIsOpened(newValue);
  
    setModifiedIngredient((prev) => {
      const { updatedIngredient, newExpirationDate } = updateOpenedIngredient(prev, newValue, initialExpirationDate, daysRemaining, today);
  
      if (newValue && newExpirationDate) {
        showConfirmation(
          "Item has been opened! 🔓",
          `The expiration date has been adjusted to: ${updatedIngredient.expirationDate}.\nWould you like to proceed?`,
          () => setExpirationDate(newExpirationDate),
          () => setIsOpened(false)
        );
      } else if (!newValue) {
        setExpirationDate(initialExpirationDate);
      }
  
      return updatedIngredient;
    });
  };  
  
  // Updates last checked time when ripeness is manually checked
  const updateCheckedIngredient = (ingredient: Ingredient, isChecked: boolean, time: string): Ingredient => {
    return {
      ...ingredient,
      lastCheckedAt: isChecked ? time : ingredient.lastCheckedAt,
    };
  };

  // Handles manual ripeness check
  const handleCheckRipeness = (newValue: boolean) => {
    setIsChecked(newValue);
  
    setModifiedIngredient((prev) => {
      const updatedIngredient = updateCheckedIngredient(prev, newValue, now);
  
      if (newValue) {
        showConfirmation(
          "Ripeness Checked ✅",
          `You have checked the ripeness. Last checked time has been updated.\nWould you like to proceed?`,
          () => {},
          () => setIsChecked(false)
        );
      }
  
      return updatedIngredient;
    });
  };

  // Updates the ingredient list with modified data
  const saveUpdatedIngredient = (
    ingredients: Ingredient[],
    modifiedIngredient: Ingredient,
    originalName: string,
    confection: string,
    isFresh: boolean,
    ripeness: string,
    expirationDate: string,
    commonEstimate: string
  ): Ingredient[] => {
    const updatedIngredient = {
      ...modifiedIngredient,
      type: confection,
      status: isFresh ? ripeness : "",
      expirationDate: expirationDate || getEstimatedDate(commonEstimate),
    };
  
    return ingredients.map((item) =>
      item.name === originalName ? updatedIngredient : item
    );
  };
  
  // Handles Button Save Changes
  const handleSaveChanges = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem("ingredients");
      let ingredients: Ingredient[] = storedIngredients ? JSON.parse(storedIngredients) : [];
  
      // Uses saveUpdatedIngredient to update the ingredient list
      const updatedIngredients = saveUpdatedIngredient(
        ingredients,
        modifiedIngredient,
        ingredient.name,
        confection,
        isFresh,
        ripeness,
        isExactDate ? expirationDate.toISOString().split("T")[0] : "",
        commonEstimate
      );
  
      await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
      showAlert("Success 🎉", "Ingredient updated successfully!", () => navigation.goBack());
    } catch (error) {
      showAlert("Error", "Failed to update ingredient");
    }
  };  

  // Handles Button Discard Changes
  const handleDiscardChanges = async () => {
    showConfirmation("Discard Changes?", "Are you sure you want to discard changes?", () => navigation.goBack());
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
           onValueChange={handleRipenessChange}>
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
          onValueChange={handleOpenedChange}
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