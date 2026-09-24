import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { BLUE } from "../theme/palettes";
import { isTaskExpired } from "../utils/date";

// Быстрое форматирование даты без toLocaleDateString
function fmtDateFast(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Мемоизированная карточка записи
const HistoryRow = memo(function HistoryRow({ item, ink, card, onDelete }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: card,
        borderWidth: 2,
        borderColor: ink,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: item.markerColor,
          borderWidth: 2,
          borderColor: ink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 13 }}>{item.markerEmoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: ink, fontWeight: "bold" }}>{item.task.title}</Text>
        <Text style={{ fontSize: 10, color: "#9a8a76" }}>
          {item.markerName} · создано {item.createdText}
          {item.task.repeat ? ` · ${item.task.repeat.count}/${item.task.repeat.target}` : ""}
        </Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: "bold", color: item.statusColor }}>{item.status}</Text>
      {item.canDelete && (
        <Pressable onPress={() => onDelete(item.raw)}>
          <Text style={{ opacity: 0.5, fontSize: 13 }}>🗑</Text>
        </Pressable>
      )}
    </View>
  );
});

export function HistoryList({ entries, onClose, onDeleteEntry }) {
  const { ink, card } = useTheme();
  const [pending, setPending] = useState(null);

  // Обогащаем записи один раз — статус, цвет, дата
  const enriched = useMemo(() => {
    return entries.map((e) => {
      const expired = isTaskExpired(e.task);   // ← один вызов на запись
      const status = e.removedAt
        ? e.task.done ? "Выполнено" : "Удалено"
        : e.task.done ? "Выполнено"
        : expired ? "Провалено"
        : "Активно";
      const statusColor = e.task.done
        ? "#2A9D8F"
        : e.removedAt
        ? "#C0392B"
        : expired
        ? BLUE
        : "#8a7a6a";
      return {
        raw: e,
        key: `${e.task.id}-${e.removedAt || "live"}`,
        task: e.task,
        markerName: e.markerName,
        markerEmoji: e.markerEmoji,
        markerColor: e.markerColor,
        status,
        statusColor,
        canDelete: status === "Выполнено" || status === "Удалено",
        createdText: fmtDateFast(e.task.createdAt),
      };
    });
  }, [entries]);

  const renderItem = useCallback(
    ({ item }) => (
      <HistoryRow item={item} ink={ink} card={card} onDelete={setPending} />
    ),
    [ink, card]
  );

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="🕓 ИСТОРИЯ" onClose={onClose} />
      <FlatList
        data={enriched}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ color: "#a0907e", fontSize: 13, fontStyle: "italic" }}>
            Пока нет ни одного дела.
          </Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

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