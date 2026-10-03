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
import { useT, useRTL } from "../i18n/LanguageContext";
import { GREEN } from "../theme/palettes";

export function OnboardingOverlay({ onDone }) {
  const { ink, paper, muted, SPACING, RADIUS, TYPE } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const SLIDES = [
    { emoji: "🗺", text: t("onb.slide1") },
    { emoji: "📍", text: t("onb.slide2") },
    { emoji: "📌", text: t("onb.slide3") },
    { emoji: "🧩", text: t("onb.slide4") },
  ];

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
            flexDirection: isRTL ? "row-reverse" : "row",
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
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: SPACING.sm }}>
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
              <Text style={{ color: ink, fontWeight: "700", fontSize: 15 }}>{t("onb.back")}</Text>
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
              <Text style={{ color: paper, fontWeight: "700", fontSize: 15 }}>{t("onb.next")}</Text>
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
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 15 }}>{t("onb.start")}</Text>
            </Pressable>
          )}
        </View>

        {!isLast && (
          <Pressable
            onPress={onDone}
            style={{ alignItems: "center", paddingVertical: SPACING.sm }}
          >
            <Text style={{ ...TYPE.small, color: ink, opacity: 0.5 }}>{t("onb.skip")}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
