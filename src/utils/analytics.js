import AsyncStorage from "@react-native-async-storage/async-storage";

// Ключи хранилища
const EVENTS_KEY = "questmap_events_v2";       // новая версия формата
const USER_ID_KEY = "questmap_user_id_v1";
const SESSION_KEY = "questmap_session_v1";
const FIRST_OPEN_KEY = "questmap_first_open_v1";

// Максимум событий в очереди
const MAX_EVENTS = 5000;
// Сколько событий отправляем за раз
const BATCH_SIZE = 50;

const ANALYTICS_ENDPOINT = "https://abc123-xyz.ngrok-free.app/api/logs";

// Идентификаторы
function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let cachedUserId = null;
export async function getUserId() {
  if (cachedUserId) return cachedUserId;
  try {
    let id = await AsyncStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = `u_${uid()}`;
      await AsyncStorage.setItem(USER_ID_KEY, id);
    }
    cachedUserId = id;
    return id;
  } catch {
    return "u_unknown";
  }
}

let cachedSessionId = null;
export function getSessionId() {
  if (!cachedSessionId) cachedSessionId = `s_${uid()}`;
  return cachedSessionId;
}

export async function getFirstOpenAt() {
  try {
    const raw = await AsyncStorage.getItem(FIRST_OPEN_KEY);
    if (raw) return Number(raw);
    const now = Date.now();
    await AsyncStorage.setItem(FIRST_OPEN_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

// Формат события: { name, props, ts, sessionId, userId, sent: false }
let pendingBuffer = [];
let flushTimer = null;
let flushing = false;

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue) {
  try {
    const trimmed = queue.length > MAX_EVENTS
      ? queue.slice(queue.length - MAX_EVENTS)
      : queue;
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("QuestMap analytics: write failed", e);
  }
}

// Отправить массив событий на сервер.

async function sendToServer(events) {
  if (!events.length) return true;
  try {
    const res = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Основной flush:
 *   1. Сначала пробуем отправить уже накопленную очередь (неотправленные).
 *   2. Потом добавляем новые события из буфера памяти.
 *   3. Пытаемся отправить их батчами.
 *   4. Помечаем успешно отправленные как sent: true.
 *   5. Оставляем неотправленные в очереди для следующей попытки.
 */
async function flush() {
  if (flushing) return;
  if (pendingBuffer.length === 0) {
    // даже если буфер пуст, можем попробовать переотправить накопленное
  }
  flushing = true;
  try {
    const toSend = pendingBuffer;
    pendingBuffer = [];

    // 1. Читаем существующую очередь
    let queue = await readQueue();

    // 2. Добавляем новые события из памяти
    queue = [...queue, ...toSend];

    // 3. Обрезаем, если слишком много
    if (queue.length > MAX_EVENTS) {
      queue = queue.slice(queue.length - MAX_EVENTS);
    }

    // 4. Берём неотправленные для попытки
    const unsent = queue.filter((e) => !e.sent);
    if (unsent.length > 0) {
      // Отправляем батчами
      for (let i = 0; i < unsent.length; i += BATCH_SIZE) {
        const batch = unsent.slice(i, i + BATCH_SIZE);
        const ok = await sendToServer(batch);
        if (ok) {
          // Помечаем успешно отправленные
          const ids = new Set(batch.map((e) => e.id));
          queue = queue.map((e) =>
            ids.has(e.id) ? { ...e, sent: true } : e
          );
          console.log(`QuestMap: sent ${batch.length} events`);
        } else {
          console.warn("QuestMap: server unreachable, keeping events in queue");
          break; // не пытаемся остальные батчи, если сервер лежит
        }
      }
    }

    // 5. Удаляем уже отправленные (оставляем только неотправленные + свежие)
    //    чтобы не раздувать хранилище
    const unsentAfter = queue.filter((e) => !e.sent);
    // Оставляем неотправленные. Отправленные можно удалить, если очередь большая.
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const cleaned = queue.filter((e) => !e.sent || e.ts > dayAgo);

    await writeQueue(cleaned);
  } catch (e) {
    console.warn("QuestMap analytics: flush error", e);
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 1000);
}

// Публичный API
export async function logEvent(name, props = {}) {
  try {
    const userId = await getUserId();
    const event = {
      id: uid(),
      name,
      props,
      ts: Date.now(),
      sessionId: getSessionId(),
      userId,
      sent: false,
    };
    pendingBuffer.push(event);
    scheduleFlush();
  } catch {
    // analytics never breaks the app
  }
}

export async function getEvents() {
  if (pendingBuffer.length > 0) {
    await flush();
  }
  return readQueue();
}

export async function clearEvents() {
  try {
    pendingBuffer = [];
    await AsyncStorage.removeItem(EVENTS_KEY);
  } catch {}
}

export async function retryPending() {
  await flush();
}

// Сводка
export async function getSummary() {
  const events = await getEvents();
  if (events.length === 0) {
    return {
      totalEvents: 0, uniqueDays: 0, sessionsCount: 0,
      firstOpenAt: null, lastEventAt: null,
      byName: {}, dailyCounts: {},
    };
  }
  const byName = {};
  const dailyCounts = {};
  const sessions = new Set();
  let firstAt = null;
  let lastAt = null;
  events.forEach((e) => {
    byName[e.name] = (byName[e.name] || 0) + 1;
    const day = new Date(e.ts).toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    if (e.sessionId) sessions.add(e.sessionId);
    if (firstAt === null || e.ts < firstAt) firstAt = e.ts;
    if (lastAt === null || e.ts > lastAt) lastAt = e.ts;
  });
  return {
    totalEvents: events.length,
    uniqueDays: Object.keys(dailyCounts).length,
    sessionsCount: sessions.size,
    firstOpenAt: firstAt,
    lastEventAt: lastAt,
    byName,
    dailyCounts,
  };
}

export async function exportEvents() {
  const events = await getEvents();
  return JSON.stringify({ exportedAt: Date.now(), events }, null, 2);
}

// Хелперы
export async function logSessionStart() {
  await logEvent("session_start", {});
}
export async function logSessionEnd() {
  await logEvent("session_end", {});
}
