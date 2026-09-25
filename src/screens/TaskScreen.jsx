import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { TaskDetailOverlay } from "./TaskDetailOverlay";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE } from "../theme/palettes";
import { formatRemaining, isTaskExpired } from "../utils/date";
import { AddTaskBar } from "../components/AddTaskBar";

export function TaskScreen({ marker, onClose, onToggle, onAdd, onDelete, onAddNote, onRemoveNote, onToggleNote, onShare, onIncrementRepeat }) {
  const { ink, card, paper } = useTheme();
  const [noteTaskId, setNoteTaskId] = useState(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);

  if (!marker) return null;

  const noteTask = marker.tasks && marker.tasks.find((t) => t.id === noteTaskId);
  const pendingTask = marker.tasks && marker.tasks.find((t) => t.id === pendingDeleteTaskId);

  return (
    <Overlay zIndex={50}>
      <OverlayHeader onBack={onClose} title={`${marker.emoji} ${marker.name.toUpperCase()}`} onClose={onClose} />
      {marker.image && (
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <Image source={{ uri: marker.image }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: ink }} />
        </View>
      )}
      <Text style={{ paddingHorizontal: 16, paddingTop: 10, fontSize: 12, letterSpacing: 1, color: ink, opacity: 0.55 }}>ДЕЛА</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}>
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
                  backgroundColor: card,
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
                  <Text style={{ opacity: 0.5, color: ink }}>✕</Text>
                </Pressable>
              </View>
            );
          })}
      </ScrollView>

      <AddTaskBar
        visible={true}
        targetMarkerId={marker.id}
        onSubmit={({ title, due, repeat, share }) => {
          onAdd(marker.id, title, due, repeat);
          if (share && onShare) onShare(title, due);
        }}
      />

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