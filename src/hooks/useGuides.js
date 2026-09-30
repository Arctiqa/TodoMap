// hooks/useGuides.js
import { useCallback } from "react";
import { GUIDE_TITLES } from "../constants/guides";

export function useGuides({
  guideUsedOffers,
  setGuideUsedOffers,
  guideCompletedOffers,
  setGuideCompletedOffers,
  setGuideProgress,
  setTitleUnlock,
  onTakeSticker,   // (payload) => void — кладёт стикер в текущее поле
  popNav,          // () => void — закрыть оверлей гида
}) {
  // ------------------------------------------------------------------
  // Прогресс: +1 за уникальную задачу, и, если достигнут тир — диалог титула
  // ------------------------------------------------------------------
  const bumpProgress = useCallback((guideKey, offerId) => {
    if (!guideKey) return;
    // без offerId — не начисляем (не знаем, за какую задачу)
    if (!offerId) return;

    // если задача уже засчитана — ничего не делаем
    if (guideCompletedOffers.includes(offerId)) return;

    setGuideCompletedOffers((prev) =>
      prev.includes(offerId) ? prev : [...prev, offerId]
    );

    setGuideProgress((prev) => {
      const next = { ...prev, [guideKey]: (prev[guideKey] || 0) + 1 };
      const titles = GUIDE_TITLES[guideKey];
      if (titles && titles[next[guideKey]]) setTitleUnlock(titles[next[guideKey]]);
      return next;
    });
  }, [guideCompletedOffers, setGuideCompletedOffers, setGuideProgress, setTitleUnlock]);

  // ------------------------------------------------------------------
  // Проверки состояния задачи
  // ------------------------------------------------------------------
  const isTaken = useCallback((offerId) => {
    return guideUsedOffers.includes(offerId);
  }, [guideUsedOffers]);

  const isCompleted = useCallback((offerId) => {
    return guideCompletedOffers.includes(offerId);
  }, [guideCompletedOffers]);

  // ------------------------------------------------------------------
  // Взять задачу → стикер + пометить как взятую
  // ------------------------------------------------------------------
  const takeTask = useCallback((guideKey, task) => {
    if (!task || !task.id || !task.title) return;

    // добавляем в used (если ещё нет)
    setGuideUsedOffers((prev) =>
      prev.includes(task.id) ? prev : [...prev, task.id]
    );

    // создаём стикер в текущем поле
    onTakeSticker &&
      onTakeSticker({
        title: task.title,
        due: null,
        notes: [],
        source: guideKey,
        guideOfferId: task.id,   // ← связь стикера с задачей гида
        repeat: null,
      });

    popNav && popNav();
  }, [setGuideUsedOffers, onTakeSticker, popNav]);

  // ------------------------------------------------------------------
  // Освободить задачу (при удалении невыполненной) → снова «невзятая»
  // ------------------------------------------------------------------
  const releaseTask = useCallback((offerId) => {
    if (!offerId) return;
    setGuideUsedOffers((prev) => prev.filter((id) => id !== offerId));
  }, [setGuideUsedOffers]);

  return {
    bumpProgress,
    isTaken,
    isCompleted,
    takeTask,
    releaseTask,
  };
}
