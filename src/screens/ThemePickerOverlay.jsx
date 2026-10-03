import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useT, useRTL } from "../i18n/LanguageContext";
import { THEMES } from "../theme/palettes";

export function ThemePickerOverlay({ current, onSelect, onClose }) {
  const t = useT();
  const isRTL = useRTL();
  return (
    <Overlay zIndex={80}>
      <OverlayHeader onBack={onClose} title={t("theme.title")} onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {Object.keys(THEMES).map((key) => {
          const themeObj = THEMES[key];
          const active = key === current;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: themeObj.card,
                borderWidth: active ? 3 : 1.5,
                borderColor: themeObj.ink,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: themeObj.bar, borderWidth: 2, borderColor: themeObj.ink }} />
              <Text style={{ fontSize: 14, fontWeight: "bold", color: themeObj.ink, flex: 1, textAlign: isRTL ? "right" : "left" }}>{themeObj.label}</Text>
              {active && <Text style={{ fontSize: 16, color: themeObj.ink }}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}
