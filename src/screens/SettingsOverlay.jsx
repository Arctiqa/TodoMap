import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, Switch } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { useT, useLanguage, useRTL } from "../i18n/LanguageContext";
import { GREEN } from "../theme/palettes";
import { LANGUAGES } from "../i18n/translations";
import { buildJournalJSON, buildJournalTXT } from "../utils/exportJournal";

export function SettingsOverlay({
  onClose,
  onOpenTheme,
  onOpenLanguage,
  onOpenNotifications,
  onOpenAbout,
  exportData,
  notificationsEnabled,
  onToggleNotifications,
}) {
  const { ink, card, paper } = useTheme();
  const t = useT();
  const { language } = useLanguage();
  const isRTL = useRTL();
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleExport = async (format) => {
    if (!exportData) return;
    const payload = format === "json"
      ? buildJournalJSON(exportData)
      : buildJournalTXT(exportData);
    await Clipboard.setStringAsync(payload);
    setCopied(format);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <Overlay zIndex={82}>
      <OverlayHeader onBack={onClose} title={t("settings.title")} onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable onPress={onOpenTheme} style={rowStyle(ink, card, isRTL)}>
          <MaterialIcons name="color-lens" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>{t("settings.theme")}</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>{t("settings.themeHint")}</Text>
          </View>
          <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={ink} />
        </Pressable>

        <Pressable onPress={onOpenLanguage} style={rowStyle(ink, card, isRTL)}>
          <MaterialIcons name="language" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>{t("settings.language")}</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>
              {LANGUAGES[language]?.label || "—"}
            </Text>
          </View>
          <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={ink} />
        </Pressable>

        <View style={rowStyle(ink, card, isRTL)}>
          <MaterialIcons name="notifications" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>{t("settings.notifications")}</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>
              {notificationsEnabled ? t("settings.notificationsOn") : t("settings.notificationsOff")}
            </Text>
          </View>
          <Switch
            value={!!notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ false: "#ccc", true: GREEN }}
          />
        </View>

        <Pressable onPress={() => setExportOpen(true)} style={rowStyle(ink, card, isRTL)}>
          <MaterialIcons name="save-alt" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>{t("settings.export")}</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>{t("settings.exportHint")}</Text>
          </View>
          <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={ink} />
        </Pressable>

        <Pressable onPress={onOpenAbout} style={rowStyle(ink, card, isRTL)}>
          <MaterialIcons name="info-outline" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>{t("settings.about")}</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>v1.0.0</Text>
          </View>
          <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={ink} />
        </Pressable>
      </ScrollView>

      {exportOpen && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setExportOpen(false)} statusBarTranslucent>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 16 }}
            onPress={() => setExportOpen(false)}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: paper,
                borderWidth: 2,
                borderColor: ink,
                borderRadius: 18,
                width: "100%",
                maxWidth: 300,
                padding: 18,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, marginBottom: 4, textAlign: isRTL ? "right" : "left" }}>
                {t("settings.exportTitle")}
              </Text>
              <Text style={{ fontSize: 11.5, color: ink, opacity: 0.6, marginBottom: 14, textAlign: isRTL ? "right" : "left" }}>
                {t("settings.exportHint2")}
              </Text>

              <Pressable
                onPress={() => handleExport("json")}
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 10,
                  borderWidth: 1.5,
                  borderColor: ink,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                  backgroundColor: card,
                }}
              >
                <MaterialIcons name="data-object" size={22} color={ink} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>JSON</Text>
                  <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>{t("settings.exportJsonHint")}</Text>
                </View>
                <MaterialIcons name={copied === "json" ? "check" : "content-copy"} size={20} color={copied === "json" ? GREEN : ink} />
              </Pressable>

              <Pressable
                onPress={() => handleExport("txt")}
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 10,
                  borderWidth: 1.5,
                  borderColor: ink,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 14,
                  backgroundColor: card,
                }}
              >
                <MaterialIcons name="description" size={22} color={ink} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink, textAlign: isRTL ? "right" : "left" }}>TXT</Text>
                  <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>{t("settings.exportTxtHint")}</Text>
                </View>
                <MaterialIcons name={copied === "txt" ? "check" : "content-copy"} size={20} color={copied === "txt" ? GREEN : ink} />
              </Pressable>

              <PrimaryButton label={t("settings.close")} color={GREEN} onPress={() => setExportOpen(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Overlay>
  );
}

function rowStyle(ink, card, isRTL) {
  return {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: card,
    borderWidth: 2,
    borderColor: ink,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  };
}
