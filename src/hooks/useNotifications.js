import { useEffect } from "react";
import {
  requestNotificationPermission,
  scheduleTaskNotifications,
} from "../utils/notifications";

export function useNotifications({ screens, loaded }) {
  // Запрос разрешения
  useEffect(() => {
    if (!loaded) return;
    requestNotificationPermission();
  }, [loaded]);

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
    allTasks.forEach(scheduleTaskNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
}
