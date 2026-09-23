import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { BLUE } from "../theme/palettes";
import { fmtDate, isTaskExpired } from "../utils/date";

export function HistoryList({ entries, onClose, onDeleteEntry }) {
  const { ink, card } = useTheme();
  const [pending, setPending] = useState(null);

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="🕓 ИСТОРИЯ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {entries.length === 0 && <Text style={{ color: "#a0907e", fontSize: 13, fontStyle: "italic" }}>Пока нет ни одного дела.</Text>}
        {entries.map((e) => {
          const status = e.removedAt ? (e.task.done ? "Выполнено" : "Удалено") : e.task.done ? "Выполнено" : isTaskExpired(e.task) ? "Провалено" : "Активно";
          const statusColor = e.task.done ? "#2A9D8F" : e.removedAt ? "#C0392B" : isTaskExpired(e.task) ? BLUE : "#8a7a6a";
          const canDelete = status === "Выполнено" || status === "Удалено";
          return (
            <View key={`${e.task.id}-${e.removedAt || "live"}`} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: card, borderWidth: 2, borderColor: ink, borderRadius: 10, padding: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: e.markerColor, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 13 }}>{e.markerEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: ink, fontWeight: "bold" }}>{e.task.title}</Text>
                <Text style={{ fontSize: 10, color: "#9a8a76" }}>
                  {e.markerName} · создано {fmtDate(e.task.createdAt)}
                  {e.task.repeat ? ` · ${e.task.repeat.count}/${e.task.repeat.target}` : ""}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: statusColor }}>{status}</Text>
              {canDelete && (
                <Pressable onPress={() => setPending(e)}>
                  <Text style={{ opacity: 0.5, fontSize: 13 }}>🗑</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      {pending && (
        <ConfirmDialog
          message={`Удалить «${pending.task.title}» из истории?`}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onDeleteEntry(pending);
            setPending(null);
          }}
        />
      )}
    </Overlay>
  );
}