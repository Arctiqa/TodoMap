import React, { useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { GREEN } from "../theme/palettes";
import { GUIDE_BY_KEY } from "../constants/guides";

export function GuideTasksOverlay({
  guideKey,
  guideUsedOffers,
  guideCompletedOffers,
  onTakeTask,
  onBack,
  onClose,
}) {
  const { ink, card, paper, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const [confirmTaskId, setConfirmTaskId] = useState(null);

  const guide = GUIDE_BY_KEY[guideKey];
  if (!guide) return null;

  const meta = { name: guide.name, icon: guide.icon, color: guide.color };
  const tasks = guide.tasks || [];

  const usedSet = useMemo(() => new Set(guideUsedOffers || []), [guideUsedOffers]);
  const completedSet = useMemo(() => new Set(guideCompletedOffers || []), [guideCompletedOffers]);

  const handlePick = useCallback((task) => {
    const taken = usedSet.has(task.id);
    const completed = completedSet.has(task.id);
    if (taken && !completed) return;
    setConfirmTaskId(task.id);
  }, [usedSet, completedSet]);

  const handleConfirm = useCallback(() => {
    const task = tasks.find((tsk) => tsk.id === confirmTaskId);
    setConfirmTaskId(null);
    if (task) onTakeTask(guideKey, task);
  }, [confirmTaskId, tasks, guideKey, onTakeTask]);

  const handleCancel = useCallback(() => {
    setConfirmTaskId(null);
  }, []);

  return (
    <Overlay zIndex={74} background={paper}>
      <OverlayHeader onBack={onBack} title="" onClose={onClose} />

      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: meta.color,
            borderWidth: 2, borderColor: ink,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <MaterialIcons name={meta.icon} size={30} color={ink} />
        </View>
        <Text style={{ fontSize: 12, fontWeight: "800", color: ink, marginTop: 8, letterSpacing: 1 }}>
          {meta.name}
        </Text>
        <Text style={{ fontSize: 11, color: ink, opacity: 0.5, marginTop: 2 }}>
          {t("guideTasks.completed", {
            done: guideCompletedOffers ? guideCompletedOffers.filter((id) => id.startsWith(guideKey + "_")).length : 0,
            total: tasks.length,
          })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {tasks.map((task) => {
          const taken = usedSet.has(task.id);
          const completed = completedSet.has(task.id);
          const confirming = confirmTaskId === task.id;

          return (
            <View key={task.id} style={{ marginBottom: SPACING.sm }}>
              <Pressable
                onPress={() => handlePick(task)}
                style={({ pressed }) => [
                  {
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: SPACING.sm,
                    backgroundColor: card,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                    opacity: completed ? 0.45 : pressed ? 0.9 : 1,
                  },
                  SHADOW.sm,
                ]}
              >
                <View
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: meta.color,
                    borderWidth: 1.5, borderColor: ink,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <MaterialIcons name={meta.icon} size={13} color={ink} />
                </View>

                <Text
                  style={{
                    ...TYPE.body,
                    color: ink,
                    flex: 1,
                    textAlign: isRTL ? "right" : "left",
                  }}
                  numberOfLines={3}
                >
                  {task.title}
                </Text>

                {taken && !completed && (
                  <View
                    style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: GREEN,
                      borderWidth: 1.5, borderColor: ink,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <MaterialIcons name="check" size={14} color="#fff" />
                  </View>
                )}

                {completed && (
                  <MaterialIcons name="check-circle" size={20} color={ink} style={{ opacity: 0.6 }} />
                )}
              </Pressable>

              {confirming && (
                <View
                  style={{
                    marginTop: 6,
                    backgroundColor: card,
                    borderWidth: 1.5,
                    borderColor: ink,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                  }}
                >
                  <Text style={{ ...TYPE.body, color: ink, marginBottom: SPACING.sm, textAlign: isRTL ? "right" : "left" }}>
                    {t("guideTasks.takeConfirm", { title: task.title })}
                  </Text>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: SPACING.sm }}>
                    <Pressable
                      onPress={handleConfirm}
                      style={({ pressed }) => ({
                        flex: 1,
                        backgroundColor: GREEN,
                        borderWidth: 1.5,
                        borderColor: ink,
                        borderRadius: RADIUS.md,
                        paddingVertical: 10,
                        alignItems: "center",
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>{t("guideTasks.yes")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCancel}
                      style={({ pressed }) => ({
                        flex: 1,
                        backgroundColor: paper,
                        borderWidth: 1.5,
                        borderColor: ink,
                        borderRadius: RADIUS.md,
                        paddingVertical: 10,
                        alignItems: "center",
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text style={{ color: ink, fontWeight: "800", fontSize: 13 }}>{t("guideTasks.no")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}
