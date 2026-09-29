import { useEffect, useRef } from "react";
import {
  requestNotificationPermission,
  scheduleTaskNotifications,
  cancelTaskNotifications,
  cancelAllNotifications,
} from "../utils/notifications";

export function useNotifications({ screens, loaded, enabled }) {
  const scheduledRef = useRef(new Set());

  // Запрос разрешения
  useEffect(() => {
    if (!loaded || !enabled) return;
    requestNotificationPermission();
  }, [loaded, enabled]);

  // При выключении — отменяем всё
  useEffect(() => {
    if (enabled) return;
    cancelAllNotifications().catch(() => {});
    scheduledRef.current.clear();
  }, [enabled]);

  // Планирование при загрузке
  useEffect(() => {
    if (!loaded || !enabled) return;
    const allTasks = [];
    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => {
          if (!t.done && t.due) allTasks.push(t);
        });
      });
      (scr.stickers || []).forEach((t) => {
        if (!t.done && t.due) allTasks.push(t);
      });
    });
    allTasks.forEach((t) => {
      scheduledRef.current.add(t.id);
      scheduleTaskNotifications(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, enabled]);

  // Реакция на изменения screens
  useEffect(() => {
    if (!loaded || !enabled) return;

    const presentIds = new Set();
    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => presentIds.add(t.id));
      });
      (scr.stickers || []).forEach((t) => presentIds.add(t.id));
    });

    scheduledRef.current.forEach((id) => {
      if (!presentIds.has(id)) {
        cancelTaskNotifications(id);
        scheduledRef.current.delete(id);
      }
    });

    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => {
          if (!t.done && t.due) {
            scheduledRef.current.add(t.id);
            scheduleTaskNotifications(t);
          } else if (t.done) {
            if (scheduledRef.current.has(t.id)) {
              cancelTaskNotifications(t.id);
              scheduledRef.current.delete(t.id);
            }
          }
        });
      });
      (scr.stickers || []).forEach((t) => {
        if (!t.done && t.due) {
          scheduledRef.current.add(t.id);
          scheduleTaskNotifications(t);
        } else if (t.done) {
          if (scheduledRef.current.has(t.id)) {
            cancelTaskNotifications(t.id);
            scheduledRef.current.delete(t.id);
          }
        }
      });
    });
  }, [loaded, enabled, screens]);
}
