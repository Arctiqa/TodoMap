import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE } from "../theme/palettes";
import { formatRemaining } from "../utils/date";

export function OthersList({ pool, onClose, onTake, onRefresh }) {
  const { ink, card } = useTheme();
  return (
    <Overlay zIndex={57}>
      <OverlayHeader onBack={onClose} title="🌐 ДРУГИЕ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 11.5, color: ink, opacity: 0.6, flex: 1, paddingRight: 8 }}>
            Задачи, которыми поделились другие (анонимно).
          </Text>
          <Pressable
            onPress={onRefresh}
            style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: card }}
          >
            <Text style={{ fontSize: 12, color: ink }}>🔄</Text>
          </Pressable>
        </View>
        {pool.length === 0 && (
          <Text style={{ color: ink, opacity: 0.5, fontSize: 13, fontStyle: "italic" }}>Пока никто ничего не расшарил.</Text>
        )}
        {pool.map((p, idx) => (
          <View key={`${p.title}-${idx}`} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 10, padding: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, color: ink, fontWeight: "bold" }}>{p.title}</Text>
              {p.due ? <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6 }}>{formatRemaining(p.due)}</Text> : null}
            </View>
            <View style={{ minWidth: 26, height: 26, borderRadius: 13, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>{p.count}</Text>
            </View>
            <Pressable onPress={() => onTake(p)} style={{ backgroundColor: GREEN, borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: "#fff", fontSize: 11.5, fontWeight: "bold" }}>Взять</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Overlay>
  );
}