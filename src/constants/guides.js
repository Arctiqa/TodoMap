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

export const GUIDES = [
  {
    key: "order",
    name: "ПОРЯДОК",
    icon: "cleaning-services",
    color: "#BDEFC9",
    tasks: ORDER_TASKS,
  },
  {
    key: "health",
    name: "ЗДОРОВЬЕ",
    icon: "favorite",
    color: "#FFD5B0",
    tasks: HEALTH_TASKS,
  },
  {
    key: "spirit",
    name: "ДУХОВНОСТЬ",
    icon: "self-improvement",
    color: "#D6C8F0",
    tasks: SPIRIT_TASKS,
  },
  {
    key: "growth",
    name: "САМОРАЗВИТИЕ",
    icon: "trending-up",
    color: "#C8E6F0",
    tasks: GROWTH_TASKS,
  },
  {
    key: "social",
    name: "СОЦИУМ",
    icon: "groups",
    color: "#F0D6D6",
    tasks: SOCIAL_TASKS,
  },
  {
    key: "rest",
    name: "ОТДЫХ",
    icon: "beach-access",
    color: "#F0EBC8",
    tasks: REST_TASKS,
  },
  {
    key: "edu",
    name: "ОБРАЗОВАНИЕ",
    icon: "school",
    color: "#C8D6F0",
    tasks: EDU_TASKS,
  },
  {
    key: "travel",
    name: "ПУТЕШЕСТВИЯ",
    icon: "flight",
    color: "#D6F0E0",
    tasks: TRAVEL_TASKS,
  },
];

export const GUIDE_BY_KEY = Object.fromEntries(GUIDES.map((g) => [g.key, g]));
export const GUIDE_KEYS = GUIDES.map((g) => g.key);

export const GUIDE_META = Object.fromEntries(
  GUIDES.map((g) => [g.key, { name: g.name, icon: g.icon, color: g.color }])
);
