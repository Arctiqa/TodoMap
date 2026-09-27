import { useRef, useEffect } from "react";
import { Animated, Keyboard } from "react-native";

export function useKeyboardOffset() {
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const onShow = (e) => {
      Animated.timing(offset, {
        toValue: -e.endCoordinates.height,
        duration: 335,
        useNativeDriver: true,
      }).start();
    };
    const onHide = () => {
      Animated.timing(offset, {
        toValue: 0,
        duration: 335,
        useNativeDriver: true,
      }).start();
    };
    const subShow = Keyboard.addListener("keyboardDidShow", onShow);
    const subHide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [offset]);

  return offset;
}