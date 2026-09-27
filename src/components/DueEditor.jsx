import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { MiniCalendar } from "./MiniCalendar";
import { TimeWheelPicker } from "./TimeWheelPicker";

export function DueEditor({
  dueMode,
  setDueMode,
  dueDate,
  setDueDate,
  dueTime,
  setDueTime,
  dueDays,
  setDueDays,
}) {
  const { ink, paper, card, inputBg } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const displayDate = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Выбрать дату";

  const displayTime = dueTime || "ЧЧ:ММ";

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Переключатель Без срока / Дата / Срок */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        {[
          { key: "none", label: "Без срока" },
          { key: "date", label: "📅 Дата" },
          { key: "duration", label: "⏳ Срок" },
        ].map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setDueMode(opt.key)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10, // ← крупнее
              borderRadius: 10,
              borderWidth: 1,       // ← тоньше
              borderColor: ink,
              backgroundColor: dueMode === opt.key ? ink : inputBg,
            }}
          >
            <Text
              style={{
                fontSize: 13,     // ← крупнее
                fontWeight: "bold",
                color: dueMode === opt.key ? paper : ink,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {dueMode === "date" && (
        <View>
          <Pressable
            onPress={() => {
              setShowCalendar((v) => !v);
              setShowTime(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: ink,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 14, // ← крупнее
              marginBottom: 8,
              backgroundColor: inputBg,
            }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text
              style={{
                fontSize: 15,      // ← крупнее
                color: ink,
                opacity: dueDate ? 1 : 0.5,
                fontWeight: dueDate ? "bold" : "normal",
              }}
              numberOfLines={1}
            >
              {displayDate}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowTime((v) => !v);
              setShowCalendar(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: ink,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 14, // ← крупнее
              marginBottom: 8,
              backgroundColor: inputBg,
            }}
          >
            <Text style={{ fontSize: 16 }}>🕐</Text>
            <Text
              style={{
                fontSize: 15,      // ← крупнее
                color: ink,
                opacity: dueTime ? 1 : 0.5,
                fontWeight: dueTime ? "bold" : "normal",
                fontFamily: dueTime ? "monospace" : undefined,
              }}
            >
              {displayTime}
            </Text>
          </Pressable>

          {showCalendar && (
            <MiniCalendar
              value={dueDate}
              onChange={(d) => {
                setDueDate(d);
                setShowCalendar(false);
              }}
            />
          )}

          {showTime && (
            <View style={{ marginTop: 4 }}>
              <TimeWheelPicker
                value={dueTime || "00:00"}
                onChange={(t) => setDueTime(t)}
                onClose={() => setShowTime(false)}
              />
            </View>
          )}
        </View>
      )}

      {dueMode === "duration" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: ink,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: inputBg,
          }}
        >
          <Pressable
            onPress={() => setDueDays((d) => Math.max(1, d - 1))}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "bold", color: ink, fontSize: 16 }}>−</Text>
          </Pressable>
          <Text
            style={{
              minWidth: 30,
              textAlign: "center",
              fontWeight: "bold",
              color: ink,
              fontSize: 16,
            }}
          >
            {dueDays}
          </Text>
          <Pressable
            onPress={() => setDueDays((d) => d + 1)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "bold", color: ink, fontSize: 16 }}>+</Text>
          </Pressable>
          <Text style={{ fontSize: 13, color: ink, opacity: 0.6 }}>
            дней с отсчётом
          </Text>
        </View>
      )}
    </View>
  );
}