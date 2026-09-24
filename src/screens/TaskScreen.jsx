import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DueEditor } from "../components/DueEditor";
import { TaskDetailOverlay } from "./TaskDetailOverlay";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE } from "../theme/palettes";
import { formatRemaining, isTaskExpired } from "../utils/date";

export function TaskScreen({ marker, onClose, onToggle, onAdd, onDelete, onAddNote, onRemoveNote, onToggleNote, onShare, onIncrementRepeat }) {
  const { ink, card, paper, bar } = useTheme();
  const [title, setTitle] = useState("");
  const [dueMode, setDueMode] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [dueDays, setDueDays] = useState(1);
  const [noteTaskId, setNoteTaskId] = useState(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);
  const [shareToPool, setShareToPool] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatTarget, setRepeatTarget] = useState(5);

  if (!marker) return null;

  const noteTask = marker.tasks && marker.tasks.find((t) => t.id === noteTaskId);
  const pendingTask = marker.tasks && marker.tasks.find((t) => t.id === pendingDeleteTaskId);

  const submit = () => {
    if (!title.trim()) return;
    let due = null;

    if (dueMode === "date") {
      if (dueDate || dueTime) {
        let date = dueDate;
        if (!date && dueTime) {
          const d = new Date();
          date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
        due = { date: date || null, time: dueTime || null, kind: "date" };
      }
    } else if (dueMode === "duration") {
      due = { target: Date.now() + dueDays * 86400000, kind: "duration" };
    }

    const repeat = repeatOn ? { count: 0, target: Math.max(1, repeatTarget) } : null;
    onAdd(marker.id, title.trim(), due, repeat);
    if (shareToPool && onShare) onShare(title.trim(), due);

    setTitle("");
    setDueMode("none");
    setDueDate("");
    setDueTime("");
    setDueDays(1);
    setShareToPool(false);
    setRepeatOn(false);
    setRepeatTarget(5);
  };

  return (
    <Overlay zIndex={50}>
      <OverlayHeader onBack={onClose} title={`${marker.emoji} ${marker.name.toUpperCase()}`} onClose={onClose} />
      {marker.image && (
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <Image source={{ uri: marker.image }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: ink }} />
        </View>
      )}
      <Text style={{ paddingHorizontal: 16, paddingTop: 10, fontSize: 12, letterSpacing: 1, color: ink, opacity: 0.55 }}>ДЕЛА</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
        {(!marker.tasks || marker.tasks.length === 0) && (
          <Text style={{ color: ink, opacity: 0.5, fontSize: 13, fontStyle: "italic" }}>Пока пусто — самое время добавить первое дело.</Text>
        )}
        {marker.tasks &&
          marker.tasks.map((t) => {
            const expired = isTaskExpired(t);
            return (
              <View
                key={t.id}
                style={{
                  flexDirection: "row", alignItems: "flex-start", gap: 8,
                  backgroundColor: t.done ? card : card,
                  opacity: t.done ? 0.55 : 1,
                  borderWidth: 2, borderColor: ink, borderRadius: 10, padding: 10,
                }}
              >
                {t.repeat && !t.done ? (
                  <Pressable
                    onPress={() => onIncrementRepeat(marker.id, t.id)}
                    style={{ width: 28, height: 28, borderRadius: 7, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center", marginTop: 2, backgroundColor: paper }}
                  >
                    <View style={{ width: 14, height: 2.5, borderRadius: 1.5, backgroundColor: ink, position: "absolute" }} />
                    <View style={{ width: 2.5, height: 14, borderRadius: 1.5, backgroundColor: ink, position: "absolute" }} />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => onToggle(marker.id, t.id)}
                    style={{ width: 28, height: 28, borderRadius: 7, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center", marginTop: 2, backgroundColor: t.done ? BLUE : "transparent" }}
                  >
                    {t.done && <Text style={{ color: "#fff", fontSize: 15 }}>✓</Text>}
                  </Pressable>
                )}

                <Pressable style={{ flex: 1 }} onPress={() => setNoteTaskId(t.id)}>
                  <Text style={{ fontSize: 14, color: expired ? BLUE : ink, textDecorationLine: t.done ? "line-through" : "none", opacity: t.done ? 0.55 : 1, fontWeight: expired ? "bold" : "normal" }}>
                    {t.title}
                  </Text>
                  {t.repeat && (
                    <View style={{ marginTop: 4, marginBottom: 2 }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: ink, opacity: 0.15, overflow: "hidden" }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: GREEN, width: `${Math.min(100, (t.repeat.count / t.repeat.target) * 100)}%` }} />
                      </View>
                      <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6, marginTop: 2 }}>
                        {t.repeat.count}/{t.repeat.target}
                      </Text>
                    </View>
                  )}
                  {t.notes && t.notes.length > 0 && (
                    <View style={{ marginTop: 3, gap: 1 }}>
                      {t.notes.map((n, i) => (
                        <Text key={i} style={{ fontSize: 11.5, color: ink, opacity: n.done ? 0.4 : 0.75, textDecorationLine: n.done ? "line-through" : "none" }}>
                          [{n.text}]
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text style={{ fontSize: 11, marginTop: 3, color: expired ? BLUE : ink, opacity: expired ? 1 : 0.6, fontWeight: expired || t.due ? "bold" : "normal" }}>
                    {formatRemaining(t.due)}
                  </Text>
                </Pressable>

                <Pressable onPress={() => setPendingDeleteTaskId(t.id)} style={{ marginTop: 2 }}>
                  <Text style={{ opacity: 0.5 }}>✕</Text>
                </Pressable>
              </View>
            );
          })}
      </ScrollView>

      <View style={{ borderTopWidth: 1.5, borderColor: ink, padding: 12, backgroundColor: paper }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Новое дело..."
          placeholderTextColor={ink}
          placeholderStyle={{ opacity: 0.4 }}
          style={{ borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginBottom: 8, color: ink }}
        />

        <DueEditor dueMode={dueMode} setDueMode={setDueMode} dueDate={dueDate} setDueDate={setDueDate} dueTime={dueTime} setDueTime={setDueTime} dueDays={dueDays} setDueDays={setDueDays} />

        <Pressable onPress={() => setRepeatOn((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: repeatOn ? 6 : 10 }}>
          <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: ink, alignItems: "center", justifyContent: "center", backgroundColor: repeatOn ? ink : paper }}>
            {repeatOn && <Text style={{ color: paper, fontSize: 11 }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 11.5, color: ink }}>🔁 Повторяющееся задание</Text>
        </Pressable>

        {repeatOn && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 }}>
            <Pressable onPress={() => setRepeatTarget((n) => Math.max(1, n - 1))} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontWeight: "bold", color: ink }}>−</Text>
            </Pressable>
            <Text style={{ minWidth: 26, textAlign: "center", fontWeight: "bold", color: ink }}>{repeatTarget}</Text>
            <Pressable onPress={() => setRepeatTarget((n) => n + 1)} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontWeight: "bold", color: ink }}>+</Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: ink, opacity: 0.6 }}>раз — дело завершится, когда наберётся столько</Text>
          </View>
        )}

        <Pressable onPress={() => setShareToPool((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: ink, alignItems: "center", justifyContent: "center", backgroundColor: shareToPool ? ink : paper }}>
            {shareToPool && <Text style={{ color: paper, fontSize: 11 }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 11.5, color: ink }}>🌐 Поделиться задачей (анонимно, в «Другие»)</Text>
        </Pressable>

        <PrimaryButton label="Добавить дело" color={GREEN} textColor="#fff" onPress={submit} />
      </View>

      {noteTask && (
        <TaskDetailOverlay
          task={noteTask}
          markerColor={marker.color}
          onBack={() => setNoteTaskId(null)}
          onAddNote={(text) => onAddNote(marker.id, noteTaskId, text)}
          onRemoveNote={(idx) => onRemoveNote(marker.id, noteTaskId, idx)}
          onToggleNote={(idx) => onToggleNote(marker.id, noteTaskId, idx)}
        />
      )}

      {pendingTask && (
        <ConfirmDialog
          message={`Удалить дело «${pendingTask.title}»?`}
          onCancel={() => setPendingDeleteTaskId(null)}
          onConfirm={() => {
            onDelete(marker.id, pendingDeleteTaskId);
            setPendingDeleteTaskId(null);
          }}
        />
      )}
    </Overlay>
  );
}