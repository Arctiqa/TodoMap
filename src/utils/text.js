export function shortLabel(text) {
  if (!text) return "";
  return text.length > 18 ? text.slice(0, 17) + "…" : text;
}