import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "./ui/Overlay";
import { useTheme } from "../theme/ThemeContext";

export function MarkerPickerModal({ screens, onPick, onClose }) {
  const { ink, paper, card } = useTheme();

  const rows = [];
  Object.values(screens).forEach((scr) => {
    (scr.markers || []).forEach((mk) => {
      if (mk.isGuide || mk.linkTo) return;
      rows.push({
        screenId: scr.id,
        screenName: scr.name,
        markerId: mk.id,
        markerName: mk.name,
        emoji: mk.emoji,
        color: mk.color,
      });
    });
  });

  return (
    <Overlay zIndex={80} background="rgba(59,47,47,0.55)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: paper, borderWidth: 2, borderColor: ink, borderRadius: 18, width: "100%", maxWidth: 320, maxHeight: "75%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1.5, borderColor: ink }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: ink }}>Куда поместить дело?</Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ padding: 12 }}>
            {rows.length === 0 && (
              <Text style={{ color: "#a0907e", fontSize: 12.5, fontStyle: "italic" }}>Пока нет ни одной метки. Сначала создай хотя бы одну.</Text>
            )}
            {rows.map((r) => (
              <Pressable
                key={`${r.screenId}-${r.markerId}`}
                onPress={() => onPick(r.screenId, r.markerId)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 10, padding: 10, marginBottom: 8 }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r.color, borderWidth: 1.5, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: ink, fontWeight: "bold" }}>{r.markerName}</Text>
                  <Text style={{ fontSize: 10.5, color: "#9a8a76" }}>{r.screenName.replace(/^[^\wА-Яа-я]+/, "")}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Overlay>
  );
}