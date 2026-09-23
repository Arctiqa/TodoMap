import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const PADDING = Math.floor(VISIBLE / 2) * ITEM_HEIGHT;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function Wheel({ data, value, onChange, onSelect, width }) {
  const { ink } = useTheme();
  const scrollRef = useRef(null);

  useEffect(() => {
    const idx = data.indexOf(value);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
    }
  }, [value]);

  const handleMomentumEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    onChange(data[clamped]);
  };

  return (
    <View style={{ width, height: VISIBLE * ITEM_HEIGHT }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingTop: PADDING, paddingBottom: PADDING }}
      >
        {data.map((item) => {
          const selected = item === value;
          return (
            <Pressable
              key={item}
              onPress={() => {
                onChange(item);
                if (onSelect) onSelect(item);
              }}
              style={{ height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{
                  fontSize: selected ? 30 : 20,
                  fontWeight: selected ? "900" : "bold",
                  color: ink,
                  opacity: selected ? 1 : 0.35,
                  fontFamily: "monospace",
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimeWheelPicker({ value, onChange, onClose }) {
  const { ink, paper } = useTheme();

  const [hStr, mStr] = (value || "00:00").split(":");
  const h = hStr || "00";
  const m = mStr || "00";

  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: ink,
        borderRadius: 18,
        backgroundColor: paper,
        padding: 16,
        overflow: "hidden",
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 11, color: ink, opacity: 0.6, fontWeight: "bold", letterSpacing: 2 }}>
          ВРЕМЯ
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Wheel
          data={HOURS}
          value={h}
          onChange={(newH) => onChange(`${newH}:${m}`)}
          onSelect={() => onClose && onClose()}
          width={70}
        />

        <Text style={{ fontSize: 34, fontWeight: "900", color: ink, opacity: 0.5, fontFamily: "monospace" }}>
          :
        </Text>

        <Wheel
          data={MINUTES}
          value={m}
          onChange={(newM) => onChange(`${h}:${newM}`)}
          onSelect={() => onClose && onClose()}
          width={70}
        />
      </View>

      {/* Полоса-индикатор по центру */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 40 + Math.floor(VISIBLE / 2) * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
          borderTopWidth: 2,
          borderBottomWidth: 2,
          borderColor: ink,
          opacity: 0.5,
          borderRadius: 6,
        }}
      />
    </View>
  );
}