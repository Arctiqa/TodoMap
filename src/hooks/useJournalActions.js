import { useCallback } from "react";
import { FIELD_MARKER_ID } from "../constants/config";

export function useJournalActions({ setScreens, setHistory, releaseGuideTask }) {
  const returnToActive = useCallback((entry) => {
    const { screenId, markerId } = entry;
    const taskId = entry.task.id;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;

      if (markerId === FIELD_MARKER_ID) {
        return {
          ...prev,
          [screenId]: {
            ...scr,
            stickers: (scr.stickers || []).map((s) =>
              s.id === taskId ? { ...s, due: null, done: false, completedAt: null } : s
            ),
          },
        };
      }

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? {
                  ...m,
                  tasks: m.tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, due: null, done: false, completedAt: null }
                      : t
                  ),
                }
              : m
          ),
        },
      };
    });
  }, [setScreens]);

  const complete = useCallback((entry) => {
    const { screenId, markerId } = entry;
    const taskId = entry.task.id;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => t.id === taskId ? { ...t, done: true, completedAt: Date.now() } : t) }
            : m),
        },
      };
    });
  }, [setScreens]);

  const remove = useCallback((entry) => {
    const { screenId, markerId } = entry;
    const taskId = entry.task.id;

    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;

      // стикер (свободное)
      if (markerId === null || markerId === undefined || markerId === "__field__") {
        return {
          ...prev,
          [screenId]: {
            ...scr,
            stickers: (scr.stickers || []).filter((s) => s.id !== taskId),
          },
        };
      }

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
              : m
          ),
        },
      };
    });
  }, [setScreens]);

  // Удалить все выполненные: переносим в historyLog и убираем из screens
  const removeAllDone = useCallback((doneEntries) => {
    if (!doneEntries || doneEntries.length === 0) return;

    const now = Date.now();

    // 1) Собираем записи для historyLog
    const archived = doneEntries.map((e) => ({
      screenId: e.screenId,
      screenName: e.screenName,
      markerId: e.markerId === FIELD_MARKER_ID ? null : e.markerId,
      markerName: e.markerName,
      markerEmoji: e.markerEmoji,
      markerColor: e.markerColor,
      task: e.task,
      removedAt: now,
    }));

    if (releaseGuideTask) {
      doneEntries.forEach((e) => {
        const task = e.task;
        if (task && task.source && task.guideOfferId) {
          releaseGuideTask(task.guideOfferId);
        }
      });
    }

    setHistory((h) => [...h, ...archived]);

    // 2) Готовим id для удаления из screens
    const idsByScreen = new Map();
    doneEntries.forEach((e) => {
      if (!idsByScreen.has(e.screenId)) {
        idsByScreen.set(e.screenId, { marker: new Set(), sticker: new Set() });
      }
      const bucket = idsByScreen.get(e.screenId);
      if (e.markerId === FIELD_MARKER_ID) bucket.sticker.add(e.task.id);
      else bucket.marker.add(e.task.id);
    });

    // 3) Удаляем из screens
    setScreens((prev) => {
      const next = { ...prev };
      idsByScreen.forEach((bucket, screenId) => {
        const scr = next[screenId];
        if (!scr) return;
        next[screenId] = {
          ...scr,
          markers: scr.markers.map((m) => {
            if (!bucket.marker.size) return m;
            const tasks = m.tasks.filter((t) => !bucket.marker.has(t.id));
            return tasks.length === m.tasks.length ? m : { ...m, tasks };
          }),
          stickers: bucket.sticker.size
            ? (scr.stickers || []).filter((s) => !bucket.sticker.has(s.id))
            : (scr.stickers || []),
        };
      });
      return next;
    });
  }, [setScreens, setHistory]);

  const hardDeleteArchive = useCallback((entry) => {
    setHistory((prev) =>
      prev.filter((e) => !(e.task.id === entry.task.id && e.removedAt === entry.removedAt))
    );
  }, [setHistory]);

  return { returnToActive, complete, remove, removeAllDone, hardDeleteArchive };
}
