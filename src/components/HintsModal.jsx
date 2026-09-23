import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "./ui/Overlay";
import { Chip } from "./ui/Chip";
import { useTheme } from "../theme/ThemeContext";

export function HintsModal({ title, groups, items, onClose, onPick }) {
  const { ink, paper } = useTheme();
  return (
    <Overlay zIndex={70} background="rgba(59,47,47,0.55)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: paper, borderWidth: 3, borderColor: ink, borderRadius: 18, width: "100%", maxWidth: 340, maxHeight: "82%" }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1.5, borderColor: ink }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink, flex: 1, paddingRight: 8 }}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ padding: 14 }}>
            {groups &&
              groups.map((g) => (
                <View key={g.layer} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, color: "#8a7a6a", marginBottom: 6 }}>{g.layer}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {g.items.map((it) => {
                      const label = typeof it === "string" ? it : `${it.emoji} ${it.name}`;
                      return <Chip key={label} label={label} onPress={() => onPick({ ...(typeof it === "string" ? { name: it } : it), type: g.type })} />;
                    })}
                  </View>
                </View>
              ))}

            {items && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {items.map((it) => (
                  <Chip key={it} label={it} onPress={() => onPick(it)} />
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Overlay>
  );
}