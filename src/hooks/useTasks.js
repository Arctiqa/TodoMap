import { useCallback } from "react";
import { nextId } from "../utils/id";
import { scheduleTaskNotifications, cancelTaskNotifications } from "../utils/notifications";
import { GUIDE_TITLES } from "../constants/guides";

export function useTasks({
  updateScreen, setScreens, setHistory,
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

  const toggleTask = useCallback((screenId, markerId, taskId) => {
    let snapshot = null;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const marker = scr.markers.find((m) => m.id === markerId);
      const task = marker && marker.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const willBeDone = !task.done;
      const shouldAward = !!(willBeDone && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
      snapshot = { task, willBeDone, shouldAward };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => m.id === markerId
            ? {
                ...m,
                tasks: m.tasks.map((t) => {
                  if (t.id !== taskId) return t;
                  const nextRepeat = (!willBeDone && t.repeat)
                    ? { ...t.repeat, count: 0 }
                    : t.repeat;
                  return {
                    ...t,
                    done: willBeDone,
                    completedAt: willBeDone ? Date.now() : null,
                    titleAwarded: shouldAward ? true : t.titleAwarded,
                    repeat: nextRepeat,
                  };
                }),
              }
            : m),
        },
      };
    });

    if (snapshot) {
      if (snapshot.willBeDone) cancelTaskNotifications(snapshot.task.id);
      else scheduleTaskNotifications(snapshot.task);
      if (snapshot.shouldAward) bumpGuideProgress(snapshot.task.source);
    }
  }, [setScreens, bumpGuideProgress]);

  const incrementRepeat = useCallback((screenId, markerId, taskId) => {
    let snapshot = null;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const marker = scr.markers.find((m) => m.id === markerId);
      const task = marker && marker.tasks.find((t) => t.id === taskId);
      if (!task || !task.repeat || task.done) return prev;

      const nextCount = Math.min(task.repeat.target, task.repeat.count + 1);
      const willFinish = nextCount >= task.repeat.target;
      const shouldAward = !!(willFinish && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
      snapshot = { task, willFinish, shouldAward };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => m.id === markerId
            ? {
                ...m,
                tasks: m.tasks.map((t) => t.id === taskId
                  ? {
                      ...t,
                      repeat: { ...t.repeat, count: nextCount },
                      done: willFinish,
                      completedAt: willFinish ? (t.completedAt || Date.now()) : null,
                      titleAwarded: shouldAward ? true : t.titleAwarded,
                    }
                  : t),
              }
            : m),
        },
      };
    });

    if (snapshot) {
      if (snapshot.willFinish) cancelTaskNotifications(snapshot.task.id);
      if (snapshot.shouldAward) bumpGuideProgress(snapshot.task.source);
    }
  }, [setScreens, bumpGuideProgress]);

  const decrementRepeat = useCallback((screenId, markerId, taskId) => {
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const marker = scr.markers.find((m) => m.id === markerId);
      const task = marker && marker.tasks.find((t) => t.id === taskId);
      if (!task || !task.repeat) return prev;

      const nextCount = Math.max(0, task.repeat.count - 1);
      const willBeDone = nextCount >= task.repeat.target;

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => m.id === markerId
            ? {
                ...m,
                tasks: m.tasks.map((t) => t.id === taskId
                  ? {
                      ...t,
                      repeat: { ...t.repeat, count: nextCount },
                      done: willBeDone,
                      completedAt: willBeDone ? (t.completedAt || Date.now()) : null,
                    }
                  : t),
              }
            : m),
        },
      };
    });
  }, [setScreens]);

  const deleteTask = useCallback((screenId, markerId, taskId) => {
    cancelTaskNotifications(taskId);
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const marker = scr.markers.find((m) => m.id === markerId);
      const task = marker && marker.tasks.find((t) => t.id === taskId);
      if (marker && task) {
        setHistory((h) => [...h, {
          screenId,
          screenName: scr.name,
          markerId: marker.id,
          markerName: marker.name,
          markerEmoji: marker.emoji,
          markerColor: marker.color,
          task,
          removedAt: Date.now(),
        }]);
      }
      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) => (m.id === markerId
            ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
            : m)),
        },
      };
    });
  }, [setScreens, setHistory]);

  return {
    addTaskCore, toggleTask, incrementRepeat, deleteTask, decrementRepeat
  };
}
