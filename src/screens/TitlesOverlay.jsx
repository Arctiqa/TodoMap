import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { GUIDE_TITLES, GUIDE_META } from "../constants/guides";
import { GUIDE_TITLE_TIERS } from "../constants/config";

export function TitlesOverlay({ guideProgress, onClose }) {
  const { ink, card } = useTheme();
  return (
    <Overlay zIndex={56}>
      <OverlayHeader onBack={onClose} title="🏆 ТИТУЛЫ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {Object.keys(GUIDE_TITLES).map((guideKey) => {
          const progress = guideProgress[guideKey] || 0;
          const meta = GUIDE_META[guideKey] || { name: guideKey, emoji: "🧑" };
          return (
            <View key={guideKey} style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 12, color: "#8a7a6a", marginBottom: 8 }}>
                {meta.emoji} {meta.name} · выполнено дел: {progress}
              </Text>
              {GUIDE_TITLE_TIERS.map((tier) => {
                const t = GUIDE_TITLES[guideKey][tier];
                const unlocked = progress >= tier;
                return (
                  <View
                    key={tier}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      backgroundColor: unlocked ? card : "#EFEFEF",
                      borderWidth: 1.5, borderColor: ink, borderRadius: 10, padding: 10, marginBottom: 8,
                      opacity: unlocked ? 1 : 0.55,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{unlocked ? t.emoji : "🔒"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink }}>{t.name}</Text>
                      <Text style={{ fontSize: 10.5, color: "#8a7a6a" }}>{unlocked ? t.desc : `За ${tier} дел от гида`}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}