import React, { useState, useMemo, useRef, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Image, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE, TEAL } from "../theme/palettes";
import { formatRemaining, isTaskExpired } from "../utils/date";
import { AddTaskBar } from "../components/AddTaskBar";
import { resolveImageSource } from "../data/initialScreens";
import { STICKER_LONG_PRESS } from "../constants/config";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) {}
}

function TaskRowLongPress({ task, onOpen, onExtract, onToggle, onIncrementRepeat }) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const expired = isTaskExpired(task);
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);

  const startPress = () => {
    longFiredRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      setPressing(false);
      onExtract && onExtract(task.id);
    }, STICKER_LONG_PRESS);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  };

  const handlePress = () => {
    if (!longFiredRef.current) {
      onOpen && onOpen(task);
    }
    longFiredRef.current = false;
  };

  const notes = task.notes || [];
  const notesDone = notes.filter((n) => n.done).length;

  return (
    <Pressable
      onPressIn={startPress}
      onPressOut={endPress}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: SPACING.sm,
          backgroundColor: card,
          opacity: task.done ? 0.55 : pressed || pressing ? 0.92 : 1,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          transform: [{ scale: pressing ? 0.98 : 1 }],
          borderWidth: pressing ? 2 : 0,
          borderColor: pressing ? ink : "transparent",
        },
        SHADOW.sm,
      ]}
    >
      {/* Галка — тап toggles done */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onToggle && onToggle(task.id);
        }}
        hitSlop={6}
        style={{
          width: 28, height: 28, borderRadius: RADIUS.sm,
          borderWidth: 1.5, borderColor: task.done ? TEAL : muted + "80",
          alignItems: "center", justifyContent: "center",
          marginTop: 2, backgroundColor: task.done ? TEAL : "transparent",
        }}
      >
        {task.done && <MaterialIcons name="check" size={18} color="#fff" />}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...TYPE.bodyBold,
            color: expired ? BLUE : ink,
            textDecorationLine: task.done ? "line-through" : "none",
            opacity: task.done ? 0.65 : 1,
          }}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.repeat && (
          <View style={{ marginTop: SPACING.xs }}>
            <ProgressBar value={task.repeat.count} max={task.repeat.target} color={GREEN} height={4} />
            <Text style={{ ...TYPE.monoSm, color: ink, opacity: 0.55, marginTop: 2 }}>
              {task.repeat.count}/{task.repeat.target}
            </Text>
          </View>
        )}

        {notes.length > 0 && (
          <View style={{ marginTop: SPACING.xs, gap: 1 }}>
            {notes.slice(0, 3).map((n, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 11.5,
                  color: ink,
                  opacity: n.done ? 0.4 : 0.75,
                  textDecorationLine: n.done ? "line-through" : "none",
                }}
                numberOfLines={1}
              >
                · {n.text}
              </Text>
            ))}
            {notes.length > 3 && (
              <Text style={{ fontSize: 10.5, color: ink, opacity: 0.4 }}>
                и ещё {notes.length - 3}
              </Text>
            )}
          </View>
        )}

        <Text
          style={{
            fontSize: 11,
            marginTop: SPACING.xs,
            color: expired ? BLUE : ink,
            opacity: expired ? 1 : 0.55,
            fontWeight: expired ? "700" : "400",
          }}
        >
          {formatRemaining(task.due)}
        </Text>
      </View>

      {/* Кнопка «+» повтора, если задача не done и есть repeat */}
      {!task.done && task.repeat && onIncrementRepeat && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onIncrementRepeat(task.id);
          }}
          hitSlop={6}
          style={{
            width: 28, height: 28, borderRadius: 14,
            borderWidth: 1.5, borderColor: GREEN,
            alignItems: "center", justifyContent: "center",
            marginTop: 2,
            backgroundColor: "transparent",
          }}
        >
          <MaterialIcons name="add" size={18} color={GREEN} />
        </Pressable>
      )}

      {!task.done && onExtract && !task.repeat && (
        <View
          style={{
            width: 22, height: 22, borderRadius: 11,
            alignItems: "center", justifyContent: "center",
            backgroundColor: pressing ? ink : "transparent",
            marginTop: 2,
          }}
        >
          <MaterialIcons
            name="open-with"
            size={pressing ? 16 : 14}
            color={pressing ? "#fff" : ink}
            style={{ opacity: pressing ? 1 : 0.3 }}
          />
        </View>
      )}
    </Pressable>
  );
}

