import React, { useRef, useCallback, useEffect, useState } from "react";
import { View, Text, PanResponder, Animated, Easing } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import {
  STICKER_SIZE,
  STICKER_LONG_PRESS,
  STICKER_DROP_RADIUS,
  PIN_BOUNDS,
  PIN_SIZE,
} from "../constants/config";
import { isTaskExpired } from "../utils/date";
import { BLUE, GREEN } from "../theme/palettes";
import { GUIDE_BY_KEY } from "../constants/guides";

function pctToPx(pct, total) {
  return (pct / 100) * total;
}

function StickerInner({
  sticker,
  containerSize,
  markers,
  onOpen,
  onDragStart,
  onDragEnd,
  onDropOnField,
  onDropOnMarker,
  onDropOnDoor,
  onExtractToParent,
  onDelete,
  onMove,
  onHoverMarker,
  isOverTrashRef,
}) {
  const { ink, card, paper } = useTheme();

  const xRef = useRef(pctToPx(sticker.x, containerSize.width || 1));
  const yRef = useRef(pctToPx(sticker.y, containerSize.height || 1));

  const pan = useRef(new Animated.ValueXY({ x: xRef.current, y: yRef.current })).current;
  const appear = useRef(new Animated.Value(0)).current;
  const dropScale = useRef(new Animated.Value(1)).current;
  const dropOpacity = useRef(new Animated.Value(1)).current;
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const containerRef = useRef(containerSize);
  containerRef.current = containerSize;

  const markersRef = useRef(markers);
  markersRef.current = markers;

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const onHoverMarkerRef = useRef(onHoverMarker);
  onHoverMarkerRef.current = onHoverMarker;

  const onExtractRef = useRef(onExtractToParent);
  onExtractRef.current = onExtractToParent;

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const lastHoverCheckRef = useRef(0);
  const hoveredMarkerIdRef = useRef(null);

  const holdTimer = useRef(null);
  const heldLongRef = useRef(false);
  const movedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const wasDraggingRef = useRef(false);

  const resetHover = useCallback(() => {
    if (hoveredMarkerIdRef.current !== null) {
      hoveredMarkerIdRef.current = null;
      onHoverMarkerRef.current && onHoverMarkerRef.current(null);
    }
  }, []);

  useEffect(() => {
    if (draggingRef.current) return;
    if (!containerSize.width || !containerSize.height) return;
    const nx = pctToPx(sticker.x, containerSize.width);
    const ny = pctToPx(sticker.y, containerSize.height);
    xRef.current = nx;
    yRef.current = ny;
    pan.setValue({ x: nx, y: ny });
  }, [sticker.x, sticker.y, containerSize.width, containerSize.height, pan]);

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [appear]);

  useEffect(() => {
    dropScale.setValue(1);
    dropOpacity.setValue(1);
  }, [sticker.id, dropScale, dropOpacity]);

  const beginDrag = useCallback(() => {
    draggingRef.current = true;
    setDragging(true);
    wasDraggingRef.current = true;
    pan.stopAnimation((value) => {
      dragStartRef.current = { x: value.x, y: value.y };
    });
    onDragStart && onDragStart(sticker.id);
  }, [pan, onDragStart, sticker.id]);

  const playDropAnimation = useCallback(
    (callback) => {
      Animated.parallel([
        Animated.timing(dropScale, {
          toValue: 0.25,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dropOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback && callback();
      });
    }, [dropScale, dropOpacity]
  );

  const endDrag = useCallback(
    (gx, gy) => {
      const cs = containerRef.current;

      if (hoveredMarkerIdRef.current !== null) {
        hoveredMarkerIdRef.current = null;
        onHoverMarkerRef.current && onHoverMarkerRef.current(null);
      }

      if (!cs.width || !cs.height) {
        draggingRef.current = false;
        setDragging(false);
        onDragEnd && onDragEnd(sticker.id);
        return;
      }

      const finalX = dragStartRef.current.x + (gx || 0);
      const finalY = dragStartRef.current.y + (gy || 0);

      if (isOverTrashRef && isOverTrashRef.current) {
        draggingRef.current = false;
        setDragging(false);
        onMoveRef.current && onMoveRef.current(0, 0);
        playDropAnimation(() => {
          onDelete && onDelete(sticker.id);
          onDragEnd && onDragEnd(sticker.id);
        });
        return;
      }

      const cx = finalX + STICKER_SIZE.width / 2;
      const cy = finalY + STICKER_SIZE.height / 2;

      let nearest = null;
      let bestDist = Infinity;
      (markersRef.current || []).forEach((m) => {
        const mx = pctToPx(m.x, cs.width);
        const my = pctToPx(m.y, cs.height);
        const d = Math.hypot(mx - cx, my - cy);
        if (d < bestDist) {
          bestDist = d;
          nearest = m;
        }
      });

      if (nearest && bestDist <= STICKER_DROP_RADIUS + PIN_SIZE.normal / 2) {
        draggingRef.current = false;
        setDragging(false);
        onMoveRef.current && onMoveRef.current(0, 0);

        playDropAnimation(() => {
          if (nearest.linkTo) {
            onDropOnDoor && onDropOnDoor(sticker.id, nearest.linkTo);
          } else {
            onDropOnMarker && onDropOnMarker(sticker.id, nearest.id);
          }
          onDragEnd && onDragEnd(sticker.id);
        });
        return;
      }

      const minX = pctToPx(PIN_BOUNDS.minX, cs.width);
      const maxX = pctToPx(PIN_BOUNDS.maxX, cs.width) - STICKER_SIZE.width;
      const minY = pctToPx(PIN_BOUNDS.minY, cs.height);
      const maxY = pctToPx(PIN_BOUNDS.maxY, cs.height) - STICKER_SIZE.height;

      const clampedX = Math.min(maxX, Math.max(minX, finalX));
      const clampedY = Math.min(maxY, Math.max(minY, finalY));

      pan.setValue({ x: clampedX, y: clampedY });
      xRef.current = clampedX;
      yRef.current = clampedY;

      const pctX = (clampedX / cs.width) * 100;
      const pctY = (clampedY / cs.height) * 100;

      draggingRef.current = false;
      setDragging(false);
      onMoveRef.current && onMoveRef.current(0, 0);
      onDropOnField && onDropOnField(sticker.id, pctX, pctY);
      onDragEnd && onDragEnd(sticker.id);
    },
    [
      sticker.id,
      onDelete,
      onDropOnField,
      onDropOnMarker,
      onDropOnDoor,
      onDragEnd,
      isOverTrashRef,
      pan,
      playDropAnimation,
    ]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        movedRef.current = false;
        heldLongRef.current = false;

        holdTimer.current = setTimeout(() => {
          holdTimer.current = null;
          if (!movedRef.current) {
            heldLongRef.current = true;

            onDragEnd && onDragEnd(sticker.id);
            onMoveRef.current && onMoveRef.current(0, 0);
            onExtractRef.current && onExtractRef.current(sticker.id);
          }
        }, STICKER_LONG_PRESS);

        beginDrag();
      },

      onPanResponderMove: (_, g) => {
        if (!movedRef.current && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5)) {
          movedRef.current = true;
          if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }
        }

        const cs = containerRef.current;
        if (!cs.width || !cs.height) return;

        const minX = pctToPx(PIN_BOUNDS.minX, cs.width);
        const maxX = pctToPx(PIN_BOUNDS.maxX, cs.width) - STICKER_SIZE.width;
        const minY = pctToPx(PIN_BOUNDS.minY, cs.height);
        const maxY = pctToPx(PIN_BOUNDS.maxY, cs.height) - STICKER_SIZE.height;

        const nx = Math.min(maxX, Math.max(minX, dragStartRef.current.x + g.dx));
        const ny = Math.min(maxY, Math.max(minY, dragStartRef.current.y + g.dy));
        pan.setValue({ x: nx, y: ny });

        if (onMoveRef.current) {
          const centerY = ny + STICKER_SIZE.height / 2;
          onMoveRef.current(centerY, cs.height);
        }

        if (onHoverMarkerRef.current) {
          const now = Date.now();
          if (!lastHoverCheckRef.current || now - lastHoverCheckRef.current > 80) {
            lastHoverCheckRef.current = now;
            const cx = nx + STICKER_SIZE.width / 2;
            const cy = ny + STICKER_SIZE.height / 2;
            let nearestId = null;
            let bestDist = Infinity;
            (markersRef.current || []).forEach((m) => {
              const mx = pctToPx(m.x, cs.width);
              const my = pctToPx(m.y, cs.height);
              const d = Math.hypot(mx - cx, my - cy);
              if (d < bestDist) {
                bestDist = d;
                nearestId = m.id;
              }
            });
            const inZone = nearestId && bestDist <= STICKER_DROP_RADIUS + PIN_SIZE.normal / 2;
            const next = inZone ? nearestId : null;
            if (next !== hoveredMarkerIdRef.current) {
              hoveredMarkerIdRef.current = next;
              onHoverMarkerRef.current(next);
            }
          }
        }
      },

      onPanResponderRelease: (_, g) => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }

        if (heldLongRef.current) {
          draggingRef.current = false;
          setDragging(false);
          onMoveRef.current && onMoveRef.current(0, 0);

          if (hoveredMarkerIdRef.current !== null) {
            hoveredMarkerIdRef.current = null;
            onHoverMarkerRef.current && onHoverMarkerRef.current(null);
          }

          onDragEnd && onDragEnd(sticker.id);
          wasDraggingRef.current = false;
          return;
        }

        if (movedRef.current) {
          endDrag(g.dx, g.dy);
        } else {
          draggingRef.current = false;
          setDragging(false);
          onDragEnd && onDragEnd(sticker.id);
          if (hoveredMarkerIdRef.current !== null) {
            hoveredMarkerIdRef.current = null;
            onHoverMarkerRef.current && onHoverMarkerRef.current(null);
          }
          onOpenRef.current && onOpenRef.current(sticker);
        }
        wasDraggingRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
        if (heldLongRef.current) {
          draggingRef.current = false;
          setDragging(false);
          onMoveRef.current && onMoveRef.current(0, 0);

          if (hoveredMarkerIdRef.current !== null) {
            hoveredMarkerIdRef.current = null;
            onHoverMarkerRef.current && onHoverMarkerRef.current(null);
          }

          onDragEnd && onDragEnd(sticker.id);
          return;
        }
        if (draggingRef.current) {
          endDrag(0, 0);
        }
        if (hoveredMarkerIdRef.current !== null) {
          hoveredMarkerIdRef.current = null;
          onHoverMarkerRef.current && onHoverMarkerRef.current(null);
        }
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  if (!containerSize.width || !containerSize.height) return null;

  const expired = !sticker.done && isTaskExpired(sticker);
  const notes = sticker.notes || [];
  const notesDone = notes.filter((n) => n.done).length;
  const guide = sticker.source ? GUIDE_BY_KEY[sticker.source] : null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: dropOpacity,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          {
            scale: Animated.multiply(
              appear,
              Animated.multiply(dragging ? 1.06 : 1, dropScale)
            ),
          },
        ],
        zIndex: dragging ? 999 : 4,
        elevation: dragging ? 999 : 4,
        width: STICKER_SIZE.width,
        height: STICKER_SIZE.height,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: card,
          borderWidth: 2,
          borderColor: sticker.color || (guide ? guide.color : ink),
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: dragging ? 0.25 : 0.12,
          shadowRadius: dragging ? 8 : 3,
          opacity: sticker.done ? 0.55 : 1,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: expired ? BLUE : ink,
            textDecorationLine: sticker.done ? "line-through" : "none",
            paddingRight: guide ? 22 : 0,
          }}
          numberOfLines={2}
        >
          {sticker.title}
        </Text>

        {notes.length > 0 && (
          <Text style={{ fontSize: 9.5, color: ink, opacity: 0.55, marginTop: 2, fontFamily: "monospace" }}>
            {notesDone}/{notes.length}
          </Text>
        )}

        {sticker.repeat && (
          <>
            <View
              style={{
                height: 3,
                borderRadius: 1.5,
                backgroundColor: ink,
                opacity: 0.15,
                marginTop: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: GREEN,
                  width: `${Math.round((sticker.repeat.count / sticker.repeat.target) * 100)}%`,
                }}
              />
            </View>
            <Text style={{ fontSize: 9, color: ink, opacity: 0.5, marginTop: 1, fontFamily: "monospace" }}>
              {sticker.repeat.count}/{sticker.repeat.target}
            </Text>
          </>
        )}


        {guide && (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: guide.color,
              borderWidth: 1.5,
              borderColor: ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name={guide.icon} size={12} color={ink} />
          </View>
        )}

        <View
          style={{
            position: "absolute",
            right: 4,
            bottom: 4,
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dragging ? ink : "transparent",
          }}
        >
          <MaterialIcons
            name="open-with"
            size={dragging ? 16 : 14}
            color={dragging ? paper : ink}
            style={{ opacity: dragging ? 1 : 0.35 }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export const MemoSticker = React.memo(StickerInner, (prev, next) => {
  return (
    prev.sticker === next.sticker &&
    prev.containerSize.width === next.containerSize.width &&
    prev.containerSize.height === next.containerSize.height &&
    prev.markers === next.markers
  );
});
