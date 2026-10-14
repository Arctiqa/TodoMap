// data/initialScreens.js
import { nextId } from "../utils/id";

let MAP_DEFAULT_BG = null;
let STAND_DEFAULT_BG = null;
let HOME_DEFAULT_BG = null;

try { MAP_DEFAULT_BG = require("../../assets/backgrounds/BG_3.png"); } catch (e) {}
try { STAND_DEFAULT_BG = require("../../assets/backgrounds/BG_5.png"); } catch (e) {}
try { HOME_DEFAULT_BG = require("../../assets/backgrounds/BG_2.png"); } catch (e) {}

export { MAP_DEFAULT_BG };

export function buildInitialScreens(t) {
  const NOW = Date.now();
  return {
    main: {
      id: "main",
      emoji: "🗺",
      name: t("screen.main"),
      theme: "terrain",
      parentId: null,
      image: MAP_DEFAULT_BG,
      markers: [
        {
          id: "home_door",
          name: t("screen.home"),
          emoji: "🏠",
          color: "#ff6003",
          x: 50,
          y: 75,
          linkTo: "home",
        },
      ],
      stickers: [],
    },

    home: {
      id: "home",
      emoji: "🏠",
      name: t("screen.home"),
      theme: "home",
      parentId: "main",
      image: HOME_DEFAULT_BG,
      markers: [
        {
          id: "order",
          name: t("marker.order"),
          emoji: "🧹",
          color: "#14c257",
          type: "home",
          x: 70,
          y: 40,
          tasks: [
            {
              id: nextId(),
              title: t("task.waterFlowers"),
              due: null,
              done: false,
              notes: [],
              createdAt: NOW,
            },
          ],
        },
      ],
      stickers: [],
    },

    schedule: {
      id: "schedule",
      emoji: "",
      name: t("screen.schedule"),
      theme: "home",
      parentId: null,
      image: STAND_DEFAULT_BG,
      markers: [],
      stickers: [],
    },
  };
}

export function resolveImageSource(img) {
  if (!img) return null;
  return typeof img === "number" ? img : { uri: img };
}
