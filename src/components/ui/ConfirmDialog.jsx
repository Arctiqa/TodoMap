import React from "react";
import { View, Text, Pressable } from "react-native";
import { Overlay } from "./Overlay";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Удалить", confirmColor = "#E4572E" }) {
  const { ink, paper } = useTheme();
  return (
    <Overlay zIndex={65} background="rgba(59,47,47,0.5)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onCancel}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: paper, borderWidth: 3, borderColor: ink, borderRadius: 16, width: "100%", maxWidth: 260, padding: 18 }}
        >
          <Text style={{ fontSize: 14, color: ink, marginBottom: 14, textAlign: "center" }}>{message}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <PrimaryButton label="Отмена" color="#fff" textColor={ink} onPress={onCancel} style={{ flex: 1 }} />
            <PrimaryButton label={confirmLabel} color={confirmColor} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Overlay>
  );
}