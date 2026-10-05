// hooks/useTasks.js
import { useCallback } from "react";
import { nextId } from "../utils/id";
import { logEvent } from "../utils/analytics";

export function useTasks({
  screens,
  updateScreen, setScreens, setHistory,
  markGuideCompleted,
  releaseGuideTask,
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
      color: payload.color || null,
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
  }, [setScreens]);

  const toggleTask = useCallback((screenId, markerId, taskId) => {
    const scr = screens[screenId];
    if (!scr) return;
    const marker = scr.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const willBeDone = !task.done;

    if (willBeDone && task.source && task.guideOfferId) {
      releaseGuideTask(task.guideOfferId);
      markGuideCompleted(task.source, task.guideOfferId);
    }

    if (willBeDone) {
      const timeToComplete = Date.now() - (task.createdAt || Date.now());
      logEvent("task_completed", {
        markerId,
        timeToCompleteMs: timeToComplete,
        hasRepeat: !!task.repeat,
        hasNotes: (task.notes || []).length > 0,
        notesCount: (task.notes || []).length,
      });
    }

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          markers: s.markers.map((m) => m.id === markerId
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
  }, [screens, setScreens, markGuideCompleted, releaseGuideTask]);

  const incrementRepeat = useCallback((screenId, markerId, taskId) => {
    const scr = screens[screenId];
    if (!scr) return;
    const marker = scr.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task || !task.repeat || task.done) return;

    const nextCount = Math.min(task.repeat.target, task.repeat.count + 1);
    const willFinish = nextCount >= task.repeat.target;

    if (willFinish && task.source && task.guideOfferId) {
      releaseGuideTask(task.guideOfferId);
      markGuideCompleted(task.source, task.guideOfferId);
    }

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          markers: s.markers.map((m) => m.id === markerId
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
  }, [screens, setScreens, markGuideCompleted, releaseGuideTask]);

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
    // Читаем актуальный стейт, побочки наружу
    const scr = screens[screenId];
    if (!scr) return;
    const marker = scr.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!marker || !task) return;

    // Если задача ещё активная и гид-задача — освобождаем слот
    // (если выполнена — ничего не делаем, id остаётся в completedOffers,
    //  но взятие больше не блокируется, т.к. taken=false)
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

    if (task) {
      logEvent("task_deleted", {
        wasDone: !!task.done,
        wasExpired: !task.done && task.due != null,
        ageMs: Date.now() - (task.createdAt || Date.now()),
      });
    }

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          markers: s.markers.map((m) => (m.id === markerId
            ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
            : m)),
        },
      };
    });
  }, [screens, setScreens, setHistory, releaseGuideTask]);

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
      rotation: Math.random() * 10 - 5,
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
        completedAt: sticker.completedAt || null,
        notes: sticker.notes || [],
        createdAt: sticker.createdAt || Date.now(),
        source: sticker.source || undefined,
        guideOfferId: sticker.guideOfferId || undefined,
        repeat: sticker.repeat || null,
        color: sticker.color || null,
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
        completedAt: task.completedAt || null,
        notes: task.notes || [],
        createdAt: task.createdAt || Date.now(),
        source: task.source || undefined,
        guideOfferId: task.guideOfferId || undefined,
        repeat: task.repeat || null,
        x,
        y,
        color: task.color || null,
        rotation: Math.random() * 10 - 5,
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
    const scr = screens[screenId];
    if (!scr) return;
    const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
    if (!sticker) return;

    if (sticker.source && sticker.guideOfferId && !sticker.done) {
      releaseGuideTask(sticker.guideOfferId);
    }

    logEvent("task_deleted", {
      where: "sticker",
      viaTrash: true,
      screenId,
      stickerId,
      wasDone: !!sticker.done,
      wasExpired: !sticker.done && sticker.due != null,
      ageMs: Date.now() - (sticker.createdAt || Date.now()),
    });

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
        color: sticker.color || null,
        rotation: sticker.rotation || 0,
      },
      removedAt: Date.now(),
    }]);

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          stickers: (s.stickers || []).filter((s2) => s2.id !== stickerId),
        },
      };
    });
  }, [screens, setScreens, setHistory, releaseGuideTask]);

  const toggleSticker = useCallback((screenId, stickerId) => {
    const scr = screens[screenId];
    if (!scr) return;
    const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
    if (!sticker) return;

    const willBeDone = !sticker.done;

    if (willBeDone && sticker.source && sticker.guideOfferId) {
      releaseGuideTask(sticker.guideOfferId);
      markGuideCompleted(sticker.source, sticker.guideOfferId);
    }

    if (willBeDone) {
      logEvent("task_completed", {
        where: "sticker",
        screenId,
        stickerId,
        timeToCompleteMs: Date.now() - (sticker.createdAt || Date.now()),
        hasRepeat: !!sticker.repeat,
        hasNotes: (sticker.notes || []).length > 0,
        notesCount: (sticker.notes || []).length,
      });
    }

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          stickers: (s.stickers || []).map((x) => {
            if (x.id !== stickerId) return x;
            return {
              ...x,
              done: willBeDone,
              completedAt: willBeDone ? Date.now() : null,
            };
          }),
        },
      };
    });
  }, [screens, setScreens, markGuideCompleted, releaseGuideTask]);

  const incrementStickerRepeat = useCallback((screenId, stickerId) => {
    const scr = screens[screenId];
    if (!scr) return;
    const sticker = (scr.stickers || []).find((s) => s.id === stickerId);
    if (!sticker || !sticker.repeat || sticker.done) return;

    const nextCount = Math.min(sticker.repeat.target, sticker.repeat.count + 1);
    const willFinish = nextCount >= sticker.repeat.target;

    if (willFinish && sticker.source && sticker.guideOfferId) {
      releaseGuideTask(sticker.guideOfferId);
      markGuideCompleted(sticker.source, sticker.guideOfferId);
    }

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;
      return {
        ...prev,
        [screenId]: {
          ...s,
          stickers: (s.stickers || []).map((x) => x.id === stickerId
            ? {
                ...x,
                repeat: { ...x.repeat, count: nextCount },
                done: willFinish,
                completedAt: willFinish ? (x.completedAt || Date.now()) : null,
              }
            : x),
        },
      };
    });
  }, [screens, setScreens, markGuideCompleted, releaseGuideTask]);

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
    addTaskCore,
    toggleTask,
    incrementRepeat,
    decrementRepeat,
    deleteTask,
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
