import { useState } from "react";

export function useOverlayState() {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingDeleteField, setPendingDeleteField] = useState(null);
  const [placementConfirm, setPlacementConfirm] = useState(null);
  const [titleUnlock, setTitleUnlock] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [pendingResetBg, setPendingResetBg] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editAction, setEditAction] = useState("none");
  const [taskDetail, setTaskDetail] = useState(null);

  return {
    showSideMenu, setShowSideMenu,
    pendingDelete, setPendingDelete,
    pendingDeleteField, setPendingDeleteField,
    placementConfirm, setPlacementConfirm,
    titleUnlock, setTitleUnlock,
    pendingPlacement, setPendingPlacement,
    showExitConfirm, setShowExitConfirm,
    editingMarker, setEditingMarker,
    editingField, setEditingField,
    pendingResetBg, setPendingResetBg,
    editMode, setEditMode,
    editAction, setEditAction,
    taskDetail, setTaskDetail,
  };
}
