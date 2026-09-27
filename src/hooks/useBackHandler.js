import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import { NAV } from "../state/navigation";

export function useBackHandler({
  overlay,
  navStack, navDispatch,
  editMode, setEditMode, setEditAction,
  currentId, setCurrentId, screens,
  cancelPendingPlacement,
}) {
  const navRef = useRef(navStack);
  navRef.current = navStack;

  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  const stateRef = useRef({ editMode, currentId, screens });
  stateRef.current = { editMode, currentId, screens };

  useEffect(() => {
    const onBackPress = () => {
      const o = overlayRef.current;
      if (o.showSideMenu) { o.setShowSideMenu(false); return true; }
      if (o.editingField) { o.setEditingField(null); return true; }
      if (o.editingMarker) { o.setEditingMarker(null); return true; }
      if (o.pendingResetBg) { o.setPendingResetBg(false); return true; }
      if (o.placementConfirm) { o.setPlacementConfirm(null); return true; }
      if (o.titleUnlock) { o.setTitleUnlock(null); return true; }
      if (o.pendingDeleteField) { o.setPendingDeleteField(null); return true; }
      if (o.pendingDelete) { o.setPendingDelete(null); return true; }
      if (o.pendingPlacement) { cancelPendingPlacement(); return true; }
      if (o.journalDetail) { o.setJournalDetail(null); return true; }

      const stack = navRef.current;
      if (stack.length > 1) { navDispatch({ type: "POP" }); return true; }

      const { editMode, currentId, screens } = stateRef.current;
      if (editMode) { setEditMode(false); setEditAction("none"); return true; }
      if (currentId !== "main") {
        const parent = screens[currentId]?.parentId || "main";
        setCurrentId(parent);
        return true;
      }
      o.setShowExitConfirm(true);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [navDispatch, cancelPendingPlacement, setEditMode, setEditAction, setCurrentId]);
}
