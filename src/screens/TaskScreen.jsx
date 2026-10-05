import React, { useState, useMemo, useRef, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Image, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, BackHandler } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { GREEN, BLUE, TEAL } from "../theme/palettes";
import { formatRemaining, isTaskExpired } from "../utils/date";
import { AddTaskBar } from "../components/AddTaskBar";
import { resolveImageSource } from "../data/initialScreens";
import { STICKER_LONG_PRESS } from "../constants/config";
import { GUIDE_BY_KEY } from "../constants/guides";
import { logEvent } from "../utils/analytics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) {}
}

function TaskRowLongPress({ task, onOpen, onExtract, onToggle, onIncrementRepeat, onDecrementRepeat }) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const expired = isTaskExpired(task);
  const [pressing, setPressing] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [confirmRepeatFinish, setConfirmRepeatFinish] = useState(false);
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
  const guide = task.source ? GUIDE_BY_KEY[task.source] : null;

  const handleToggle = (e) => {
    e.stopPropagation?.();
    if (task.done) {
      onToggle && onToggle(task.id);
      return;
    }
    if (task.source) {
      setConfirmDone(true);
    } else {
      onToggle && onToggle(task.id);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation?.();
    if (!task.repeat) return;
    const nextCount = task.repeat.count + 1;
    const willFinish = nextCount >= task.repeat.target;

    if (willFinish && task.source) {
      onIncrementRepeat && onIncrementRepeat(task.id);
      setConfirmRepeatFinish(true);
    } else {
      onIncrementRepeat && onIncrementRepeat(task.id);
    }
  };

  return (
    <>
      <Pressable
        onPressIn={startPress}
        onPressOut={endPress}
        onPress={handlePress}
        style={({ pressed }) => [
          {
            flexDirection: isRTL ? "row-reverse" : "row",
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
        {task.repeat && !task.done && onIncrementRepeat ? (
          <Pressable
            onPress={handleIncrement}
            hitSlop={6}
            style={{
              width: 28, height: 28, borderRadius: RADIUS.sm,
              borderWidth: 1.5, borderColor: GREEN,
              alignItems: "center", justifyContent: "center",
              marginTop: 2, backgroundColor: "transparent",
            }}
          >
            <MaterialIcons name="add" size={18} color={GREEN} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleToggle}
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
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...TYPE.bodyBold,
              color: expired ? BLUE : ink,
              textDecorationLine: task.done ? "line-through" : "none",
              opacity: task.done ? 0.65 : 1,
              flexShrink: 1,
              textAlign: isRTL ? "right" : "left",
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
                    textAlign: isRTL ? "right" : "left",
                  }}
                  numberOfLines={1}
                >
                  · {n.text}
                </Text>
              ))}
              {notes.length > 3 && (
                <Text style={{ fontSize: 10.5, color: ink, opacity: 0.4, textAlign: isRTL ? "right" : "left" }}>
                  +{notes.length - 3}
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
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {formatRemaining(task.due, t)}
          </Text>
        </View>

        {task.color && (
          <View
            style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: task.color,
              borderWidth: 1.5, borderColor: ink,
              marginTop: 2,
            }}
          />
        )}

        {guide && (
          <View
            style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: guide.color,
              borderWidth: 1.5, borderColor: ink,
              alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}
          >
            <MaterialIcons name={guide.icon} size={12} color={ink} />
          </View>
        )}

        {!task.done && onExtract && (
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

      {confirmDone && (
        <ConfirmDialog
          message={t("task.confirmGuideDone")}
          confirmLabel={t("guideTasks.yes")}
          confirmColor={GREEN}
          onCancel={() => setConfirmDone(false)}
          onConfirm={() => {
            setConfirmDone(false);
            onToggle && onToggle(task.id);
          }}
        />
      )}

      {confirmRepeatFinish && (
        <ConfirmDialog
          message={t("task.confirmGuideDone")}
          confirmLabel={t("guideTasks.yes")}
          confirmColor={GREEN}
          onCancel={() => {
            setConfirmRepeatFinish(false);
            onDecrementRepeat && onDecrementRepeat(task.id);
          }}
          onConfirm={() => {
            setConfirmRepeatFinish(false);
          }}
        />
      )}
    </>
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
  onDecrementRepeat,
  onOpenDetail,
  onExtractToField,
}) {
  const { ink, card, paper, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [addBarExpanded, setAddBarExpanded] = useState(false);
  const [addBarMinimized, setAddBarMinimized] = useState(false);

  const sortedTasks = useMemo(() => {
    if (!marker?.tasks) return [];
    const active = marker.tasks.filter((tsk) => !tsk.done).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const done = marker.tasks.filter((tsk) => tsk.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return [...active, ...done];
  }, [marker?.tasks]);

  const handleCopy = useCallback(async () => {
    if (!marker) return;
    const activeTasks = (marker.tasks || []).filter((tsk) => !tsk.done);
    const lines = activeTasks.map((tsk) => {
      const notes = (tsk.notes || []).map((n) => `    ${n.done ? "[x]" : "[ ]"} ${n.text}`).join("\n");
      return `- ${tsk.title}${notes ? "\n" + notes : ""}`;
    });
    const text = `${marker.emoji} ${marker.name}\n\n${lines.join("\n")}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [marker]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (addBarExpanded) {
        setAddBarExpanded(false);
        return true;
      }
      if (addBarMinimized) {
        setAddBarMinimized(false);
        return true;
      }
      if (pendingDeleteTaskId) {
        setPendingDeleteTaskId(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [addBarExpanded, addBarMinimized, pendingDeleteTaskId]);

  if (!marker) return null;

  const pendingTask = marker.tasks && marker.tasks.find((tsk) => tsk.id === pendingDeleteTaskId);

  return (
    <Overlay zIndex={50}>
      <OverlayHeader
        onBack={onClose}
        title={`${marker.emoji} ${marker.name.toUpperCase()}`}
        onClose={onClose}
        right={
          <Pressable
            onPress={handleCopy}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: RADIUS.pill,
              borderWidth: 1.5,
              borderColor: ink,
              backgroundColor: card,
            }}
          >
            <MaterialIcons
              name={copied ? "check" : "content-copy"}
              size={16}
              color={copied ? GREEN : ink}
            />
            <Text style={{ fontSize: 11.5, fontWeight: "700", color: copied ? GREEN : ink }}>
              {copied ? t("task.copied") : t("task.copy")}
            </Text>
          </Pressable>
        }
      />

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
        {addBarExpanded && !addBarMinimized && (
          <Pressable
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 5,
            }}
            onPress={() => {
              setAddBarExpanded(false);
              setAddBarMinimized(false);
            }}
          />
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          {(!marker.tasks || marker.tasks.length === 0) && (
            <EmptyState
              emoji="✨"
              title={t("task.empty")}
              subtitle={t("task.emptySub")}
            />
          )}

          {sortedTasks.map((tsk, index) => {
            const prev = sortedTasks[index - 1];
            const showActiveDivider = !tsk.done && (index === 0 || sortedTasks[index - 1].done);
            const showDoneDivider = tsk.done && index > 0 && !prev.done;

            return (
              <React.Fragment key={tsk.id}>
                {showActiveDivider && (
                  <Text style={{ ...TYPE.caption, color: ink, opacity: 0.4, textAlign: "center", marginVertical: SPACING.sm }}>
                    {t("task.activeDivider")}
                  </Text>
                )}
                {showDoneDivider && (
                  <Text style={{ ...TYPE.caption, color: ink, opacity: 0.4, textAlign: "center", marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
                    {t("task.doneDivider")}
                  </Text>
                )}

                <TaskRowLongPress
                  task={tsk}
                  onOpen={(task) => onOpenDetail(task)}
                  onExtract={onExtractToField}
                  onToggle={(taskId) => onToggle(marker.id, taskId)}
                  onIncrementRepeat={(taskId) => onIncrementRepeat && onIncrementRepeat(marker.id, taskId)}
                  onDecrementRepeat={(taskId) => onDecrementRepeat && onDecrementRepeat(marker.id, taskId)}
                />
              </React.Fragment>
            );
          })}
        </ScrollView>

        <View style={{ zIndex: 10, position: "relative" }}>
          <AddTaskBar
            visible={true}
            targetMarkerId={marker.id}
            collapsed={!addBarExpanded}
            minimized={addBarMinimized}
            onExpand={() => { setAddBarExpanded(true); setAddBarMinimized(false); }}
            onCollapse={() => { setAddBarExpanded(false); setAddBarMinimized(false); }}
            onMinimize={() => { setAddBarExpanded(false); setAddBarMinimized(true); }}
            onUnminimize={() => { setAddBarExpanded(false); setAddBarMinimized(false); }}
            showColorPicker={true}
            onSubmit={({ title, due, repeat, share, color }) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onAdd(marker.id, title, due, repeat, color);
              logEvent("task_created", {
                hasDue: !!due,
                hasRepeat: !!repeat,
                hasShare: !!share,
                hasColor: !!color,
                target: "marker",   // добавили в метку
              });             
              if (share && onShare) onShare(title, due);
              setAddBarExpanded(false);
              setAddBarMinimized(false);
            }}
          />
        </View>
      </KeyboardAvoidingView>

      {pendingTask && (
        <ConfirmDialog
          message={t("task.deleteTask", { title: pendingTask.title })}
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
