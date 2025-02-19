import { Alert, Platform } from "react-native";

// Shows alert that needs confermation
export const showConfirmation = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
  if (Platform.OS === "web") {
    // Use browser's confirm dialog for web
    const confirmAction = window.confirm(`${title}\n\n${message}`);
    if (confirmAction) onConfirm?.();
    else onCancel?.();
  } else {
    // Use React Native Alert for mobile
        Alert.alert(title, message, [
            { text: "Cancel", onPress: onCancel, style: "cancel" },
            { text: "OK", onPress: onConfirm },
        ]);
  }
};

// Shows generic alert
export const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    if (Platform.OS === "web") {
        // Use browser's confirm dialog for web
        window.alert(`${title}\n\n${message}`);
        if (onConfirm) onConfirm();
    } else {
        // Use React Native Alert for mobile
        Alert.alert(title, message, [
            { text: "OK", onPress: onConfirm },
        ]
        );
    }
};

