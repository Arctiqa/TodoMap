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
  GENERAL_TASKS,
  HOBBY_TASKS,
} from "./guideTasks";

export const GUIDES = [
  { key: "order",   nameKey: "guide.order.name",   icon: "cleaning-services", color: "#BDEFC9", tasks: ORDER_TASKS },
  { key: "health",  nameKey: "guide.health.name",  icon: "favorite",           color: "#FFD5B0", tasks: HEALTH_TASKS },
  { key: "edu",     nameKey: "guide.edu.name",     icon: "school",             color: "#C8D6F0", tasks: EDU_TASKS },
  { key: "growth",  nameKey: "guide.growth.name",  icon: "trending-up",        color: "#C8E6F0", tasks: GROWTH_TASKS },
  { key: "rest",    nameKey: "guide.rest.name",    icon: "beach-access",       color: "#F0EBC8", tasks: REST_TASKS },
  { key: "travel",  nameKey: "guide.travel.name",  icon: "flight",             color: "#D6F0E0", tasks: TRAVEL_TASKS },
  { key: "social",  nameKey: "guide.social.name",  icon: "groups",             color: "#F0D6D6", tasks: SOCIAL_TASKS },
  { key: "general", nameKey: "guide.general.name", icon: "checklist",          color: "#E8E0D0", tasks: GENERAL_TASKS },
  { key: "spirit",  nameKey: "guide.spirit.name",  icon: "self-improvement",   color: "#D6C8F0", tasks: SPIRIT_TASKS },
  { key: "hobby",   nameKey: "guide.hobby.name",   icon: "palette",            color: "#F0D8E8", tasks: HOBBY_TASKS },
];

export const GUIDE_BY_KEY = Object.fromEntries(GUIDES.map((g) => [g.key, g]));
export const GUIDE_KEYS = GUIDES.map((g) => g.key);

export const GUIDE_META = Object.fromEntries(
  GUIDES.map((g) => [g.key, { nameKey: g.nameKey, icon: g.icon, color: g.color }])
);
