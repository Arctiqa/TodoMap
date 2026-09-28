import React, { useState, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🗺",
    title: "Твои дела — на карте",
    subtitle: "Каждая метка — это папка с задачами. Перетаскивай, создавай поля, добавляй эмодзи.",
  },
  {
    emoji: "🧭",
    title: "Гиды помогут начать",
    subtitle: "МИСТЕР ПРОПЕР и МИСТЕР ЖОПЕР дадут задания и титулы за прогресс.",
  },
  {
    emoji: "📖",
    title: "Журнал всё помнит",
    subtitle: "Активные, проваленные, выполненные, мысли и архив — в одном месте.",
  },
];

export function OnboardingOverlay({ onDone }) {
  const { ink, paper, muted, SPACING, RADIUS, TYPE } = useTheme();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const go = (dir) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIndex((i) => Math.max(0, Math.min(SLIDES.length - 1, i + dir)));
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paper }}>
      <View style={{ flex: 1, padding: SPACING.xl, justifyContent: "center" }}>
        <Animated.View style={{ opacity: fade, alignItems: "center" }}>
          <Text style={{ fontSize: 80, marginBottom: SPACING.xl }}>{slide.emoji}</Text>
          <Text style={{ ...TYPE.h1, color: ink, textAlign: "center", marginBottom: SPACING.md }}>
            {slide.title}
          </Text>
          <Text style={{ ...TYPE.body, color: ink, opacity: 0.6, textAlign: "center", lineHeight: 22 }}>
            {slide.subtitle}
          </Text>
        </Animated.View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: SPACING.xxl }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? ink : muted + "50",
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ padding: SPACING.lg, gap: SPACING.sm }}>
        {!isLast ? (
          <Pressable
            onPress={() => go(1)}
            style={({ pressed }) => ({
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

        <Pressable onPress={onDone} style={{ alignItems: "center", paddingVertical: SPACING.sm }}>
          <Text style={{ ...TYPE.small, color: ink, opacity: 0.5 }}>Пропустить</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
