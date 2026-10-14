import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { GUIDE_META } from "../constants/guides";
import { MaterialIcons } from "@expo/vector-icons";

export function GuidesListOverlay({ onSelect, onClose }) {
  const { ink, card } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  return (
    <Overlay zIndex={73}>
      <OverlayHeader onBack={onClose} title={t("guides.title")} onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {Object.keys(GUIDE_META).map((key) => {
          const meta = GUIDE_META[key];
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, backgroundColor: card, borderWidth: 1.5, borderColor: ink, borderRadius: 12, padding: 10, marginBottom: 1 }}
            >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: meta.color, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name={meta.icon} size={22} color={ink} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, flex: 1, textAlign: isRTL ? "right" : "left" }}>{t(meta.nameKey)}</Text>
              <Text style={{ fontSize: 16, color: ink, opacity: 0.6 }}>{isRTL ? "‹" : "›"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Overlay>
  );
}
