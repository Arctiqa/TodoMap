import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { GUIDE_META } from "../constants/guides";

export function GuidesListOverlay({ onSelect, onClose }) {
  const { ink, card } = useTheme();
  return (
    <Overlay zIndex={73}>
      <OverlayHeader onBack={onClose} title="🧭 ГИДЫ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {Object.keys(GUIDE_META).map((key) => {
          const meta = GUIDE_META[key];
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 12, padding: 12, marginBottom: 8 }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: meta.color, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, flex: 1 }}>{meta.name}</Text>
              <Text style={{ fontSize: 16, color: "#9a8a76" }}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}