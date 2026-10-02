import {
  allEntries,
  activeEntries,
  expiredEntries,
  doneEntries,
  findEntry,
  findMarker,
  findTask,
} from "../state/selectors";
import { FIELD_MARKER_ID } from "../constants/config";

// Хелпер: строим минимальный screens
function makeTask(id, patch = {}) {
  return {
    id,
    title: `task ${id}`,
    due: null,
    done: false,
    notes: [],
    createdAt: Date.now(),
    ...patch,
  };
}

function makeScreens() {
  return {
    main: {
      id: "main",
      name: "КАРТА",
      emoji: "🗺",
      parentId: null,
      markers: [
        {
          id: "m1",
          name: "Работа",
          emoji: "💼",
          color: "#000",
          x: 50, y: 50,
          tasks: [
            makeTask(1),                                             // active
            makeTask(2, { done: true, completedAt: Date.now() }),    // done
            makeTask(3, { due: { kind: "duration", target: Date.now() - 1000 } }), // expired
          ],
        },
      ],
      stickers: [
        makeTask("st1"),                                             // active стикер
        makeTask("st2", { done: true, completedAt: Date.now() }),    // done стикер
      ],
    },
  };
}

describe("allEntries", () => {
  test("собирает задачи маркеров + стикеры", () => {
    const out = allEntries(makeScreens());
    expect(out).toHaveLength(5);
    const stickerEntries = out.filter((e) => e.markerId === FIELD_MARKER_ID);
    expect(stickerEntries).toHaveLength(2);
    expect(stickerEntries[0].markerName).toBe("Свободное");
  });
});

describe("activeEntries", () => {
  test("только не done и не expired", () => {
    const out = activeEntries(makeScreens());
    const ids = out.map((e) => e.task.id);
    expect(ids).toContain(1);
    expect(ids).toContain("st1");
    expect(ids).not.toContain(2);
    expect(ids).not.toContain(3);
    expect(ids).not.toContain("st2");
  });
});

describe("expiredEntries", () => {
  test("только не done с истёкшим сроком", () => {
    const out = expiredEntries(makeScreens());
    const ids = out.map((e) => e.task.id);
    expect(ids).toEqual([3]);
  });
});

describe("doneEntries", () => {
  test("только done (и задачи, и стикеры)", () => {
    const out = doneEntries(makeScreens());
    const ids = out.map((e) => e.task.id);
    expect(ids).toContain(2);
    expect(ids).toContain("st2");
    expect(ids).toHaveLength(2);
  });
});

describe("findMarker / findTask", () => {
  test("находит маркер по id", () => {
    const m = findMarker(makeScreens(), "main", "m1");
    expect(m.name).toBe("Работа");
  });

  test("null если нет", () => {
    expect(findMarker(makeScreens(), "main", "nope")).toBeNull();
  });

  test("находит задачу в маркере", () => {
    const t = findTask(makeScreens(), "main", "m1", 1);
    expect(t.title).toBe("task 1");
  });

  test("находит стикер через FIELD_MARKER_ID", () => {
    const t = findTask(makeScreens(), "main", FIELD_MARKER_ID, "st1");
    expect(t.title).toBe("task st1");
  });
});

describe("findEntry", () => {
  test("находит задачу маркера", () => {
    const e = findEntry(makeScreens(), { screenId: "main", markerId: "m1", taskId: 1 });
    expect(e.task.title).toBe("task 1");
    expect(e.markerName).toBe("Работа");
  });

  test("находит стикер", () => {
    const e = findEntry(makeScreens(), { screenId: "main", markerId: FIELD_MARKER_ID, taskId: "st1" });
    expect(e.task.title).toBe("task st1");
    expect(e.markerName).toBe("Свободное");
  });

  test("null если нет", () => {
    expect(findEntry(makeScreens(), { screenId: "main", markerId: "m1", taskId: 999 })).toBeNull();
  });
});
