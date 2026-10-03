import React from "react";
import { View, Text, Pressable, Image, Modal } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { CUSTOM_BACKGROUNDS } from "../constants/backgrounds";

export function BackgroundPickerOverlay({ current, onSelect, onClose }) {
  const { ink, paper, card } = useTheme();
  const t = useT();
  const isRTL = useRTL();

  const items = [
    { key: "default", label: t("bg.default"), source: null, isDefault: true },
    ...CUSTOM_BACKGROUNDS.map((bg) => ({ key: bg.key, label: bg.label, source: bg.source, isDefault: false })),
  ];

  const renderItem = (item) => {
    const isActive = item.isDefault ? current == null : current === item.source;

    return (
      <Pressable
        key={item.key}
        onPress={() => onSelect(item.isDefault ? "__DEFAULT__" : item.source)}
        style={{
          width: "31%",
          aspectRatio: 9 / 16,
          marginBottom: 10,
          borderRadius: 10,
          borderWidth: isActive ? 3 : 1.5,
          borderColor: ink,
          overflow: "hidden",
          backgroundColor: card,
          opacity: isActive ? 1 : 0.92,
        }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {item.isDefault ? (
            <View style={{ alignItems: "center", justifyContent: "center", padding: 4 }}>
              <Text style={{ fontSize: 22, marginBottom: 2 }}>🏠</Text>
              <Text style={{ fontSize: 9.5, color: ink, textAlign: "center" }}>{t("bg.default")}</Text>
            </View>
          ) : (
            <Image
              source={item.source}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: paper,
            borderWidth: 2,
            borderColor: ink,
            borderRadius: 18,
            width: "100%",
            maxWidth: 360,
            padding: 14,
          }}
        >
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>
              {t("bg.title")}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18, color: ink, opacity: 0.6 }}>✕</Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {items.map(renderItem)}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
