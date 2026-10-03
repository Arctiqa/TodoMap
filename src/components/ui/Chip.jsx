// components/ui/Chip.jsx
import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function Chip({ label, active, onPress, style, size = "md" }) {
  const { ink, card, paper, RADIUS, muted } = useTheme();

  const h = size === "sm" ? 26 : 32;
  const fs = size === "sm" ? 11 : 12.5;
  const px = size === "sm" ? 8 : 12;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h,
          borderRadius: RADIUS.pill,
          paddingHorizontal: px,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? ink : card,
          borderWidth: 1,
          borderColor: active ? ink : muted + "40",
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: fs,
          color: active ? paper : ink,
          fontWeight: "700",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
