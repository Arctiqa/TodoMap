import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function Chip({ label, active, onPress, style }) {
  const { ink, card } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderWidth: 2,
          borderColor: ink,
          borderRadius: 14,
          paddingVertical: 4,
          paddingHorizontal: 10,
          backgroundColor: active ? ink : card,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 11.5, color: active ? "#fff" : ink, fontWeight: "bold" }}>{label}</Text>
    </Pressable>
  );
}