import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";

export function SettingsOverlay({ onClose, onOpenTheme, onOpenLanguage, onOpenNotifications, onOpenAbout }) {
  const { ink, card } = useTheme();

  const items = [
    { key: "theme",         icon: "color-lens",    label: "Тема",         desc: "Светлая, тёмная, синяя…", onPress: onOpenTheme },
    { key: "language",      icon: "language",      label: "Язык",         desc: "Русский",                  onPress: onOpenLanguage },
    { key: "notifications", icon: "notifications", label: "Уведомления",  desc: "Напоминания о делах",      onPress: onOpenNotifications },
    { key: "about",         icon: "info-outline",  label: "О приложении", desc: "v1.0.0",                   onPress: onOpenAbout },
  ];

  return (
    <Overlay zIndex={82}>
      <OverlayHeader onBack={onClose} title="⚙️ НАСТРОЙКИ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              backgroundColor: card,
              borderWidth: 2,
              borderColor: ink,
              borderRadius: 10,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <MaterialIcons name={item.icon} size={24} color={ink} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>{item.label}</Text>
              <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>{item.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={ink} />
          </Pressable>
        ))}
      </ScrollView>
    </Overlay>
  );
}