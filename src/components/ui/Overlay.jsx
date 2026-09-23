import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export function Overlay({ children, zIndex = 50, background }) {
  const { paper } = useTheme();
  return (
    <View
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: background || paper,
        zIndex,
        elevation: zIndex,
      }}
    >
      {children}
    </View>
  );
}