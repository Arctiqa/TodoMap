// screens/LanguagePickerOverlay.jsx
import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { useT, useLanguage, useRTL } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/translations";
import { applyRTL, reloadApp } from "../utils/rtl";
import { GREEN, RED } from "../theme/palettes";

export function LanguagePickerOverlay({ current, onSelect, onClose }) {
  const { ink, card, paper } = useTheme();
  const t = useT();
  const isRTL = useRTL();

  // { key, willRestart } — язык, который ждёт подтверждения
  const [pending, setPending] = useState(null);

  const handlePick = (key) => {
    if (key === current) return;

    const currentIsRTL = !!LANGUAGES[current]?.rtl;
    const nextIsRTL = !!LANGUAGES[key]?.rtl;

    // Если направление (LTR/RTL) меняется — нужен перезапуск
    if (currentIsRTL !== nextIsRTL) {
      setPending({ key, willRestart: true });
      return;
    }

    // Обычная смена языка — сразу
    onSelect(key);
    setPending({ key, willRestart: false, done: true });
  };

  const confirmSwitch = async () => {
    if (!pending) return;
    const { key, willRestart } = pending;
    setPending(null);

    onSelect(key);

    if (willRestart) {
      const needsRestart = await applyRTL(key);
      if (needsRestart) {
        setTimeout(() => {
          reloadApp();
        }, 250);
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

      {/* Диалог подтверждения смены направления (LTR ↔ RTL) */}
      {pending && pending.willRestart && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setPending(null)}
          statusBarTranslucent
        >
          <Pressable
            onPress={() => setPending(null)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: paper,
                borderWidth: 3,
                borderColor: ink,
                borderRadius: 16,
                padding: 18,
                width: "100%",
                maxWidth: 280,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: ink,
                  marginBottom: 6,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {t("language.restartTitle")}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  color: ink,
                  opacity: 0.75,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {t("language.restartConfirm")}
              </Text>
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  gap: 8,
                }}
              >
                <PrimaryButton
                  label={t("confirm.cancel")}
                  color="#fff"
                  textColor={ink}
                  onPress={() => setPending(null)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label={t("language.restartOk")}
                  color={GREEN}
                  textColor="#000"
                  onPress={confirmSwitch}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Overlay>
  );
}
