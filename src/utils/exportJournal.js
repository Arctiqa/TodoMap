// utils/exportJournal.js
import { fmtDate } from "./date";

/* ------------------------------------------------------------------
   Собираем плоский список всех дел со статусом и всеми датами
------------------------------------------------------------------ */
export function collectJournalEntries({ screens, historyLog }) {
  const entries = [];

  // Всё, что живёт в полях (активные, выполненные, проваленные)
  Object.values(screens).forEach((scr) => {
    (scr.markers || []).forEach((mk) => {
      (mk.tasks || []).forEach((task) => {
        entries.push({
          screenName: scr.name,
          markerName: mk.name,
          markerEmoji: mk.emoji,
          task,
          removedAt: null,
        });
      });
    });
  });

  // Всё, что в архиве
  (historyLog || []).forEach((h) => {
    entries.push({
      screenName: h.screenName,
      markerName: h.markerName,
      markerEmoji: h.markerEmoji,
      task: h.task,
      removedAt: h.removedAt || null,
    });
  });

  return entries;
}

function statusOf(task, removedAt) {
  if (removedAt) return task.done ? "Выполнено и удалено" : "Удалено";
  if (task.done) return "Выполнено";
  if (task.due) {
    const now = Date.now();
    let dueTime = null;
    if (task.due.kind === "duration" && task.due.target) dueTime = task.due.target;
    else if (task.due.date) {
      const [y, mo, d] = task.due.date.split("-").map(Number);
      const [hh, mm] = (task.due.time || "23:59").split(":").map(Number);
      dueTime = new Date(y, mo - 1, d, hh || 0, mm || 0).getTime();
    } else if (task.due.time) {
      const [hh, mm] = task.due.time.split(":").map(Number);
      const n = new Date();
      dueTime = new Date(n.getFullYear(), n.getMonth(), n.getDate(), hh || 0, mm || 0).getTime();
    }
    if (dueTime && dueTime < now) return "Провалено";
  }
  return "Активно";
}

/* ------------------------------------------------------------------
   JSON — экспорт всех данных
------------------------------------------------------------------ */
export function buildJournalJSON({ screens, historyLog, thoughts, guideProgress }) {
  const data = {
    exportedAt: new Date().toISOString(),
    app: "QuestMap",
    version: 1,
    screens: screens,
    historyLog: historyLog,
    thoughts: thoughts,
    guideProgress: guideProgress,
  };
  return JSON.stringify(data, null, 2);
}

/* ------------------------------------------------------------------
   TXT — человекочитаемый лог
------------------------------------------------------------------ */
export function buildJournalTXT({ screens, historyLog, thoughts }) {
  const entries = collectJournalEntries({ screens, historyLog });

  // Группировка по статусу
  const groups = {
    "Активно": [],
    "Провалено": [],
    "Выполнено": [],
    "Удалено": [],
    "Выполнено и удалено": [],
  };

  entries.forEach((e) => {
    const st = statusOf(e.task, e.removedAt);
    if (!groups[st]) groups[st] = [];
    groups[st].push(e);
  });

  const lines = [];
  lines.push("========================================");
  lines.push("  ЖУРНАЛ QUESTMAP");
  lines.push(`  Экспортировано: ${new Date().toLocaleString("ru-RU")}`);
  lines.push("========================================");
  lines.push("");

  Object.keys(groups).forEach((status) => {
    const list = groups[status];
    if (!list.length) return;
    lines.push(`### ${status.toUpperCase()} (${list.length})`);
    lines.push("");

    // Сортировка по дате последнего события
    list
      .sort((a, b) => {
        const ta = a.removedAt || a.task.completedAt || a.task.createdAt || 0;
        const tb = b.removedAt || b.task.completedAt || b.task.createdAt || 0;
        return tb - ta;
      })
      .forEach((e) => {
        lines.push(`  ${e.markerEmoji} ${e.task.title}`);
        lines.push(`     Поле:   ${e.screenName}`);
        lines.push(`     Метка:  ${e.markerName}`);
        lines.push(`     Создано:    ${fmtDate(e.task.createdAt)}`);
        if (e.task.completedAt) lines.push(`     Выполнено:  ${fmtDate(e.task.completedAt)}`);
        if (e.removedAt)        lines.push(`     Удалено:    ${fmtDate(e.removedAt)}`);
        if (e.task.notes && e.task.notes.length) {
          const doneCount = e.task.notes.filter((n) => n.done).length;
          lines.push(`     Пометки:    ${doneCount}/${e.task.notes.length}`);
          e.task.notes.forEach((n) => {
            lines.push(`        ${n.done ? "[x]" : "[ ]"} ${n.text}`);
          });
        }
        if (e.task.repeat) {
          lines.push(`     Серия:      ${e.task.repeat.count}/${e.task.repeat.target}`);
        }
        lines.push("");
      });
  });

  // Мысли
  if (thoughts && thoughts.length) {
    lines.push("========================================");
    lines.push(`  МЫСЛИ (${thoughts.length})`);
    lines.push("========================================");
    lines.push("");
    thoughts
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .forEach((t) => {
        lines.push(`  ${fmtDate(t.createdAt)}  ${t.text}`);
      });
    lines.push("");
  }

  return lines.join("\n");
}