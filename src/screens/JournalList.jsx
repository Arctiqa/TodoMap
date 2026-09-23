import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";
import { formatRemaining } from "../utils/date";

export function JournalList({ entries, onClose, onOpenDetail }) {
  const { ink, card } = useTheme();
  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="📖 ЖУРНАЛ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {entries.length === 0 && <Text style={{ color: "#a0907e", fontSize: 13, fontStyle: "italic" }}>Активных дел пока нет.</Text>}
        {entries.map((e) => (
          <Pressable
            key={e.task.id}
            onPress={() => onOpenDetail(e)}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: card, borderWidth: 2, borderColor: ink, borderRadius: 10, padding: 10 }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: e.markerColor, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 14 }}>{e.markerEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, color: ink, fontWeight: "bold" }}>{e.task.title}</Text>
              <Text style={{ fontSize: 10.5, color: "#9a8a76" }}>
                {e.screenName.replace(/^[^\wА-Яа-я]+/, "")} · {e.markerName}
              </Text>
              {e.task.repeat && (
                <View style={{ marginTop: 5 }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: "#E5DCC8", overflow: "hidden" }}>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: GREEN, width: `${Math.min(100, (e.task.repeat.count / e.task.repeat.target) * 100)}%` }} />
                  </View>
                  <Text style={{ fontSize: 10, color: "#9a8a76", marginTop: 2 }}>
                    {e.task.repeat.count}/{e.task.repeat.target}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10.5, color: "#6b5b4d", fontFamily: "monospace" }}>{formatRemaining(e.task.due)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Overlay>
  );
}