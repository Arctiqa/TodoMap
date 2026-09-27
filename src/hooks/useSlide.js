import { useRef, useMemo, useCallback } from "react";
import { PanResponder, Animated, Dimensions } from "react-native";
import { SWIPE_EDGE_RESISTANCE } from "../constants/config";

export function useSlide({ topLevelOrder, currentId, setCurrentId, editMode }) {
  const screenWidth = useRef(Dimensions.get("window").width).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  const siblings = useMemo(
    () => topLevelOrder.includes(currentId)
      ? { list: topLevelOrder, index: topLevelOrder.indexOf(currentId) }
      : { list: [], index: -1 },
    [topLevelOrder, currentId]
  );

  const siblingsRef = useRef(siblings);
  siblingsRef.current = siblings;

  const goSibling = useCallback((dir) => {
    const target = topLevelOrder[topLevelOrder.indexOf(currentId) + dir];
    if (target) setCurrentId(target);
  }, [topLevelOrder, currentId, setCurrentId]);

  const animateSlide = useCallback((direction) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const target = direction > 0 ? screenWidth : -screenWidth;

    Animated.timing(slideX, {
      toValue: target,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      goSibling(direction > 0 ? -1 : 1);
      slideX.setValue(-target);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        isAnimatingRef.current = false;
      });
    });
  }, [screenWidth, goSibling, slideX]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => {
      if (editMode || isAnimatingRef.current) return false;
      return Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
    },
    onPanResponderMove: (_, g) => {
      const sib = siblingsRef.current;
      const canGoLeft = sib.index > 0;
      const canGoRight = sib.index !== -1 && sib.index < sib.list.length - 1;
      let dx = g.dx;
      if ((dx > 0 && !canGoLeft) || (dx < 0 && !canGoRight)) {
        dx = dx * SWIPE_EDGE_RESISTANCE;
      }
      slideX.setValue(dx);
    },
    onPanResponderRelease: (_, g) => {
      const sib = siblingsRef.current;
      const threshold = screenWidth * 0.25;
      const goRight = g.dx < -threshold && sib.index !== -1 && sib.index < sib.list.length - 1;
      const goLeft  = g.dx > threshold && sib.index > 0;

      if (goRight || goLeft) {
        animateSlide(goLeft ? 1 : -1);
      } else {
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 60,
        }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
    },
  }), [editMode, animateSlide, screenWidth, slideX]);

  return { slideX, swipeResponder, siblings, goSibling, animateSlide };
}
