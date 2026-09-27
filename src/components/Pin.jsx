import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, PanResponder, Image, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { PIN_BOUNDS, PIN_SIZE } from "../constants/config";
import { shortLabel } from "../utils/text";
import { isTaskExpired } from "../utils/date";
import { BLUE } from "../theme/palettes";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Преобразование процентов в пиксели с учётом размера контейнера
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
  const { ink, card } = useTheme();

  const isBig = !!marker.linkTo;
  const size = isBig ? PIN_SIZE.special : PIN_SIZE.normal;

  // --- Актуальные значения в ref, чтобы PanResponder не зависел от них ---
  const markerRef = useRef(marker);
  markerRef.current = marker;

  const containerRef = useRef(containerSize);
  containerRef.current = containerSize;

  const onDragMoveRef = useRef(onDragMove);
  onDragMoveRef.current = onDragMove;

  // --- Позиция в пикселях через Animated.ValueXY ---
  const pan = useRef(
    new Animated.ValueXY({
      x: pctToPx(marker.x, containerSize.width || 1),
      y: pctToPx(marker.y, containerSize.height || 1),
    })
  ).current;

  // Базовое смещение на момент начала жеста (пиксели)
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Синхронизация при внешних изменениях marker.x/y или размера контейнера
  useEffect(() => {
    if (!containerSize.width || !containerSize.height) return;
    pan.setValue({
      x: pctToPx(marker.x, containerSize.width),
      y: pctToPx(marker.y, containerSize.height),
    });
  }, [marker.x, marker.y, containerSize.width, containerSize.height, pan]);

  // --- PanResponder создаётся ОДИН РАЗ ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,

      onPanResponderGrant: () => {
        // Запоминаем текущую позицию как стартовую
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

      onPanResponderRelease: (_, g) => {
        const cs = containerRef.current;
        if (!cs.width || !cs.height) return;

        // Переводим пиксели обратно в проценты для хранения
        pan.stopAnimation((value) => {
          const xPct = (value.x / cs.width) * 100;
          const yPct = (value.y / cs.height) * 100;
          onDragMoveRef.current(markerRef.current.id, xPct, yPct);
        });
      },

      onPanResponderTerminate: () => {
        // Ничего — позиция уже в pan
      },

      // Не терять жест при скролле родителя
      onPanResponderTerminationRequest: () => false,

      // Забирать жест сразу, как только начался (иначе родитель может перехватить)
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  // --- Данные для отображения ---
  const doneCount = marker.tasks ? marker.tasks.filter((t) => t.done).length : 0;
  const total = marker.tasks ? marker.tasks.length : 0;
  const previewTasks = marker.tasks
    ? marker.tasks.filter((t) => !t.done).slice(0, 2)
    : [];

  const handlePress = useCallback(() => {
    if (editMode) {
      if (editAction === "delete") {
        onDelete(marker);
        return;
      }
      if (editAction === "edit") {
        onEdit && onEdit(marker);
        return;
      }
      return;
    }
    onOpen(marker);
  }, [editMode, editAction, onDelete, onEdit, onOpen, marker]);

  // Не рендерим, пока не знаем размер контейнера —
  // иначе позиция «прыгнет» из (0,0)
  if (!containerSize.width || !containerSize.height) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        // Компенсируем половину размера пина, чтобы центр был в точке
        transform: [
          { translateX: Animated.subtract(pan.x, size / 2) },
          { translateY: Animated.subtract(pan.y, size / 2) },
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
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: marker.color,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 3,
            elevation: 5,
          }}
        >
          {marker.image ? (
            <Image source={{ uri: marker.image }} style={{ width: size, height: size }} />
          ) : (
            <Text style={{ fontSize: isBig ? 26 : 19 }}>{marker.emoji}</Text>
          )}

          {marker.linkTo && (
            <View
              style={{
                position: "absolute",
                bottom: -3,
                right: -3,
                width: 22,
                height: 22,
                borderRadius: 11,
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
              <Text style={{ fontSize: 9 }}>
                {editAction === "delete" ? "🗑" : editAction === "edit" ? "✎" : "✥"}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

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
          {total > 0 ? (
            <Text style={{ fontWeight: "normal", opacity: 0.6 }}>
              {" "}
              {doneCount}/{total}
            </Text>
          ) : null}
        </Text>
      </View>

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