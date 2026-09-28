import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";
import { buildJournalJSON, buildJournalTXT } from "../utils/exportJournal";

export function SettingsOverlay({
  onClose,
  onOpenTheme,
  onOpenLanguage,
  onOpenNotifications,
  onOpenAbout,
  exportData,        // ← { screens, historyLog, thoughts, guideProgress }
}) {
  const { ink, card, paper } = useTheme();
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleExport = async (format) => {
    if (!exportData) return;
    let payload;
    if (format === "json") {
      payload = buildJournalJSON(exportData);
    } else {
      payload = buildJournalTXT(exportData);
    }
    await Clipboard.setStringAsync(payload);
    setCopied(format);
    setTimeout(() => setCopied(null), 1800);
  };

  const items = [
    { key: "theme",         icon: "color-lens",    label: "Тема",         desc: "Светлая, тёмная, синяя…", onPress: onOpenTheme },
    { key: "language",      icon: "language",      label: "Язык",         desc: "Русский",                  onPress: onOpenLanguage },
    { key: "notifications", icon: "notifications", label: "Уведомления",  desc: "Напоминания о делах",      onPress: onOpenNotifications },
    { key: "export",        icon: "save-alt",      label: "Скопировать журнал", desc: "JSON или TXT в буфер",    onPress: () => setExportOpen(true) },
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

      {/* Модалка выбора формата */}
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
              <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, marginBottom: 4 }}>
                📄 Экспорт журнала
              </Text>
              <Text style={{ fontSize: 11.5, color: ink, opacity: 0.6, marginBottom: 14 }}>
                Выбери формат — данные скопируются в буфер обмена
              </Text>

              <Pressable
                onPress={() => handleExport("json")}
                style={{
                  flexDirection: "row",
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
                  <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink }}>JSON</Text>
                  <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6 }}>Полная структура данных</Text>
                </View>
                {copied === "json" && <MaterialIcons name="check" size={20} color={GREEN} />}
              </Pressable>

              <Pressable
                onPress={() => handleExport("txt")}
                style={{
                  flexDirection: "row",
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
                  <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink }}>TXT</Text>
                  <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6 }}>Читаемый лог с датами</Text>
                </View>
                {copied === "txt" && <MaterialIcons name="check" size={20} color={GREEN} />}
              </Pressable>

              <PrimaryButton label="Закрыть" color={GREEN} onPress={() => setExportOpen(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Overlay>
  );
}