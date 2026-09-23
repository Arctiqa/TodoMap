import React from "react";
import { View, Text, Pressable } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

export function TitleUnlockDialog({ title, onClose }) {
  const { ink, paper } = useTheme();
  if (!title) return null;
  return (
    <Overlay zIndex={78} background="rgba(59,47,47,0.55)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: paper, borderWidth: 2, borderColor: ink, borderRadius: 18, width: "100%", maxWidth: 280, padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#8a7a6a", fontWeight: "bold", marginBottom: 8 }}>🏆 НОВЫЙ ТИТУЛ</Text>
          <Text style={{ fontSize: 34, marginBottom: 4 }}>{title.emoji}</Text>
          <Text style={{ fontSize: 17, fontWeight: "bold", color: ink, marginBottom: 8 }}>{title.name.toUpperCase()}</Text>
          <Text style={{ fontSize: 13, color: "#8a7a6a", textAlign: "center", marginBottom: 16 }}>{title.desc}</Text>
          <PrimaryButton label="Забрать" color={GREEN} onPress={onClose} style={{ width: "100%" }} />
        </Pressable>
      </Pressable>
    </Overlay>
  );
}