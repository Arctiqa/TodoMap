// App.jsx
import React, { useState, useMemo, useReducer, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StatusBar, Image, BackHandler, Animated, ScrollView, Platform, AppState  } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { KeyboardProvider, KeyboardAvoidingView } from "react-native-keyboard-controller";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { GREEN, BLUE, RED, TEAL } from "./theme/palettes";
import { useQuestStore } from "./state/useQuestStore";
import { navReducer, NAV } from "./state/navigation";
import { activeEntries, expiredEntries, doneEntries, historyEntries } from "./state/selectors";
import { FIELD_MARKER_ID, STICKER_TRASH_ZONE_HEIGHT, NOTIFICATIONS_KEY } from "./constants/config";

import { LanguageProvider, useT, useLanguage } from "./i18n/LanguageContext";
import {
  LANGUAGE_STORAGE_KEY,
  detectSystemLanguage,
  normalizeLanguage,
} from "./utils/language";
import { applyRTL } from "./utils/rtl";

import { BottomBar } from "./components/BottomBar";
import { SideMenu } from "./components/SideMenu";
import { Pin } from "./components/Pin";
import { MemoSticker } from "./components/Sticker";
import { Overlay } from "./components/ui/Overlay";
import { InfoDialog } from "./components/ui/InfoDialog";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { NewPinForm } from "./components/forms/NewPinForm";
import { AddTaskBar } from "./components/AddTaskBar";

import { TaskScreen } from "./screens/TaskScreen";
import { JournalList } from "./screens/JournalList";
import { HistoryList } from "./screens/HistoryList";
import { OthersList } from "./screens/OthersList";
import { SettingsOverlay } from "./screens/SettingsOverlay";
import { GuidesListOverlay } from "./screens/GuidesListOverlay";
import { GuideTasksOverlay } from "./screens/GuideTasksOverlay";
import { ThemePickerOverlay } from "./screens/ThemePickerOverlay";
import { LanguagePickerOverlay } from "./screens/LanguagePickerOverlay";
import { BackgroundPickerOverlay } from "./screens/BackgroundPickerOverlay";
import { TaskDetailOverlay } from "./screens/TaskDetailOverlay";
import { OnboardingOverlay } from "./screens/OnboardingOverlay";

import { screenTitle } from "./utils/text";
import { cancelTaskNotifications } from "./utils/notifications";
import { logEvent, logSessionStart, logSessionEnd, getFirstOpenAt, retryPending } from "./utils/analytics";
import { resolveImageSource, DOM_DEFAULT_BG, MAP_DEFAULT_BG } from "./data/initialScreens";

import { useOverlayState } from "./hooks/useOverlayState";
import { useThoughts } from "./hooks/useThoughts";
import { useJournalActions } from "./hooks/useJournalActions";
import { useGuides } from "./hooks/useGuides";
import { useSharedPool } from "./hooks/useSharedPool";
import { useTasks } from "./hooks/useTasks";
import { useScreens } from "./hooks/useScreens";
import { useSlide } from "./hooks/useSlide";
import { useNotifications } from "./hooks/useNotifications";
import { useBackHandler } from "./hooks/useBackHandler";

export default function App() {
  const [themeName, setThemeName] = useState("light");
  const [language, setLanguage] = useState(null);
  const [loadedLang, setLoadedLang] = useState(false);

  const sessionStartedRef = useRef(false);

    useEffect(() => {
      (async () => {
        await retryPending();
        await getFirstOpenAt();
      })();
    }, []);

    useEffect(() => {
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "background") {
          logSessionEnd();
          sessionStartedRef.current = false;
        } else if (state === "active" && !sessionStartedRef.current) {
          logSessionStart();
          sessionStartedRef.current = true;
        }
      });
      // При старте приложения
      if (!sessionStartedRef.current) {
        logSessionStart();
        sessionStartedRef.current = true;
      }
      return () => sub.remove();
    }, []);

  useEffect(() => {
    AsyncStorage.getItem("questmap_theme")
      .then((v) => v && setThemeName(v))
      .catch((e) => console.warn("QuestMap: тема не загрузилась", e));

    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((v) => {
        const norm = normalizeLanguage(v);
        setLanguage(norm || detectSystemLanguage());
      })
      .catch(() => setLanguage(detectSystemLanguage()))
      .finally(() => setLoadedLang(true));
  }, []);

  const handleThemeChange = useCallback((key) => {
    logEvent("theme_changed", { to: key });
    setThemeName(key);
    AsyncStorage.setItem("questmap_theme", key).catch((e) =>
      console.warn("QuestMap: тема не сохранилась", e)
    );
  }, []);

  const handleLanguageChange = useCallback(async (key) => {
    logEvent("language_changed", { to: key });
    setLanguage(key);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, key).catch((e) =>
      console.warn("QuestMap: язык не сохранился", e)
    );
    // RTL-переключение делается в LanguagePickerOverlay (там есть подтверждение и reload)
    await applyRTL(key);
  }, []);

  if (!loadedLang) return null;

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <LanguageProvider language={language}>
          <ThemeProvider name={themeName}>
            <AppShell
              onThemeChange={handleThemeChange}
              language={language}
              onLanguageChange={handleLanguageChange}
            />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}