export function TaskScreen({
  marker,
  onClose,
  onToggle,
  onAdd,
  onDelete,
  onShare,
  onIncrementRepeat,
  onOpenDetail,
  onExtractToField,
}) {
  const { ink, card, paper, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);
  const [copied, setCopied] = useState(false);

  const sortedTasks = useMemo(() => {
    if (!marker?.tasks) return [];
    const active = marker.tasks.filter((t) => !t.done).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const done = marker.tasks.filter((t) => t.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return [...active, ...done];
  }, [marker?.tasks]);

  const handleCopy = useCallback(async () => {
    if (!marker) return;
    const activeTasks = (marker.tasks || []).filter((t) => !t.done);
    const lines = activeTasks.map((t) => {
      const notes = (t.notes || []).map((n) => `    ${n.done ? "[x]" : "[ ]"} ${n.text}`).join("\n");
      return `- ${t.title}${notes ? "\n" + notes : ""}`;
    });
    const text = `${marker.emoji} ${marker.name}\n\n${lines.join("\n")}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [marker]);

  if (!marker) return null;

  const pendingTask = marker.tasks && marker.tasks.find((t) => t.id === pendingDeleteTaskId);

  return (
    <Overlay zIndex={50}>
      <OverlayHeader
        onBack={onClose}
        title={`${marker.emoji} ${marker.name.toUpperCase()}`}
        onClose={onClose}
      />

      {/* Шапка действий — копирование */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
        <Pressable
          onPress={handleCopy}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: RADIUS.pill,
            borderWidth: 1.5,
            borderColor: ink,
            backgroundColor: card,
          }}
        >
          <MaterialIcons name={copied ? "check" : "content-copy"} size={16} color={copied ? GREEN : ink} />
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: copied ? GREEN : ink }}>
            {copied ? "Скопировано" : "Копировать"}
          </Text>
        </Pressable>
      </View>

      {marker.image && (
        <View style={{ alignItems: "center", paddingTop: SPACING.sm }}>
          <Image
            source={resolveImageSource(marker.image)}
            style={{
              width: 90, height: 90,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: muted + "40",
            }}
          />
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          {(!marker.tasks || marker.tasks.length === 0) && (
            <EmptyState
              emoji="✨"
              title="Пока пусто"
              subtitle="Самое время добавить первое дело"
            />
          )}

          {sortedTasks.map((t, index) => {
            const prev = sortedTasks[index - 1];
            const showActiveDivider = !t.done && (index === 0 || sortedTasks[index - 1].done);
            const showDoneDivider = t.done && index > 0 && !prev.done;

            return (
              <React.Fragment key={t.id}>
                {showActiveDivider && (
                  <Text style={{ ...TYPE.caption, color: ink, opacity: 0.4, textAlign: "center", marginVertical: SPACING.sm }}>
                    — АКТИВНЫЕ —
                  </Text>
                )}
                {showDoneDivider && (
                  <Text style={{ ...TYPE.caption, color: ink, opacity: 0.4, textAlign: "center", marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
                    — ЗАВЕРШЁННЫЕ —
                  </Text>
                )}

                <TaskRowLongPress
                  task={t}
                  onOpen={(task) => onOpenDetail(task)}
                  onExtract={!t.done && !t.repeat ? onExtractToField : undefined}
                  onToggle={(taskId) => onToggle(marker.id, taskId)}
                  onIncrementRepeat={(taskId) => onIncrementRepeat && onIncrementRepeat(marker.id, taskId)}
                />
              </React.Fragment>
            );
          })}
        </ScrollView>

        <AddTaskBar
          visible={true}
          targetMarkerId={marker.id}
          onSubmit={({ title, due, repeat, share }) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onAdd(marker.id, title, due, repeat);
            if (share && onShare) onShare(title, due);
          }}
        />
      </KeyboardAvoidingView>

      {pendingTask && (
        <ConfirmDialog
          message={`Удалить дело «${pendingTask.title}»?`}
          onCancel={() => setPendingDeleteTaskId(null)}
          onConfirm={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onDelete(marker.id, pendingDeleteTaskId);
            setPendingDeleteTaskId(null);
          }}
        />
      )}
    </Overlay>
  );
}
