import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import { isRTLLanguage } from "./language";

export async function applyRTL(language) {
  const shouldBeRTL = isRTLLanguage(language);
  const currentlyRTL = I18nManager.isRTL;

  if (shouldBeRTL === currentlyRTL) return false;

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  return true;
}

export async function reloadApp() {
  try {
    await Updates.reloadAsync();
  } catch (e) {
    console.warn("QuestMap: не удалось перезапустить приложение", e);
  }
}

export function rtlStyle(isRTL, ltrStyle, rtlStyleObj) {
  return isRTL ? rtlStyleObj : ltrStyle;
}
