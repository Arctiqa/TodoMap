import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

const SLIDES = [
  {
    emoji: "🗺",
    text: "Добавьте в поле местность, которую вы хотите посетить",
  },
  {
    emoji: "📍",
    text: "Метка — это объект на местности, который представляет интерес",
  },
  {
    emoji: "📌",
    text: "В метку можно добавить дела, связанные с этим объектом",
  },
  {
    emoji: "🧩",
    text: "Распределяйте задачи по меткам, чтобы наглядно увидеть дела, связанные с ней",
  },
];

export function OnboardingOverlay({ onDone }) {
  const { ink, paper, muted, SPACING, RADIUS, TYPE } = useTheme();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const go = (dir) => {
    const next = Math.max(0, Math.min(SLIDES.length - 1, index + dir));
    if (next === index) return;
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) go(1);
        else if (g.dx > 40) go(-1);
      },
    })
  ).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paper }}>
      <View
        {...swipeResponder.panHandlers}
        style={{ flex: 1, padding: SPACING.xl, justifyContent: "center" }}
      >
        <Animated.View style={{ opacity: fade, alignItems: "center" }}>
          <Text style={{ fontSize: 80, marginBottom: SPACING.xl }}>{slide.emoji}</Text>
          <Text
            style={{
              ...TYPE.h1,
              color: ink,
              textAlign: "center",
              lineHeight: 30,
              paddingHorizontal: SPACING.md,
            }}
          >
            {slide.text}
          </Text>
        </Animated.View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: SPACING.xxl,
          }}
        >
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                if (i === index) return;
                Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
                  setIndex(i);
                  Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
                });
              }}
              hitSlop={8}
            >
              <View
                style={{
                  width: i === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === index ? ink : muted + "50",
                }}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ padding: SPACING.lg, gap: SPACING.sm }}>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {index > 0 && (
            <Pressable
              onPress={() => go(-1)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: ink,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: ink, fontWeight: "700", fontSize: 15 }}>Назад</Text>
            </Pressable>
          )}

          {!isLast ? (
            <Pressable
              onPress={() => go(1)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: ink,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: paper, fontWeight: "700", fontSize: 15 }}>Далее</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onDone}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: GREEN,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>Начать</Text>
            </Pressable>
          )}
        </View>

        {!isLast && (
          <Pressable
            onPress={onDone}
            style={{ alignItems: "center", paddingVertical: SPACING.sm }}
          >
            <Text style={{ ...TYPE.small, color: ink, opacity: 0.5 }}>Пропустить</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
