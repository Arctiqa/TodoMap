import {
  todayStr,
  toDate,
  formatRemaining,
  isTaskExpired,
  fmtDate,
} from "../utils/date";

describe("todayStr", () => {
  test("возвращает сегодня в формате YYYY-MM-DD", () => {
    const s = todayStr(0);
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(s).toBe(expected);
  });

  test("смещение +1 даёт завтра", () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const expected = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    expect(todayStr(1)).toBe(expected);
  });

  test("смещение -1 даёт вчера", () => {
    const t = new Date();
    t.setDate(t.getDate() - 1);
    const expected = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    expect(todayStr(-1)).toBe(expected);
  });
});

describe("toDate", () => {
  test("null → null", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });

  test("duration → Date(target)", () => {
    const target = Date.now() + 1000;
    const d = toDate({ kind: "duration", target });
    expect(d.getTime()).toBe(target);
  });

  test("date без time → 23:59 того дня", () => {
    const d = toDate({ date: "2025-03-15" });
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
  });

  test("date + time → точное время", () => {
    const d = toDate({ date: "2025-03-15", time: "09:30" });
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
  });

  test("time без date → сегодня в это время", () => {
    const d = toDate({ time: "08:00" });
    const now = new Date();
    expect(d.getFullYear()).toBe(now.getFullYear());
    expect(d.getMonth()).toBe(now.getMonth());
    expect(d.getDate()).toBe(now.getDate());
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(0);
  });

  test("пустой объект → null", () => {
    expect(toDate({})).toBeNull();
  });
});

describe("isTaskExpired", () => {
  const base = { id: 1, title: "t" };

  test("done → false", () => {
    expect(isTaskExpired({ ...base, done: true, due: { date: "2000-01-01" } })).toBe(false);
  });

  test("нет due → false", () => {
    expect(isTaskExpired({ ...base, done: false })).toBe(false);
  });

  test("срок в прошлом → true", () => {
    const past = new Date(Date.now() - 60000);
    expect(isTaskExpired({ ...base, done: false, due: { kind: "duration", target: past.getTime() } })).toBe(true);
  });

  test("срок в будущем → false", () => {
    const future = new Date(Date.now() + 60000);
    expect(isTaskExpired({ ...base, done: false, due: { kind: "duration", target: future.getTime() } })).toBe(false);
  });
});

describe("formatRemaining", () => {
  test("null → 'без срока'", () => {
    expect(formatRemaining(null)).toBe("без срока");
  });

  test("duration истёк → '⏰ истекло'", () => {
    expect(formatRemaining({ kind: "duration", target: Date.now() - 1000 })).toBe("⏰ истекло");
  });

  test("duration < 1 мин → 'меньше минуты'", () => {
    expect(formatRemaining({ kind: "duration", target: Date.now() + 30000 })).toBe("меньше минуты");
  });

  test("duration минуты", () => {
    const s = formatRemaining({ kind: "duration", target: Date.now() + 5 * 60000 });
    expect(s).toMatch(/через \d+ мин/);
  });

  test("duration часы", () => {
    const s = formatRemaining({ kind: "duration", target: Date.now() + 3 * 3600000 });
    expect(s).toMatch(/через 2 ч|через 3 ч/);
  });

  test("duration дни", () => {
    const s = formatRemaining({ kind: "duration", target: Date.now() + 5 * 86400000 });
    expect(s).toMatch(/через \d+ дн\./);
  });
});

describe("fmtDate", () => {
  test("формат DD.MM.YYYY", () => {
    const ts = new Date(2025, 2, 15).getTime();
    expect(fmtDate(ts)).toBe("15.03.2025");
  });

  test("пусто → пустая строка", () => {
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(0)).toBe("");
  });
});
