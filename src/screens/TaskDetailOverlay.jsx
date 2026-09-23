import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { BLUE } from "../theme/palettes";
import { isTaskExpired, formatRemaining } from "../utils/date";

export function TaskDetailOverlay({ task, markerColor, onBack, onAddNote, onRemoveNote, onToggleNote }) {
  const { ink, card } = useTheme();
  const [note, setNote] = useState("");
  const expired = isTaskExpired(task);

  const submit = () => {
    if (!note.trim()) return;
    onAddNote(note.trim());
    setNote("");
  };

  return (
    <Overlay zIndex={52}>
      <OverlayHeader onBack={onBack} title="" onClose={onBack} />
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: expired ? BLUE : ink, marginBottom: 14 }}>{task.title}</Text>

        <View style={{ marginBottom: 16, gap: 6 }}>
          {(!task.notes || task.notes.length === 0) && (
            <Text style={{ color: "#a0907e", fontSize: 12.5, fontStyle: "italic" }}>Пометок пока нет.</Text>
          )}
          {task.notes &&
            task.notes.map((n, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Pressable style={{ flex: 1 }} onPress={() => onToggleNote(i)}>
                  <Text style={{ fontSize: 13, color: n.done ? "#9a8a76" : ink, textDecorationLine: n.done ? "line-through" : "none" }}>{n.text}</Text>
                </Pressable>
                <Pressable onPress={() => onRemoveNote(i)}>
                  <Text style={{ opacity: 0.5 }}>✕</Text>
                </Pressable>
              </View>
            ))}
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Новая пометка..."
            placeholderTextColor="#a0907e"
            style={{ flex: 1, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 }}
          />
          <Pressable onPress={submit} style={{ backgroundColor: markerColor, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16 }}>＋</Text>
          </Pressable>
        </View>

        <View style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: expired ? BLUE : ink }}>{formatRemaining(task.due)}</Text>
        </View>
      </ScrollView>
    </Overlay>
  );
}