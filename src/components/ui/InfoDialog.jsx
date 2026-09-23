import React from "react";
import { Text, Pressable } from "react-native";
import { Overlay } from "./Overlay";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";
import { GREEN } from "../../theme/palettes";

export function InfoDialog({ message, onClose }) {
  const { ink, paper } = useTheme();
  return (
    <Overlay zIndex={95} background="rgba(59,47,47,0.5)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: paper, borderWidth: 3, borderColor: ink, borderRadius: 16, width: "100%", maxWidth: 260, padding: 18 }}
        >
          <Text style={{ fontSize: 14, color: ink, marginBottom: 14, textAlign: "center" }}>{message}</Text>
          <PrimaryButton label="Ок" color={GREEN} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Overlay>
  );
}