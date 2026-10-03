// components/ui/EmptyState.jsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useRTL } from "../../i18n/LanguageContext";
import { GREEN } from "../../theme/palettes";

export function EmptyState({
  emoji,
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
}) {
  const { ink, muted, SPACING, RADIUS, TYPE } = useTheme();
  const isRTL = useRTL();

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: compact ? SPACING.lg : SPACING.xxl,
        paddingHorizontal: SPACING.lg,
      }}
    >
      {emoji && (
        <Text style={{ fontSize: compact ? 32 : 44, marginBottom: SPACING.sm, opacity: 0.9 }}>
          {emoji}
        </Text>
      )}
      {icon && (
        <MaterialIcons name={icon} size={compact ? 32 : 44} color={muted} style={{ marginBottom: SPACING.sm }} />
      )}

      {title && (
        <Text style={{ ...TYPE.h3, color: ink, textAlign: "center", marginBottom: SPACING.xs }}>
          {title}
        </Text>
      )}

      {subtitle && (
        <Text
          style={{
            ...TYPE.small,
            color: ink,
            opacity: 0.55,
            textAlign: "center",
            maxWidth: 260,
            lineHeight: 17,
          }}
        >
          {subtitle}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            marginTop: SPACING.lg,
            backgroundColor: GREEN,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.pill,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
          })}
        >
          <Text style={{ color: "#000", fontWeight: "700", fontSize: 13 }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
