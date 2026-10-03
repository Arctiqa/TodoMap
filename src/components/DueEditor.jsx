// components/DueEditor.jsx
import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
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
  const t = useT();
  const isRTL = useRTL();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const displayDate = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : t("due.pickDate");

  const displayTime = dueTime || t("due.time");

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, marginBottom: 10 }}>
        {[
          { key: "none",     label: t("due.none") },
          { key: "date",     label: t("due.date") },
          { key: "duration", label: t("due.duration") },
        ].map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setDueMode(opt.key)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: ink,
              backgroundColor: dueMode === opt.key ? ink : inputBg,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: dueMode === opt.key ? paper : ink,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {dueMode === "date" && (
        <View>
          <Pressable
            onPress={() => setShowCalendar((v) => !v)}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: ink,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 14,
              marginBottom: 8,
              backgroundColor: inputBg,
            }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text
              style={{
                fontSize: 15,
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
            onPress={() => setShowTime(true)}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: ink,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 14,
              marginBottom: 8,
              backgroundColor: inputBg,
            }}
          >
            <Text style={{ fontSize: 16 }}>🕐</Text>
            <Text
              style={{
                fontSize: 15,
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
        </View>
      )}

      <Modal
        visible={showTime}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTime(false)}
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onPress={() => setShowTime(false)}
        >
          <Pressable onPress={() => {}} style={{ width: "100%", maxWidth: 320 }}>
            <TimeWheelPicker
              value={dueTime || "00:00"}
              onChange={(val) => setDueTime(val)}
              onClose={() => setShowTime(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {dueMode === "duration" && (
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
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
            {t("due.days")}
          </Text>
        </View>
      )}
    </View>
  );
}
