import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function PrimaryButton({ label, onPress, color, textColor = "#fff", style }) {
  const { ink } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: color || ink,
          borderWidth: 2,
          borderColor: ink,
          borderRadius: 8,
          paddingVertical: 9,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontWeight: "bold", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}