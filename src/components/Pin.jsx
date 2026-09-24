import React, { useMemo, useRef, useCallback } from "react";
import { View, Text, Pressable, PanResponder, Image } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { PIN_BOUNDS, PIN_SIZE } from "../constants/config";
import { shortLabel } from "../utils/text";
import { isTaskExpired } from "../utils/date";
import { BLUE } from "../theme/palettes";

function PinInner({ marker, editMode, editAction, containerSize, onOpen, onDragMove, onDelete }) {
  const { ink, card, paper } = useTheme();
  const size = marker.special ? PIN_SIZE.special : PIN_SIZE.normal;

  // Живая позиция во время драга — не толкаем стор на каждый кадр
  const dragRef = useRef({ x: marker.x, y: marker.y, active: false });
  const [, forceRender] = React.useState(0);

  const containerRef = useRef(containerSize);
  containerRef.current = containerSize;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderGrant: () => {
          dragRef.current = { x: marker.x, y: marker.y, active: true };
        },
        onPanResponderMove: (evt, g) => {
          const cs = containerRef.current;
          if (!cs.width || !cs.height) return;
          const dxPct = (g.dx / cs.width) * 100;
          const dyPct = (g.dy / cs.height) * 100;
          const nx = Math.min(PIN_BOUNDS.maxX, Math.max(PIN_BOUNDS.minX, marker.x + dxPct));
          const ny = Math.min(PIN_BOUNDS.maxY, Math.max(PIN_BOUNDS.minY, marker.y + dyPct));
          dragRef.current = { x: nx, y: ny, active: true };
          forceRender((n) => n + 1);
        },
        onPanResponderRelease: () => {
          const { x, y, active } = dragRef.current;
          if (active) onDragMove(marker.id, x, y);
          dragRef.current.active = false;
        },
        onPanResponderTerminate: () => {
          dragRef.current.active = false;
        },
      }),
    [marker.id, marker.x, marker.y, onDragMove]
  );

  const px = dragRef.current.active ? dragRef.current.x : marker.x;
  const py = dragRef.current.active ? dragRef.current.y : marker.y;

  const doneCount = marker.tasks ? marker.tasks.filter((t) => t.done).length : 0;
  const total = marker.tasks ? marker.tasks.length : 0;
  const previewTasks = marker.tasks ? marker.tasks.filter((t) => !t.done).slice(0, 2) : [];

  const handlePress = useCallback(() => {
    if (editMode) {
      if (editAction === "delete") onDelete(marker);
      return;
    }
    onOpen(marker);
  }, [editMode, editAction, onDelete, onOpen, marker]);

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        left: `${px}%`,
        top: `${py}%`,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        alignItems: "center",
        zIndex: 2,
      }}
    >
      <Pressable onPress={handlePress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.88 : 1 }] }]}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: marker.color,
            borderWidth: 2.5,
            borderColor: ink,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 0,
            elevation: 4,
          }}
        >
          {marker.image ? (
            <Image source={{ uri: marker.image }} style={{ width: size, height: size }} />
          ) : (
            <Text style={{ fontSize: marker.special ? 24 : 19 }}>{marker.emoji}</Text>
          )}
          {marker.image && (
            <View
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: card,
                borderWidth: 1.5,
                borderColor: ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 10 }}>{marker.emoji}</Text>
            </View>
          )}
          {editMode && (
            <View
              style={{
                position: "absolute",
                bottom: -5,
                right: -5,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: editAction === "delete" ? "#E4572E" : card,
                borderWidth: 2,
                borderColor: ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 9 }}>{editAction === "delete" ? "🗑" : "✥"}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Подпись метки */}
      <View
        style={{
          marginTop: 4,
          backgroundColor: card,
          borderWidth: 2,
          borderColor: ink,
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "bold", color: ink }}>
          {marker.name}
          {total > 0 ? <Text style={{ fontWeight: "normal", opacity: 0.6 }}> {doneCount}/{total}</Text> : null}
        </Text>
      </View>

      {/* Превью задач */}
      {!editMode && previewTasks.length > 0 && (
        <View style={{ marginTop: 3, alignItems: "center" }}>
          {previewTasks.map((t) => (
            <View
              key={t.id}
              style={{
                marginTop: 2,
                backgroundColor: card,
                borderWidth: 1.5,
                borderColor: ink,
                paddingHorizontal: 6,
                paddingVertical: 2,
                maxWidth: 110,
              }}
            >
              <Text
                style={{
                  fontSize: 9.5,
                  fontFamily: "monospace",
                  color: isTaskExpired(t) ? BLUE : ink,
                  opacity: isTaskExpired(t) ? 1 : 0.75,
                }}
                numberOfLines={1}
              >
                {shortLabel(t.title)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const Pin = React.memo(PinInner, (prev, next) => {
  return (
    prev.marker === next.marker &&
    prev.editMode === next.editMode &&
    prev.editAction === next.editAction &&
    prev.containerSize.width === next.containerSize.width &&
    prev.containerSize.height === next.containerSize.height
  );
});