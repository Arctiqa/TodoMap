import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Как показывать уведомление, когда оно сработало
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Запрос разрешения у пользователя (один раз)
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  // Android требует канал для уведомлений
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Напоминания о задачах",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
  return true;
}

// Точки напоминаний
const REMINDER_OFFSETS = [
  { text: "осталось 24 часа", ms: 24 * 60 * 60 * 1000 },
  { text: "осталось 6 часов", ms: 6 * 60 * 60 * 1000 },
  { text: "остался 1 час", ms: 60 * 60 * 1000 },
];

// Запланировать напоминания для одной задачи
export async function scheduleTaskNotifications(task) {
  if (__DEV__) console.warn(`[notif] Вызов для "${task?.title}", due=${JSON.stringify(task?.due)}`);

  if (!task || task.done || !task.due) {
    if (__DEV__) console.warn(`[notif] Пропуск: task=${!!task}, done=${task?.done}, due=${!!task?.due}`);
    return;
  }

  await cancelTaskNotifications(task.id);

  let dueTime;
  if (task.due.kind === "duration" && task.due.target) {
    dueTime = task.due.target;
  } else if (task.due.date && task.due.time) {
    dueTime = new Date(`${task.due.date}T${task.due.time}`).getTime();
  } else if (task.due.date) {
    dueTime = new Date(`${task.due.date}T23:59:00`).getTime();
  } else if (task.due.time) {
    // Только время — сегодня в это время
    const [h, m] = task.due.time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    dueTime = d.getTime();

    // Если время уже прошло сегодня — переносим на завтра
    if (dueTime <= Date.now()) {
      d.setDate(d.getDate() + 1);
      dueTime = d.getTime();
    }
  } else {
    if (__DEV__) console.warn(`[notif] Не могу вычислить dueTime для "${task.title}"`);
    return;
  }

  const now = Date.now();
  if (__DEV__) console.warn(`[notif] dueTime=${new Date(dueTime).toISOString()}, now=${new Date(now).toISOString()}`);

  for (const offset of REMINDER_OFFSETS) {
    const triggerTime = dueTime - offset.ms;
    if (triggerTime <= now) {
      if (__DEV__) console.warn(`[notif] Пропуск ${offset.text} (уже в прошлом)`);
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `task_${task.id}_${offset.ms}`,
      content: {
        title: "⏰ Напоминание",
        body: `До истечения срока «${task.title}» ${offset.text}`,
        data: { taskId: task.id },
      },
      trigger: { type: "date", date: new Date(triggerTime) },
    });
    if (__DEV__) console.warn(`[notif] Запланировано для "${task.title}" — ${offset.text}`);
  }
}

// Отменить все напоминания для задачи (при выполнении или удалении)
export async function cancelTaskNotifications(taskId) {
  if (!taskId) return;

  const all = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `task_${taskId}_`;
  const mine = all.filter((n) => n.identifier && n.identifier.startsWith(prefix));

  if (__DEV__) console.warn(`[notifications] Отменяю ${mine.length} уведомлений для задачи ${taskId}`);

  for (const n of mine) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}