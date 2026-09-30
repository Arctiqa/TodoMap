// constants/guides.js
import {
  ORDER_TASKS,
  HEALTH_TASKS,
  SPIRIT_TASKS,
  GROWTH_TASKS,
  SOCIAL_TASKS,
  REST_TASKS,
  EDU_TASKS,
  TRAVEL_TASKS,
} from "./guideTasks";

// ---------- Заглушка титулов (тиры 1/5/10/20/30) ----------
const DEFAULT_TITLES = {
  1:  { name: "Новичок",  emoji: "🌱", desc: "Первый шаг сделан." },
  5:  { name: "Ученик",   emoji: "📗", desc: "Ты втянулся." },
  10: { name: "Практик",  emoji: "⚙️", desc: "Уже что-то умеешь." },
  20: { name: "Мастер",   emoji: "🎖", desc: "Серьёзный уровень." },
  30: { name: "Гуру",     emoji: "👑", desc: "Достиг вершины." },
};

export const GUIDES = [
  {
    key: "order",
    name: "ПОРЯДОК",
    icon: "cleaning-services",
    color: "#BDEFC9",
    tasks: ORDER_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "health",
    name: "ЗДОРОВЬЕ",
    icon: "favorite",
    color: "#FFD5B0",
    tasks: HEALTH_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "spirit",
    name: "ДУХОВНОСТЬ",
    icon: "self-improvement",
    color: "#D6C8F0",
    tasks: SPIRIT_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "growth",
    name: "САМОРАЗВИТИЕ",
    icon: "trending-up",
    color: "#C8E6F0",
    tasks: GROWTH_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "social",
    name: "СОЦИУМ",
    icon: "groups",
    color: "#F0D6D6",
    tasks: SOCIAL_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "rest",
    name: "ОТДЫХ",
    icon: "beach-access",
    color: "#F0EBC8",
    tasks: REST_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "edu",
    name: "ОБРАЗОВАНИЕ",
    icon: "school",
    color: "#C8D6F0",
    tasks: EDU_TASKS,
    titles: DEFAULT_TITLES,
  },
  {
    key: "travel",
    name: "ПУТЕШЕСТВИЯ",
    icon: "flight",
    color: "#D6F0E0",
    tasks: TRAVEL_TASKS,
    titles: DEFAULT_TITLES,
  },
];

// ---------- Производные ----------
export const GUIDE_BY_KEY = Object.fromEntries(GUIDES.map((g) => [g.key, g]));
export const GUIDE_KEYS = GUIDES.map((g) => g.key);

export const GUIDE_META = Object.fromEntries(
  GUIDES.map((g) => [g.key, { name: g.name, icon: g.icon, color: g.color }])
);

export const GUIDE_TITLES = Object.fromEntries(
  GUIDES.map((g) => [g.key, g.titles])
);
