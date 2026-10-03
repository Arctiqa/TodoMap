// components/SideMenu.jsx
import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Animated, PanResponder } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT, useRTL } from "../i18n/LanguageContext";
import { RED } from "../theme/palettes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = Math.min(280, SCREEN_WIDTH * 0.72);
const SWIPE_THRESHOLD = 60;

export function SideMenu({ visible, onClose, onAction }) {
  const { ink, paper, card } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isRTL = useRTL();
  const closedX = isRTL ? MENU_WIDTH : -MENU_WIDTH;

  const translateX = useRef(new Animated.Value(closedX)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateX.setValue(closedX);
    }
  }, [closedX, visible, translateX]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: closedX, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, closedX, translateX, overlayOpacity]);

  const closePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
          const swipeDir = isRTL ? g.dx > 8 : g.dx < -8;
          return swipeDir && Math.abs(g.dx) > Math.abs(g.dy);
        },
        onPanResponderMove: (_, g) => {
          const next = isRTL
            ? Math.max(0, Math.min(MENU_WIDTH, g.dx))
            : Math.max(-MENU_WIDTH, Math.min(0, g.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const trigger = isRTL ? g.dx > SWIPE_THRESHOLD : g.dx < -SWIPE_THRESHOLD;
          if (trigger) {
            onClose();
          } else {
            Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
          }
        },
      }),
    [onClose, isRTL, translateX]
  );

  const SECTIONS = [
    {
      title: t("side.section.marker"),
      items: [
        { key: "add-marker",    icon: "add-location-alt", label: t("side.addMarker") },
        { key: "edit-marker",   icon: "edit-location",    label: t("side.editMarker") },
        { key: "delete-marker", icon: "delete-forever",   label: t("side.deleteMarker"), color: "red" },
      ],
    },
    {
      title: t("side.section.field"),
      items: [
        { key: "add-field",    icon: "layers",         label: t("side.addField") },
        { key: "edit-field",   icon: "edit",           label: t("side.editField") },
        { key: "clear-bg",     icon: "layers-clear",   label: t("side.clearBg") },
        { key: "delete-field", icon: "delete-forever", label: t("side.deleteField"), color: "red" },
      ],
    },
    {
      title: t("side.section.progress"),
      items: [
        { key: "guides",  icon: "explore",      label: t("side.guides") },
        { key: "titles",  icon: "emoji-events", label: t("side.titles") },
        { key: "history", icon: "history",      label: t("side.history") },
      ],
    },
    {
      title: t("side.section.settings"),
      items: [
        { key: "settings", icon: "settings", label: t("side.settings") },
      ],
    },
  ];

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
          top: 0,
          bottom: 0,
          // ВСЕГДА left: 0. При RTL RN автоматически превратит его в right: 0.
          left: 0,
          width: MENU_WIDTH,
          backgroundColor: paper,
          shadowColor: "#000",
          shadowOffset: { width: isRTL ? -2 : 2, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 8,
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: insets.top + 8,
            paddingBottom: 10,
            borderBottomWidth: 0.7,
            borderColor: ink,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: ink, letterSpacing: 1, textAlign: isRTL ? "right" : "left" }}>
            {t("side.title")}
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
                  textAlign: isRTL ? "right" : "left",
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
                        flexDirection: isRTL ? "row-reverse" : "row",
                        alignItems: "center",
                        gap: 12,
                        paddingHorizontal: 14, paddingVertical: 10,
                        backgroundColor: pressed ? card : "transparent",
                      },
                    ]}
                  >
                    <MaterialIcons name={item.icon} size={20} color={isRed ? RED : ink} />
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: "600",
                        color: isRed ? RED : ink,
                        flex: 1,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View
            style={{
              paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24,
              borderTopWidth: 1, borderColor: ink, marginTop: 8, opacity: 0.6,
            }}
          >
            <Text style={{ fontSize: 10.5, color: ink, textAlign: isRTL ? "right" : "left" }}>
              v1.0.0 · TodoMapApp
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
