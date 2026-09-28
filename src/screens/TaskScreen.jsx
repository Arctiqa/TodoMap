import React, { useState, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Image, LayoutAnimation, Platform, UIManager } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) {}
}

export function TaskScreen({
  marker, onClose, onToggle, onAdd, onDelete, onShare, onIncrementRepeat, onOpenDetail,
}) {
  const { ink, card, paper, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);

  const sortedTasks = useMemo(() => {
    if (!marker?.tasks) return [];
    const active = marker.tasks.filter((t) => !t.done).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const done = marker.tasks.filter((t) => t.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return [...active, ...done];
  }, [marker?.tasks]);

  if (!marker) return null;

  const pendingTask = marker.tasks && marker.tasks.find((t) => t.id === pendingDeleteTaskId);

  const handleToggle = (taskId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(marker.id, taskId);
  };

  return (
    <Overlay zIndex={50}>
      <OverlayHeader
        onBack={onClose}
        title={`${marker.emoji} ${marker.name.toUpperCase()}`}
        onClose={onClose}
      />

      {marker.image && (
        <View style={{ alignItems: "center", paddingTop: SPACING.md }}>
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

      <Text
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          ...TYPE.caption,
          color: ink,
          opacity: 0.5,
        }}
      >
        ДЕЛА
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 120 }}
      >
        {(!marker.tasks || marker.tasks.length === 0) && (
          <EmptyState
            emoji="✨"
            title="Пока пусто"
            subtitle="Самое время добавить первое дело"
          />
        )}

        {sortedTasks.map((t, index) => {
          const expired = isTaskExpired(t);
          const prev = sortedTasks[index - 1];
          const showActiveDivider = !t.done && (index === 0 || sortedTasks[index - 1].done);
          const showDoneDivider = t.done && index > 0 && !prev.done;

          return (
            <React.Fragment key={t.id}>
              {showActiveDivider && (
                <Text
                  style={{
                    ...TYPE.caption,
                    color: ink,
                    opacity: 0.4,
                    textAlign: "center",
                    marginVertical: SPACING.sm,
                  }}
                >
                  — АКТИВНЫЕ —
                </Text>
              )}
              {showDoneDivider && (
                <Text
                  style={{
                    ...TYPE.caption,
                    color: ink,
                    opacity: 0.4,
                    textAlign: "center",
                    marginTop: SPACING.lg,
                    marginBottom: SPACING.sm,
                  }}
                >
                  — ЗАВЕРШЁННЫЕ —
                </Text>
              )}

              <Pressable
                onPress={() => onOpenDetail(t)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: SPACING.sm,
                    backgroundColor: card,
                    opacity: t.done ? 0.55 : pressed ? 0.92 : 1,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                  SHADOW.sm,
                ]}
              >
                {t.repeat && !t.done ? (
                  <Pressable
                    onPress={(ev) => { ev.stopPropagation?.(); onIncrementRepeat(marker.id, t.id); }}
                    hitSlop={6}
                    style={{
                      width: 28, height: 28, borderRadius: RADIUS.sm,
                      borderWidth: 1.5, borderColor: muted + "80",
                      alignItems: "center", justifyContent: "center",
                      marginTop: 2, backgroundColor: paper,
                    }}
                  >
                    <MaterialIcons name="add" size={18} color={ink} />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={(ev) => { ev.stopPropagation?.(); handleToggle(t.id); }}
                    hitSlop={6}
                    style={{
                      width: 28, height: 28, borderRadius: RADIUS.sm,
                      borderWidth: 1.5, borderColor: t.done ? TEAL : muted + "80",
                      alignItems: "center", justifyContent: "center",
                      marginTop: 2, backgroundColor: t.done ? TEAL : "transparent",
                    }}
                  >
                    {t.done && <MaterialIcons name="check" size={18} color="#fff" />}
                  </Pressable>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...TYPE.bodyBold,
                      color: expired ? BLUE : ink,
                      textDecorationLine: t.done ? "line-through" : "none",
                      opacity: t.done ? 0.65 : 1,
                    }}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>

                  {t.repeat && (
                    <View style={{ marginTop: SPACING.xs }}>
                      <ProgressBar value={t.repeat.count} max={t.repeat.target} color={GREEN} height={4} />
                      <Text style={{ ...TYPE.monoSm, color: ink, opacity: 0.55, marginTop: 2 }}>
                        🔁 {t.repeat.count}/{t.repeat.target}
                      </Text>
                    </View>
                  )}

                  {t.notes && t.notes.length > 0 && (
                    <View style={{ marginTop: SPACING.xs, gap: 1 }}>
                      {t.notes.slice(0, 3).map((n, i) => (
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
                      {t.notes.length > 3 && (
                        <Text style={{ fontSize: 10.5, color: ink, opacity: 0.4 }}>
                          и ещё {t.notes.length - 3}
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
                    {formatRemaining(t.due)}
                  </Text>
                </View>

                <Pressable
                  onPress={(ev) => { ev.stopPropagation?.(); setPendingDeleteTaskId(t.id); }}
                  hitSlop={8}
                  style={{ marginTop: 2 }}
                >
                  <MaterialIcons name="close" size={18} color={muted} />
                </Pressable>
              </Pressable>
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
