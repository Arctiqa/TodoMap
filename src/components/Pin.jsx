import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, PanResponder, Image, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { PIN_BOUNDS, PIN_SIZE } from "../constants/config";
import { shortLabel } from "../utils/text";
import { isTaskExpired } from "../utils/date";
import { BLUE } from "../theme/palettes";
import { resolveImageSource } from "../data/initialScreens";

const OUTER_RING = 7;
const BADGE = 22;

function pctToPx(pct, total) {
  return (pct / 100) * total;
}

function PinInner({
  marker,
  editMode,
  editAction,
  containerSize,
  onOpen,
  onDragMove,
  onDelete,
  onEdit,
}) {
  const appear = useRef(new Animated.Value(0)).current;
  const { ink, card, paper, ring } = useTheme();

  const isBig = !!marker.linkTo;
  const size = isBig ? PIN_SIZE.special : PIN_SIZE.normal;
  const outerSize = size + OUTER_RING * 2;

  const markerRef = useRef(marker);
  markerRef.current = marker;

  const containerRef = useRef(containerSize);
  containerRef.current = containerSize;

  const onDragMoveRef = useRef(onDragMove);
  onDragMoveRef.current = onDragMove;

  const pan = useRef(
    new Animated.ValueXY({
      x: pctToPx(marker.x, containerSize.width || 1),
      y: pctToPx(marker.y, containerSize.height || 1),
    })
  ).current;

  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Появление пина — spring scale 0 → 1
  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [appear]);

  // Синхронизация позиции при изменении marker.x/y или размера контейнера
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (!containerSize.width || !containerSize.height) return;
    pan.setValue({
      x: pctToPx(marker.x, containerSize.width),
      y: pctToPx(marker.y, containerSize.height),
    });
  }, [marker.x, marker.y, containerSize.width, containerSize.height, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,

      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        pan.stopAnimation((value) => {
          dragStartRef.current = { x: value.x, y: value.y };
        });
      },

      onPanResponderMove: (_, g) => {
        const cs = containerRef.current;
        if (!cs.width || !cs.height) return;

        const minX = pctToPx(PIN_BOUNDS.minX, cs.width);
        const maxX = pctToPx(PIN_BOUNDS.maxX, cs.width);
        const minY = pctToPx(PIN_BOUNDS.minY, cs.height);
        const maxY = pctToPx(PIN_BOUNDS.maxY, cs.height);

        const nx = Math.min(maxX, Math.max(minX, dragStartRef.current.x + g.dx));
        const ny = Math.min(maxY, Math.max(minY, dragStartRef.current.y + g.dy));

        pan.setValue({ x: nx, y: ny });
      },

      onPanResponderRelease: () => {
        const cs = containerRef.current;
        if (!cs.width || !cs.height) return;
        pan.stopAnimation((value) => {
          const xPct = (value.x / cs.width) * 100;
          const yPct = (value.y / cs.height) * 100;
          onDragMoveRef.current(markerRef.current.id, xPct, yPct);
        });
        isDraggingRef.current = false;
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  const doneCount = marker.tasks ? marker.tasks.filter((t) => t.done).length : 0;
  const total = marker.tasks ? marker.tasks.length : 0;
  const previewTasks = marker.tasks
    ? marker.tasks.filter((t) => !t.done).slice(0, 2)
    : [];

  const imageSource = useMemo(() => resolveImageSource(marker.image), [marker.image]);

  const handlePress = useCallback(() => {
    if (editMode) {
      if (editAction === "delete") { onDelete(marker); return; }
      if (editAction === "edit") { onEdit && onEdit(marker); return; }
      return;
    }
    onOpen(marker);
  }, [editMode, editAction, onDelete, onEdit, onOpen, marker]);

  if (!containerSize.width || !containerSize.height) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: [
          { translateX: Animated.subtract(pan.x, outerSize / 2) },
          { translateY: Animated.subtract(pan.y, outerSize / 2) },
          { scale: appear },
        ],
        alignItems: "center",
        zIndex: 2,
      }}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.88 : 1 }] }]}
      >
        <View
          style={{
            width: outerSize,
            height: outerSize,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Внешнее кольцо */}
          <View
            style={{
              position: "absolute",
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderWidth: OUTER_RING,
              borderColor: ring,
            }}
          />

          {/* Внутренний круг с тенью */}
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: marker.color,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            {imageSource ? (
              <Image source={imageSource} style={{ width: size, height: size }} />
            ) : (
              <Text style={{ fontSize: isBig ? 26 : 19 }}>{marker.emoji}</Text>
            )}
          </View>

          {/* Бейдж «папка» — вложенный пин */}
          {marker.linkTo && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: BADGE,
                height: BADGE,
                borderRadius: BADGE / 2,
                backgroundColor: card,
                borderWidth: 2,
                borderColor: ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="folder" size={12} color={ink} />
            </View>
          )}

          {/* Бейдж картинки */}
          {marker.image && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
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

          {/* Бейдж режима редактирования */}
          {editMode && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: editAction === "delete" ? "#E4572E" : card,
                borderWidth: 2,
                borderColor: ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 10 }}>
                {editAction === "delete" ? "🗑" : editAction === "edit" ? "✎" : "✥"}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Подпись */}
      <View
        style={{
          marginTop: 4,
          backgroundColor: card,
          borderWidth: 2,
          borderColor: ink,
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "bold", color: ink }}>
          {marker.name}
          {total > 0 ? (
            <Text style={{ fontWeight: "normal", opacity: 0.6 }}>
              {" "}{doneCount}/{total}
            </Text>
          ) : null}
        </Text>
      </View>

      {/* Превью дел */}
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
    </Animated.View>
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
