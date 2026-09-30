// hooks/useGuides.js
import { useCallback } from "react";
import { GUIDE_CHAINS, GUIDE_TITLES } from "../constants/guides";
import { GUIDE_REPEAT_MIN, GUIDE_REPEAT_SPAN } from "../constants/config";

export function useGuides({
  guideUsedOffers,
  setGuideUsedOffers,
  setGuideTakenCount,
  setGuideProgress,
  setTitleUnlock,
  onTakeSticker,   // (payload) => void — App.jsx кладёт стикер в currentId
  popNav,          // () => void — закрыть оверлей гида
}) {
  const bumpProgress = useCallback((guideKey) => {
    setGuideProgress((prev) => {
      const next = { ...prev, [guideKey]: (prev[guideKey] || 0) + 1 };
      const titles = GUIDE_TITLES[guideKey];
      if (titles && titles[next[guideKey]]) setTitleUnlock(titles[next[guideKey]]);
      return next;
    });
  }, [setGuideProgress, setTitleUnlock]);

  const nextChainOfferFor = useCallback((guideKey) => {
    const chain = GUIDE_CHAINS[guideKey] || [];
    return chain.find((o) => !guideUsedOffers.includes(o.id)) || null;
  }, [guideUsedOffers]);

  const bumpTaken = useCallback((guideKey) => {
    if (!guideKey) return;
    setGuideTakenCount((prev) => ({
      ...prev,
      [guideKey]: (prev[guideKey] || 0) + 1,
    }));
  }, [setGuideTakenCount]);

  // ---- Взять сюжетный оффер цепочки ----
  const takeChainOffer = useCallback((guideKey, offer) => {
    if (!offer || guideUsedOffers.includes(offer.id)) return;

    setGuideUsedOffers((prev) =>
      prev.includes(offer.id) ? prev : [...prev, offer.id]
    );
    bumpTaken(guideKey);

    onTakeSticker &&
      onTakeSticker({
        title: offer.taskTitle,
        due: null,
        notes: offer.starterNotes || [],
        source: guideKey,
        repeat: null,
      });

    popNav();
  }, [guideUsedOffers, setGuideUsedOffers, bumpTaken, onTakeSticker, popNav]);

  // ---- Своё задание вместо оффера ----
  const takeCustomInstead = useCallback((guideKey, text) => {
    const title = (text || "").trim();
    if (!title) return;
    bumpTaken(guideKey);
    onTakeSticker &&
      onTakeSticker({
        title,
        due: null,
        notes: [],
        source: guideKey,
        repeat: null,
      });
    popNav();
  }, [bumpTaken, onTakeSticker, popNav]);

  // ---- Рандомайзер ----
  const takeRandom = useCallback((guideKey, title) => {
    if (!title) return;
    bumpTaken(guideKey);
    const target = GUIDE_REPEAT_MIN + Math.floor(Math.random() * GUIDE_REPEAT_SPAN);
    onTakeSticker &&
      onTakeSticker({
        title,
        due: null,
        notes: [],
        source: guideKey,
        repeat: { count: 0, target },
      });
    popNav();
  }, [bumpTaken, onTakeSticker, popNav]);

  return {
    bumpProgress,
    nextChainOfferFor,
    takeChainOffer,
    takeCustomInstead,
    takeRandom,
  };
}
