// hooks/useTasks.js
import { useCallback } from "react";
import { nextId } from "../utils/id";
import { scheduleTaskNotifications, cancelTaskNotifications } from "../utils/notifications";

export function useTasks({
  updateScreen, setScreens, setHistory,
  bumpGuideProgress,    // (guideKey, offerId) => void
  releaseGuideTask,     // (offerId) => void
}) {
  // ============================================================
  // Задачи внутри пинов
  // ============================================================

  const addTaskCore = useCallback((screenId, markerId, payload) => {
    const newTask = {
      id: nextId(),
      title: payload.title,
      due: payload.due || null,
      done: false,
      notes: (payload.notes || []).map((t) => (typeof t === "string" ? { text: t, done: false } : t)),
      createdAt: Date.now(),
      source: payload.source || undefined,
      guideOfferId: payload.guideOfferId || undefined,
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
      snapshot = { task, willBeDone };

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
                    repeat: nextRepeat,
                  };
                }),
              }
            : m),
        },
      };
    });

	if (snapshot) {
	  if (snapshot.willBeDone) {
		cancelTaskNotifications(snapshot.task.id);
		if (snapshot.task.source && snapshot.task.guideOfferId) {
		  releaseGuideTask(snapshot.task.guideOfferId);
		  bumpGuideProgress(snapshot.task.source, snapshot.task.guideOfferId);
		}
	  } else {
		scheduleTaskNotifications(snapshot.task);
	  }
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
      snapshot = { task, willFinish };

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
                    }
                  : t),
              }
            : m),
        },
      };
    });

	if (snapshot) {
	  if (snapshot.willFinish) {
		cancelTaskNotifications(snapshot.task.id);
		if (snapshot.task.source && snapshot.task.guideOfferId) {
		  releaseGuideTask(snapshot.task.guideOfferId);
		  bumpGuideProgress(snapshot.task.source, snapshot.task.guideOfferId);
		}
	  }
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
        // если это гидовая задача и она НЕ выполнена — вернуть в список гида
        if (task.source && task.guideOfferId && !task.done) {
          releaseGuideTask(task.guideOfferId);
        }
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
  }, [setScreens, setHistory, releaseGuideTask]);

  // ============================================================
  // Стикеры
  // ============================================================

  const addSticker = useCallback((screenId, payload, x = 50, y = 50) => {
    const newSticker = {
      id: `st_${nextId()}`,
      title: payload.title,
      due: payload.due || null,
      done: false,
      notes: (payload.notes || []).map((t) => (typeof t === "string" ? { text: t, done: false } : t)),
      createdAt: Date.now(),
      source: payload.source || undefined,
      guideOfferId: payload.guideOfferId || undefined,
      repeat: payload.repeat || null,
      x,
      y,
      color: payload.color || null,
    };
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: [...(scr.stickers || []), newSticker],
        },
      };
    });
    scheduleTaskNotifications(newSticker);
    return newSticker.id;
  }, [setScreens]);

  const updateSticker = useCallback((screenId, stickerId, patch) => {
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).map((s) =>
            s.id === stickerId ? { ...s, ...patch } : s
          ),
        },
      };
    });
  }, [setScreens]);

  const updateStickerPosition = useCallback((screenId, stickerId, x, y) => {
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).map((s) =>
            s.id === stickerId ? { ...s, x, y } : s
          ),
        },
      };
    });
  }, [setScreens]);

  const moveStickerToMarker = useCallback((screenId, stickerId, markerId) => {
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
      if (!sticker) return prev;

      const task = {
        id: sticker.id,
        title: sticker.title,
        due: sticker.due || null,
        done: sticker.done || false,
        notes: sticker.notes || [],
        createdAt: sticker.createdAt || Date.now(),
        source: sticker.source || undefined,
        guideOfferId: sticker.guideOfferId || undefined,
        repeat: sticker.repeat || null,
      };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).filter((s) => s.id !== stickerId),
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: [...(m.tasks || []), task] }
              : m
          ),
        },
      };
    });
  }, [setScreens]);

  const moveTaskToField = useCallback((screenId, markerId, taskId, x = 50, y = 50) => {
    cancelTaskNotifications(taskId);
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const marker = scr.markers.find((m) => m.id === markerId);
      const task = marker && marker.tasks.find((t) => t.id === taskId);
      if (!marker || !task) return prev;

      const sticker = {
        id: task.id,
        title: task.title,
        due: task.due || null,
        done: task.done || false,
        notes: task.notes || [],
        createdAt: task.createdAt || Date.now(),
        source: task.source || undefined,
        guideOfferId: task.guideOfferId || undefined,
        repeat: task.repeat || null,
        x,
        y,
        color: null,
      };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
              : m
          ),
          stickers: [...(scr.stickers || []), sticker],
        },
      };
    });
  }, [setScreens]);

  const deleteSticker = useCallback((screenId, stickerId) => {
    cancelTaskNotifications(stickerId);
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
      if (sticker) {
        // если это гидовый стикер и он НЕ выполнен — вернуть в список гида
        if (sticker.source && sticker.guideOfferId && !sticker.done) {
          releaseGuideTask(sticker.guideOfferId);
        }
        setHistory((h) => [...h, {
          screenId,
          screenName: scr.name,
          markerId: null,
          markerName: "Свободное",
          markerEmoji: scr.emoji || "📌",
          markerColor: "#B08968",
          task: {
            id: sticker.id,
            title: sticker.title,
            due: sticker.due || null,
            done: sticker.done || false,
            notes: sticker.notes || [],
            createdAt: sticker.createdAt || Date.now(),
            completedAt: sticker.done ? Date.now() : null,
            source: sticker.source || undefined,
            guideOfferId: sticker.guideOfferId || undefined,
            repeat: sticker.repeat || null,
          },
          removedAt: Date.now(),
        }]);
      }
      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).filter((s) => s.id !== stickerId),
        },
      };
    });
  }, [setScreens, setHistory, releaseGuideTask]);

  const toggleSticker = useCallback((screenId, stickerId) => {
    let snapshot = null;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
      if (!sticker) return prev;

      const willBeDone = !sticker.done;
      snapshot = { sticker, willBeDone };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).map((s) => {
            if (s.id !== stickerId) return s;
            return {
              ...s,
              done: willBeDone,
              completedAt: willBeDone ? Date.now() : null,
            };
          }),
        },
      };
    });

	if (snapshot) {
	  if (snapshot.willBeDone) {
		cancelTaskNotifications(snapshot.sticker.id);
		if (snapshot.sticker.source && snapshot.sticker.guideOfferId) {
		  releaseGuideTask(snapshot.sticker.guideOfferId);
		  bumpGuideProgress(snapshot.sticker.source, snapshot.sticker.guideOfferId);
		}
	  } else {
		scheduleTaskNotifications(snapshot.sticker);
	  }
	}
  }, [setScreens, bumpGuideProgress]);

  const incrementStickerRepeat = useCallback((screenId, stickerId) => {
    let snapshot = null;
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
      if (!sticker || !sticker.repeat || sticker.done) return prev;

      const nextCount = Math.min(sticker.repeat.target, sticker.repeat.count + 1);
      const willFinish = nextCount >= sticker.repeat.target;
      snapshot = { sticker, willFinish };

      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).map((s) => s.id === stickerId
            ? {
                ...s,
                repeat: { ...s.repeat, count: nextCount },
                done: willFinish,
                completedAt: willFinish ? (s.completedAt || Date.now()) : null,
              }
            : s),
        },
      };
    });

	if (snapshot) {
	  if (snapshot.willFinish) {
		cancelTaskNotifications(snapshot.sticker.id);
		if (snapshot.sticker.source && snapshot.sticker.guideOfferId) {
		  releaseGuideTask(snapshot.sticker.guideOfferId);
		  bumpGuideProgress(snapshot.sticker.source, snapshot.sticker.guideOfferId);
		}
	  }
	}
  }, [setScreens, bumpGuideProgress]);

  const decrementStickerRepeat = useCallback((screenId, stickerId) => {
    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
      if (!sticker || !sticker.repeat) return prev;

      const nextCount = Math.max(0, sticker.repeat.count - 1);
      const willBeDone = nextCount >= sticker.repeat.target;

      return {
        ...prev,
        [screenId]: {
          ...scr,
          stickers: (scr.stickers || []).map((s) => s.id === stickerId
            ? {
                ...s,
                repeat: { ...s.repeat, count: nextCount },
                done: willBeDone,
                completedAt: willBeDone ? (s.completedAt || Date.now()) : null,
              }
            : s),
        },
      };
    });
  }, [setScreens]);

  const moveStickerToField = useCallback((fromScreenId, stickerId, toScreenId, x = 50, y = 50) => {
    cancelTaskNotifications(stickerId);
    setScreens((prev) => {
      const from = prev[fromScreenId];
      const to = prev[toScreenId];
      if (!from || !to) return prev;

      const sticker = (from.stickers || []).find((s) => s.id === stickerId);
      if (!sticker) return prev;

      const moved = { ...sticker, x, y };

      return {
        ...prev,
        [fromScreenId]: {
          ...from,
          stickers: (from.stickers || []).filter((s) => s.id !== stickerId),
        },
        [toScreenId]: {
          ...to,
          stickers: [...(to.stickers || []), moved],
        },
      };
    });
  }, [setScreens]);

  return {
    // задачи внутри пинов
    addTaskCore,
    toggleTask,
    incrementRepeat,
    decrementRepeat,
    deleteTask,
    // стикеры
    addSticker,
    updateSticker,
    updateStickerPosition,
    moveStickerToMarker,
    moveStickerToField,
    moveTaskToField,
    deleteSticker,
    toggleSticker,
    incrementStickerRepeat,
    decrementStickerRepeat,
  };
}
