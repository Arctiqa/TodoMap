// screens/LanguagePickerOverlay.jsx
import React from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { useT, useLanguage } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/translations";
import { applyRTL, reloadApp } from "../utils/rtl";

export function LanguagePickerOverlay({ current, onSelect, onClose }) {
  const { ink, card } = useTheme();
  const t = useT();
  const { isRTL } = useLanguage();

  const handlePick = async (key) => {
    const currentIsRTL = !!LANGUAGES[current]?.rtl;
    const nextIsRTL = !!LANGUAGES[key]?.rtl;

    onSelect(key);

    if (currentIsRTL !== nextIsRTL) {
      const needsRestart = await applyRTL(key);
      if (needsRestart) {
        Alert.alert("", t("language.restartHint"), [
          { text: t("info.ok"), onPress: () => reloadApp() },
        ]);
      }
    }
  };

  return (
    <Overlay zIndex={81}>
      <OverlayHeader
        onBack={onClose}
        title={t("language.title")}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {Object.entries(LANGUAGES).map(([key, meta]) => {
          const active = key === current;
          return (
            <Pressable
              key={key}
              onPress={() => handlePick(key)}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: card,
                borderWidth: active ? 3 : 1.5,
                borderColor: ink,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 26 }}>{meta.label.split(" ")[0]}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: ink,
                  flex: 1,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {meta.label.split(" ").slice(1).join(" ")}
              </Text>
              {active && (
                <Text style={{ fontSize: 18, color: ink, fontWeight: "bold" }}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}
