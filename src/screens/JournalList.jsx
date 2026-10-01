import React, { useState, useMemo, useCallback, memo, useRef } from "react";
import { View, Text, Pressable, FlatList, LayoutAnimation, Platform, UIManager } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { Chip } from "../components/ui/Chip";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { TaskRow } from "../components/TaskRow";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE, RED, TEAL } from "../theme/palettes";
import { ThoughtsSection } from "./ThoughtsSection";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) {}
}

const SORTS = [
  { key: "markers", label: "По меткам" },
  { key: "added",   label: "Добавление" },
  { key: "alpha",   label: "А–Я" },
];

function byAdded(a, b) {
  const d = (b.task.createdAt || 0) - (a.task.createdAt || 0);
  if (d !== 0) return d;
  return (Number(b.task.id) || 0) - (Number(a.task.id) || 0);
}

function byAlpha(a, b) {
  const d = String(a.task.title || "").localeCompare(String(b.task.title || ""), "ru", { sensitivity: "base" });
  return d !== 0 ? d : byAdded(a, b);
}

const SectionHeader = memo(function SectionHeader({ title, count, color, open, onToggle, ink, RADIUS, TYPE }) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialIcons name={open ? "expand-more" : "chevron-right"} size={22} color={ink} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: "900", color: color || ink, letterSpacing: 1 }}>
        {title}
      </Text>
      <View
        style={{
          minWidth: 26,
          height: 22,
          paddingHorizontal: 8,
          borderRadius: RADIUS.pill,
          backgroundColor: color || ink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>{count}</Text>
      </View>
    </Pressable>
  );
});

