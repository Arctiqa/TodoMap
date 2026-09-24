import React from "react";
import { View, Text, Modal } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";
import { GREEN } from "../../theme/palettes";

export function InfoDialog({ message, onClose }) {
  const { ink, paper } = useTheme();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <View
          style={{
            backgroundColor: paper,
            borderWidth: 3,
            borderColor: ink,
            borderRadius: 16,
            width: "100%",
            maxWidth: 260,
            padding: 18,
          }}
        >
          <Text style={{ fontSize: 14, color: ink, marginBottom: 14, textAlign: "center" }}>
            {message}
          </Text>
          <PrimaryButton label="Ок" color={GREEN} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}