import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import { DueEditor } from "./DueEditor";
import { PrimaryButton } from "./ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

export function AddTaskBar({ targetMarkerId, onSubmit, visible }) {
  const { ink, card, paper } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [dueMode, setDueMode] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [dueDays, setDueDays] = useState(1);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatTarget, setRepeatTarget] = useState(1);
  const [shareToPool, setShareToPool] = useState(false);

  const animValue = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const swipeDownResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50) setExpanded(false);
      },
    })
  ).current;

  if (!visible) return null;

  const reset = () => {
    setTitle("");
    setDueMode("none");
    setDueDate("");
    setDueTime("");
    setDueDays(1);
    setRepeatOn(false);
    setRepeatTarget(1);
    setShareToPool(false);
  };

  const submit = () => {
    if (!title.trim()) return;
    let due = null;
    if (dueMode === "date") {
      if (dueDate || dueTime) {
        let date = dueDate;
        if (!date && dueTime) {
          const d = new Date();
          date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
        due = { date: date || null, time: dueTime || null, kind: "date" };
      }
    } else if (dueMode === "duration") {
      due = { target: Date.now() + dueDays * 86400000, kind: "duration" };
    }
    const repeat = repeatOn ? { count: 0, target: Math.max(1, repeatTarget) } : null;
    onSubmit({ title: title.trim(), due, repeat, share: shareToPool });
    reset();
    setExpanded(false);
  };

  const cancel = () => {
    reset();
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable
          onPress={() => setExpanded(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: card,
            borderWidth: 2,
            borderColor: ink,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 16, color: ink, opacity: 0.5 }}>＋</Text>
          <Text style={{ fontSize: 14, color: ink, opacity: 0.5 }}>
            Новое дело...
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      {...swipeDownResponder.panHandlers}
      style={{
        marginHorizontal: 10,
        marginBottom: 8,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        backgroundColor: paper,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        overflow: "hidden",
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: ink,
        maxHeight: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 900],
        }),
        opacity: animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        }),
      }}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "bold", color: ink }}>
            НОВОЕ ДЕЛО
          </Text>
          <Pressable onPress={cancel}>
            <Text style={{ fontSize: 18, color: ink, opacity: 0.6 }}>✕</Text>
          </Pressable>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Название..."
          placeholderTextColor={ink}
          style={{
            borderWidth: 2,
            borderColor: ink,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 14,
            marginBottom: 8,
            color: ink,
            backgroundColor: card,
          }}
        />

        <DueEditor
          dueMode={dueMode}
          setDueMode={setDueMode}
          dueDate={dueDate}
          setDueDate={setDueDate}
          dueTime={dueTime}
          setDueTime={setDueTime}
          dueDays={dueDays}
          setDueDays={setDueDays}
        />

        <Pressable
          onPress={() => setRepeatOn((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: repeatOn ? 6 : 10,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: repeatOn ? ink : paper,
            }}
          >
            {repeatOn && <Text style={{ color: paper, fontSize: 11 }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 11.5, color: ink }}>🔁 Серия повторов</Text>
        </Pressable>

        {repeatOn && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1.5,
              borderColor: ink,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginBottom: 10,
            }}
          >
            <Pressable
              onPress={() => setRepeatTarget((n) => Math.max(1, n - 1))}
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
              <Text style={{ fontWeight: "bold", color: ink }}>−</Text>
            </Pressable>
            <Text
              style={{
                minWidth: 26,
                textAlign: "center",
                fontWeight: "bold",
                color: ink,
              }}
            >
              {repeatTarget}
            </Text>
            <Pressable
              onPress={() => setRepeatTarget((n) => n + 1)}
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
              <Text style={{ fontWeight: "bold", color: ink }}>+</Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: ink, opacity: 0.6 }}>
              {" "}
              раз до завершения
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setShareToPool((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: shareToPool ? ink : paper,
            }}
          >
            {shareToPool && (
              <Text style={{ color: paper, fontSize: 11 }}>✓</Text>
            )}
          </View>
          <Text style={{ fontSize: 11.5, color: ink }}>
            🌐 Поделиться задачей
          </Text>
        </Pressable>

        <PrimaryButton
          label="Добавить дело"
          color={GREEN}
          textColor="#fff"
          onPress={submit}
        />
      </ScrollView>
    </Animated.View>
  );
}