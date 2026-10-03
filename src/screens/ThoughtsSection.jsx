import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { GREEN, RED } from "../theme/palettes";
import { fmtDate } from "../utils/date";

export function ThoughtsSection({ thoughts, onAdd, onDelete, onConvert, onInputFocus }) {
  const { ink, card, paper, inputBg } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    onAdd(v);
    setText("");
  };

  return (
    <View>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, marginBottom: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={onInputFocus}
          placeholder={t("thoughts.new")}
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
            textAlign: isRTL ? "right" : "left",
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

      {thoughts.length === 0 && (
        <Text style={{ color: ink, opacity: 0.5, fontSize: 12.5, fontStyle: "italic", textAlign: isRTL ? "right" : "left" }}>
          {t("thoughts.empty")}
        </Text>
      )}

      {[...thoughts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((th) => (
        <View
          key={th.id}
          style={{
            backgroundColor: card,
            borderWidth: 1.5,
            borderColor: ink,
            borderRadius: 10,
            padding: 10,
            marginBottom: 8,
          }}
        >
          {editingId === th.id ? (
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
                  textAlign: isRTL ? "right" : "left",
                }}
              />
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, marginTop: 8 }}>
                <Pressable
                  onPress={() => {
                    const v = editText.trim();
                    if (v) onAdd(v, th.id);
                    setEditingId(null);
                  }}
                  style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: GREEN }}
                >
                  <Text style={{ fontSize: 11, color: "#fff", fontWeight: "bold" }}>{t("thoughts.save")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setEditingId(null)}
                  style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: card }}
                >
                  <Text style={{ fontSize: 11, color: ink, fontWeight: "bold" }}>{t("thoughts.cancel")}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13.5, color: ink, lineHeight: 19, textAlign: isRTL ? "right" : "left" }}>
                {th.text}
              </Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", marginTop: 8, gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 10.5, color: ink, opacity: 0.5, textAlign: isRTL ? "right" : "left" }}>
                  {fmtDate(th.createdAt)}
                </Text>
                <Pressable onPress={() => onConvert(th)} hitSlop={8} style={{ padding: 4 }}>
                  <MaterialIcons name="add-task" size={18} color={GREEN} />
                </Pressable>
                <Pressable onPress={() => { setEditingId(th.id); setEditText(th.text); }} hitSlop={8} style={{ padding: 4 }}>
                  <MaterialIcons name="edit" size={18} color={ink} />
                </Pressable>
                <Pressable onPress={() => onDelete(th.id)} hitSlop={8} style={{ padding: 4 }}>
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
