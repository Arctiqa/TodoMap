import { useCallback } from "react";
import { FIELD_MARKER_ID } from "../constants/config";

export function useJournalActions({ setScreens, setHistory }) {
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

  const hardDeleteArchive = useCallback((entry) => {
    setHistory((prev) =>
      prev.filter((e) => !(e.task.id === entry.task.id && e.removedAt === entry.removedAt))
    );
  }, [setHistory]);

  return { returnToActive, complete, remove, hardDeleteArchive };
}
