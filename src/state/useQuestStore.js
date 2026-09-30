// state/useQuestStore.js
import { useReducer, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "../constants/config";
import { GUIDE_KEYS } from "../constants/guides";
import { dedupeIds } from "../utils/id";
import { initialScreens } from "../data/initialScreens";

// ---------- Начальные счётчики по всем гидам ----------
function emptyGuideCounts() {
  return Object.fromEntries(GUIDE_KEYS.map((k) => [k, 0]));
}

// ---------- Миграция сохранённых счётчиков под текущий набор гидов ----------
function mergeGuideCounts(saved) {
  const out = emptyGuideCounts();
  if (saved && typeof saved === "object") {
    Object.keys(out).forEach((k) => {
      if (typeof saved[k] === "number" && Number.isFinite(saved[k])) {
        out[k] = saved[k];
      }
    });
  }
  return out;
}

// ---------- Миграция массива id офферов (строки, уникальные) ----------
function mergeOfferIds(saved) {
  if (!Array.isArray(saved)) return [];
  const seen = new Set();
  const out = [];
  saved.forEach((id) => {
    if (typeof id === "string" && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  });
  return out;
}

const initialState = {
  screens: initialScreens,
  topLevelOrder: ["main"],
  historyLog: [],
  thoughts: [],
  guideProgress: emptyGuideCounts(),
  guideUsedOffers: [],        // id задач, взятых и ещё не выполненных
  guideCompletedOffers: [],   // id задач, за которые уже засчитан прогресс
  sharedPool: [],
  loaded: false,
};

function ensureStickers(screensObj) {
  const result = {};
  Object.entries(screensObj).forEach(([key, scr]) => {
    result[key] = {
      ...scr,
      markers: scr.markers || [],
      stickers: Array.isArray(scr.stickers) ? scr.stickers : [],
    };
  });
  return result;
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, loaded: true };

    case "SET_SCREENS":
      return { ...state, screens: typeof action.value === "function" ? action.value(state.screens) : action.value };

    case "UPDATE_SCREEN":
      return {
        ...state,
        screens: { ...state.screens, [action.id]: action.fn(state.screens[action.id]) },
      };

    case "SET_TOP_LEVEL_ORDER":
      return { ...state, topLevelOrder: typeof action.value === "function" ? action.value(state.topLevelOrder) : action.value };

    case "SET_HISTORY":
      return { ...state, historyLog: typeof action.value === "function" ? action.value(state.historyLog) : action.value };

    case "SET_THOUGHTS":
      return { ...state, thoughts: typeof action.value === "function" ? action.value(state.thoughts) : action.value };

    case "SET_GUIDE_PROGRESS":
      return { ...state, guideProgress: typeof action.value === "function" ? action.value(state.guideProgress) : action.value };

    case "SET_GUIDE_USED_OFFERS":
      return { ...state, guideUsedOffers: typeof action.value === "function" ? action.value(state.guideUsedOffers) : action.value };

    case "SET_GUIDE_COMPLETED_OFFERS":
      return { ...state, guideCompletedOffers: typeof action.value === "function" ? action.value(state.guideCompletedOffers) : action.value };

    case "SET_SHARED_POOL":
      return { ...state, sharedPool: typeof action.value === "function" ? action.value(state.sharedPool) : action.value };

    default:
      return state;
  }
}

export function useQuestStore() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const patch = {};
          if (data.screens) patch.screens = ensureStickers(dedupeIds(data.screens));
          if (data.topLevelOrder) patch.topLevelOrder = data.topLevelOrder;
          if (data.historyLog) patch.historyLog = data.historyLog;
          if (data.thoughts) patch.thoughts = data.thoughts;

          // --- миграция гидов под текущий набор ---
          if (data.guideProgress) patch.guideProgress = mergeGuideCounts(data.guideProgress);
          patch.guideUsedOffers = mergeOfferIds(data.guideUsedOffers);
          patch.guideCompletedOffers = mergeOfferIds(data.guideCompletedOffers);

          if (data.sharedPool) patch.sharedPool = data.sharedPool;
          dispatch({ type: "HYDRATE", payload: patch });
        } else {
          dispatch({ type: "HYDRATE", payload: {} });
        }
      } catch (e) {
        console.warn("QuestMap: не удалось загрузить состояние", e);
        dispatch({ type: "HYDRATE", payload: {} });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          screens: state.screens,
          topLevelOrder: state.topLevelOrder,
          historyLog: state.historyLog,
          thoughts: state.thoughts,
          guideProgress: state.guideProgress,
          guideUsedOffers: state.guideUsedOffers,
          guideCompletedOffers: state.guideCompletedOffers,
          sharedPool: state.sharedPool,
        })
      ).catch((e) => console.warn("QuestMap: не удалось сохранить", e));
    }, 400);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [
    state.loaded,
    state.screens,
    state.topLevelOrder,
    state.historyLog,
    state.thoughts,
    state.guideProgress,
    state.guideUsedOffers,
    state.guideCompletedOffers,
    state.sharedPool,
  ]);

  const setScreens = useCallback((value) => dispatch({ type: "SET_SCREENS", value }), []);
  const updateScreen = useCallback((id, fn) => dispatch({ type: "UPDATE_SCREEN", id, fn }), []);
  const setTopLevelOrder = useCallback((value) => dispatch({ type: "SET_TOP_LEVEL_ORDER", value }), []);
  const setHistory = useCallback((value) => dispatch({ type: "SET_HISTORY", value }), []);
  const setThoughts = useCallback((value) => dispatch({ type: "SET_THOUGHTS", value }), []);
  const setGuideProgress = useCallback((value) => dispatch({ type: "SET_GUIDE_PROGRESS", value }), []);
  const setGuideUsedOffers = useCallback((value) => dispatch({ type: "SET_GUIDE_USED_OFFERS", value }), []);
  const setGuideCompletedOffers = useCallback((value) => dispatch({ type: "SET_GUIDE_COMPLETED_OFFERS", value }), []);
  const setSharedPool = useCallback((value) => dispatch({ type: "SET_SHARED_POOL", value }), []);

  return {
    state,
    dispatch,
    setScreens,
    updateScreen,
    setTopLevelOrder,
    setHistory,
    setThoughts,
    setGuideProgress,
    setGuideUsedOffers,
    setGuideCompletedOffers,
    setSharedPool,
  };
}
