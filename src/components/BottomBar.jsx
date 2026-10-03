import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useT } from "../i18n/LanguageContext";
import { useRTL } from "../i18n/LanguageContext";
import { GREEN } from "../theme/palettes";

export function BottomBar({ onAction, activeKey }) {
  const { ink, bar } = useTheme();
  const t = useT();
  const isRTL = useRTL();

  const ITEMS = [
    { key: "menu",    icon: "menu",             label: t("bottom.menu"),    action: "menu" },
    { key: "home",    icon: "home",             label: t("bottom.home"),    action: "home" },
    { key: "journal", icon: "menu-book",        label: t("bottom.journal"), action: "journal" },
    { key: "marker",  icon: "add-location-alt", label: t("bottom.marker"),  action: "add-marker" },
    { key: "others",  icon: "public",           label: t("bottom.others"),  action: "others" },
  ];

  return (
    <View
      style={{
        backgroundColor: bar,
        paddingTop: 3,
        paddingBottom: 3,
        paddingHorizontal: 6,
        shadowColor: ink,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 14,
      }}
    >
      <View style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}>
        {ITEMS.map((item) => {
          const active = activeKey === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onAction(item.action)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 6,
                  borderRadius: 14,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons
                name={item.icon}
                size={26}
                color={active ? GREEN : ink}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: active ? GREEN : ink,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
