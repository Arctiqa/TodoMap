import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { MiniCalendar } from "./MiniCalendar";
import { TimeWheelPicker } from "./TimeWheelPicker";

export function DueEditor({ dueMode, setDueMode, dueDate, setDueDate, dueTime, setDueTime, dueDays, setDueDays }) {
  const { ink } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const displayDate = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "Выбрать дату";

  const displayTime = dueTime || "ЧЧ:ММ";

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
              flex: 1,
              alignItems: "center",
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: ink,
              backgroundColor: dueMode === opt.key ? ink : "#fff",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "bold", color: dueMode === opt.key ? "#fff" : ink }}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {dueMode === "date" && (
        <View>
          {/* Кнопка даты — на всю ширину */}
          <Pressable
            onPress={() => {
              setShowCalendar((v) => !v);
              setShowTime(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 2,
              borderColor: ink,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>📅</Text>
            <Text
              style={{
                fontSize: 12.5,
                color: dueDate ? ink : "#a0907e",
                fontWeight: dueDate ? "bold" : "normal",
              }}
              numberOfLines={1}
            >
              {displayDate}
            </Text>
          </Pressable>

          {/* Кнопка времени — на всю ширину, под датой */}
          <Pressable
            onPress={() => {
              setShowTime((v) => !v);
              setShowCalendar(false);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 2,
              borderColor: ink,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>🕐</Text>
            <Text
              style={{
                fontSize: 12.5,
                color: dueTime ? ink : "#a0907e",
                fontWeight: dueTime ? "bold" : "normal",
                fontFamily: dueTime ? "monospace" : undefined,
              }}
            >
              {displayTime}
            </Text>
          </Pressable>

          {/* Календарь */}
          {showCalendar && (
            <MiniCalendar
              value={dueDate}
              onChange={(d) => {
                setDueDate(d);
                setShowCalendar(false);
              }}
            />
          )}

          {/* Колесо времени */}
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
            borderWidth: 2,
            borderColor: ink,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Pressable
            onPress={() => setDueDays((d) => Math.max(1, d - 1))}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>−</Text>
          </Pressable>
          <Text style={{ minWidth: 26, textAlign: "center", fontWeight: "bold", color: ink }}>{dueDays}</Text>
          <Pressable
            onPress={() => setDueDays((d) => d + 1)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>+</Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: "#8a7a6a" }}>дней с отсчётом</Text>
        </View>
      )}
    </View>
  );
}