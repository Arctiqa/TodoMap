import { useCallback } from "react";

export function useJournalActions({ setScreens, setHistory }) {
  const returnToActive = useCallback((entry) => {
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
            ? { ...m, tasks: m.tasks.map((t) => t.id === taskId ? { ...t, due: null, done: false, completedAt: null } : t) }
            : m),
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
      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => m.id === markerId
            ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
            : m),
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
