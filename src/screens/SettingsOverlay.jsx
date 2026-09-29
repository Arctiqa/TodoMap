import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, Switch } from "react-native";
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
  exportData,
  notificationsEnabled,
  onToggleNotifications,
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

  return (
    <Overlay zIndex={82}>
      <OverlayHeader onBack={onClose} title="НАСТРОЙКИ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable
          onPress={onOpenTheme}
          style={rowStyle(ink, card)}
        >
          <MaterialIcons name="color-lens" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>Тема</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>Светлая, тёмная, синяя…</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={ink} />
        </Pressable>

        <Pressable onPress={onOpenLanguage} style={rowStyle(ink, card)}>
          <MaterialIcons name="language" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>Язык</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>Русский</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={ink} />
        </Pressable>

        {/* Уведомления — переключатель */}
        <View style={rowStyle(ink, card)}>
          <MaterialIcons name="notifications" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>Уведомления</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>
              {notificationsEnabled ? "Включены" : "Выключены"}
            </Text>
          </View>
          <Switch
            value={!!notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ false: "#ccc", true: GREEN }}
          />
        </View>

        <Pressable onPress={() => setExportOpen(true)} style={rowStyle(ink, card)}>
          <MaterialIcons name="save-alt" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>Скопировать журнал</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>JSON или TXT в буфер</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={ink} />
        </Pressable>

        <Pressable onPress={onOpenAbout} style={rowStyle(ink, card)}>
          <MaterialIcons name="info-outline" size={24} color={ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>О приложении</Text>
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>v1.0.0</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={ink} />
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
              <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, marginBottom: 4 }}>
                Экспорт журнала
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
                <MaterialIcons name={copied === "json" ? "check" : "content-copy"} size={20} color={copied === "json" ? GREEN : ink} />
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
                <MaterialIcons name={copied === "txt" ? "check" : "content-copy"} size={20} color={copied === "txt" ? GREEN : ink} />
              </Pressable>

              <PrimaryButton label="Закрыть" color={GREEN} onPress={() => setExportOpen(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Overlay>
  );
}

function rowStyle(ink, card) {
  return {
    flexDirection: "row",
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