function AppShell({ onThemeChange, language, onLanguageChange }) {
  const { name: themeName, ink, paper, card, bar, fieldBg } = useTheme();
  const t = useT();
  const { isRTL } = useLanguage();

  const store = useQuestStore();
  const {
    state, setScreens, updateScreen, setTopLevelOrder, setHistory, setThoughts,
    setGuideUsedOffers, setGuideCompletedOffers, setSharedPool,
  } = store;
  const {
    screens, topLevelOrder, historyLog, thoughts,
    guideUsedOffers, guideCompletedOffers, sharedPool, loaded,
  } = state;

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.getItem("questmap_onboarded_v1")
      .then((v) => { if (!v) setShowOnboarding(true); })
      .catch(() => {});
    AsyncStorage.getItem(NOTIFICATIONS_KEY)
      .then((v) => { if (v === "0") setNotificationsEnabled(false); })
      .catch(() => {});
  }, [loaded]);

  const finishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    AsyncStorage.setItem("questmap_onboarded_v1", "1").catch(() => {});
    logEvent("onboarding_complete", {});
  }, []);

  const toggleNotifications = useCallback((value) => {
    setNotificationsEnabled(value);
    AsyncStorage.setItem(NOTIFICATIONS_KEY, value ? "1" : "0").catch(() => {});
  }, []);

  const [navStack, navDispatch] = useReducer(navReducer, [{ type: NAV.ROOT }]);
  const pushNav = useCallback((navType, payload) => navDispatch({ type: "PUSH", navType, payload }), []);
  const popNav = useCallback(() => navDispatch({ type: "POP" }), []);
  const resetNav = useCallback(() => navDispatch({ type: "RESET" }), []);
  const topNav = navStack[navStack.length - 1];

  const [currentId, setCurrentId] = useState("main");
  const screen = screens[currentId];

  const [addTaskBarExpanded, setAddTaskBarExpanded] = useState(false);
  const [addTaskBarMinimized, setAddTaskBarMinimized] = useState(false);


  const overlay = useOverlayState();
  const {
    showSideMenu, setShowSideMenu,
    pendingDelete, setPendingDelete,
    pendingDeleteField, setPendingDeleteField,
    placementConfirm, setPlacementConfirm,
    pendingPlacement, setPendingPlacement,
    showExitConfirm, setShowExitConfirm,
    editingMarker, setEditingMarker,
    editingField, setEditingField,
    pendingResetBg, setPendingResetBg,
    editMode, setEditMode,
    editAction, setEditAction,
    taskDetail, setTaskDetail,
  } = overlay;

  const takeStickerRef = useRef(null);

  const {
    markCompleted: markGuideCompleted,
    takeTask: takeGuideTask,
    releaseTask: releaseGuideTask,
  } = useGuides({
    guideUsedOffers,
    setGuideUsedOffers,
    guideCompletedOffers,
    setGuideCompletedOffers,
    onTakeSticker: (payload) => takeStickerRef.current && takeStickerRef.current(payload),
    popNav,
  });

  const {
    addTaskCore, toggleTask, incrementRepeat, decrementRepeat, deleteTask,
    addSticker, updateSticker, updateStickerPosition,
    moveStickerToMarker, moveStickerToField, moveTaskToField, deleteSticker, toggleSticker,
    incrementStickerRepeat, decrementStickerRepeat,
  } = useTasks({
    screens,
    updateScreen, setScreens, setHistory,
    markGuideCompleted,
    releaseGuideTask,
  });

  takeStickerRef.current = (payload) => {
    addSticker(currentId, payload, 50, 50);
  };

  const {
    createMarker, saveMarkerEdits, deleteMarker, handleDragMove,
    createScreen, saveFieldEdits, deleteField, updateScreenImage,
  } = useScreens({
    screens, screen, currentId, setScreens, updateScreen,
    setTopLevelOrder, setHistory, setEditMode, popNav, setCurrentId,
  });

  const handleCreateMarker = useCallback((values) => {
    createMarker(values);
    logEvent("marker_created", {
      asField: !!values.asField,
      hasImage: !!values.image,
      hasColor: !!values.color,
    });
  }, [createMarker]);    



  const {
    addOrUpdate: addOrUpdateThought,
    remove: deleteThought,
    convertToTask: convertThoughtToTask,
  } = useThoughts({
    setThoughts,
    onConvertToSticker: (payload) => takeStickerRef.current && takeStickerRef.current(payload),
    popNav,
  });

  const {
    returnToActive: returnTaskToActive,
    complete: completeTaskFromJournal,
    remove: deleteTaskFromJournal,
  } = useJournalActions({ setScreens, setHistory });

  const {
    load: loadSharedPool,
    share: shareTaskToPool,
  } = useSharedPool({ setSharedPool });

  const {
    slideX, swipeResponder, siblings, animateSlide,
  } = useSlide({ topLevelOrder, currentId, setCurrentId, editMode });

  useNotifications({ screens, loaded, enabled: notificationsEnabled });

  useBackHandler({
    overlay: { ...overlay, pendingPlacement },
    navStack, navDispatch,
    editMode, setEditMode, setEditAction,
    currentId, setCurrentId, screens,
    cancelPendingPlacement: () => setPendingPlacement(null),
    addTaskBarExpanded, setAddTaskBarExpanded,
  });

  const [draggingStickerId, setDraggingStickerId] = useState(null);
  const [trashActive, setTrashActive] = useState(false);
  const hoveredMarkerIdRef = useRef(null);
  const hoveredListenersRef = useRef(new Set());
  const isOverTrashRef = useRef(false);

  const setHoveredMarkerId = useCallback((markerId) => {
    if (hoveredMarkerIdRef.current === markerId) return;
    hoveredMarkerIdRef.current = markerId;
    hoveredListenersRef.current.forEach((cb) => cb(markerId));
  }, []);

  const subscribeHovered = useCallback((cb) => {
    hoveredListenersRef.current.add(cb);
    return () => hoveredListenersRef.current.delete(cb);
  }, []);

  const handleStickerDragStart = useCallback((stickerId) => {
    setDraggingStickerId(stickerId);
    isOverTrashRef.current = false;
    setTrashActive(false);
    setHoveredMarkerId(null);
  }, [setHoveredMarkerId]);

  const handleStickerDragEnd = useCallback(() => {
    setDraggingStickerId(null);
    isOverTrashRef.current = false;
    setTrashActive(false);
    setHoveredMarkerId(null);
  }, [setHoveredMarkerId]);

  const handleDropStickerOnDoor = useCallback((stickerId, linkToId) => {
    moveStickerToField(currentId, stickerId, linkToId, 50, 50);
  }, [currentId, moveStickerToField, setCurrentId]);

  const handleExtractStickerToParent = useCallback((stickerId) => {
    const parentId = screen.parentId;
    if (!parentId) return;
    moveStickerToField(currentId, stickerId, parentId, 50, 50);
    setCurrentId(parentId);
  }, [screen, currentId, moveStickerToField, setCurrentId]);

  const handleHoverMarker = useCallback((markerId) => {
    setHoveredMarkerId(markerId);
  }, []);

  const handleStickerMove = useCallback((stickerCenterY, containerHeight) => {
    if (!containerHeight) return;
    const over = stickerCenterY > containerHeight - STICKER_TRASH_ZONE_HEIGHT;
    if (over !== isOverTrashRef.current) {
      isOverTrashRef.current = over;
      setTrashActive(over);
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (draggingStickerId) {
        setDraggingStickerId(null);
        isOverTrashRef.current = false;
        setTrashActive(false);
        setHoveredMarkerId(null);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [draggingStickerId, setHoveredMarkerId]);

  const openTaskDetail = useCallback((task, marker, screenId) => {
    setTaskDetail({
      taskId: task.id,
      markerId: marker ? marker.id : FIELD_MARKER_ID,
      screenId,
    });
  }, [setTaskDetail]);

  const taskDetailData = useMemo(() => {
    if (!taskDetail) return null;
    const scr = screens[taskDetail.screenId];
    if (!scr) return null;

    if (taskDetail.markerId === FIELD_MARKER_ID) {
      const sticker = (scr.stickers || []).find((s) => s.id === taskDetail.taskId);
      if (!sticker) return null;
      return { task: sticker, marker: null, screen: scr, isSticker: true };
    }

    const mk = scr.markers.find((m) => m.id === taskDetail.markerId);
    if (!mk) return null;
    const tsk = mk.tasks.find((x) => x.id === taskDetail.taskId);
    if (!tsk) return null;
    return { task: tsk, marker: mk, screen: scr, isSticker: false };
  }, [taskDetail, screens]);

  const patchTaskInDetail = useCallback((patchFn) => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;

    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;

      if (markerId === FIELD_MARKER_ID) {
        return {
          ...prev,
          [screenId]: {
            ...scr,
            stickers: (scr.stickers || []).map((s) => s.id === taskId ? patchFn(s) : s),
          },
        };
      }

      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: m.tasks.map((tsk) => (tsk.id === taskId ? patchFn(tsk) : tsk)) }
              : m
          ),
        },
      };
    });
  }, [taskDetail, setScreens]);

  const renameTask = useCallback((newTitle) => {
    patchTaskInDetail((tsk) => ({ ...tsk, title: newTitle }));
  }, [patchTaskInDetail]);

  const addNoteGlobal = useCallback((text) => {
    patchTaskInDetail((tsk) => ({ ...tsk, notes: [...(tsk.notes || []), { text, done: false }] }));
  }, [patchTaskInDetail]);

  const removeNoteGlobal = useCallback((idx) => {
    patchTaskInDetail((tsk) => ({ ...tsk, notes: (tsk.notes || []).filter((_, i) => i !== idx) }));
  }, [patchTaskInDetail]);

  const toggleNoteGlobal = useCallback((idx) => {
    patchTaskInDetail((tsk) => ({
      ...tsk,
      notes: (tsk.notes || []).map((n, i) => (i === idx ? { ...n, done: !n.done } : n)),
    }));
  }, [patchTaskInDetail]);

  const completeTaskFromDetail = useCallback(() => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;

    const scr = screens[screenId];
    if (!scr) { setTaskDetail(null); return; }

    let task = null;
    if (markerId === FIELD_MARKER_ID) {
      task = (scr.stickers || []).find((s) => s.id === taskId);
    } else {
      const mk = scr.markers.find((m) => m.id === markerId);
      task = mk && mk.tasks.find((tsk) => tsk.id === taskId);
    }

    if (!task || task.done) {
      setTaskDetail(null);
      return;
    }

    if (task.source && task.guideOfferId) {
      releaseGuideTask(task.guideOfferId);
      markGuideCompleted(task.source, task.guideOfferId);
    }

    logEvent("task_completed", {
      where: markerId === FIELD_MARKER_ID ? "sticker" : "marker",
      screenId,
      markerId: markerId === FIELD_MARKER_ID ? null : markerId,
      taskId,
      timeToCompleteMs: Date.now() - (task.createdAt || Date.now()),
      hasRepeat: !!task.repeat,
      hasNotes: (task.notes || []).length > 0,
      notesCount: (task.notes || []).length,
    });

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;

      if (markerId === FIELD_MARKER_ID) {
        return {
          ...prev,
          [screenId]: {
            ...s,
            stickers: (s.stickers || []).map((x) =>
              x.id === taskId ? { ...x, done: true, completedAt: Date.now() } : x
            ),
          },
        };
      }

      return {
        ...prev,
        [screenId]: {
          ...s,
          markers: s.markers.map((m) =>
            m.id === markerId
              ? {
                  ...m,
                  tasks: m.tasks.map((tsk) =>
                    tsk.id === taskId
                      ? { ...tsk, done: true, completedAt: Date.now() }
                      : tsk
                  ),
                }
              : m
          ),
        },
      };
    });

    setTaskDetail(null);
  }, [taskDetail, screens, setScreens, releaseGuideTask, markGuideCompleted, setTaskDetail]);

  const uncompleteTaskFromDetail = useCallback(() => {
    patchTaskInDetail((tsk) => ({ ...tsk, done: false, completedAt: null }));
  }, [patchTaskInDetail]);

  const deleteTaskFromDetail = useCallback(() => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    cancelTaskNotifications(taskId);

    const scr = screens[screenId];
    if (!scr) { setTaskDetail(null); return; }

    let task = null;
    let marker = null;

    if (markerId === FIELD_MARKER_ID) {
      task = (scr.stickers || []).find((s) => s.id === taskId);
    } else {
      marker = scr.markers.find((m) => m.id === markerId);
      task = marker && marker.tasks.find((tsk) => tsk.id === taskId);
    }

    if (!task) { setTaskDetail(null); return; }

    if (task.source && task.guideOfferId && !task.done) {
      releaseGuideTask(task.guideOfferId);
    }

    // ⬇️ ЛОГИРУЕМ УДАЛЕНИЕ
    logEvent("task_deleted", {
      where: markerId === FIELD_MARKER_ID ? "sticker" : "marker",
      viaDetail: true,
      screenId,
      markerId: markerId === FIELD_MARKER_ID ? null : markerId,
      taskId,
      wasDone: !!task.done,
      wasExpired: !task.done && task.due != null,
      ageMs: Date.now() - (task.createdAt || Date.now()),
    });

    setHistory((h) => [
      ...h,
      {
        screenId,
        screenName: scr.name,
        markerId: markerId === FIELD_MARKER_ID ? null : (marker ? marker.id : null),
        markerName: markerId === FIELD_MARKER_ID ? t("common.free") : (marker ? marker.name : ""),
        markerEmoji: markerId === FIELD_MARKER_ID ? (scr.emoji || "📌") : (marker ? marker.emoji : "📌"),
        markerColor: markerId === FIELD_MARKER_ID ? "#B08968" : (marker ? marker.color : "#B08968"),
        task,
        removedAt: Date.now(),
      },
    ]);

    setScreens((prev) => {
      const s = prev[screenId];
      if (!s) return prev;

      if (markerId === FIELD_MARKER_ID) {
        return {
          ...prev,
          [screenId]: {
            ...s,
            stickers: (s.stickers || []).filter((x) => x.id !== taskId),
          },
        };
      }

      return {
        ...prev,
        [screenId]: {
          ...s,
          markers: s.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: m.tasks.filter((tsk) => tsk.id !== taskId) }
              : m
          ),
        },
      };
    });

    setTaskDetail(null);
  }, [taskDetail, screens, setScreens, releaseGuideTask, markGuideCompleted, setTaskDetail, t, setHistory]);
  
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  const activeTaskId = topNav.type === NAV.TASK ? topNav.payload.markerId : null;
  const activeMarker = activeTaskId ? (screen.markers || []).find((m) => m.id === activeTaskId) : null;

  const active = useMemo(() => activeEntries(screens), [screens]);
  const expired = useMemo(() => expiredEntries(screens), [screens]);
  const doneList = useMemo(() => doneEntries(screens), [screens]);

  const handleOpen = useCallback((marker) => {
    if (marker.linkTo) {
      setEditMode(false);
      setCurrentId(marker.linkTo);
      return;
    }
    pushNav(NAV.TASK, { markerId: marker.id });
  }, [setEditMode, setCurrentId, pushNav]);

  const handleAddTaskFromBar = useCallback(({ title, due, repeat, share, color }) => {
    addSticker(currentId, { title, due, repeat, color }, 50, 50);
    logEvent("task_created", {
      hasDue: !!due,
      hasRepeat: !!repeat,
      hasShare: !!share,
      hasColor: !!color,
      target: "field",   // добавили в поле, а не в метку
    });
    if (share) shareTaskToPool(title, due);
  }, [currentId, addSticker, shareTaskToPool]);

  const handleBottomAction = useCallback((action) => {
    switch (action) {
      case "menu":
        setShowSideMenu((v) => !v);
        break;
      case "home":
        resetNav();
        setCurrentId("main");
        setEditMode(false);
        setEditAction("none");
        break;
      case "journal": resetNav(); pushNav(NAV.JOURNAL); break;
      case "add-marker": resetNav(); pushNav(NAV.ADD_MARKER); break;
      case "others": resetNav(); pushNav(NAV.OTHERS); loadSharedPool(); break;
    }
  }, [setShowSideMenu, resetNav, pushNav, loadSharedPool, setCurrentId, setEditMode, setEditAction]);

  const handleSideMenuAction = useCallback((key) => {
    setShowSideMenu(false);
    switch (key) {
      case "add-marker":
        resetNav(); pushNav(NAV.ADD_MARKER); break;
      case "edit-marker":
        resetNav(); setEditMode(true); setEditAction("edit"); break;
      case "delete-marker":
        resetNav(); setEditMode(true); setEditAction("delete"); break;
      case "add-field":
        resetNav(); pushNav(NAV.ADD_SCREEN); break;
      case "edit-field":
        setEditingField(screen); break;
      case "clear-bg":
        setPendingResetBg(true); break;
      case "delete-field":
        if (topLevelOrder.includes(currentId) && currentId !== "main") {
          setPendingDeleteField(screen);
        }
        break;
      case "guides":
        resetNav(); pushNav(NAV.GUIDES_LIST); break;
      case "history":
        resetNav(); pushNav(NAV.HISTORY); break;
      case "settings":
        resetNav(); pushNav(NAV.SETTINGS); break;
    }
  }, [
    screen, currentId, topLevelOrder, resetNav, pushNav,
    setShowSideMenu, setEditMode, setEditAction,
    setEditingField, setPendingDeleteField, setPendingResetBg,
  ]);

  const breadcrumbs = useMemo(() => {
    const chain = [];
    let id = currentId;
    let guard = 0;
    while (id && screens[id] && guard < 20) {
      chain.unshift({ id, name: screens[id].name, emoji: screens[id].emoji });
      id = screens[id].parentId;
      guard++;
    }
    return chain;
  }, [currentId, screens]);


  const handleOpenSticker = useCallback((sticker) => {
    setTaskDetail({
      taskId: sticker.id,
      markerId: FIELD_MARKER_ID,
      screenId: currentId,
    });
  }, [currentId, setTaskDetail]);

  const handleDropStickerOnField = useCallback((stickerId, x, y) => {
    updateStickerPosition(currentId, stickerId, x, y);
  }, [currentId, updateStickerPosition]);

  const handleDropStickerOnMarker = useCallback((stickerId, markerId) => {
    moveStickerToMarker(currentId, stickerId, markerId);
  }, [currentId, moveStickerToMarker]);

  const handleDeleteSticker = useCallback((stickerId) => {
    deleteSticker(currentId, stickerId);
  }, [currentId, deleteSticker]);

  const renderTopNav = () => {
    switch (topNav.type) {
      case NAV.TASK:
        return activeMarker ? (
          <TaskScreen
            marker={activeMarker}
            onClose={popNav}
            onToggle={(markerId, taskId) => toggleTask(currentId, markerId, taskId)}
            onAdd={(markerId, title, due, repeat, color) => addTaskCore(currentId, markerId, { title, due, repeat, color })}
            onDelete={(markerId, taskId) => deleteTask(currentId, markerId, taskId)}
            onShare={shareTaskToPool}
            onIncrementRepeat={(markerId, taskId) => incrementRepeat(currentId, markerId, taskId)}
            onDecrementRepeat={(markerId, taskId) => decrementRepeat(currentId, markerId, taskId)}
            onOpenDetail={(tsk) => openTaskDetail(tsk, activeMarker, currentId)}
            onExtractToField={(taskId) => {
              moveTaskToField(currentId, activeMarker.id, taskId, 50, 50);
              popNav();
            }}
          />
        ) : null;

      case NAV.JOURNAL:
        return (
          <JournalList
            active={active}
            expired={expired}
            done={doneList}
            thoughts={thoughts}
            onClose={popNav}
            onOpenDetail={(e) => {
              if (e.markerId === FIELD_MARKER_ID) {
                setTaskDetail({
                  taskId: e.task.id,
                  markerId: FIELD_MARKER_ID,
                  screenId: e.screenId,
                });
                return;
              }
              const scr = screens[e.screenId];
              const mk = scr?.markers.find((m) => m.id === e.markerId);
              if (mk) openTaskDetail(e.task, mk, e.screenId);
            }}
            onAddThought={addOrUpdateThought}
            onDeleteThought={deleteThought}
            onConvertThought={convertThoughtToTask}
            onReturnTask={returnTaskToActive}
            onCompleteTask={completeTaskFromJournal}
            onDeleteTask={deleteTaskFromJournal}
          />
        );

      case NAV.HISTORY:
        return (
          <HistoryList
            entries={historyEntries(screens, historyLog)}
            onClose={popNav}
            onClearHistory={() => setHistory([])}
          />
        );

      case NAV.OTHERS:
        return (
          <OthersList
            pool={sharedPool}
            onClose={popNav}
            onRefresh={loadSharedPool}
            onTake={(p) => {
              addSticker(currentId, {
                title: p.title,
                due: p.due || null,
                notes: [],
                repeat: null,
              }, 50, 50);
              popNav();
            }}
          />
        );

      case NAV.THEME_PICKER:
        return (
          <ThemePickerOverlay
            current={themeName}
            onSelect={(key) => onThemeChange(key)}
            onClose={popNav}
          />
        );

      case NAV.LANGUAGE_PICKER:
        return (
          <LanguagePickerOverlay
            current={language}
            onSelect={onLanguageChange}
            onClose={popNav}
          />
        );

      case NAV.GUIDES_LIST:
        return (
          <GuidesListOverlay
            onSelect={(key) => { popNav(); pushNav(NAV.GUIDE_TASKS, { guideKey: key }); }}
            onClose={popNav}
          />
        );

      case NAV.BACKGROUND_PICKER:
        return (
          <BackgroundPickerOverlay
            current={screen.image}
            onSelect={(value) => {
              if (value === "__DEFAULT__") {
                const def = currentId === "main"
                  ? MAP_DEFAULT_BG
                  : currentId === "home"
                  ? DOM_DEFAULT_BG
                  : null;
                updateScreenImage(currentId, def);
              } else {
                updateScreenImage(currentId, value);
              }
              popNav();
            }}
            onClose={popNav}
          />
        );

      case NAV.GUIDE_TASKS:
        return (
          <GuideTasksOverlay
            guideKey={topNav.payload.guideKey}
            guideUsedOffers={guideUsedOffers}
            guideCompletedOffers={guideCompletedOffers}
            onTakeTask={takeGuideTask}
            onBack={popNav}
            onClose={popNav}
          />
        );

      case NAV.SETTINGS:
        return (
          <SettingsOverlay
            onClose={popNav}
            onOpenTheme={() => pushNav(NAV.THEME_PICKER)}
            onOpenLanguage={() => pushNav(NAV.LANGUAGE_PICKER)}
            onOpenNotifications={() => {}}
            onOpenAbout={() => {}}
            exportData={{ screens, historyLog, thoughts }}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={toggleNotifications}
          />
        );

      default:
        return null;
    }
  };

  if (!screen) return null;

  const backIcon = isRTL ? "arrow-forward" : "arrow-back";
  const nextIcon = isRTL ? "arrow-back" : "arrow-forward";

  return (
    <View style={{ flex: 1, backgroundColor: paper }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView
          key={`${themeName}-${language}`}
          style={{ flex: 1, backgroundColor: fieldBg, overflow: "hidden" }}
          edges={["top"]}
        >
          <StatusBar barStyle="dark-content" />

          {editMode && editAction === "delete" && (
            <Pressable
              onPress={() => { setEditMode(false); setEditAction("none"); }}
              style={{ backgroundColor: RED, paddingVertical: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
                {t("app.editModeDelete")}
              </Text>
            </Pressable>
          )}

          {editMode && editAction === "edit" && (
            <Pressable
              onPress={() => { setEditMode(false); setEditAction("none"); }}
              style={{ backgroundColor: BLUE, paddingVertical: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
                {t("app.editModeEdit")}
              </Text>
            </Pressable>
          )}

          <View style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12, paddingVertical: 10, backgroundColor: bar,
          }}>
            {screen.parentId ? (
              <Pressable
                onPress={() => { setEditMode(false); setCurrentId(screen.parentId); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, minWidth: 36 }}
              >
                <MaterialIcons name={backIcon} size={22} color={ink} />
              </Pressable>
            ) : <View style={{ width: 36 }} />}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", gap: 4, paddingHorizontal: 4 }}
              style={{ flex: 1 }}
            >
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    <Pressable
                      onPress={() => {
                        if (!isLast) {
                          resetNav();
                          setEditMode(false);
                          setEditAction("none");
                          setCurrentId(crumb.id);
                        }
                      }}
                      disabled={isLast}
                    >
                      <Text
                        style={{
                          fontSize: isLast ? 15 : 12.5,
                          fontWeight: isLast ? "bold" : "600",
                          color: ink,
                          opacity: isLast ? 1 : 0.6,
                        }}
                        numberOfLines={1}
                      >
                        {crumb.emoji ? `${crumb.emoji} ` : ""}{crumb.name}
                      </Text>
                    </Pressable>
                    {!isLast && (
                      <Text style={{ fontSize: 12, color: ink, opacity: 0.35 }}>
                        {isRTL ? "‹" : "›"}
                      </Text>
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>

            <View style={{ width: 36 }} />
          </View>

          <Animated.View
            {...swipeResponder.panHandlers}
            style={{
              flex: 1, backgroundColor: fieldBg, position: "relative",
              transform: [{ translateX: slideX }],
            }}
            onLayout={(e) =>
              setMapSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
            }
          >
            {!editMode && screen.parentId && (
              <Pressable
                onLongPress={() => {
                  setEditMode(false);
                  setCurrentId(screen.parentId);
                }}
                delayLongPress={500}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
              />
            )}

            {addTaskBarExpanded && !addTaskBarMinimized && (
              <Pressable
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 9,
                }}
                onPress={() => {
                  setAddTaskBarExpanded(false);
                  setAddTaskBarMinimized(false);
                }}
              />
            )}

            {!editMode && siblings.list.length > 1 && (
              <View
                pointerEvents="box-none"
                style={{
                  position: "absolute", top: 10, left: 0, right: 0,
                  flexDirection: "row", justifyContent: "space-between",
                  paddingHorizontal: 16, zIndex: 5,
                }}
              >
                {siblings.index > 0 ? (
                  <Pressable onPress={() => animateSlide(isRTL ? -1 : 1)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                    <MaterialIcons name={backIcon} size={30} color={ink} />
                  </Pressable>
                ) : <View style={{ width: 30 }} />}

                {siblings.index !== -1 && siblings.index < siblings.list.length - 1 ? (
                  <Pressable onPress={() => animateSlide(isRTL ? 1 : -1)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                    <MaterialIcons name={nextIcon} size={30} color={ink} />
                  </Pressable>
                ) : <View style={{ width: 30 }} />}
              </View>
            )}

            {editMode && (editAction === "delete" || editAction === "edit") && (
              <Pressable
                onPress={() => { setEditMode(false); setEditAction("none"); }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
              />
            )}

            {screen.image && (
              <Image
                source={resolveImageSource(screen.image)}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            )}

            {screen.markers.map((m) => (
              <Pin
                key={m.id}
                marker={m}
                markerId={m.id}
                subscribeHovered={subscribeHovered}
                editMode={editMode}
                editAction={editAction}
                containerSize={mapSize}
                onOpen={handleOpen}
                onDragMove={handleDragMove}
                onDelete={(mk) => setPendingDelete(mk)}
                onEdit={(mk) => setEditingMarker(mk)}
              />
            ))}

            {!editMode && (screen.stickers || []).map((s) => (
              <MemoSticker
                key={s.id}
                sticker={s}
                containerSize={mapSize}
                markers={screen.markers}
                onOpen={handleOpenSticker}
                onDragStart={handleStickerDragStart}
                onDragEnd={handleStickerDragEnd}
                onDropOnField={handleDropStickerOnField}
                onDropOnMarker={handleDropStickerOnMarker}
                onDropOnDoor={handleDropStickerOnDoor}
                onExtractToParent={handleExtractStickerToParent}
                onDelete={handleDeleteSticker}
                isOverTrashRef={isOverTrashRef}
                onMove={handleStickerMove}
                onHoverMarker={handleHoverMarker}
              />
            ))}

            {draggingStickerId && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0, right: 0, bottom: 15,
                  height: STICKER_TRASH_ZONE_HEIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 998,
                  elevation: 998,
                }}
              >
                <View
                  style={{
                    width: 70, height: 70, borderRadius: 35,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: trashActive ? RED : card,
                    borderWidth: 3,
                    borderColor: trashActive ? RED : ink,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                    opacity: trashActive ? 1 : 0.85,
                    transform: [{ scale: trashActive ? 1.15 : 1 }],
                  }}
                >
                  <MaterialIcons
                    name="delete-forever"
                    size={36}
                    color={trashActive ? "#fff" : ink}
                  />
                </View>
              </View>
            )}

            {renderTopNav()}

            {!editMode &&
              navStack.length === 1 &&
              !showSideMenu &&
              !pendingDelete &&
              !pendingDeleteField &&
              !pendingPlacement &&
              !showExitConfirm &&
              !placementConfirm && (
                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10 }}>
                  <AddTaskBar
                    visible={true}
                    onSubmit={handleAddTaskFromBar}
                    bgColor="transparent"
                    collapsed={!addTaskBarExpanded}
                    minimized={addTaskBarMinimized}
                    onExpand={() => { setAddTaskBarExpanded(true); setAddTaskBarMinimized(false); }}
                    onCollapse={() => { setAddTaskBarExpanded(false); setAddTaskBarMinimized(false); }}
                    onMinimize={() => { setAddTaskBarExpanded(false); setAddTaskBarMinimized(true); }}
                    onUnminimize={() => { setAddTaskBarExpanded(false); setAddTaskBarMinimized(false); }}
                  />
                </View>
              )}
          </Animated.View>

          <NewPinForm
            mode="create"
            title={t("pin.newMarker")}
            confirmLabel={t("pin.addMarker")}
            showPlaceHints={currentId !== "home"}
            onClose={popNav}
            onCreate={handleCreateMarker} // ← стало
            visible={topNav.type === NAV.ADD_MARKER}
          />

          <NewPinForm
            mode="create"
            title={t("pin.newField")}
            confirmLabel={t("pin.createField")}
            showColor={false}
            imageAspect={[9, 16]}
            onClose={popNav}
            onCreate={createScreen}
            visible={topNav.type === NAV.ADD_SCREEN}
          />

          {editingMarker && (
            <NewPinForm
              key={editingMarker.id}
              mode="edit"
              title={t("pin.editMarker")}
              confirmLabel={t("pin.save")}
              initialValues={{
                name: editingMarker.name,
                emoji: editingMarker.emoji,
                color: editingMarker.color,
                image: editingMarker.image,
              }}
              onClose={() => setEditingMarker(null)}
              onSave={(values) => {
                saveMarkerEdits(editingMarker, values);
                setEditingMarker(null);
              }}
            />
          )}

          {editingField && (
            <NewPinForm
              key={editingField.id}
              mode="editField"
              title={t("pin.editField")}
              confirmLabel={t("pin.save")}
              showColor={false}
              initialValues={{
                name: editingField.name,
                emoji: editingField.emoji,
                image: editingField.image,
              }}
              onClose={() => setEditingField(null)}
              onSave={(values) => {
                saveFieldEdits(editingField, values);
                setEditingField(null);
              }}
            />
          )}

          {placementConfirm && (
            <InfoDialog
              message={t("app.placementAdded", {
                title: placementConfirm.title,
                marker: placementConfirm.markerName,
              })}
              onClose={() => setPlacementConfirm(null)}
            />
          )}

          {pendingDelete && (
            <ConfirmDialog
              message={t("app.deleteMarker", { name: pendingDelete.name })}
              confirmLabel={t("confirm.delete")}
              onCancel={() => setPendingDelete(null)}
              onConfirm={() => {
                deleteMarker(pendingDelete.id);
                setPendingDelete(null);
                setEditMode(false);
                setEditAction("none");
              }}
            />
          )}

          {pendingDeleteField && (
            <ConfirmDialog
              message={t("app.deleteField", { name: pendingDeleteField.name })}
              confirmLabel={t("confirm.delete")}
              onCancel={() => setPendingDeleteField(null)}
              onConfirm={() => {
                deleteField(pendingDeleteField.id);
                setPendingDeleteField(null);
              }}
            />
          )}

          {pendingResetBg && (
            <ConfirmDialog
              message={t("app.clearBg")}
              confirmLabel={t("confirm.clear")}
              confirmColor={RED}
              onCancel={() => setPendingResetBg(false)}
              onConfirm={() => {
                updateScreenImage(currentId, null);
                setPendingResetBg(false);
              }}
            />
          )}

          {showExitConfirm && (
            <ConfirmDialog
              message={t("app.exit")}
              confirmLabel={t("confirm.exit")}
              confirmColor={BLUE}
              onCancel={() => setShowExitConfirm(false)}
              onConfirm={() => { setShowExitConfirm(false); BackHandler.exitApp(); }}
            />
          )}

          {taskDetailData && (
            <TaskDetailOverlay
              key={taskDetailData.task.id}
              task={taskDetailData.task}
              markerColor={taskDetailData.marker ? taskDetailData.marker.color : "#B08968"}
              markerName={taskDetailData.marker ? taskDetailData.marker.name : t("common.free")}
              screenName={taskDetailData.screen.name}
              onBack={() => setTaskDetail(null)}
              onRename={renameTask}
              onAddNote={addNoteGlobal}
              onRemoveNote={removeNoteGlobal}
              onToggleNote={toggleNoteGlobal}
              onIncrementRepeat={() => {
                if (taskDetailData.isSticker) {
                  incrementStickerRepeat(taskDetailData.screen.id, taskDetailData.task.id);
                } else {
                  incrementRepeat(taskDetailData.screen.id, taskDetailData.marker.id, taskDetailData.task.id);
                }
              }}
              onDecrementRepeat={() => {
                if (taskDetailData.isSticker) {
                  decrementStickerRepeat(taskDetailData.screen.id, taskDetailData.task.id);
                } else {
                  decrementRepeat(taskDetailData.screen.id, taskDetailData.marker.id, taskDetailData.task.id);
                }
              }}
              onDelete={deleteTaskFromDetail}
              onComplete={completeTaskFromDetail}
              onUncomplete={uncompleteTaskFromDetail}
            />
          )}

          {showOnboarding && (
            <Overlay zIndex={200}>
              <OnboardingOverlay onDone={finishOnboarding} />
            </Overlay>
          )}

          <SideMenu
            visible={showSideMenu}
            onClose={() => setShowSideMenu(false)}
            onAction={handleSideMenuAction}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: bar }}>
        <BottomBar onAction={handleBottomAction} />
      </SafeAreaView>
    </View>
  );
}
