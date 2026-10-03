// utils/language.js
import * as Localization from "expo-localization";
import { LANGUAGES, DEFAULT_LANGUAGE } from "../i18n/translations";

export const LANGUAGE_STORAGE_KEY = "questmap_language_v1";

export function detectSystemLanguage() {
  try {
    const locales = Localization.getLocales?.() || [];
    for (const loc of locales) {
      const code = (loc.languageCode || "").toLowerCase();
      if (LANGUAGES[code]) return code;
    }
  } catch (e) {
    // expo-localization может быть недоступен — игнорируем
  }
  return DEFAULT_LANGUAGE;
}

export function normalizeLanguage(code) {
  if (!code) return null;
  const short = String(code).split("-")[0].toLowerCase();
  return LANGUAGES[short] ? short : null;
}

export function isRTLLanguage(code) {
  return !!LANGUAGES[code]?.rtl;
}
