// components/ui/OverlayHeader.jsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useRTL } from "../../i18n/LanguageContext";

export function OverlayHeader({ onBack, title, onClose, right }) {
  const { ink } = useTheme();
  const isRTL = useRTL();
  const backIcon = isRTL ? "arrow-forward" : "arrow-back";

  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1.5,
        borderColor: ink,
        position: "relative",
      }}
    >
      <Pressable onPress={onBack} style={{ minWidth: 40, alignItems: isRTL ? "flex-end" : "flex-start", zIndex: 2 }}>
        <MaterialIcons name={backIcon} size={24} color={ink} />
      </Pressable>

      <Text
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          fontSize: 15,
          fontWeight: "bold",
          color: ink,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={{ minWidth: 40, alignItems: isRTL ? "flex-start" : "flex-end", zIndex: 2 }}>
        {right || null}
      </View>
    </View>
  );
}
