import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { MiniCalendar } from "./MiniCalendar";

export function DueEditor({ dueMode, setDueMode, dueDate, setDueDate, dueTime, setDueTime, dueDays, setDueDays }) {
  const { ink } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);

  const handleTimeChange = (raw) => {
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    const prevDigitsOnly = dueTime.replace(/[^0-9]/g, "");
    const next = digitsOnly.slice(0, 4);
    let formatted;
    if (next.length <= 2) {
      formatted = next;
      if (next.length === 2 && digitsOnly.length > prevDigitsOnly.length) formatted = `${next}:`;
    } else {
      formatted = `${next.slice(0, 2)}:${next.slice(2)}`;
    }
    setDueTime(formatted);
  };

  const displayDate = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "Выбрать дату";

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
        {[
          { key: "none", label: "Без срока" },
          { key: "date", label: "📅 Дата" },
          { key: "duration", label: "⏳ Срок" },
        ].map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setDueMode(opt.key)}
            style={{
              flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 8,
              borderWidth: 2, borderColor: ink,
              backgroundColor: dueMode === opt.key ? ink : "#fff",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "bold", color: dueMode === opt.key ? "#fff" : ink }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {dueMode === "date" && (
        <View>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: showCalendar ? 8 : 4 }}>
            <Pressable
              onPress={() => setShowCalendar((v) => !v)}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13 }}>📅</Text>
              <Text style={{ fontSize: 12.5, color: dueDate ? ink : "#a0907e", fontWeight: dueDate ? "bold" : "normal" }} numberOfLines={1}>
                {displayDate}
              </Text>
            </Pressable>
            <TextInput
              value={dueTime}
              onChangeText={handleTimeChange}
              placeholder="ЧЧ:ММ"
              placeholderTextColor="#a0907e"
              keyboardType="numeric"
              style={{ width: 80, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12.5 }}
            />
          </View>

          {showCalendar && (
            <MiniCalendar
              value={dueDate}
              onChange={(d) => {
                setDueDate(d);
                setShowCalendar(false);
              }}
            />
          )}
        </View>
      )}

      {dueMode === "duration" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Pressable onPress={() => setDueDays((d) => Math.max(1, d - 1))} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontWeight: "bold" }}>−</Text>
          </Pressable>
          <Text style={{ minWidth: 26, textAlign: "center", fontWeight: "bold", color: ink }}>{dueDays}</Text>
          <Pressable onPress={() => setDueDays((d) => d + 1)} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontWeight: "bold" }}>+</Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: "#8a7a6a" }}>дней с отсчётом</Text>
        </View>
      )}
    </View>
  );
}