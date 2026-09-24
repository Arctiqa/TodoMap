import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";

const ITEMS = [
  { key: "menu",    icon: "menu",       label: "Меню",    action: "menu" },
  { key: "journal", icon: "menu-book",  label: "Журнал",  action: "journal" },
  { key: "history", icon: "history",    label: "История", action: "history" },
  { key: "others",  icon: "public",     label: "Другие",  action: "others" },
];

export function BottomBar({ onAction, activeKey }) {
  const { ink, bar } = useTheme();

  return (
    <View
      style={{
        backgroundColor: bar,
        paddingTop: 8,
        paddingBottom: 10,
        paddingHorizontal: 6,
        shadowColor: ink,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
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