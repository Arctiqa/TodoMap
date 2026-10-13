import { useCallback } from "react";

export function useGuides({
  guideUsedOffers,
  setGuideUsedOffers,
  onTakeSticker,
  popNav,
}) {
  // Взято ли задание
  const isTaken = useCallback((offerId) => {
    return guideUsedOffers.includes(offerId);
  }, [guideUsedOffers]);

  // Взять задание — кладём в поле как стикер и помечаем как «взято»
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

  // Освободить слот (когда задача удалена)
  const releaseTask = useCallback((offerId) => {
    if (!offerId) return;
    setGuideUsedOffers((prev) => prev.filter((id) => id !== offerId));
  }, [setGuideUsedOffers]);

  return {
    isTaken,
    takeTask,
    releaseTask,
  };
}
