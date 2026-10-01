import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { BLUE, GREEN, RED, TEAL } from "../theme/palettes";
import { isTaskExpired, formatRemaining, fmtDate } from "../utils/date";
import { ProgressBar } from "./ui/ProgressBar";
import { GUIDE_BY_KEY } from "../constants/guides";

export const TaskRow = memo(function TaskRow({
  entry,
  showPath = true,
  isDone = false,
  withActions = false,
  actionKind,
  onOpenDetail,
  onReturn,
  onComplete,
  onDelete,
}) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const t = entry.task;
  const color = t.color;
  const expired = !isDone && isTaskExpired(t);
  const notes = t.notes || [];
  const notesDone = notes.filter((n) => n.done).length;
  const hasNotes = notes.length > 0;
  const hasRepeat = !!t.repeat;
  const guide = t.source ? GUIDE_BY_KEY[t.source] : null;

  return (
    <Pressable
      onPress={() => onOpenDetail && onOpenDetail(entry)}
      style={({ pressed }) => [
        {
          backgroundColor: card,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          marginBottom: SPACING.sm,
          opacity: isDone ? 0.55 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        SHADOW.md,
      ]}
    >
      
      {color && (
        <View
          style={{
            width: 6,
            borderRadius: 3,
            backgroundColor: color,
            alignSelf: "stretch",
            borderWidth: 1,
            borderColor: ink,
          }}
        />
      )}      
      
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
        {/* Эмодзи метки */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: entry.markerColor + "33",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>{entry.markerEmoji}</Text>
        </View>

        {/* Центральная колонка */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...TYPE.bodyBold,
              color: expired ? BLUE : ink,
              textDecorationLine: isDone ? "line-through" : "none",
            }}
            numberOfLines={2}
          >
            {t.title}
          </Text>

          {showPath && (
            <Text
              style={{
                ...TYPE.small,
                color: ink,
                opacity: 0.5,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {entry.markerName} · {(entry.screenName || "").replace(/^[^\wА-Яа-я]+/, "")}
            </Text>
          )}
        </View>

        {/* Правая колонка: срок + иконка гида */}
        <View style={{ alignItems: "flex-end", maxWidth: 90, gap: 4 }}>
          <Text
            style={{
              ...TYPE.monoSm,
              color: expired ? BLUE : isDone ? TEAL : ink,
              opacity: expired || isDone ? 1 : 0.65,
              fontWeight: expired ? "700" : "400",
            }}
            numberOfLines={1}
          >
            {isDone && t.completedAt ? fmtDate(t.completedAt) : formatRemaining(t.due)}
          </Text>
          {guide && (
            <View
              style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: guide.color,
                borderWidth: 1, borderColor: ink,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <MaterialIcons name={guide.icon} size={10} color={ink} />
            </View>
          )}
        </View>
      </View>

        {hasRepeat && (
          <View style={{ marginTop: SPACING.sm, gap: SPACING.xs }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <ProgressBar value={t.repeat.count} max={t.repeat.target} color={GREEN} height={5} style={{ flex: 1 }} />
              <Text style={{ ...TYPE.monoSm, color: ink, opacity: 0.55, minWidth: 30, textAlign: "right" }}>
                {t.repeat.count}/{t.repeat.target}
              </Text>
            </View>
          </View>
        )}

      {withActions && (onReturn || onComplete || onDelete) && (
        <View
          style={{
            flexDirection: "row",
            gap: SPACING.sm,
            marginTop: SPACING.md,
            flexWrap: "wrap",
          }}
        >
          {onReturn && (
            <ActionButton icon="undo" label="Вернуть" color={ink} onPress={onReturn} />
          )}
          {onComplete && (
            <ActionButton icon="check" label="Выполнено" color={TEAL} filled onPress={onComplete} />
          )}
          {onDelete && (
            <ActionButton icon="delete-outline" label="Удалить" color={RED} onPress={onDelete} />
          )}
        </View>
      )}
    </Pressable>
  );
});

function ActionButton({ icon, label, color, onPress, filled = false }) {
  const { RADIUS, SPACING } = useTheme();
  return (
    <Pressable
      onPress={(ev) => {
        ev.stopPropagation?.();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
        backgroundColor: filled ? color : "transparent",
        borderWidth: filled ? 0 : 1,
        borderColor: color + "55",
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <MaterialIcons name={icon} size={14} color={filled ? "#fff" : color} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: filled ? "#fff" : color }}>
        {label}
      </Text>
    </Pressable>
  );
}
