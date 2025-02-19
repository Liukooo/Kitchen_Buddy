import React, { useEffect, useState, useMemo, useCallback } from "react";

import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Switch,
  TextInput,
  TouchableOpacity,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Camera, CameraView } from "expo-camera";

// Local imports
import { Categories, Locations, Types, Status } from "@/constants/Options";
import { Ingredient } from "@/constants/Ingredient";
import { getEstimatedDate } from "@/scripts/Functions";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import DatePicker from "@/components/DatePicker";
import { styles } from "@/components/ui/Styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { showConfirmation, showAlert } from "@/components/ShowAlert";
import { useRipeness } from "@/hooks/useRipeness";
import { useFocusEffect } from "expo-router";

const AddIngredientScreen: React.FC = () => {
  const [ingredientName, setIngredientName] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const { confection, setConfection, ripeness, setRipeness, isFresh } = useRipeness("");
  const [isExactDate, setIsExactDate] = useState<boolean>(false);
  const [expirationDate, setExpirationDate] = useState<Date>(new Date());
  const [commonEstimate, setCommonEstimate] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Transforms Exact Date or Estimated Date into processable String
  const computedExpirationDate = useMemo(() => {
    return isExactDate
      ? expirationDate.toISOString().split("T")[0]
      : getEstimatedDate(commonEstimate);
  }, [isExactDate, expirationDate, commonEstimate]);

  // Resets the form
  const resetForm = () => {
    setIngredientName("");
    setBrand("");
    setCategory("");
    setLocation("");
    setConfection("");
    setRipeness("");
    setIsExactDate(false);
    setExpirationDate(new Date());
    setCommonEstimate("");
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        // Loads stored ingredients
        const storedIngredients = await AsyncStorage.getItem("ingredients");
        if (storedIngredients) setIngredients(JSON.parse(storedIngredients));
      };
    
      fetchData();
    }, [])
  );

  useEffect(() => {
    const requestCameraPermission = async () => {
      // Requests camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
  
    requestCameraPermission();
  }, []);

  // Resets ripeness status for non fresh ingredients
  useEffect(() => {
    if (!isFresh) setRipeness("");
  }, [isFresh]);
  
  // Function to create a new ingredient object
  const createIngredient = (name: string, brand: string, category: string, location: string, confection: string, ripeness: string, expirationDate: string): Ingredient => ({
    name,
    brand,
    category,
    location,
    type: confection,
    status: ripeness,
    expirationDate,
    // Checked date is set only if Ingredient has a ripeness status
    lastCheckedAt: ripeness ? new Date().toISOString() : undefined,
  });

  // Function to persist ingredients to AsyncStorage
  const saveIngredients = async (newIngredient: Ingredient, existingIngredients: Ingredient[]) => {
    const updatedIngredients = [...existingIngredients, newIngredient];
    await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
    setIngredients(updatedIngredients);
  };

  // Handles Adding new Ingredient
  const handleAddIngredient = useCallback(async () => {
    if (!ingredientName.trim()) {
      showAlert("Alert 🚫", "Please enter an item name.");
      return;
    }

    const newIngredient = createIngredient(ingredientName, brand, category, location, confection, ripeness, computedExpirationDate);
    
    await saveIngredients(newIngredient, ingredients);
    
    showAlert(
      "Ingredient Added ✅",
      `Name: ${newIngredient.name}\nBrand: ${newIngredient.brand}\nCategory: ${newIngredient.category}\nLocation: ${newIngredient.location}\nType: ${newIngredient.type}\nExpiration Date: ${newIngredient.expirationDate}`,
      resetForm
    );
  }, [ingredientName, brand, category, location, confection, ripeness, computedExpirationDate, isFresh, ingredients, setIngredients, resetForm]);


  // Handles Barcode Scan and Add Ingredient
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Disables scanning for multiple scans
    setScanning(false);
    // Shows loading indicator
    setLoading(true);
    
    try {
      // Waits for API request
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      // Converts JSON into JS
      const result = await response.json();
  
      if (result.status === 1) {
        const ingredientName = result.product.product_name || "Unknown Product";
  
        // Saves to state
        setIngredientName(ingredientName);
  
        // Saves to AsyncStorage
        const newIngredient: Ingredient = {
          name: ingredientName,
          isOpened: false,
          expirationDate: "",
        };
  
        // Loads existing ingredients
        const storedIngredients = await AsyncStorage.getItem("ingredients");
        const ingredientsArray = storedIngredients ? JSON.parse(storedIngredients) : [];
  
        // Adds new ingredient to list
        const updatedIngredients = [...ingredientsArray, newIngredient];
  
        // Saves updated list back to storage
        await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
  
        // Shows success alert
        showAlert(
          "Product Found!",
          `Scanned: ${ingredientName}`,
          resetForm
        )
      } else {
        // Shows not found alert
        showConfirmation(
          "Error",
          "Product not found in OpenFoodFacts"
        )
      }
    } catch (error) {
      // Shows error alert
      showConfirmation(
        "Error", 
        "Failed to fetch product details."
      )
    } finally {
      setLoading(false);
    }
  };

  // Requests again camera permission when the barcode scanner is accessed
  const checkPermissions = async () => {
    const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
  
    // If permission is granted, it enables scanning
    if (status === "granted") {
      setHasPermission(true);
      return;
    }

    // If permission is denied, prompts the user to open settings
    if (status === "denied") {
      setHasPermission(false);
  
      if (!canAskAgain) {
        showConfirmation(
          "Camera Permission Denied",
          "You need to enable camera permissions in settings to use this feature.",
          () => Linking.openSettings()
        );
      }
  
      return;
    }

    setHasPermission(false);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/icon.jpg")}
          style={styles.image}
        />
      }>
      {/* Title */}
        <ThemedText type="title">Add an Ingredient to the Fridge</ThemedText>
      
      <ThemedView style={styles.container}>
        {/* Name */}
        <ThemedText type="label">Ingredient Name:</ThemedText>
        <TextInput
          style={styles.input}
          value={ingredientName}
          maxLength={20}
          onChangeText={setIngredientName}
          placeholder="Enter Ingredient Name"
        />
        {/* Brand */}
        <ThemedText type="label">Brand Name:</ThemedText>
        <TextInput
          style={styles.input}
          value={brand}
          maxLength={20}
          onChangeText={setBrand}
          placeholder="Enter Brand (optional)"
        />

        {/* Category */}
        <ThemedText type="label">Category:</ThemedText>
        <Picker selectedValue={category} style={styles.picker} onValueChange={setCategory}>
          {Categories.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>

        {/* Location */}
        <ThemedText type="label">Location:</ThemedText>
        <Picker selectedValue={location} style={styles.picker} onValueChange={setLocation}>
          {Locations.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        {/* Confection type */}
        <ThemedText style={styles.label}>Confection Type:</ThemedText>
        <Picker selectedValue={confection} style={styles.picker} onValueChange={setConfection}>
          {Types.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        {/* Ripeness Status */}
        {isFresh && (
          <>
            <ThemedText style={styles.label}>Ripeness Status:</ThemedText>
            <Picker selectedValue={ripeness} style={styles.picker} onValueChange={setRipeness}>
              {Status.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
            </Picker>
          </>
        )}

        {/* Switch for Exact Date */}
        <ThemedView style={styles.switchContainer}>
          <ThemedText>Exact Date</ThemedText>
          <Switch value={isExactDate} onValueChange={setIsExactDate} trackColor={{ false: "#ccc", true: "#81b0ff" }}/>
        </ThemedView>

        {/* Exact Date or Estimated Date*/}
        {isExactDate ? (
          <DatePicker date={expirationDate} onDateChange={setExpirationDate} />
        ) : (
          <>
            <ThemedText type="label">Estimated Expiration:</ThemedText>
            <Picker selectedValue={commonEstimate} style={styles.picker} onValueChange={setCommonEstimate}>
              <Picker.Item label="Select Date" value="" />
              <Picker.Item label="2 days from now" value="2 days" />
              <Picker.Item label="1 week from now" value="1 week" />
              <Picker.Item label="10 days from now" value="10 days" />
              <Picker.Item label="1 month from now" value="1 month" />
            </Picker>
          </>
        )}

        {/* Add Button */}
        <TouchableOpacity style={styles.successButton} onPress={handleAddIngredient}>
          <ThemedText style={styles.buttonText}>Add Ingredient</ThemedText>
        </TouchableOpacity>

        {/* Barcode Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setScanning(true)}>
          <ThemedText style={styles.buttonText}>Scan Barcode</ThemedText>
        </TouchableOpacity>

        {/* Barcode Screen */}
        <Modal visible={scanning} animationType="slide">
          <ThemedView style={styles.modalContainer}>
            {hasPermission === false ? (
              <ThemedView>
                <ThemedText style={styles.buttonText}>
                  Camera permission is required to scan barcodes.
                </ThemedText>
                <ThemedView style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.primaryButton} onPress={checkPermissions}>
                    <ThemedText style={styles.buttonText}>Check Permissions</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerButton} onPress={() => setScanning(false)}>
                    <ThemedText style={styles.buttonText}>Close Scanner</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ) : (
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"]
                }}
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
              >
                <TouchableOpacity style={styles.closeButton} onPress={() => setScanning(false)}>
                  <ThemedText style={styles.buttonText}>Close Scanner</ThemedText>
                </TouchableOpacity>
              </CameraView>
            )}
          </ThemedView>
        </Modal>

        {loading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#28a745" />
            <ThemedText>Fetching Product Details...</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
};

export default AddIngredientScreen;