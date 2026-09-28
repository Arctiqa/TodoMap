import { useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { nextId } from "../utils/id";
import { cancelTaskNotifications } from "../utils/notifications";

export function useScreens({
  screens, screen, currentId, setScreens, updateScreen,
  setTopLevelOrder, setHistory, setEditMode, popNav, setCurrentId,
}) {
  // ---- Архив ----
  const archiveTasks = useCallback((scr, mk) => {
    const entries = (mk.tasks || []).map((task) => ({
      screenId: scr.id, screenName: scr.name,
      markerId: mk.id, markerName: mk.name,
      markerEmoji: mk.emoji, markerColor: mk.color,
      task, removedAt: Date.now(),
    }));
    if (entries.length) {
      (mk.tasks || []).forEach((t) => cancelTaskNotifications(t.id));
      setHistory((prev) => [...prev, ...entries]);
    }
  }, [setHistory]);

  const archiveScreen = useCallback((scr) => {
    (scr.markers || []).forEach((mk) => archiveTasks(scr, mk));
  }, [archiveTasks]);

  // ---- Метки ----
  const createMarker = useCallback(({ name, emoji, color, type, image, asField }) => {
    if (asField) {
      const newScreenId = `s${nextId()}`;
      const markerId = `m${nextId()}`;
      setScreens((prev) => ({
        ...prev,
        [currentId]: {
          ...prev[currentId],
          markers: [...prev[currentId].markers, {
            id: markerId, name, emoji, color,
            type: type || "general", image: image || null,
            x: 50, y: 50, linkTo: newScreenId,
          }],
        },
        [newScreenId]: {
          id: newScreenId, emoji,
          name: `${name.toUpperCase()} — ДЕЛА`,
          theme: "city", parentId: currentId, markers: [],
        },
      }));
    } else {
      updateScreen(currentId, (s) => ({
        ...s,
        markers: [...s.markers, {
          id: `m${nextId()}`, name, emoji, color,
          type: type || "general", image: image || null,
          x: 50, y: 50, tasks: [],
        }],
      }));
    }
    popNav();
  }, [currentId, setScreens, updateScreen, popNav]);

  const saveMarkerEdits = useCallback((editingMarker, values) => {
    if (!editingMarker) return;
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => m.id === editingMarker.id
        ? { ...m, name: values.name, emoji: values.emoji, color: values.color, image: values.image }
        : m),
    }));
  }, [currentId, updateScreen]);

  const deleteMarker = useCallback((markerId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    if (marker) archiveTasks(screen, marker);
    if (marker && marker.linkTo && screens[marker.linkTo]) archiveScreen(screens[marker.linkTo]);
    setScreens((prev) => {
      const next = {
        ...prev,
        [currentId]: {
          ...prev[currentId],
          markers: prev[currentId].markers.filter((m) => m.id !== markerId),
        },
      };
      if (marker && marker.linkTo && next[marker.linkTo]) delete next[marker.linkTo];
      return next;
    });
  }, [screen, screens, currentId, setScreens, archiveTasks, archiveScreen]);

  const handleDragMove = useCallback((markerId, x, y) => {
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => (m.id === markerId ? { ...m, x, y } : m)),
    }));
  }, [currentId, updateScreen]);

  // ---- Поля ----
  const createScreen = useCallback(({ name, emoji, image }) => {
    const newId = `s${nextId()}`;
    setScreens((prev) => ({
      ...prev,
      [newId]: {
        id: newId, emoji, name: name.toUpperCase(),
        theme: "city", image: image || null,
        parentId: null, markers: [],
      },
    }));
    setTopLevelOrder((prev) => [...prev, newId]);
    popNav();
    setEditMode(false);
    setCurrentId(newId);
  }, [setScreens, setTopLevelOrder, popNav, setEditMode, setCurrentId]);

  const saveFieldEdits = useCallback((editingField, values) => {
    if (!editingField) return;
    setScreens((prev) => ({
      ...prev,
      [editingField.id]: {
        ...prev[editingField.id],
        emoji: values.emoji || "",
        name: values.name || "",
        image: values.image ?? prev[editingField.id].image,
      },
    }));
  }, [setScreens]);

  const deleteField = useCallback((id) => {
    const scr = screens[id];
    if (scr) archiveScreen(scr);
    setScreens((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setTopLevelOrder((prev) => prev.filter((x) => x !== id));
    if (currentId === id) setCurrentId("main");
  }, [screens, currentId, setScreens, setTopLevelOrder, setCurrentId, archiveScreen]);

  const updateScreenImage = useCallback((screenId, uri) => {
    setScreens((prev) => ({ ...prev, [screenId]: { ...prev[screenId], image: uri } }));
  }, [setScreens]);

  const pickBackgroundImage = useCallback(async (screenId) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const src = result.assets[0].uri;
      const ext = src.split(".").pop() || "jpg";
      const dst = `${FileSystem.documentDirectory}bg_${Date.now()}.${ext}`;
      try {
        await FileSystem.copyAsync({ from: src, to: dst });
        updateScreenImage(screenId, dst);
      } catch (e) {
        console.warn("QuestMap: фон не скопирован", e);
        updateScreenImage(screenId, src);
      }
    }
  }, [updateScreenImage]);

  return {
    archiveTasks, archiveScreen,
    createMarker, saveMarkerEdits, deleteMarker, handleDragMove,
    createScreen, saveFieldEdits, deleteField, updateScreenImage, pickBackgroundImage,
  };
}
