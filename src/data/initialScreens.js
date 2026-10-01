import { nextId } from "../utils/id";
import { todayStr } from "../utils/date";

let DOM_DEFAULT_BG = null;
let MAP_DEFAULT_BG = null;
let NATURE_DEFAULT_BG = null;
try { DOM_DEFAULT_BG = require("../../assets/backgrounds/BG_3.png"); } catch (e) {}
try { MAP_DEFAULT_BG = require("../../assets/backgrounds/BG_4.png"); } catch (e) {}
try { NATURE_DEFAULT_BG = require("../../assets/backgrounds/BG_6.png"); } catch (e) {}

export { DOM_DEFAULT_BG, MAP_DEFAULT_BG, NATURE_DEFAULT_BG };

const NOW = Date.now();

export const initialScreens = {
  main: {
    id: "main",
    emoji: "🗺",
    name: "КАРТА",
    theme: "terrain",
    parentId: null,
    image: MAP_DEFAULT_BG,
    markers: [
      { id: "dom",     name: "Дом",     emoji: "🏠", color: "#E4572E", x: 50, y: 75, linkTo: "home" },
      { id: "job",     name: "Работа",  emoji: "💼", color: "#2D6CDF", x: 20, y: 30 },
      { id: "shop",    name: "Магазин", emoji: "🛒", color: "#00C9A7", x: 75, y: 30 },
      { id: "nature",  name: "Природа", emoji: "🌲", color: "#2ECC71", x: 50, y: 20, linkTo: "nature" },
    ],
    stickers: [],
  },
  home: {
    id: "home",
    emoji: "🏠",
    name: "ДОМ — ДЕЛА",
    theme: "home",
    parentId: "main",
    image: DOM_DEFAULT_BG,
    markers: [
      {
        id: "shopping",
        name: "Покупки",
        emoji: "🛒",
        color: "#2A9D8F",
        type: "home",
        x: 22,
        y: 22,
        tasks: [
          { id: nextId(), title: "Купить газонокосилку", due: null, done: false, notes: [], createdAt: NOW },
        ],
      },
      {
        id: "chores",
        name: "Хозяйство",
        emoji: "🔧",
        color: "#E76F51",
        type: "home",
        x: 28,
        y: 66,
        tasks: [
          { id: nextId(), title: "Полить цветы", due: { date: todayStr(0), time: "19:00", kind: "date" }, done: false, notes: [], createdAt: NOW },
          { id: nextId(), title: "Починить шкаф", due: { date: todayStr(5), time: null, kind: "date" }, done: false, notes: [], createdAt: NOW },
        ],
      },
      {
        id: "study",
        name: "Учёба",
        emoji: "📚",
        color: "#3D5A80",
        type: "study",
        x: 72,
        y: 24,
        tasks: [
          { id: nextId(), title: "Взять книгу «Ассемблер» (1975) — библиотека", due: null, done: false, notes: [], createdAt: NOW },
          { id: nextId(), title: "Дочитать главу по алгоритмам", due: null, done: false, notes: [], createdAt: NOW },
        ],
      },
      { id: "misc", name: "Разное", emoji: "✨", color: "#B08968", type: "general", x: 76, y: 64, tasks: [] },
    ],
    stickers: [],
  },
  nature: {
    id: "nature",
    emoji: "🌲",
    name: "ПРИРОДА — ДЕЛА",
    theme: "nature",
    parentId: "main",
    image: NATURE_DEFAULT_BG,
    markers: [
      { id: "dacha",   name: "Дача",      emoji: "🏡", color: "#2ECC71", type: "home",   x: 30, y: 30, tasks: [] },
      { id: "busstop", name: "Остановка", emoji: "🚏", color: "#3D5A80", type: "travel", x: 70, y: 60, tasks: [] },
    ],
    stickers: [],
  },
};

export function resolveImageSource(img) {
  if (!img) return null;
  return typeof img === "number" ? img : { uri: img };
}