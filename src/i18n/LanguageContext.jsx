// i18n/LanguageContext.jsx
import React, { createContext, useContext, useMemo } from "react";
import { TRANSLATIONS, DEFAULT_LANGUAGE, LANGUAGES } from "./translations";

const LanguageContext = createContext(null);

function makeT(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallback = TRANSLATIONS[DEFAULT_LANGUAGE];

  return function t(key, params) {
    let str = dict[key];
    if (str == null) str = fallback[key];
    if (str == null) return key;

    if (params) {
      str = str.replace(/\{(\w+)\}/g, (_, k) =>
        params[k] != null ? String(params[k]) : `{${k}}`
      );
    }
    return str;
  };
}

export function LanguageProvider({ language, children }) {
  const value = useMemo(() => {
    const lang = LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
    const t = makeT(lang);
    const isRTL = !!LANGUAGES[lang]?.rtl;
    return { language: lang, t, isRTL };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx.t;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

export function useRTL() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useRTL must be used inside LanguageProvider");
  return ctx.isRTL;
}
