import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Удалить", confirmColor = "#E4572E", backdrop = "rgba(0,0,0,0.5)" }) {
  const { ink, paper } = useTheme();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: backdrop,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <Pressable style={{ width: "100%", maxWidth: 260 }} onPress={() => {}}>
          <View
            style={{
              backgroundColor: paper,
              borderWidth: 3,
              borderColor: ink,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <Text style={{ fontSize: 14, color: ink, marginBottom: 14, textAlign: "center" }}>
              {message}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <PrimaryButton label="Отмена" color="#fff" textColor={ink} onPress={onCancel} style={{ flex: 1 }} />
              <PrimaryButton label={confirmLabel} color={confirmColor} onPress={onConfirm} style={{ flex: 1 }} />
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}