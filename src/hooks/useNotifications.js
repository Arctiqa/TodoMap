import { useEffect, useRef } from "react";
import {
  requestNotificationPermission,
  scheduleTaskNotifications,
  cancelTaskNotifications,
} from "../utils/notifications";

export function useNotifications({ screens, loaded }) {
  // Запрос разрешения
  useEffect(() => {
    if (!loaded) return;
    requestNotificationPermission();
  }, [loaded]);

  // Множество id задач, для которых уже запланированы уведомления
  const scheduledRef = useRef(new Set());

  // Планирование при загрузке
  useEffect(() => {
    if (!loaded) return;
    const allTasks = [];
    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => {
          if (!t.done && t.due) allTasks.push(t);
        });
      });
    });
    allTasks.forEach((t) => {
      scheduledRef.current.add(t.id);
      scheduleTaskNotifications(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Реакция на изменения screens: перепланирование изменённых, отмена удалённых
  useEffect(() => {
    if (!loaded) return;

    const presentIds = new Set();
    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => {
          presentIds.add(t.id);
        });
      });
    });

    // Отменяем у тех, кого больше нет в screens
    scheduledRef.current.forEach((id) => {
      if (!presentIds.has(id)) {
        cancelTaskNotifications(id);
        scheduledRef.current.delete(id);
      }
    });

    // Перепланируем все активные задачи с due (идемпотентно — scheduleTaskNotifications сам отменяет старые)
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
    });
  }, [loaded, screens]);
}
