import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SHARE_API, SHARE_POOL_KEY } from "../constants/config";

export function useSharedPool({ setSharedPool }) {
  const load = useCallback(async () => {
    if (SHARE_API.baseUrl) {
      try {
        const res = await fetch(`${SHARE_API.baseUrl}/pool`);
        setSharedPool(await res.json());
        return;
      } catch (e) {
        console.warn("QuestMap: сервер недоступен", e);
      }
    }
    try {
      const raw = await AsyncStorage.getItem(SHARE_POOL_KEY);
      const items = raw ? JSON.parse(raw) : [];
      const groups = {};
      items.forEach((it) => {
        const key = (it.title || "").trim().toLowerCase();
        if (!key) return;
        if (!groups[key]) groups[key] = { title: it.title, due: it.due, count: 0 };
        groups[key].count += 1;
        groups[key].due = it.due;
      });
      setSharedPool(Object.values(groups));
    } catch (e) {
      console.warn("QuestMap: пул не загрузился", e);
      setSharedPool([]);
    }
  }, [setSharedPool]);

  const share = useCallback(async (title, due) => {
    if (SHARE_API.baseUrl) {
      try {
        await fetch(`${SHARE_API.baseUrl}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, due }),
        });
        return;
      } catch (e) {
        console.warn("QuestMap: сервер недоступен, сохраняю локально", e);
      }
    }
    try {
      const raw = await AsyncStorage.getItem(SHARE_POOL_KEY);
      const items = raw ? JSON.parse(raw) : [];
      items.push({ title, due });
      await AsyncStorage.setItem(SHARE_POOL_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("QuestMap: не сохранилось в пул", e);
    }
  }, []);

  return { load, share };
}
