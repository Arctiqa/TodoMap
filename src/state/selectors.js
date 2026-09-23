import { isTaskExpired } from "../utils/date";

export function findMarker(screens, screenId, markerId) {
  const scr = screens[screenId];
  return scr ? scr.markers.find((m) => m.id === markerId) : null;
}

export function findTask(screens, screenId, markerId, taskId) {
  const mk = findMarker(screens, screenId, markerId);
  return mk ? (mk.tasks || []).find((t) => t.id === taskId) : null;
}

export function allEntries(screens) {
  const out = [];
  Object.values(screens).forEach((scr) => {
    (scr.markers || []).forEach((mk) => {
      (mk.tasks || []).forEach((task) => {
        out.push({
          screenId: scr.id,
          screenName: scr.name,
          markerId: mk.id,
          markerName: mk.name,
          markerEmoji: mk.emoji,
          markerColor: mk.color,
          task,
        });
      });
    });
  });
  return out;
}

export function activeEntries(screens) {
  return allEntries(screens).filter((e) => !e.task.done && !isTaskExpired(e.task));
}

export function historyEntries(screens, historyLog) {
  return [...allEntries(screens), ...historyLog].sort((a, b) => (b.task.createdAt || 0) - (a.task.createdAt || 0));
}

export function findEntry(screens, loc) {
  if (!loc) return null;
  const scr = screens[loc.screenId];
  if (!scr) return null;
  const mk = scr.markers.find((m) => m.id === loc.markerId);
  if (!mk) return null;
  const task = (mk.tasks || []).find((t) => t.id === loc.taskId);
  if (!task) return null;
  return {
    screenId: scr.id,
    screenName: scr.name,
    markerId: mk.id,
    markerName: mk.name,
    markerEmoji: mk.emoji,
    markerColor: mk.color,
    task,
  };
}