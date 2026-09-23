import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { THEMES } from "../theme/palettes";

export function ThemePickerOverlay({ current, onSelect, onClose }) {
  return (
    <Overlay zIndex={80}>
      <OverlayHeader onBack={onClose} title="🎨 ТЕМА" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {Object.keys(THEMES).map((key) => {
          const t = THEMES[key];
          const active = key === current;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                backgroundColor: t.card,
                borderWidth: active ? 3 : 1.5, borderColor: t.ink,
                borderRadius: 12, padding: 14, marginBottom: 8,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.bar, borderWidth: 2, borderColor: t.ink }} />
              <Text style={{ fontSize: 14, fontWeight: "bold", color: t.ink, flex: 1 }}>{t.label}</Text>
              {active && <Text style={{ fontSize: 16, color: t.ink }}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}