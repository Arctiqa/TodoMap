import { useReducer, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "../constants/config";
import { dedupeIds } from "../utils/id";
import { initialScreens } from "../data/initialScreens";

const initialState = {
  screens: initialScreens,
  topLevelOrder: ["main"],
  historyLog: [],
  guideProgress: { proper: 0, joper: 0 },
  guideUsedOffers: [],
  guideTakenCount: { proper: 0, joper: 0 },
  sharedPool: [],
  loaded: false,
};

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

    case "SET_GUIDE_PROGRESS":
      return { ...state, guideProgress: typeof action.value === "function" ? action.value(state.guideProgress) : action.value };

    case "SET_GUIDE_USED_OFFERS":
      return { ...state, guideUsedOffers: typeof action.value === "function" ? action.value(state.guideUsedOffers) : action.value };

    case "SET_GUIDE_TAKEN_COUNT":
      return { ...state, guideTakenCount: typeof action.value === "function" ? action.value(state.guideTakenCount) : action.value };

    case "SET_SHARED_POOL":
      return { ...state, sharedPool: action.value };

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
          if (data.screens) patch.screens = dedupeIds(data.screens);
          if (data.topLevelOrder) patch.topLevelOrder = data.topLevelOrder;
          if (data.historyLog) patch.historyLog = data.historyLog;
          if (data.guideProgress) patch.guideProgress = data.guideProgress;
          if (data.guideUsedOffers) patch.guideUsedOffers = data.guideUsedOffers;
          if (data.guideTakenCount) patch.guideTakenCount = data.guideTakenCount;
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
          guideProgress: state.guideProgress,
          guideUsedOffers: state.guideUsedOffers,
          guideTakenCount: state.guideTakenCount,
        })
      ).catch((e) => console.warn("QuestMap: не удалось сохранить", e));
    }, 400);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [
    state.loaded,
    state.screens,
    state.topLevelOrder,
    state.historyLog,
    state.guideProgress,
    state.guideUsedOffers,
    state.guideTakenCount,
  ]);

  const setScreens = useCallback((value) => dispatch({ type: "SET_SCREENS", value }), []);
  const updateScreen = useCallback((id, fn) => dispatch({ type: "UPDATE_SCREEN", id, fn }), []);
  const setTopLevelOrder = useCallback((value) => dispatch({ type: "SET_TOP_LEVEL_ORDER", value }), []);
  const setHistory = useCallback((value) => dispatch({ type: "SET_HISTORY", value }), []);
  const setGuideProgress = useCallback((value) => dispatch({ type: "SET_GUIDE_PROGRESS", value }), []);
  const setGuideUsedOffers = useCallback((value) => dispatch({ type: "SET_GUIDE_USED_OFFERS", value }), []);
  const setGuideTakenCount = useCallback((value) => dispatch({ type: "SET_GUIDE_TAKEN_COUNT", value }), []);
  const setSharedPool = useCallback((value) => dispatch({ type: "SET_SHARED_POOL", value }), []);

  return {
    state,
    dispatch,
    setScreens,
    updateScreen,
    setTopLevelOrder,
    setHistory,
    setGuideProgress,
    setGuideUsedOffers,
    setGuideTakenCount,
    setSharedPool,
  };
}