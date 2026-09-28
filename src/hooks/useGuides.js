import { useCallback } from "react";
import { GUIDE_CHAINS, GUIDE_TITLES } from "../constants/guides";
import { RANDOM_REPEAT_MIN, RANDOM_REPEAT_SPAN } from "../constants/config";
import { NAV } from "../state/navigation";

export function useGuides({
  guideUsedOffers, setGuideUsedOffers,
  setGuideTakenCount, setGuideProgress,
  setTitleUnlock, setPendingPlacement,
  pushNav, popNav, topNav,
}) {
  const bumpProgress = useCallback((guideKey) => {
    setGuideProgress((prev) => {
      const next = { ...prev, [guideKey]: (prev[guideKey] || 0) + 1 };
      const tiers = GUIDE_TITLES[guideKey];
      if (tiers && tiers[next[guideKey]]) setTitleUnlock(tiers[next[guideKey]]);
      return next;
    });
  }, [setGuideProgress, setTitleUnlock]);

  const nextChainOfferFor = useCallback((guideKey) => {
    const chain = GUIDE_CHAINS[guideKey] || [];
    return chain.find((o) => !guideUsedOffers.includes(o.id)) || null;
  }, [guideUsedOffers]);

  const takeChainOffer = useCallback((guideKey, offer) => {
    if (guideUsedOffers.includes(offer.id)) return;
    setGuideUsedOffers((prev) => (prev.includes(offer.id) ? prev : [...prev, offer.id]));
    setGuideTakenCount((prev) => ({ ...prev, [guideKey]: (prev[guideKey] || 0) + 1 }));
    setPendingPlacement({
      title: offer.taskTitle,
      due: null,
      notes: offer.starterNotes || [],
      source: guideKey,
      repeat: null,
    });
    popNav();
  }, [guideUsedOffers, setGuideUsedOffers, setGuideTakenCount, setPendingPlacement, popNav]);

  const takeCustomInstead = useCallback((guideKey, text) => {
    setPendingPlacement({ title: text, due: null, notes: [], source: undefined, repeat: null });
    popNav();
  }, [setPendingPlacement, popNav]);

  const takeRandom = useCallback((title) => {
    if (!title) return;
    const guideKey = topNav.payload?.guideKey;
    if (!guideKey) return;
    setGuideTakenCount((prev) => ({ ...prev, [guideKey]: (prev[guideKey] || 0) + 1 }));
    const target = RANDOM_REPEAT_MIN + Math.floor(Math.random() * RANDOM_REPEAT_SPAN);
    setPendingPlacement({ title, due: null, notes: [], source: guideKey, repeat: { count: 0, target } });
  }, [topNav, setGuideTakenCount, setPendingPlacement]);

  const openGuide = useCallback((guideKey) => {
    pushNav(NAV.GUIDE_TASKS, { guideKey });
  }, [pushNav]);

  return { bumpProgress, nextChainOfferFor, takeChainOffer, takeCustomInstead, takeRandom, openGuide };
}
