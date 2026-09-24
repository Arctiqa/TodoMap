import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Animated, PanResponder } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = Math.min(280, SCREEN_WIDTH * 0.72);
const SWIPE_THRESHOLD = 60;   // сколько нужно протянуть, чтобы открыть/закрыть

const SECTIONS = [
  { title: "СОЗДАНИЕ", items: [
    { key: "add-marker", icon: "add-location-alt", label: "Создать метку" },
    { key: "add-field",  icon: "layers",           label: "Создать поле" },
  ]},
  { title: "РЕДАКТИРОВАНИЕ", items: [
    { key: "edit-mode",   icon: "edit",    label: "Режим правки" },
    { key: "change-bg",   icon: "image",   label: "Изменить фон" },
    { key: "reset-bg",    icon: "restore", label: "Фон по умолчанию" },
  ]},
  { title: "ПРОГРЕСС", items: [
    { key: "guides", icon: "explore",      label: "Гиды" },
    { key: "titles", icon: "emoji-events", label: "Титулы" },
  ]},
  { title: "НАСТРОЙКИ", items: [
    { key: "settings", icon: "settings", label: "Настройки" },
  ]},
];

export function SideMenu({ visible, onClose, onAction }) {
  const { ink, paper, card } = useTheme();

  // Текущая позиция меню: 0 = открыто (слева), -MENU_WIDTH = закрыто (за экраном)
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  // Затемнение: 0 = прозрачно, 1 = чёрное
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -MENU_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Свайп для закрытия (когда меню открыто)
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Затемнение — fading, тап закрывает */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          opacity: overlayOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Панель — выезжает слева */}
      <Animated.View
        {...closePanResponder.panHandlers}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: MENU_WIDTH,
          backgroundColor: paper,
          borderRightWidth: 3,
          borderColor: ink,
          transform: [{ translateX }],
        }}
      >
        {/* Шапка */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1.5,
            borderColor: ink,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: ink, letterSpacing: 1 }}>
            МЕНЮ
          </Text>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <MaterialIcons name="close" size={22} color={ink} />
          </Pressable>
        </View>

        {/* Пункты */}
        <ScrollView contentContainerStyle={{ paddingVertical: 4 }}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={{ marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 9.5,
                  fontWeight: "800",
                  color: ink,
                  opacity: 0.5,
                  letterSpacing: 1.5,
                  paddingHorizontal: 14,
                  paddingTop: 8,
                  paddingBottom: 2,
                }}
              >
                {section.title}
              </Text>
              {section.items.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => onAction(item.key)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: pressed ? card : "transparent",
                    },
                  ]}
                >
                  <MaterialIcons name={item.icon} size={20} color={ink} />
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: ink, flex: 1 }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
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