export function shortLabel(text) {
  if (!text) return "";
  return text.length > 18 ? text.slice(0, 17) + "…" : text;
}

export function screenTitle(screen) {
  if (!screen) return "";
  const e = (screen.emoji || "").trim();
  const n = (screen.name || "").trim();
  return e ? `${e} ${n}` : n;
}