import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function OverlayHeader({ onBack, backLabel = "Назад", title, onClose }) {
  const { ink } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1.5,
        borderColor: ink,
      }}
    >
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 60 }}>
        <Text style={{ fontSize: 16 }}>←</Text>
        <Text style={{ fontWeight: "bold", color: ink }}>{backLabel}</Text>
      </Pressable>
      <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, textAlign: "center", flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onClose || onBack} style={{ minWidth: 60, alignItems: "flex-end" }}>
        <Text style={{ fontSize: 18 }}>✕</Text>
      </Pressable>
    </View>
  );
}