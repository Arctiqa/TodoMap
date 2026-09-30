import { useEffect, useRef } from "react";
import {
  requestNotificationPermission,
  scheduleTaskNotifications,
  cancelTaskNotifications,
  cancelAllNotifications,
} from "../utils/notifications";

function sigOf(t) {
  if (t.done || !t.due) return "off";
  return `${t.due.kind || ""}|${t.due.target || ""}|${t.due.date || ""}|${t.due.time || ""}|${t.title || ""}`;
}

export function useNotifications({ screens, loaded, enabled }) {
  const scheduledRef = useRef(new Map()); // id -> signature

  // 1) Запрос разрешения
  useEffect(() => {
    if (!loaded || !enabled) return;
    requestNotificationPermission();
  }, [loaded, enabled]);

  // 2) Выключение — отменяем всё
  useEffect(() => {
    if (enabled) return;
    cancelAllNotifications().catch(() => {});
    scheduledRef.current.clear();
  }, [enabled]);

  // 3) Дифф по id
  useEffect(() => {
    if (!loaded || !enabled) return;

    const map = scheduledRef.current;
    const presentIds = new Set();

    const handle = (t) => {
      presentIds.add(t.id);
      const sig = sigOf(t);
      const prev = map.get(t.id);
      if (prev === sig) return;

      if (t.done || !t.due) {
        cancelTaskNotifications(t.id).catch(() => {});
        map.delete(t.id);
      } else {
        scheduleTaskNotifications(t).catch(() => {});
        map.set(t.id, sig);
      }
    };

    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach(handle);
      });
      (scr.stickers || []).forEach(handle);
    });

    Array.from(map.keys()).forEach((id) => {
      if (!presentIds.has(id)) {
        cancelTaskNotifications(id).catch(() => {});
        map.delete(id);
      }
    });
  }, [loaded, enabled, screens]);
}
