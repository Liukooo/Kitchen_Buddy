import React, { useEffect, useState, useMemo } from "react";
import {
  TextInput,
  Switch,
  View,
  Image,
  Platform,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Ingredient {
  name: string;
  category: string;
  location: string;
  type: string;
  expirationDate: string;
  estimateDate: string;
}

const getEstimatedDate = (estimate: string): string => {
  const date = new Date();
  const daysMap: Record<string, number> = {
    "2 days": 2,
    "1 week": 7,
    "10 days": 10,
    "1 month": 30,
  };
  date.setDate(date.getDate() + (daysMap[estimate] || 0));
  return estimate ? date.toISOString().split("T")[0] : "";
};

const AddIngredientScreen: React.FC = () => {
  const [ingredientName, setIngredientName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [confection, setConfection] = useState("");
  const [isExactDate, setIsExactDate] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [commonEstimate, setCommonEstimate] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadIngredients = async () => {
      const storedIngredients = await AsyncStorage.getItem("ingredients");
      if (storedIngredients) setIngredients(JSON.parse(storedIngredients));
    };
    loadIngredients();
  }, []);

  const computedExpirationDate = useMemo(() => {
    return isExactDate
      ? expirationDate.toISOString().split("T")[0]
      : getEstimatedDate(commonEstimate);
  }, [isExactDate, expirationDate, commonEstimate]);

  const handleAddIngredient = async () => {
    if (!ingredientName.trim()) {
      Alert.alert(
        "Alert 🚫",
        "Please enter an item name."
      );
      return;
    }

    const newIngredient: Ingredient = {
      name: ingredientName,
      category,
      location,
      type: confection,
      expirationDate: computedExpirationDate,
      estimateDate: commonEstimate,
    };

    const updatedIngredients = [...ingredients, newIngredient];
    await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
    setIngredients(updatedIngredients);

    Alert.alert(
      "Ingredient Added ✅",
      `Name: ${newIngredient.name}\nCategory: ${newIngredient.category}\nLocation: ${newIngredient.location}\nType: ${newIngredient.type}\nExpiration Date: ${newIngredient.expirationDate}`,
      [{ text: "OK", onPress: resetForm }]
    )
  };

  const resetForm = () => {
    setIngredientName("");
    setCategory("");
    setLocation("");
    setConfection("");
    setIsExactDate(false);
    setExpirationDate(new Date());
    setCommonEstimate("");
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") return setShowDatePicker(false);
    if (selectedDate) setExpirationDate(selectedDate);
    setShowDatePicker(false);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/icon.jpg')}
          style={styles.image}
        />
        }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Add an Ingredient to the Fridge</ThemedText>
      </ThemedView>

      <ThemedView style={styles.container}>
        <ThemedText style={styles.label}>Ingredient Name:</ThemedText>
        <TextInput
          style={styles.input}
          value={ingredientName}
          onChangeText={setIngredientName}
          placeholder="Enter Ingredient Name"
        />

        <ThemedText style={styles.label}>Category:</ThemedText>
        <Picker selectedValue={category} style={styles.picker} onValueChange={setCategory}>
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Fruit" value="fruit" />
          <Picker.Item label="Vegetable" value="vegetable" />
          <Picker.Item label="Dairy" value="dairy" />
          <Picker.Item label="Fish" value="fish" />
          <Picker.Item label="Meat" value="meat" />
          <Picker.Item label="Beverage" value="beverage" />
        </Picker>

        <ThemedText style={styles.label}>Location:</ThemedText>
        <Picker selectedValue={location} style={styles.picker} onValueChange={setLocation}>
          <Picker.Item label="Select Location" value="" />
          <Picker.Item label="Fridge" value="fridge" />
          <Picker.Item label="Freezer" value="freezer" />
          <Picker.Item label="Pantry" value="pantry" />
        </Picker>

        <ThemedText style={styles.label}>Confection Type:</ThemedText>
        <Picker selectedValue={confection} style={styles.picker} onValueChange={setConfection}>
          <Picker.Item label="Select Confection Type" value="" />
          <Picker.Item label="Fresh" value="fresh" />
          <Picker.Item label="Canned" value="canned" />
          <Picker.Item label="Frozen" value="frozen" />
          <Picker.Item label="Cured" value="cured" />
        </Picker>

        <ThemedView style={styles.switchContainer}>
          <ThemedText>Exact Date</ThemedText>
          <Switch value={isExactDate} onValueChange={setIsExactDate} trackColor={{ false: "#ffffff88", true: "#81b0ff" }}/>
        </ThemedView>

        {isExactDate ? (
          Platform.OS === "web" ? (
            <>
              <ThemedText style={styles.label}>Select a date:</ThemedText>
              <TextInput
                style={styles.input}
                value={computedExpirationDate}
                onChangeText={(text) => {
                  const parsedDate = new Date(text);
                  if (!isNaN(parsedDate.getTime())) setExpirationDate(parsedDate);
                }}
                placeholder="YYYY-MM-DD"
              />
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={styles.dateButtonText}>Pick Date</ThemedText>
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
          )
        ) : (
          <>
            <ThemedText style={styles.label}>Estimated Expiration:</ThemedText>
            <Picker selectedValue={commonEstimate} style={styles.picker} onValueChange={setCommonEstimate}>
              <Picker.Item label="Select Date" value="" />
              <Picker.Item label="2 days from now" value="2 days" />
              <Picker.Item label="1 week from now" value="1 week" />
              <Picker.Item label="10 days from now" value="10 days" />
              <Picker.Item label="1 month from now" value="1 month" />
            </Picker>
          </>
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>
          <ThemedText style={styles.addButtonText}>Add Ingredient</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    gap:4,
    padding: 16
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  label: { fontSize: 18, marginBottom: 8 },
  input: { backgroundColor: "white", height: 50, paddingHorizontal: 5, marginBottom: 16, color: "black" },
  picker: { backgroundColor: "white", height: 50, borderWidth: 0.5, marginBottom: 16 },
  switchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dateButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 5, alignItems: "center", marginBottom: 16 },
  dateButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  addButton: { backgroundColor: "#28a745", padding: 12, borderRadius: 5, alignItems: "center", marginTop: 10 },
  addButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default AddIngredientScreen;
