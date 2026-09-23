let uid = Date.now() * 1000;
export const nextId = () => uid++;

// Возвращает НОВЫЙ объект, не мутирует входной.
export function dedupeIds(screensObj) {
  const seen = new Set();
  const fix = (oldId, prefix) =>
    seen.has(oldId) ? `${prefix}_fix_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : oldId;

  const result = {};
  Object.entries(screensObj).forEach(([scrKey, scr]) => {
    const markers = (scr.markers || []).map((mk) => {
      const newMkId = fix(mk.id, "m");
      seen.add(newMkId);
      const tasks = (mk.tasks || []).map((t) => {
        const newTId = fix(t.id, "t");
        seen.add(newTId);
        return newTId === t.id ? t : { ...t, id: newTId };
      });
      return newMkId === mk.id && tasks.every((t, i) => t === (mk.tasks || [])[i])
        ? mk
        : { ...mk, id: newMkId, tasks };
    });
    result[scrKey] = { ...scr, markers };
  });
  return result;
}