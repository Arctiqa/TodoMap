import { useCallback } from "react";
import { nextId } from "../utils/id";
import { scheduleTaskNotifications, cancelTaskNotifications } from "../utils/notifications";
import { GUIDE_TITLES } from "../constants/guides";

export function useTasks({
  screen, currentId, updateScreen, setScreens, setHistory,
  bumpGuideProgress,
}) {
  const addTaskCore = useCallback((screenId, markerId, payload) => {
    const newTask = {
      id: nextId(),
      title: payload.title,
      due: payload.due || null,
      done: false,
      notes: (payload.notes || []).map((t) => (typeof t === "string" ? { text: t, done: false } : t)),
      createdAt: Date.now(),
      source: payload.source || undefined,
      repeat: payload.repeat || null,
    };
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId ? { ...m, tasks: [...(m.tasks || []), newTask] } : m
          ),
        },
      };
    });
    scheduleTaskNotifications(newTask);
  }, [setScreens]);

  const toggleTask = useCallback((markerId, taskId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const willBeDone = !task.done;
    if (willBeDone) cancelTaskNotifications(task.id);
    else scheduleTaskNotifications(task);

    const shouldAward = !!(task && !task.done && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
    if (shouldAward) bumpGuideProgress(task.source);

    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => m.id === markerId
        ? {
            ...m,
            tasks: m.tasks.map((t) => t.id === taskId
              ? {
                  ...t,
                  done: willBeDone,
                  completedAt: willBeDone ? Date.now() : null,
                  titleAwarded: shouldAward ? true : t.titleAwarded,
                }
              : t),
          }
        : m),
    }));
  }, [screen, currentId, updateScreen, bumpGuideProgress]);

  const incrementRepeat = useCallback((markerId, taskId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task || !task.repeat || task.done) return;
    const nextCount = Math.min(task.repeat.target, task.repeat.count + 1);
    const willFinish = nextCount >= task.repeat.target;
    if (willFinish) cancelTaskNotifications(task.id);

    const shouldAward = !!(willFinish && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
    if (shouldAward) bumpGuideProgress(task.source);

    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => m.id === markerId
        ? {
            ...m,
            tasks: m.tasks.map((t) => t.id === taskId
              ? {
                  ...t,
                  repeat: { ...t.repeat, count: nextCount },
                  done: willFinish,
                  titleAwarded: shouldAward ? true : t.titleAwarded,
                }
              : t),
          }
        : m),
    }));
  }, [screen, currentId, updateScreen, bumpGuideProgress]);

  const deleteTask = useCallback((markerId, taskId) => {
    cancelTaskNotifications(taskId);
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (marker && task) {
      setHistory((prev) => [...prev, {
        screenId: currentId,
        screenName: screen.name,
        markerId: marker.id,
        markerName: marker.name,
        markerEmoji: marker.emoji,
        markerColor: marker.color,
        task,
        removedAt: Date.now(),
      }]);
    }
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => (m.id === markerId
        ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
        : m)),
    }));
  }, [screen, currentId, updateScreen, setHistory]);

  const addNoteLocal = useCallback((markerId, taskId, text) => {
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => (m.id === markerId
        ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
            ? { ...t, notes: [...(t.notes || []), { text, done: false }] }
            : t)) }
        : m)),
    }));
  }, [currentId, updateScreen]);

  const removeNoteLocal = useCallback((markerId, taskId, idx) => {
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => (m.id === markerId
        ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
            ? { ...t, notes: t.notes.filter((_, i) => i !== idx) }
            : t)) }
        : m)),
    }));
  }, [currentId, updateScreen]);

  const toggleNoteLocal = useCallback((markerId, taskId, idx) => {
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => (m.id === markerId
        ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
            ? { ...t, notes: t.notes.map((n, i) => (i === idx ? { ...n, done: !n.done } : n)) }
            : t)) }
        : m)),
    }));
  }, [currentId, updateScreen]);

  // Глобальные (для JournalDetail)
  const addNoteGlobal = useCallback((journalDetail, text) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) => (m.id === markerId
          ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
              ? { ...t, notes: [...(t.notes || []), { text, done: false }] }
              : t)) }
          : m)),
      },
    }));
  }, [setScreens]);

  const removeNoteGlobal = useCallback((journalDetail, idx) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) => (m.id === markerId
          ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
              ? { ...t, notes: t.notes.filter((_, i) => i !== idx) }
              : t)) }
          : m)),
      },
    }));
  }, [setScreens]);

  const toggleNoteGlobal = useCallback((journalDetail, idx) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) => (m.id === markerId
          ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId
              ? { ...t, notes: t.notes.map((n, i) => (i === idx ? { ...n, done: !n.done } : n)) }
              : t)) }
          : m)),
      },
    }));
  }, [setScreens]);

  return {
    addTaskCore, toggleTask, incrementRepeat, deleteTask,
    addNoteLocal, removeNoteLocal, toggleNoteLocal,
    addNoteGlobal, removeNoteGlobal, toggleNoteGlobal,
  };
}