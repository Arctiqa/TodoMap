import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { todayStr } from "../utils/date";

export function MiniCalendar({ value, onChange }) {
  const { ink } = useTheme();
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const todayIso = todayStr(0);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDay = (d) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
  };

  return (
    <View style={{ borderWidth: 2, borderColor: ink, borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} style={{ paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 15, color: ink, fontWeight: "bold" }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 12.5, fontWeight: "bold", color: ink, textTransform: "capitalize" }}>{monthName}</Text>
        <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} style={{ paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 15, color: ink, fontWeight: "bold" }}>›</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <Text key={d} style={{ width: `${100 / 7}%`, textAlign: "center", fontSize: 9.5, color: "#8a7a6a" }}>
            {d}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((d, i) => {
          const dateStr = d ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
          const isSelected = dateStr && dateStr === value;
          const isToday = dateStr === todayIso;
          return (
            <Pressable key={i} disabled={!d} onPress={() => d && selectDay(d)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" }}>
              {d && (
                <View
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: isSelected ? ink : "transparent",
                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                    borderColor: ink,
                  }}
                >
                  <Text style={{ fontSize: 11, color: isSelected ? "#fff" : ink, fontWeight: isToday ? "bold" : "normal" }}>{d}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}