// components/AddTaskBar.jsx
import React, { useState, useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { DueEditor } from "./DueEditor";
import { PrimaryButton } from "./ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { GREEN_SOFT, PALETTE } from "../theme/palettes";

const STICKER_COLORS = [...PALETTE, "#3ec9ec"];

export function AddTaskBar({
  targetMarkerId,
  onSubmit,
  visible = true,
  bgColor,
  collapsed = true,
  minimized = false,
  onExpand,
  onCollapse,
  onMinimize,
  onUnminimize,
  showColorPicker = true,
}) {
  const { ink, card, paper, inputBg } = useTheme();
  const t = useT();
  const isRTL = useRTL();

  const [title, setTitle] = useState("");
  const [dueMode, setDueMode] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [dueDays, setDueDays] = useState(1);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatTarget, setRepeatTarget] = useState(1);
  const [shareToPool, setShareToPool] = useState(false);
  const [color, setColor] = useState(null);

  const animValue = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const scrollRef = useRef(null);

  const stateRef = useRef({ collapsed, minimized });
  stateRef.current = { collapsed, minimized };

  const callbacksRef = useRef({ onExpand, onCollapse, onMinimize, onUnminimize });
  callbacksRef.current = { onExpand, onCollapse, onMinimize, onUnminimize };

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: collapsed ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [collapsed]);

  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2;
      },
      onPanResponderRelease: (_, g) => {
        const { collapsed, minimized } = stateRef.current;
        const { onExpand, onCollapse, onMinimize, onUnminimize } = callbacksRef.current;

        if (g.dy > 50) {
          if (!collapsed && !minimized) onCollapse && onCollapse();
          else if (collapsed && !minimized) onMinimize && onMinimize();
          return;
        }
        if (g.dy < -50) {
          if (minimized) onUnminimize && onUnminimize();
          else if (collapsed) onExpand && onExpand();
          return;
        }
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
    setColor(null);
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
    onSubmit({ title: title.trim(), due, repeat, share: shareToPool, color });
    reset();
    onCollapse && onCollapse();
  };

  // ----- ПОЛОСКА (минимизировано) -----
  if (minimized) {
    return (
      <View {...swipeResponder.panHandlers}>
        <Pressable
          onPress={() => onExpand && onExpand()}
          style={({ pressed }) => ({
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View
            style={{
              width: 60,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: ink,
              opacity: 0.35,
            }}
          />
        </Pressable>
      </View>
    );
  }

  // ----- ПЛАШКА (свёрнуто) -----
  if (collapsed) {
    return (
      <View {...swipeResponder.panHandlers}>
        <Pressable
          onPress={() => onExpand && onExpand()}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: paper,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 6,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <MaterialIcons name="add" size={22} color={ink} />
          <Text style={{ fontSize: 15, color: ink, fontWeight: "700" }}>
            {t("addTask.add")}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ----- РАЗВЁРНУТОЕ -----
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View {...swipeResponder.panHandlers}>
        <Animated.View
          style={{
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backgroundColor: paper,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: ink,
            maxHeight: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 700],
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
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 14,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: ink,
                opacity: 0.2,
                marginBottom: 12,
              }}
            />

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("addTask.placeholder")}
              placeholderTextColor="#9A9A9A"
              style={{
                borderWidth: 1,
                borderColor: ink,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 16,
                marginBottom: 12,
                color: ink,
                backgroundColor: inputBg,
                textAlign: isRTL ? "right" : "left",
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
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
                marginBottom: repeatOn ? 8 : 12,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: ink,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: repeatOn ? ink : paper,
                }}
              >
                {repeatOn && <Text style={{ color: paper, fontSize: 13 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13.5, color: ink }}>{t("addTask.repeat")}</Text>
            </Pressable>

            {repeatOn && (
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
                  marginBottom: 12,
                  backgroundColor: inputBg,
                }}
              >
                <Pressable
                  onPress={() => setRepeatTarget((n) => Math.max(1, n - 1))}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    borderWidth: 1, borderColor: ink,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: ink, fontSize: 16 }}>−</Text>
                </Pressable>
                <Text style={{ minWidth: 30, textAlign: "center", fontWeight: "bold", color: ink, fontSize: 16 }}>
                  {repeatTarget}
                </Text>
                <Pressable
                  onPress={() => setRepeatTarget((n) => n + 1)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    borderWidth: 1, borderColor: ink,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: ink, fontSize: 16 }}>+</Text>
                </Pressable>
                <Text style={{ fontSize: 13, color: ink, opacity: 0.6 }}>
                  {t("addTask.repeatTimes")}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => setShareToPool((v) => !v)}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  borderWidth: 1, borderColor: ink,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: shareToPool ? ink : paper,
                }}
              >
                {shareToPool && <Text style={{ color: paper, fontSize: 13 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13.5, color: ink }}>{t("addTask.share")}</Text>
            </Pressable>

            {showColorPicker && (
              <>
                <Text style={{ fontSize: 13.5, color: ink, marginBottom: 8, textAlign: isRTL ? "right" : "left" }}>
                  {t("addTask.color")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {STICKER_COLORS.map((c) => {
                    const active = color === c;
                    const isBlack = c === "#000000";
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setColor(active ? null : c)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: c,
                          borderWidth: active ? 3 : 2,
                          borderColor: active
                            ? ink
                            : isBlack
                            ? ink
                            : "transparent",
                        }}
                      />
                    );
                  })}
                </View>
              </>
            )}

            <PrimaryButton
              label={t("addTask.add")}
              color={GREEN_SOFT}
              textColor="#000"
              onPress={submit}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
