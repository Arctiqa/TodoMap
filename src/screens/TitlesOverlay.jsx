import React from "react";
import { View, Text, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useTheme } from "../theme/ThemeContext";
import { GUIDES } from "../constants/guides";
import { GREEN } from "../theme/palettes";

export function TitlesOverlay({ guideProgress, onClose }) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();

  return (
    <Overlay zIndex={56}>
      <OverlayHeader onBack={onClose} title="🏆 ТИТУЛЫ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {GUIDES.map((guide) => {
          const progress = guideProgress[guide.key] || 0;
          const tiers = Object.keys(guide.titles).map(Number).sort((a, b) => a - b);
          const nextTier = tiers.find((t) => t > progress);

          return (
            <View key={guide.key} style={{ marginBottom: SPACING.xl }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.md }}>
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: guide.color,
                    borderWidth: 2, borderColor: ink,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <MaterialIcons name={guide.icon} size={20} color={ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPE.h3, color: ink }}>{guide.name}</Text>
                  <Text style={{ ...TYPE.small, color: ink, opacity: 0.5 }}>
                    выполнено дел: {progress}
                  </Text>
                </View>
              </View>

              {nextTier && (
                <View style={{ marginBottom: SPACING.md }}>
                  <ProgressBar
                    value={progress}
                    max={nextTier}
                    color={GREEN}
                    height={6}
                    showLabel
                    label={`До следующего титула: ${progress}/${nextTier}`}
                  />
                </View>
              )}

              {tiers.map((tier) => {
                const t = guide.titles[tier];
                const unlocked = progress >= tier;
                return (
                  <View
                    key={tier}
                    style={[
                      {
                        flexDirection: "row", alignItems: "center", gap: SPACING.md,
                        backgroundColor: card,
                        opacity: unlocked ? 1 : 0.45,
                        borderRadius: RADIUS.lg,
                        padding: SPACING.md,
                        marginBottom: SPACING.sm,
                      },
                      SHADOW.sm,
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{unlocked ? t.emoji : "🔒"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...TYPE.bodyBold, color: ink }}>{t.name}</Text>
                      <Text style={{ ...TYPE.small, color: ink, opacity: 0.55 }}>
                        {unlocked ? t.desc : `За ${tier} дел от гида`}
                      </Text>
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
