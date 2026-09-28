import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useTheme } from "../theme/ThemeContext";
import { GUIDE_TITLES, GUIDE_META } from "../constants/guides";
import { GUIDE_TITLE_TIERS } from "../constants/config";
import { GREEN } from "../theme/palettes";

export function TitlesOverlay({ guideProgress, onClose }) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();

  return (
    <Overlay zIndex={56}>
      <OverlayHeader onBack={onClose} title="🏆 ТИТУЛЫ" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {Object.keys(GUIDE_TITLES).map((guideKey) => {
          const progress = guideProgress[guideKey] || 0;
          const meta = GUIDE_META[guideKey] || { name: guideKey, emoji: "🧑" };
          const nextTier = GUIDE_TITLE_TIERS.find((t) => t > progress);

          return (
            <View key={guideKey} style={{ marginBottom: SPACING.xl }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.md }}>
                <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPE.h3, color: ink }}>{meta.name}</Text>
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

              {GUIDE_TITLE_TIERS.map((tier) => {
                const t = GUIDE_TITLES[guideKey][tier];
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
