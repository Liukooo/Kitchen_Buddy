import React, { useEffect, useState, useMemo } from "react";
import {
  TextInput,
  Switch,
  Image,
  Platform,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  View,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Camera, CameraView } from "expo-camera";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Categories, Locations, Types } from "@/constants/Options";
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadIngredients = async () => {
      const storedIngredients = await AsyncStorage.getItem("ingredients");
      if (storedIngredients) setIngredients(JSON.parse(storedIngredients));
    };
    loadIngredients();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Handle Barcode Scan and Add Ingredient
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Disable scanning for multiple scans
    setScanning(false);
    // Show loading indicator
    setLoading(true);
    
    try {
      // Wait for API request
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      // Converts JSON into JS
      const result = await response.json();
  
      if (result.status === 1) {
        const ingredientName = result.product.product_name || "Unknown Product";
  
        // Save to state
        setIngredientName(ingredientName);
  
        // Save to AsyncStorage
        const newIngredient: Ingredient = {
          name: ingredientName,
          category: "",
          location: "",
          type: "",
          expirationDate: "",
          estimateDate: "", 
        };
  
        // Load existing ingredients
        const storedIngredients = await AsyncStorage.getItem("ingredients");
        const ingredientsArray = storedIngredients ? JSON.parse(storedIngredients) : [];
  
        // Add new ingredient to list
        const updatedIngredients = [...ingredientsArray, newIngredient];
  
        // Save updated list back to storage
        await AsyncStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
  
        // Show success alert
        Alert.alert("Product Found!",
          `Scanned: ${ingredientName}`,
          [{ text: "OK", onPress: resetForm }]
        )
      } else {
        // Show not found alert
        Alert.alert("Error", "Product not found in OpenFoodFacts");
      }
    } catch (error) {
      // Show error alert
      Alert.alert("Error", "Failed to fetch product details.");
    } finally {
      setLoading(false);
    }
  };

  // Transforms Date into processable String
  const computedExpirationDate = useMemo(() => {
    return isExactDate
      ? expirationDate.toISOString().split("T")[0]
      : getEstimatedDate(commonEstimate);
  }, [isExactDate, expirationDate, commonEstimate]);

  // Handle Add Ingredient 
  const handleAddIngredient = async () => {
    if (!ingredientName.trim()) {
      Alert.alert(
        "Alert 🚫",
        "Please enter an item name."
      );
      return;
    }

    // Save to AsyncStorage
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
          {Categories.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>

        <ThemedText style={styles.label}>Location:</ThemedText>
        <Picker selectedValue={location} style={styles.picker} onValueChange={setLocation}>
          {Locations.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>

        <ThemedText style={styles.label}>Confection Type:</ThemedText>
        <Picker selectedValue={confection} style={styles.picker} onValueChange={setConfection}>
          {Types.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
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

        <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
          <ThemedText style={styles.scanButtonText}>Scan Barcode</ThemedText>
        </TouchableOpacity>

        <Modal visible={scanning} animationType="slide" transparent>
          <ThemedView style={styles.modalContainer}>
            {hasPermission === false ? (
              <ThemedText style={styles.permissionText}>
                Camera permission is required to scan barcodes.
              </ThemedText>
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
                  <ThemedText style={styles.closeButtonText}>Close Scanner</ThemedText>
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
  input: {
    backgroundColor: "white",
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 16,
    color: "black",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  picker: {
    backgroundColor: "white",
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
},
  switchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dateButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 5, alignItems: "center", marginBottom: 16 },
  dateButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  addButton: { backgroundColor: "#28a745", padding: 12, borderRadius: 5, alignItems: "center", marginTop: 10 },
  addButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  scanButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  scanButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: { color: "white", fontSize: 18, textAlign: "center", marginBottom: 20 },
  camera: {
    width: "100%",
    height: "80%",
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: "white", fontSize: 16 },
  loadingContainer: {
    alignItems: "center",
  },
});

export default AddIngredientScreen;
