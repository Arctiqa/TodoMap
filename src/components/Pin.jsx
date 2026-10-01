import React, { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, PanResponder, Image, Animated, Easing } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { PIN_BOUNDS, PIN_SIZE } from "../constants/config";
import { shortLabel } from "../utils/text";
import { isTaskExpired } from "../utils/date";
import { BLUE } from "../theme/palettes";
import { resolveImageSource } from "../data/initialScreens";
import { GUIDE_BY_KEY } from "../constants/guides";

const OUTER_RING = 7;
const BADGE = 22;
const MAX_PREVIEW = 3;

function pctToPx(pct, total) {
  return (pct / 100) * total;
}

function PinInner({
  marker,
  markerId,
  subscribeHovered,
  editMode,
  editAction,
  containerSize,
  onOpen,
  onDragMove,
  onDelete,
  onEdit,
}) {
  const appear = useRef(new Animated.Value(0)).current;
  const hoverScale = useRef(new Animated.Value(1)).current;
  const { ink, card, paper, ring } = useTheme();

  const isBig = !!marker.linkTo;
  const size = isBig ? PIN_SIZE.special : PIN_SIZE.normal;
  const outerSize = size + OUTER_RING * 2;

  const markerRef = useRef(marker);
  markerRef.current = marker;

  const [hovered, setHovered] = useState(false);

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

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [appear]);

  useEffect(() => {
    if (!subscribeHovered || !markerId) return;
    const cb = (id) => setHovered(id === markerId);
    const unsubscribe = subscribeHovered(cb);
    return unsubscribe;
  }, [subscribeHovered, markerId]);

  useEffect(() => {
    Animated.timing(hoverScale, {
      toValue: hovered ? 1.25 : 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hovered, hoverScale]);

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

  const previewTasks = useMemo(() => {
    if (!marker.tasks) return [];
    return marker.tasks.filter((t) => !t.done).slice(0, MAX_PREVIEW);
  }, [marker.tasks]);

  const activeCount = marker.tasks ? marker.tasks.filter((t) => !t.done).length : 0;
  const hasMore = activeCount > MAX_PREVIEW;

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
          { scale: Animated.multiply(appear, hoverScale) },
        ],
        alignItems: "center",
        zIndex: hovered ? 100 : 2,
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
          <View
            style={{
              position: "absolute",
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderWidth: OUTER_RING,
              borderColor: hovered ? marker.color : ring,
            }}
          />

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

          {editMode && (
            <View
              style={{
                position: "absolute",
                bottom: 0, left: 0,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: editAction === "delete" ? "#E4572E" : card,
                borderWidth: 2, borderColor: ink,
                alignItems: "center", justifyContent: "center",
              }}
            >
              {editAction === "delete" ? (
                <MaterialIcons name="delete-forever" size={12} color="#fff" />
              ) : editAction === "edit" ? (
                <MaterialIcons name="edit" size={11} color={ink} />
              ) : (
                <Text style={{ fontSize: 10 }}>✥</Text>
              )}
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

      {!editMode && previewTasks.length > 0 && (
        <Pressable
          onPress={handlePress}
          style={{
            marginTop: 3,
            backgroundColor: card,
            borderWidth: 1.5,
            borderColor: ink,
            paddingHorizontal: 6,
            paddingVertical: 3,
            maxWidth: 140,
            borderRadius: 6,
          }}
        >
            {previewTasks.map((t, i) => {
              const g = t.source ? GUIDE_BY_KEY[t.source] : null;
              return (
                <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: i === 0 ? 0 : 2 }}>
                  {g && (
                    <View
                      style={{
                        width: 12, height: 12, borderRadius: 6,
                        backgroundColor: g.color,
                        borderWidth: 1, borderColor: ink,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name={g.icon} size={8} color={ink} />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontFamily: "monospace",
                      color: isTaskExpired(t) ? BLUE : ink,
                      opacity: isTaskExpired(t) ? 1 : 0.75,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {shortLabel(t.title)}
                  </Text>
                  {t.repeat && (
                    <Text
                      style={{
                        fontSize: 9.5,
                        fontFamily: "monospace",
                        color: ink,
                        opacity: 0.5,
                      }}
                    >
                      {t.repeat.count}/{t.repeat.target}
                    </Text>
                  )}
                </View>
              );
            })}
            
          {hasMore && (
            <Text
              style={{
                fontSize: 9.5,
                fontFamily: "monospace",
                color: ink,
                opacity: 0.4,
                marginTop: 2,
                textAlign: "center",
              }}
            >
              ...
            </Text>
          )}
        </Pressable>
      )}
    </Animated.View>
  );
}

export const Pin = React.memo(PinInner, (prev, next) => {
  return (
    prev.marker === next.marker &&
    prev.markerId === next.markerId &&
    prev.editMode === next.editMode &&
    prev.editAction === next.editAction &&
    prev.containerSize.width === next.containerSize.width &&
    prev.containerSize.height === next.containerSize.height
  );
});
