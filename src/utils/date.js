// utils/date.js
export const todayStr = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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

// t — функция перевода; если не передана, фоллбэк на ключи
function formatDiff(diffMs, t) {
  if (diffMs <= 0) return t("common.expired");
  if (diffMs < 60000) return t("common.lessThanMin");

  if (diffMs < 86400000) {
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) return t("common.throughMin", { n: diffMin });
    const diffH = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;

    if (diffMin < 6 * 60) {
      return remMin > 0
        ? t("common.throughHMin", { h: diffH, m: remMin })
        : t("common.throughH", { n: diffH });
    }
    return t("common.throughH", { n: diffH });
  }

  const diffDays = Math.ceil(diffMs / 86400000);
  return diffDays === 1
    ? t("common.throughDay")
    : t("common.throughDays", { n: diffDays });
}

export function formatRemaining(due, t) {
  const tr = t || ((k) => k);
  if (!due) return tr("common.noDeadline");

  if (due.kind === "duration") {
    if (!due.target) return tr("common.noDeadline");
    return formatDiff(due.target - Date.now(), tr);
  }

  const d = toDate(due);
  if (!d) return tr("common.noDeadline");
  return formatDiff(d.getTime() - Date.now(), tr);
}

export function isTaskExpired(task) {
  if (!task || task.done || !task.due) return false;
  const d = toDate(task.due);
  if (!d) return false;
  return d.getTime() - Date.now() <= 0;
}

export function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
