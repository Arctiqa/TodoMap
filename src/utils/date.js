export const todayStr = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Быстрый парсинг даты — без new Date(строка)
export function toDate(due) {
  if (!due) return null;

  if (due.kind === "duration" && due.target) return new Date(due.target);

  if (due.date) {
    const [y, mo, d] = due.date.split("-").map(Number);
    let h = 23, mi = 59;
    if (due.time) {
      const [hh, mm] = due.time.split(":").map(Number);
      h = hh || 0;
      mi = mm || 0;
    }
    return new Date(y, mo - 1, d, h, mi, 0, 0);
  }

  if (due.time) {
    const [h, m] = due.time.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0, 0, 0);
  }

  return null;
}

export function formatRemaining(due) {
  if (!due) return "без срока";
  if (due.kind === "duration") {
    if (!due.target) return "без срока";
    const diffMs = due.target - Date.now();
    if (diffMs <= 0) return "⏰ истекло";
    if (diffMs < 60000) return "меньше минуты";
    if (diffMs < 86400000) {
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 60) return `через ${diffMin} мин`;
      const diffH = Math.round(diffMin / 60);
      return `через ${diffH} ч`;
    }
    const diffDays = Math.ceil(diffMs / 86400000);
    return diffDays === 1 ? "через 1 день" : `через ${diffDays} дн.`;
  }
  const d = toDate(due);
  if (!d) return "без срока";
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return "⏰ истекло";
  if (diffMs < 60000) return "меньше минуты";
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `через ${diffMin} мин`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `через ${diffH} ч`;
  const diffD = Math.round(diffH / 24);
  return `через ${diffD} дн.`;
}

export function isTaskExpired(task) {
  if (!task || task.done || !task.due) return false;
  const d = toDate(task.due);
  if (!d) return false;
  return d.getTime() - Date.now() <= 0;
}

// Быстрое форматирование — без toLocaleDateString
export function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}