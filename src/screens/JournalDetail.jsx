import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { BLUE } from "../theme/palettes";
import { isTaskExpired, formatRemaining } from "../utils/date";

export function JournalDetail({ entry, onBack, onClose, onAddNote, onRemoveNote, onToggleNote }) {
  const { ink, card } = useTheme();
  const [note, setNote] = useState("");
  if (!entry) return null;

  const submit = () => {
    if (!note.trim()) return;
    onAddNote(note.trim());
    setNote("");
  };

  return (
    <Overlay zIndex={58}>
      <OverlayHeader onBack={onBack} backLabel="Журнал" title="" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 19, fontWeight: "bold", color: ink, marginBottom: 4 }}>
          {entry.markerEmoji} {entry.task.title}
        </Text>
        <Text style={{ fontSize: 11.5, color: ink, opacity: 0.6, marginBottom: 14 }}>
          {entry.markerName} · {entry.screenName.replace(/^[^\wА-Яа-я]+/, "")}
        </Text>

        <View style={{ gap: 6, marginBottom: 16 }}>
          {entry.task.notes.length === 0 && (
            <Text style={{ color: ink, opacity: 0.5, fontSize: 12.5, fontStyle: "italic" }}>Пометок пока нет.</Text>
          )}
          {entry.task.notes.map((n, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Pressable style={{ flex: 1 }} onPress={() => onToggleNote(i)}>
                <Text style={{ fontSize: 13, color: ink, opacity: n.done ? 0.4 : 1, textDecorationLine: n.done ? "line-through" : "none" }}>{n.text}</Text>
              </Pressable>
              <Pressable onPress={() => onRemoveNote(i)}>
                <Text style={{ opacity: 0.5, color: ink }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Новая пометка..."
            placeholderTextColor={ink}
            style={{ flex: 1, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: ink, backgroundColor: card }}
          />
          <Pressable onPress={submit} style={{ backgroundColor: entry.markerColor, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16 }}>＋</Text>
          </Pressable>
        </View>

        <View style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: isTaskExpired(entry.task) ? BLUE : ink }}>{formatRemaining(entry.task.due)}</Text>
        </View>
      </ScrollView>
    </Overlay>
  );
}