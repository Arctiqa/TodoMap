import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, RED } from "../theme/palettes";
import { fmtDate } from "../utils/date";

export function ThoughtsSection({ thoughts, onAdd, onDelete, onConvert }) {
  const { ink, card, paper, inputBg } = useTheme();
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };

  return (
    <View>
      {/* Добавление */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Новая мысль..."
          placeholderTextColor={ink}
          multiline
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: ink,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13.5,
            color: ink,
            backgroundColor: inputBg,
            minHeight: 44,
          }}
        />
        <Pressable
          onPress={submit}
          style={{
            backgroundColor: GREEN,
            borderWidth: 1.5,
            borderColor: ink,
            borderRadius: 10,
            paddingHorizontal: 14,
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Список мыслей */}
      {thoughts.length === 0 && (
        <Text style={{ color: ink, opacity: 0.5, fontSize: 12.5, fontStyle: "italic" }}>
          Пока пусто. Записывай сюда идеи, желания, планы.
        </Text>
      )}

      {[...thoughts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((t) => (
        <View
          key={t.id}
          style={{
            backgroundColor: card,
            borderWidth: 1.5,
            borderColor: ink,
            borderRadius: 10,
            padding: 10,
            marginBottom: 8,
          }}
        >
          {editingId === t.id ? (
            <>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                multiline
                style={{
                  borderWidth: 1.5,
                  borderColor: ink,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  fontSize: 13.5,
                  color: ink,
                  backgroundColor: inputBg,
                }}
              />
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                <Pressable
                  onPress={() => {
                    const v = editText.trim();
                    if (v) onAdd(v, t.id);
                    setEditingId(null);
                  }}
                  style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: GREEN }}
                >
                  <Text style={{ fontSize: 11, color: "#fff", fontWeight: "bold" }}>Сохранить</Text>
                </Pressable>
                <Pressable
                  onPress={() => setEditingId(null)}
                  style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: card }}
                >
                  <Text style={{ fontSize: 11, color: ink, fontWeight: "bold" }}>Отмена</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13.5, color: ink, lineHeight: 19 }}>
                {t.text}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 10.5, color: ink, opacity: 0.5 }}>
                  {fmtDate(t.createdAt)}
                </Text>
                <Pressable
                  onPress={() => onConvert(t)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="add-task" size={18} color={GREEN} />
                </Pressable>
                <Pressable
                  onPress={() => { setEditingId(t.id); setEditText(t.text); }}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="edit" size={18} color={ink} />
                </Pressable>
                <Pressable
                  onPress={() => onDelete(t.id)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="delete-outline" size={18} color={RED} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
}