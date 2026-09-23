import React, { createContext, useContext, useMemo } from "react";
import { THEMES } from "./palettes";

const ThemeContext = createContext(null);

export function ThemeProvider({ name, children }) {
  const value = useMemo(() => {
    const t = THEMES[name] || THEMES.light;
    return { name, ...t };
  }, [name]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}