import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

export function OverlayHeader({ onBack, title, onClose, right }) {
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
      <Pressable onPress={onBack} style={{ minWidth: 40, alignItems: "flex-start" }}>
        <MaterialIcons name="arrow-back" size={24} color={ink} />
      </Pressable>

      <Text
        style={{ fontSize: 15, fontWeight: "bold", color: ink, textAlign: "center", flex: 1 }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={{ minWidth: 40, alignItems: "flex-end" }}>
        {right || null}
      </View>
    </View>
  );
}
