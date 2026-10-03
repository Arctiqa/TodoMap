// components/ui/ConfirmDialog.jsx
import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../../theme/ThemeContext";
import { useT, useRTL } from "../../i18n/LanguageContext";

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  confirmColor = "#E4572E",
  backdrop = "rgba(0,0,0,0.5)",
}) {
  const { ink, paper } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const label = confirmLabel || t("confirm.delete");

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: backdrop,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: paper,
            borderWidth: 3,
            borderColor: ink,
            borderRadius: 16,
            padding: 18,
            width: "100%",
            maxWidth: 260,
          }}
        >
          <Text style={{ fontSize: 14, color: ink, marginBottom: 14, textAlign: "center" }}>
            {message}
          </Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
            <PrimaryButton
              label={t("confirm.cancel")}
              color="#fff"
              textColor={ink}
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label={label}
              color={confirmColor}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
