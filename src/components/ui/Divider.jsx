// components/ui/Divider.jsx
import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function Divider({ label, style }) {
  const { ink, divider, SPACING, TYPE } = useTheme();

  if (!label) {
    return <View style={[{ height: 1, backgroundColor: divider }, style]} />;
  }

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.md,
          marginVertical: SPACING.sm,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: divider }} />
      <Text style={{ ...TYPE.caption, color: ink, opacity: 0.5 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: divider }} />
    </View>
  );
}
