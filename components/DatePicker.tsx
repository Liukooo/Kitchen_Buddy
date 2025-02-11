import React, { useState } from "react";
import { Platform, TextInput, TouchableOpacity } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

// Local imports
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { styles } from "@/components/ui/Styles";

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onDateChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  // Handles the Date selection in the DataTimePicker
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") return setShowPicker(false);
    if (selectedDate) onDateChange(selectedDate);
    setShowPicker(false);
  };

  return (
    <ThemedView>
      {Platform.OS === "web" ? (
        <TextInput
          style={styles.input}
          value={date.toISOString().split("T")[0]}
          onChangeText={(text) => {
                const parsedDate = new Date(text);
                if (!isNaN(parsedDate.getTime())) onDateChange(parsedDate);
          }}
          placeholder="YYYY-MM-DD"
        />
      ) : (
        <>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <ThemedText style={styles.buttonText}>Pick Date</ThemedText>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </>
      )}
    </ThemedView>
  );
};

export default DatePicker;
