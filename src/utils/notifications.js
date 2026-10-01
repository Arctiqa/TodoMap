import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Напоминания о задачах",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
  return true;
}

const REMINDER_OFFSETS = [
  { text: "осталось 24 часа", ms: 24 * 60 * 60 * 1000 },
  { text: "осталось 6 часов", ms: 6 * 60 * 60 * 1000 },
  { text: "остался 1 час", ms: 60 * 60 * 1000 },
];

export async function scheduleTaskNotifications(task) {
  if (!task || task.done || !task.due) {
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
    const [h, m] = task.due.time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    dueTime = d.getTime();
    if (dueTime <= Date.now()) {
      d.setDate(d.getDate() + 1);
      dueTime = d.getTime();
    }
  } else {
    return;
  }

  const now = Date.now();

  for (const offset of REMINDER_OFFSETS) {
    const triggerTime = dueTime - offset.ms;
    if (triggerTime <= now) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: `task_${task.id}_${offset.ms}`,
        content: {
          title: "Напоминание",
          body: `До истечения срока «${task.title}» ${offset.text}`,
          data: { taskId: task.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerTime),
        },
      });
    } catch (e) {
    }
  }
}

export async function cancelTaskNotifications(taskId) {
  if (!taskId) return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `task_${taskId}_`;
  const mine = all.filter((n) => n.identifier && n.identifier.startsWith(prefix));
  for (const n of mine) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