export function JournalList({
  active, expired, done, thoughts,
  onClose, onOpenDetail,
  onAddThought, onDeleteThought, onConvertThought,
  onReturnTask, onCompleteTask, onDeleteTask,
}) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();
  const [mode, setMode] = useState("markers");
  const [doneFilter, setDoneFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const scrollRef = useRef(null);
  const [pendingExpiredAction, setPendingExpiredAction] = useState(null);

  const [openSections, setOpenSections] = useState({
    active: false,
    expired: false,
    done: false,
    thoughts: false,
  });

  const toggle = useCallback((key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const flatActive = useMemo(
    () => [...active].sort(mode === "alpha" ? byAlpha : byAdded),
    [active, mode]
  );

  const flatExpired = useMemo(() => [...expired].sort(byAdded), [expired]);

  const filteredDone = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    return [...done]
      .filter((e) => {
        const t = e.task.completedAt || 0;
        if (doneFilter === "today") return now - t < day;
        if (doneFilter === "week") return now - t < day * 7;
        if (doneFilter === "month") return now - t < day * 30;
        return true;
      })
      .sort((a, b) => (b.task.completedAt || 0) - (a.task.completedAt || 0));
  }, [done, doneFilter]);

  const items = useMemo(() => {
    const out = [];

    out.push({ type: "header", key: "h_active", section: "active", title: "АКТИВНЫЕ", count: active.length, color: RED });
    if (openSections.active) {
      out.push({ type: "sortChips", key: "sort_active" });
      if (flatActive.length === 0) {
        out.push({ title: "Активных дел нет"});
      } else if (mode === "markers") {
        const byMarker = new Map();
        flatActive.forEach((e) => {
          const key = `${e.screenId}::${e.markerId}`;
          if (!byMarker.has(key)) {
            byMarker.set(key, {
              markerId: e.markerId, markerName: e.markerName,
              markerEmoji: e.markerEmoji, markerColor: e.markerColor,
              screenName: e.screenName, items: [],
            });
          }
          byMarker.get(key).items.push(e);
        });
        const blocks = [...byMarker.values()].sort((a, b) =>
          a.markerName.localeCompare(b.markerName, "ru", { sensitivity: "base" })
        );
        blocks.forEach((block, bi) => {
          out.push({ type: "markerBlock", key: `mb_${block.markerId}_${bi}`, block });
        });
      } else {
        flatActive.forEach((e) => out.push({ type: "task", key: `a_${e.task.id}`, entry: e, showPath: true }));
      }
    }

    out.push({ type: "header", key: "h_expired", section: "expired", title: "ПРОВАЛЕННЫЕ", count: expired.length, color: BLUE });
    if (openSections.expired) {
      if (flatExpired.length === 0) {
        out.push({ title: "Проваленных нет" });
      } else {
        flatExpired.forEach((e) => out.push({ type: "task", key: `x_${e.task.id}`, entry: e, showPath: true, withActions: true, actionKind: "expired" }));
      }
    }

    out.push({ type: "header", key: "h_done", section: "done", title: "ВЫПОЛНЕННЫЕ", count: done.length, color: TEAL });
    if (openSections.done) {
      out.push({ type: "doneChips", key: "done_chips" });
      if (filteredDone.length === 0) {
        out.push({ title: "Ничего не найдено" });
      } else {
        filteredDone.forEach((e) => out.push({ type: "task", key: `d_${e.task.id}`, entry: e, showPath: true, isDone: true, withActions: true, actionKind: "done" }));
      }
    }

    out.push({ type: "header", key: "h_thoughts", section: "thoughts", title: "МЫСЛИ", count: thoughts.length, color: ink });
    if (openSections.thoughts) {
      out.push({ type: "thoughts", key: "thoughts_block" });
    }

    return out;
  }, [active, expired, done, thoughts, flatActive, flatExpired, filteredDone, openSections, doneFilter, mode, ink]);

  const renderItem = useCallback(({ item }) => {
    switch (item.type) {
      case "header":
        return (
          <SectionHeader
            title={item.title}
            count={item.count}
            color={item.color}
            open={openSections[item.section]}
            onToggle={() => toggle(item.section)}
            ink={ink} RADIUS={RADIUS} TYPE={TYPE}
          />
        );

      case "sortChips":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.sm }}>
            {SORTS.map((s) => (
              <Chip key={s.key} label={s.label} active={mode === s.key} onPress={() => setMode(s.key)} size="sm" />
            ))}
          </View>
        );

      case "markerBlock":
        return (
          <View style={{ marginBottom: SPACING.lg }}>
            <View
              style={{
                flexDirection: "row", alignItems: "center", gap: SPACING.sm,
                paddingVertical: SPACING.xs, marginBottom: SPACING.sm,
              }}
            >
              <View
                style={{
                  width: 26, height: 26, borderRadius: 13,
                  backgroundColor: item.block.markerColor + "33",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12 }}>{item.block.markerEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPE.smallBold, color: ink }}>{item.block.markerName}</Text>
                <Text style={{ fontSize: 10, color: ink, opacity: 0.5 }}>
                  {(item.block.screenName || "").replace(/^[^\wА-Яа-я]+/, "")}
                </Text>
              </View>
              <View
                style={{
                  minWidth: 22, height: 20, paddingHorizontal: 6, borderRadius: 10,
                  backgroundColor: ink, opacity: 0.75,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: card }}>
                  {item.block.items.length}
                </Text>
              </View>
            </View>

            {item.block.items.map((e) => (
              <TaskRow
                key={e.task.id}
                entry={e}
                showPath={false}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </View>
        );

      case "doneChips":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.sm }}>
            {[
              { key: "today", label: "Сегодня" },
              { key: "week",  label: "Неделя" },
              { key: "month", label: "Месяц" },
              { key: "all",   label: "Всё" },
            ].map((f) => (
              <Chip key={f.key} label={f.label} active={doneFilter === f.key} onPress={() => setDoneFilter(f.key)} size="sm" />
            ))}
          </View>
        );

      case "empty":
        return <EmptyState emoji={item.emoji} title={item.title} subtitle={item.subtitle} compact />;

      case "task":
        return (
          <TaskRow
            entry={item.entry}
            showPath={item.showPath}
            isDone={!!item.isDone}
            onOpenDetail={onOpenDetail}
            onReturn={
              item.withActions
                ? () => {
                    if (item.actionKind === "expired") {
                      setPendingExpiredAction({ entry: item.entry, kind: "return" });
                    } else {
                      onReturnTask(item.entry);
                    }
                  }
                : undefined
            }
            onComplete={
              item.actionKind === "expired"
                ? () => setPendingExpiredAction({ entry: item.entry, kind: "complete" })
                : undefined
            }
            onDelete={
              item.withActions
                ? () => {
                    if (item.actionKind === "done") {
                      // без подтверждения
                      onDeleteTask(item.entry);
                    } else {
                      setPendingDelete(item.entry);
                    }
                  }
                : undefined
            } 
            withActions={item.withActions}
            actionKind={item.actionKind}
          />
        );

      case "thoughts":
        return (
          <ThoughtsSection
            thoughts={thoughts}
            onAdd={onAddThought}
            onDelete={onDeleteThought}
            onConvert={onConvertThought}
          />
        );

      default:
        return null;
    }
  }, [openSections, ink, card, muted, SPACING, RADIUS, SHADOW, TYPE, mode, doneFilter, thoughts, onOpenDetail, onReturnTask, onCompleteTask, onAddThought, onDeleteThought, onConvertThought, toggle]);

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="ЖУРНАЛ" onClose={onClose} />

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {items.map((item) => (
          <View key={item.key}>{renderItem({ item })}</View>
        ))}
      </KeyboardAwareScrollView>

      {pendingDelete && (
        <ConfirmDialog
          message={`Удалить «${pendingDelete.task.title}» из журнала?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onDeleteTask(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}

      {pendingExpiredAction && (
        <ConfirmDialog
          message={
            pendingExpiredAction.kind === "return"
              ? "Вернуть задачу в активные?"
              : "Отметить задачу выполненной?"
          }
          confirmLabel={pendingExpiredAction.kind === "return" ? "Вернуть" : "Выполнить"}
          confirmColor={pendingExpiredAction.kind === "return" ? BLUE : GREEN}
          onCancel={() => setPendingExpiredAction(null)}
          onConfirm={() => {
            if (pendingExpiredAction.kind === "return") {
              onReturnTask(pendingExpiredAction.entry);
            } else {
              onCompleteTask(pendingExpiredAction.entry);
            }
            setPendingExpiredAction(null);
          }}
        />
      )}

    </Overlay>
  );
}

