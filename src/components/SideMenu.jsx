import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Animated, PanResponder } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RED } from "../theme/palettes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = Math.min(280, SCREEN_WIDTH * 0.72);
const SWIPE_THRESHOLD = 60;

const SECTIONS = [
  {
    title: "МЕТКА",
    items: [
      { key: "add-marker",    icon: "add-location-alt", label: "Создать метку" },
      { key: "edit-marker",   icon: "edit-location",    label: "Редактировать метку" },
      { key: "delete-marker", icon: "delete-forever",   label: "Удалить метку", color: "red" },
    ],
  },
  {
    title: "ПОЛЕ",
    items: [
      { key: "add-field",    icon: "layers",         label: "Создать поле" },
      { key: "edit-field",    icon: "edit",          label: "Редактировать поле" },
      { key: "reset-bg",     icon: "restore",        label: "Фон по умолчанию" },
      { key: "delete-field", icon: "delete-forever", label: "Удалить поле", color: "red" },
    ],
  },
  {
    title: "ПРОГРЕСС",
    items: [
      { key: "guides", icon: "explore",      label: "Гиды" },
      { key: "titles", icon: "emoji-events", label: "Титулы" },
    ],
  },
  {
    title: "НАСТРОЙКИ",
    items: [
      { key: "settings", icon: "settings", label: "Настройки" },
    ],
  },
];

export function SideMenu({ visible, onClose, onAction }) {
  const { ink, paper, card } = useTheme();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -MENU_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const closePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          const next = Math.max(-MENU_WIDTH, Math.min(0, g.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SWIPE_THRESHOLD) {
            onClose();
          } else {
            Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
          }
        },
      }),
    [onClose]
  );

  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          opacity: overlayOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        {...closePanResponder.panHandlers}
        style={{
          position: "absolute",
          top: 0, bottom: 0, left: 0,
          width: MENU_WIDTH,
          backgroundColor: paper,
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 8,
          transform: [{ translateX }],
        }}
      >
        {/* Шапка — с отступом от статус-бара, тонкая граница снизу, без крестика */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: insets.top + 8,
            paddingBottom: 10,
            borderBottomWidth: 0.7,
            borderColor: ink,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: ink, letterSpacing: 1 }}>
            МЕНЮ
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingVertical: 4 }}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={{ marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 9.5, fontWeight: "800", color: ink, opacity: 0.5,
                  letterSpacing: 1.5,
                  paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2,
                }}
              >
                {section.title}
              </Text>
              {section.items.map((item) => {
                const isRed = item.color === "red";
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onAction(item.key)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row", alignItems: "center", gap: 12,
                        paddingHorizontal: 14, paddingVertical: 10,
                        backgroundColor: pressed ? card : "transparent",
                      },
                    ]}
                  >
                    <MaterialIcons name={item.icon} size={20} color={isRed ? RED : ink} />
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: isRed ? RED : ink, flex: 1 }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1, borderColor: ink, marginTop: 8, opacity: 0.6 }}>
            <Text style={{ fontSize: 10.5, color: ink }}>v1.0.0 · TodoMapApp</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}