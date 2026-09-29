import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function PrimaryButton({
  label,
  onPress,
  color,
  textColor = "#fff",
  style,
  disabled = false,
  loading = false,
  size = "md",       // "sm" | "md" | "lg"
  variant = "solid", // "solid" | "outline" | "ghost"
}) {
  const { ink, RADIUS, SPACING, SHADOW } = useTheme();

  const heights = { sm: 36, md: 46, lg: 54 };
  const fontSizes = { sm: 13, md: 14, lg: 16 };
  const pads = { sm: 10, md: 12, lg: 14 };

  const bg = variant === "solid" ? (color || ink) : "transparent";
  const border = variant === "ghost" ? 0 : 1.5;
  const borderColor = variant === "outline" ? ink : "transparent";
  const fg = variant === "outline" ? ink : textColor;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: border,
          borderColor,
          borderRadius: RADIUS.md,
          minHeight: heights[size],
          paddingVertical: pads[size],
          paddingHorizontal: SPACING.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: SPACING.sm,
          opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        variant === "solid" && SHADOW.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{
            color: fg,
            fontWeight: "700",
            fontSize: fontSizes[size],
            letterSpacing: 0,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
