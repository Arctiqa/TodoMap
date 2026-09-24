import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

export function TitleUnlockDialog({ title, onClose }) {
  const { ink, paper } = useTheme();
  if (!title) return null;
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
        <Pressable style={{ width: "100%", maxWidth: 280 }} onPress={onClose}>
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: paper,
                borderWidth: 2,
                borderColor: ink,
                borderRadius: 18,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, color: ink, opacity: 0.6, fontWeight: "bold", marginBottom: 8 }}>
                🏆 НОВЫЙ ТИТУЛ
              </Text>
              <Text style={{ fontSize: 34, marginBottom: 4 }}>{title.emoji}</Text>
              <Text style={{ fontSize: 17, fontWeight: "bold", color: ink, marginBottom: 8 }}>
                {title.name.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 13, color: ink, opacity: 0.6, textAlign: "center", marginBottom: 16 }}>
                {title.desc}
              </Text>
              <PrimaryButton label="Забрать" color={GREEN} onPress={onClose} style={{ width: "100%" }} />
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}