// hooks/useGuides.js
import { useCallback } from "react";

export function useGuides({
  guideUsedOffers,
  setGuideUsedOffers,
  guideCompletedOffers,
  setGuideCompletedOffers,
  onTakeSticker,
  popNav,
}) {
  const markCompleted = useCallback((guideKey, offerId) => {
    if (!guideKey || !offerId) return;
    if (guideCompletedOffers.includes(offerId)) return;
    setGuideCompletedOffers((prev) =>
      prev.includes(offerId) ? prev : [...prev, offerId]
    );
  }, [guideCompletedOffers, setGuideCompletedOffers]);

  const isTaken = useCallback((offerId) => {
    return guideUsedOffers.includes(offerId);
  }, [guideUsedOffers]);

  const isCompleted = useCallback((offerId) => {
    return guideCompletedOffers.includes(offerId);
  }, [guideCompletedOffers]);

  const takeTask = useCallback((guideKey, task) => {
    if (!task || !task.id || !task.title) return;

    setGuideUsedOffers((prev) =>
      prev.includes(task.id) ? prev : [...prev, task.id]
    );

    onTakeSticker &&
      onTakeSticker({
        title: task.title,
        due: null,
        notes: [],
        source: guideKey,
        guideOfferId: task.id,
        repeat: null,
      });

    popNav && popNav();
  }, [setGuideUsedOffers, onTakeSticker, popNav]);

  const releaseTask = useCallback((offerId) => {
    if (!offerId) return;
    setGuideUsedOffers((prev) => prev.filter((id) => id !== offerId));
  }, [setGuideUsedOffers]);

  return {
    markCompleted,
    isTaken,
    isCompleted,
    takeTask,
    releaseTask,
  };
}
