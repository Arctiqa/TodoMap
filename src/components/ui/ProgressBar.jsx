import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { GREEN } from "../../theme/palettes";

export function ProgressBar({
  value = 0,
  max = 1,
  color = GREEN,
  height = 6,
  showLabel = false,
  label,
  style,
}) {
  const { ink, muted, SPACING, TYPE } = useTheme();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <View style={style}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: muted + "30",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height,
            borderRadius: height / 2,
            backgroundColor: color,
            width: `${pct}%`,
          }}
        />
      </View>
      {showLabel && (
        <Text style={{ ...TYPE.monoSm, color: ink, opacity: 0.6, marginTop: 3 }}>
          {label != null ? label : `${value}/${max}`}
        </Text>
      )}
    </View>
  );
}
