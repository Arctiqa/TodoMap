import { isTaskExpired } from "../utils/date";
import { screenTitle } from "../utils/text";
import { FIELD_MARKER_ID } from "../constants/config";

export function findMarker(screens, screenId, markerId) {
  const scr = screens[screenId];
  if (!scr) return null;
  return scr.markers.find((m) => m.id === markerId) || null;
}

export function findTask(screens, screenId, markerId, taskId) {
  if (markerId === FIELD_MARKER_ID || markerId === null || markerId === undefined) {
    const scr = screens[screenId];
    if (!scr) return null;
    return (scr.stickers || []).find((s) => s.id === taskId) || null;
  }
  const mk = findMarker(screens, screenId, markerId);
  return mk ? (mk.tasks || []).find((t) => t.id === taskId) || null : null;
}

export function allEntries(screens) {
  const out = [];
  Object.values(screens).forEach((scr) => {
    (scr.markers || []).forEach((mk) => {
      (mk.tasks || []).forEach((task) => {
        out.push({
          screenId: scr.id,
          screenName: screenTitle(scr),
          markerId: mk.id,
          markerName: mk.name,
          markerEmoji: mk.emoji,
          markerColor: mk.color,
          task,
        });
      });
    });

    (scr.stickers || []).forEach((sticker) => {
      out.push({
        screenId: scr.id,
        screenName: screenTitle(scr),
        markerId: FIELD_MARKER_ID,
        markerName: "Свободное",
        markerEmoji: scr.emoji || "📌",
        markerColor: "#B08968",
        task: sticker,
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

  if (loc.markerId === FIELD_MARKER_ID || loc.markerId === null || loc.markerId === undefined) {
    const sticker = (scr.stickers || []).find((s) => s.id === loc.taskId);
    if (!sticker) return null;
    return {
      screenId: scr.id,
      screenName: screenTitle(scr),
      markerId: FIELD_MARKER_ID,
      markerName: "Свободное",
      markerEmoji: scr.emoji || "📌",
      markerColor: "#B08968",
      task: sticker,
    };
  }

  const mk = scr.markers.find((m) => m.id === loc.markerId);
  if (!mk) return null;
  const task = (mk.tasks || []).find((t) => t.id === loc.taskId);
  if (!task) return null;
  return {
    screenId: scr.id,
    screenName: screenTitle(scr),
    markerId: mk.id,
    markerName: mk.name,
    markerEmoji: mk.emoji,
    markerColor: mk.color,
    task,
  };
}

export function expiredEntries(screens) {
  return allEntries(screens).filter((e) => !e.task.done && isTaskExpired(e.task));
}

export function doneEntries(screens) {
  return allEntries(screens).filter((e) => e.task.done);
}

export function countByStatus(screens, historyLog) {
  const all = allEntries(screens);
  const active = all.filter((e) => !e.task.done && !isTaskExpired(e.task)).length;
  const expired = all.filter((e) => !e.task.done && isTaskExpired(e.task)).length;
  const done = all.filter((e) => e.task.done).length;
  const archived = historyLog.length;
  return { active, expired, done, archived };
}
