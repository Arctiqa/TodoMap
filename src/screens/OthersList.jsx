import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE } from "../theme/palettes";
import { formatRemaining } from "../utils/date";

export function OthersList({ pool, onClose, onTake, onRefresh }) {
  const { ink, card, muted, SPACING, RADIUS, SHADOW, TYPE } = useTheme();

  return (
    <Overlay zIndex={57}>
      <OverlayHeader onBack={onClose} title="🌐 ДРУГИЕ" onClose={onClose} />

      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <Text style={{ flex: 1, ...TYPE.small, color: ink, opacity: 0.55 }}>
          Задачи, которыми поделились другие.
        </Text>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: card,
            alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <MaterialIcons name="refresh" size={20} color={ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm }}>
        {pool.length === 0 && (
          <EmptyState
            emoji="🌍"
            title="Пока пусто"
            subtitle="Никто ещё не поделился задачей. Будь первым — включи «Поделиться» при создании."
          />
        )}

        {pool.map((p, idx) => (
          <View
            key={`${p.title}-${idx}`}
            style={[
              {
                flexDirection: "row", alignItems: "center", gap: SPACING.sm,
                backgroundColor: card,
                borderRadius: RADIUS.lg,
                padding: SPACING.md,
              },
              SHADOW.sm,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ ...TYPE.bodyBold, color: ink }} numberOfLines={2}>{p.title}</Text>
              {p.due ? (
                <Text style={{ ...TYPE.small, color: ink, opacity: 0.55, marginTop: 2 }}>
                  {formatRemaining(p.due)}
                </Text>
              ) : null}
            </View>

            <View
              style={{
                minWidth: 30, height: 30, borderRadius: 15,
                backgroundColor: BLUE,
                alignItems: "center", justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{p.count}</Text>
            </View>

            <Pressable
              onPress={() => onTake(p)}
              style={({ pressed }) => ({
                backgroundColor: GREEN,
                borderRadius: RADIUS.pill,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{ color: "#000", fontSize: 12, fontWeight: "800" }}>Взять</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Overlay>
  );
}
