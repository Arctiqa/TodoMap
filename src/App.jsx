import React, { useState, useMemo, useReducer, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, PanResponder, StatusBar, Image, BackHandler } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { GREEN, BLUE, THEME_BG } from "./theme/palettes";
import { useQuestStore } from "./state/useQuestStore";
import { navReducer, NAV } from "./state/navigation";
import { activeEntries, historyEntries, findEntry } from "./state/selectors";

import { BottomBar } from "./components/BottomBar";
import { SideMenu } from "./components/SideMenu";
import { Pin } from "./components/Pin";
import { MarkerPickerModal } from "./components/MarkerPickerModal";
import { InfoDialog } from "./components/ui/InfoDialog";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { NewPinForm } from "./components/forms/NewPinForm";

import { TaskScreen } from "./screens/TaskScreen";
import { JournalList } from "./screens/JournalList";
import { JournalDetail } from "./screens/JournalDetail";
import { HistoryList } from "./screens/HistoryList";
import { OthersList } from "./screens/OthersList";
import { GuidesListOverlay } from "./screens/GuidesListOverlay";
import { GuideTasksOverlay } from "./screens/GuideTasksOverlay";
import { TitlesOverlay } from "./screens/TitlesOverlay";
import { TitleUnlockDialog } from "./screens/TitleUnlockDialog";
import { ThemePickerOverlay } from "./screens/ThemePickerOverlay";

import { nextId } from "./utils/id";
import { requestNotificationPermission, scheduleTaskNotifications, cancelTaskNotifications } from "./utils/notifications";

import { resolveImageSource, DOM_DEFAULT_BG, MAP_DEFAULT_BG } from "./data/initialScreens";
import { SHARE_API, SHARE_POOL_KEY, RANDOM_REPEAT_MIN, RANDOM_REPEAT_SPAN } from "./constants/config";
import { GUIDE_CHAINS, GUIDE_TITLES } from "./constants/guides";

// ============ Корневой App: только тема ============
export default function App() {
  const [themeName, setThemeName] = useState("light");

  useEffect(() => {
    AsyncStorage.getItem("questmap_theme")
      .then((v) => v && setThemeName(v))
      .catch((e) => console.warn("QuestMap: тема не загрузилась", e));
  }, []);

  const handleThemeChange = useCallback((key) => {
    setThemeName(key);
    AsyncStorage.setItem("questmap_theme", key).catch((e) => console.warn("QuestMap: тема не сохранилась", e));
  }, []);

  return (
    <ThemeProvider name={themeName}>
      <AppShell onThemeChange={handleThemeChange} />
    </ThemeProvider>
  );
}

// ============ Всё приложение ============
function AppShell({ onThemeChange }) {
  const { name: themeName, ink, paper, bar } = useTheme();
  const [showSideMenu, setShowSideMenu] = useState(false);

  const {
    state, setScreens, updateScreen, setTopLevelOrder, setHistory,
    setGuideProgress, setGuideUsedOffers, setGuideTakenCount, setSharedPool,
  } = useQuestStore();

  const { screens, topLevelOrder, historyLog, guideProgress, guideUsedOffers, guideTakenCount, sharedPool, loaded } = state;

  // ---- Навигация: стек для оверлеев ----
  const [navStack, navDispatch] = useReducer(navReducer, [{ type: NAV.ROOT }]);
  const pushNav = useCallback((navType, payload) => navDispatch({ type: "PUSH", navType, payload }), []);
  const popNav = useCallback(() => navDispatch({ type: "POP" }), []);
  const resetNav = useCallback(() => navDispatch({ type: "RESET" }), []);

  // ---- Текущий экран карты: ОТДЕЛЬНО от стека ----
  const [currentId, setCurrentId] = useState("main");

  const topNav = navStack[navStack.length - 1];
  const [editMode, setEditMode] = useState(false);
  const [editAction, setEditAction] = useState("none");

  const screen = screens[currentId];
  const activeTaskId = topNav.type === NAV.TASK ? topNav.payload.markerId : null;
  const activeMarker = activeTaskId ? (screen.markers || []).find((m) => m.id === activeTaskId) : null;

  // ---- Локальные оверлеи ----
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingDeleteField, setPendingDeleteField] = useState(null);
  const [placementConfirm, setPlacementConfirm] = useState(null);
  const [titleUnlock, setTitleUnlock] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [journalDetail, setJournalDetail] = useState(null);

  // ---- Back ----
  const navRef = useRef(navStack);
  navRef.current = navStack;
  const overlayRef = useRef({});
  overlayRef.current = {
    placementConfirm, titleUnlock, pendingDeleteField, pendingDelete,
    pendingPlacement, showExitConfirm, journalDetail, showSideMenu,
  };

  const cancelPendingPlacement = useCallback(() => {
    setPendingPlacement(null);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    requestNotificationPermission();
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const allTasks = [];
    Object.values(screens).forEach((scr) => {
      (scr.markers || []).forEach((mk) => {
        (mk.tasks || []).forEach((t) => {
          if (!t.done && t.due) allTasks.push(t);
        });
      });
    });
    allTasks.forEach(scheduleTaskNotifications);
  }, [loaded]);

  useEffect(() => {
    const onBackPress = () => {
      const o = overlayRef.current;
      if (o.showSideMenu) { setShowSideMenu(false); return true; }
      if (o.placementConfirm) { setPlacementConfirm(null); return true; }
      if (o.titleUnlock) { setTitleUnlock(null); return true; }
      if (o.pendingDeleteField) { setPendingDeleteField(null); return true; }
      if (o.pendingDelete) { setPendingDelete(null); return true; }
      if (o.pendingPlacement) { cancelPendingPlacement(); return true; }
      if (o.journalDetail) { setJournalDetail(null); return true; }

      const stack = navRef.current;
      if (stack.length > 1) { navDispatch({ type: "POP" }); return true; }
      if (editMode) { setEditMode(false); return true; }
      if (currentId !== "main") {
        const parent = screens[currentId]?.parentId || "main";
        setCurrentId(parent);
        return true;
      }
      setShowExitConfirm(true);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [editMode, currentId, screens, cancelPendingPlacement]);

  // ---- Архив ----
  const archiveTasks = (scr, mk) => {
    const entries = (mk.tasks || []).map((task) => ({
      screenId: scr.id, screenName: scr.name, markerId: mk.id, markerName: mk.name,
      markerEmoji: mk.emoji, markerColor: mk.color, task, removedAt: Date.now(),
    }));
    if (entries.length) {
      (mk.tasks || []).forEach((t) => cancelTaskNotifications(t.id));
      setHistory((prev) => [...prev, ...entries]);
    }
  };
  const archiveScreen = (scr) => (scr.markers || []).forEach((mk) => archiveTasks(scr, mk));

  // ---- Открытие ----
  const handleOpen = (marker) => {
    if (marker.linkTo) {
      setEditMode(false);
      setCurrentId(marker.linkTo);
      return;
    }
    pushNav(NAV.TASK, { markerId: marker.id });
  };

  const handleDragMove = useCallback((markerId, x, y) => {
    updateScreen(currentId, (s) => ({ ...s, markers: s.markers.map((m) => (m.id === markerId ? { ...m, x, y } : m)) }));
  }, [currentId, updateScreen]);

  // ---- Задания ----
  const bumpGuideProgress = (guideKey) => {
    setGuideProgress((prev) => {
      const next = { ...prev, [guideKey]: (prev[guideKey] || 0) + 1 };
      const tiers = GUIDE_TITLES[guideKey];
      if (tiers && tiers[next[guideKey]]) setTitleUnlock(tiers[next[guideKey]]);
      return next;
    });
  };

  const toggleTask = (markerId, taskId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.done) {
      cancelTaskNotifications(task.id);
    } else {
      scheduleTaskNotifications(task);
    }

    const shouldAward = !!(task && !task.done && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
    if (shouldAward) bumpGuideProgress(task.source);

    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => m.id === markerId
        ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done, titleAwarded: shouldAward ? true : t.titleAwarded } : t)) }
        : m),
    }));
  };

  const incrementRepeat = (markerId, taskId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (!task || !task.repeat || task.done) return;
    const nextCount = Math.min(task.repeat.target, task.repeat.count + 1);
    const willFinish = nextCount >= task.repeat.target;

    if (willFinish) {
      cancelTaskNotifications(task.id);
    }

    const shouldAward = !!(willFinish && !task.titleAwarded && task.source && GUIDE_TITLES[task.source]);
    if (shouldAward) bumpGuideProgress(task.source);
    updateScreen(currentId, (s) => ({
      ...s,
      markers: s.markers.map((m) => m.id === markerId
        ? { ...m, tasks: m.tasks.map((t) => t.id === taskId
            ? { ...t, repeat: { ...t.repeat, count: nextCount }, done: willFinish, titleAwarded: shouldAward ? true : t.titleAwarded }
            : t) }
        : m),
    }));
  };

  const addTaskCore = (screenId, markerId, payload) => {
    const newTask = {
      id: nextId(),
      title: payload.title,
      due: payload.due || null,
      done: false,
      notes: (payload.notes || []).map((t) => (typeof t === "string" ? { text: t, done: false } : t)),
      createdAt: Date.now(),
      source: payload.source || undefined,
      repeat: payload.repeat || null,
    };

    setScreens((prev) => {
      const scr = prev[screenId];
      if (!scr) return prev;
      return {
        ...prev,
        [screenId]: {
          ...scr,
          markers: scr.markers.map((m) =>
            m.id === markerId
              ? { ...m, tasks: [...(m.tasks || []), newTask] }
              : m
          ),
        },
      };
    });

    scheduleTaskNotifications(newTask);
  };

  // ---- Гиды ----
  const openGuide = (guideKey) => { pushNav(NAV.GUIDE_TASKS, { guideKey }); };

  const nextChainOfferFor = (guideKey) => {
    const chain = GUIDE_CHAINS[guideKey] || [];
    return chain.find((o) => !guideUsedOffers.includes(o.id)) || null;
  };

  const takeChainOffer = (guideKey, offer) => {
    if (guideUsedOffers.includes(offer.id)) return;
    setGuideUsedOffers((prev) => (prev.includes(offer.id) ? prev : [...prev, offer.id]));
    setGuideTakenCount((prev) => ({ ...prev, [guideKey]: (prev[guideKey] || 0) + 1 }));
    setPendingPlacement({ title: offer.taskTitle, due: null, notes: offer.starterNotes || [], source: guideKey, repeat: null });
    popNav();
  };

  const takeCustomInstead = (guideKey, text) => {
    setPendingPlacement({ title: text, due: null, notes: [], source: undefined, repeat: null });
    popNav();
  };

  const takeGuideRandom = (title) => {
    if (!title) return;
    const guideKey = topNav.payload.guideKey;
    setGuideTakenCount((prev) => ({ ...prev, [guideKey]: (prev[guideKey] || 0) + 1 }));
    const target = RANDOM_REPEAT_MIN + Math.floor(Math.random() * RANDOM_REPEAT_SPAN);
    setPendingPlacement({ title, due: null, notes: [], source: guideKey, repeat: { count: 0, target } });
  };

  const placeTask = (screenId, markerId) => {
    if (!pendingPlacement) return;
    addTaskCore(screenId, markerId, {
      title: pendingPlacement.title, due: pendingPlacement.due, notes: pendingPlacement.notes,
      source: pendingPlacement.source, repeat: pendingPlacement.repeat,
    });
    const mk = screens[screenId]?.markers.find((m) => m.id === markerId);
    setPlacementConfirm({ title: pendingPlacement.title, markerName: mk ? mk.name : "" });
    setPendingPlacement(null);
  };

  // ---- Шаринг ----
  const loadSharedPool = async () => {
    if (SHARE_API.baseUrl) {
      try { const res = await fetch(`${SHARE_API.baseUrl}/pool`); setSharedPool(await res.json()); return; }
      catch (e) { console.warn("QuestMap: сервер недоступен", e); }
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
    } catch (e) { console.warn("QuestMap: пул не загрузился", e); setSharedPool([]); }
  };

  const shareTaskToPool = async (title, due) => {
    if (SHARE_API.baseUrl) {
      try {
        await fetch(`${SHARE_API.baseUrl}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, due }) });
        return;
      } catch (e) { console.warn("QuestMap: сервер недоступен, сохраняю локально", e); }
    }
    try {
      const raw = await AsyncStorage.getItem(SHARE_POOL_KEY);
      const items = raw ? JSON.parse(raw) : [];
      items.push({ title, due });
      await AsyncStorage.setItem(SHARE_POOL_KEY, JSON.stringify(items));
    } catch (e) { console.warn("QuestMap: не сохранилось в пул", e); }
  };

  // ---- CRUD ----
  const deleteTask = (markerId, taskId) => {
    cancelTaskNotifications(taskId);
    const marker = screen.markers.find((m) => m.id === markerId);
    const task = marker && marker.tasks.find((t) => t.id === taskId);
    if (marker && task) {
      setHistory((prev) => [...prev, { screenId: currentId, screenName: screen.name, markerId: marker.id, markerName: marker.name, markerEmoji: marker.emoji, markerColor: marker.color, task, removedAt: Date.now() }]);
    }
    updateScreen(currentId, (s) => ({ ...s, markers: s.markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) } : m)) }));
  };

  const addNoteLocal = (markerId, taskId, text) => {
    updateScreen(currentId, (s) => ({ ...s, markers: s.markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: [...(t.notes || []), { text, done: false }] } : t)) } : m)) }));
  };
  const removeNoteLocal = (markerId, taskId, idx) => {
    updateScreen(currentId, (s) => ({ ...s, markers: s.markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.filter((_, i) => i !== idx) } : t)) } : m)) }));
  };
  const toggleNoteLocal = (markerId, taskId, idx) => {
    updateScreen(currentId, (s) => ({ ...s, markers: s.markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.map((n, i) => (i === idx ? { ...n, done: !n.done } : n)) } : t)) } : m)) }));
  };

  const createMarker = ({ name, emoji, color, type, image, asField }) => {
    if (asField) {
      const newScreenId = `s${nextId()}`;
      const markerId = `m${nextId()}`;
      setScreens((prev) => ({
        ...prev,
        [currentId]: { ...prev[currentId], markers: [...prev[currentId].markers, { id: markerId, name, emoji, color, type: type || "general", image: image || null, x: 50, y: 50, linkTo: newScreenId }] },
        [newScreenId]: { id: newScreenId, name: `${emoji} ${name.toUpperCase()} — ДЕЛА`, theme: "city", parentId: currentId, markers: [] },
      }));
    } else {
      updateScreen(currentId, (s) => ({ ...s, markers: [...s.markers, { id: `m${nextId()}`, name, emoji, color, type: type || "general", image: image || null, x: 50, y: 50, tasks: [] }] }));
    }
    popNav();
  };

  const createScreen = ({ name, emoji, image }) => {
    const newId = `s${nextId()}`;
    setScreens((prev) => ({ ...prev, [newId]: { id: newId, name: `${emoji} ${name.toUpperCase()}`, theme: "city", image: image || null, parentId: null, markers: [] } }));
    setTopLevelOrder((prev) => [...prev, newId]);
    popNav();
    setEditMode(false);
    setCurrentId(newId);
  };

  const updateScreenImage = (screenId, uri) => {
    setScreens((prev) => ({ ...prev, [screenId]: { ...prev[screenId], image: uri } }));
  };

  const pickBackgroundImage = async (screenId) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [9, 16] });
    if (!result.canceled && result.assets && result.assets[0]) {
      const src = result.assets[0].uri;
      const ext = src.split(".").pop() || "jpg";
      const dst = `${FileSystem.documentDirectory}bg_${Date.now()}.${ext}`;
      try { await FileSystem.copyAsync({ from: src, to: dst }); updateScreenImage(screenId, dst); }
      catch (e) { console.warn("QuestMap: фон не скопирован", e); updateScreenImage(screenId, src); }
    }
  };

  const deleteField = (id) => {
    const scr = screens[id];
    if (scr) archiveScreen(scr);
    setScreens((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setTopLevelOrder((prev) => prev.filter((x) => x !== id));
    if (currentId === id) setCurrentId("main");
  };

  const deleteMarker = (markerId) => {
    const marker = screen.markers.find((m) => m.id === markerId);
    if (marker) archiveTasks(screen, marker);
    if (marker && marker.linkTo && screens[marker.linkTo]) archiveScreen(screens[marker.linkTo]);
    setScreens((prev) => {
      const next = { ...prev, [currentId]: { ...prev[currentId], markers: prev[currentId].markers.filter((m) => m.id !== markerId) } };
      if (marker && marker.linkTo && next[marker.linkTo]) delete next[marker.linkTo];
      return next;
    });
  };

  // ---- Селекторы ----
  const active = useMemo(() => activeEntries(screens), [screens]);
  const history = useMemo(() => historyEntries(screens, historyLog), [screens, historyLog]);
  const journalDetailEntry = useMemo(() => findEntry(screens, journalDetail), [screens, journalDetail]);

  const hardDeleteEntry = (entry) => {
    if (entry.removedAt) {
      setHistory((prev) => prev.filter((e) => !(e.task.id === entry.task.id && e.removedAt === entry.removedAt)));
    } else {
      cancelTaskNotifications(entry.task.id);
      setScreens((prev) => {
        const scr = prev[entry.screenId];
        if (!scr) return prev;
        return { ...prev, [entry.screenId]: { ...scr, markers: scr.markers.map((m) => (m.id === entry.markerId ? { ...m, tasks: m.tasks.filter((t) => t.id !== entry.task.id) } : m)) } };
      });
    }
  };

  const addNoteGlobal = (text) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({ ...prev, [screenId]: { ...prev[screenId], markers: prev[screenId].markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: [...(t.notes || []), { text, done: false }] } : t)) } : m)) } }));
  };
  const removeNoteGlobal = (idx) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({ ...prev, [screenId]: { ...prev[screenId], markers: prev[screenId].markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.filter((_, i) => i !== idx) } : t)) } : m)) } }));
  };
  const toggleNoteGlobal = (idx) => {
    if (!journalDetail) return;
    const { screenId, markerId, taskId } = journalDetail;
    setScreens((prev) => ({ ...prev, [screenId]: { ...prev[screenId], markers: prev[screenId].markers.map((m) => (m.id === markerId ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.map((n, i) => (i === idx ? { ...n, done: !n.done } : n)) } : t)) } : m)) } }));
  };

  // ---- Свайп ----
  const siblings = topLevelOrder.includes(currentId) ? { list: topLevelOrder, index: topLevelOrder.indexOf(currentId) } : { list: [], index: -1 };
  const goSibling = useCallback((dir) => {
    const target = topLevelOrder[topLevelOrder.indexOf(currentId) + dir];
    if (target) setCurrentId(target);
  }, [topLevelOrder, currentId]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, g) => !editMode && Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (evt, g) => {
      if (editMode) return;
      if (g.dx < -60) goSibling(1);
      else if (g.dx > 60) goSibling(-1);
    },
  }), [editMode, goSibling]);

  // ---- Нижнее меню ----
  const handleBottomAction = (action) => {
    switch (action) {
      case "menu":
        setShowSideMenu(true);
        break;
      case "journal":
        pushNav(NAV.JOURNAL);
        break;
      case "history":
        pushNav(NAV.HISTORY);
        break;
      case "others":
        pushNav(NAV.OTHERS);
        loadSharedPool();
        break;
    }
  };

  // ---- Боковое меню ----
  const handleSideMenuAction = (key) => {
    setShowSideMenu(false);

    switch (key) {
      case "add-marker":
        pushNav(NAV.ADD_MARKER);
        break;
      case "add-field":
        pushNav(NAV.ADD_SCREEN);
        break;
      case "edit-mode":
        resetNav();
        setEditMode(true);
        break;
      case "change-bg":
        pickBackgroundImage(currentId);
        break;
      case "reset-bg":
        if (currentId === "main" || currentId === "home") {
          updateScreenImage(currentId, currentId === "main" ? MAP_DEFAULT_BG : DOM_DEFAULT_BG);
        }
        break;
      case "guides":
        pushNav(NAV.GUIDES_LIST);
        break;
      case "titles":
        pushNav(NAV.TITLES);
        break;
      case "settings":
        pushNav(NAV.THEME_PICKER);
        break;
    }
  };

  // ---- Верхний оверлей из стека ----
  const renderTopNav = () => {
    switch (topNav.type) {
      case NAV.TASK:
        return activeMarker ? (
          <TaskScreen
            marker={activeMarker} onClose={popNav} onToggle={toggleTask}
            onAdd={(markerId, title, due, repeat) => addTaskCore(currentId, markerId, { title, due, repeat })}
            onDelete={deleteTask} onAddNote={addNoteLocal} onRemoveNote={removeNoteLocal}
            onToggleNote={toggleNoteLocal} onShare={shareTaskToPool} onIncrementRepeat={incrementRepeat}
          />
        ) : null;
      case NAV.ADD_MARKER:
        return <NewPinForm title="Новая метка" confirmLabel="Добавить метку" showPlaceHints={currentId !== "home"} onClose={popNav} onCreate={createMarker} />;
      case NAV.ADD_SCREEN:
        return <NewPinForm title="Новое поле" confirmLabel="Создать поле" showColor={false} imageAspect={[9, 16]} onClose={popNav} onCreate={createScreen} />;
      case NAV.JOURNAL:
        return <JournalList entries={active} onClose={popNav} onOpenDetail={(e) => setJournalDetail({ screenId: e.screenId, markerId: e.markerId, taskId: e.task.id })} />;
      case NAV.HISTORY:
		return <HistoryList entries={history} onClose={popNav} onDeleteEntry={hardDeleteEntry} />;
      case NAV.OTHERS:
        return <OthersList pool={sharedPool} onClose={popNav} onRefresh={loadSharedPool} onTake={(p) => { setPendingPlacement({ title: p.title, due: p.due || null, notes: [], source: undefined }); popNav(); }} />;
      case NAV.TITLES:
        return <TitlesOverlay guideProgress={guideProgress} onClose={popNav} />;
      case NAV.THEME_PICKER:
        return <ThemePickerOverlay current={themeName} onSelect={(key) => { onThemeChange(key); popNav(); }} onClose={popNav} />;
      case NAV.GUIDES_LIST:
        return <GuidesListOverlay onSelect={(key) => { popNav(); openGuide(key); }} onClose={popNav} />;
      case NAV.GUIDE_TASKS:
        return (
          <GuideTasksOverlay
            guideKey={topNav.payload.guideKey}
            chainOffer={nextChainOfferFor(topNav.payload.guideKey)}
            takenCount={guideTakenCount[topNav.payload.guideKey]}
            onTakeChain={(offer) => takeChainOffer(topNav.payload.guideKey, offer)}
            onCustom={(text) => takeCustomInstead(topNav.payload.guideKey, text)}
            onTakeRandom={takeGuideRandom}
            onBack={() => { popNav(); pushNav(NAV.GUIDES_LIST); }}
            onClose={popNav}
          />
        );
      default:
        return null;
    }
  };

  if (!loaded) return null;
  if (!screen) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paper }} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Шапка */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1.5, borderColor: ink, backgroundColor: bar }}>
        {screen.parentId ? (
          <Pressable onPress={() => { setEditMode(false); setCurrentId(screen.parentId); }} style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 46 }}>
            <Text>← Карта</Text>
          </Pressable>
        ) : <View style={{ width: 46 }} />}
        <Text style={{ fontSize: 16, fontWeight: "bold", color: ink, textAlign: "center", flex: 1 }} numberOfLines={1}>{screen.name}</Text>
        <View style={{ width: 46 }} />
      </View>

      {/* Карта */}
      <View {...swipeResponder.panHandlers} style={{ flex: 1, backgroundColor: THEME_BG[screen.theme || "terrain"] }} onLayout={(e) => setMapSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {screen.image && <Image source={resolveImageSource(screen.image)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />}
        {screen.markers.map((m) => (
          <Pin key={m.id} marker={m} editMode={editMode} editAction={editAction} containerSize={mapSize} onOpen={handleOpen} onDragMove={handleDragMove} onDelete={(mk) => setPendingDelete(mk)} />
        ))}

        {!editMode && siblings.index > 0 && (
          <Pressable onPress={() => goSibling(-1)} style={{ position: "absolute", left: 10, top: "50%", marginTop: -17, width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: GREEN, fontWeight: "bold", fontSize: 18 }}>‹</Text>
          </Pressable>
        )}
        {!editMode && siblings.index !== -1 && siblings.index < siblings.list.length - 1 && (
          <Pressable onPress={() => goSibling(1)} style={{ position: "absolute", right: 10, top: "50%", marginTop: -17, width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: GREEN, fontWeight: "bold", fontSize: 18 }}>›</Text>
          </Pressable>
        )}

        {renderTopNav()}

        {journalDetail && journalDetailEntry && topNav.type === NAV.JOURNAL && (
          <JournalDetail
            entry={journalDetailEntry} onBack={() => setJournalDetail(null)}
            onClose={() => { setJournalDetail(null); popNav(); }}
            onAddNote={addNoteGlobal} onRemoveNote={removeNoteGlobal} onToggleNote={toggleNoteGlobal}
          />
        )}

        {titleUnlock && <TitleUnlockDialog title={titleUnlock} onClose={() => setTitleUnlock(null)} />}
        {pendingPlacement && <MarkerPickerModal screens={screens} onClose={cancelPendingPlacement} onPick={(screenId, markerId) => placeTask(screenId, markerId)} />}
        {placementConfirm && <InfoDialog message={`«${placementConfirm.title}» добавлено в «${placementConfirm.markerName}».`} onClose={() => setPlacementConfirm(null)} />}
        {pendingDelete && <ConfirmDialog message={`Удалить метку «${pendingDelete.name}»?`} onCancel={() => setPendingDelete(null)} onConfirm={() => { deleteMarker(pendingDelete.id); setPendingDelete(null); }} />}
        {pendingDeleteField && <ConfirmDialog message={`Удалить поле «${pendingDeleteField.name}» вместе со всеми метками?`} onCancel={() => setPendingDeleteField(null)} onConfirm={() => { deleteField(pendingDeleteField.id); setPendingDeleteField(null); }} />}
        {showExitConfirm && <ConfirmDialog message="Выйти из приложения?" confirmLabel="Выйти" confirmColor={BLUE} onCancel={() => setShowExitConfirm(false)} onConfirm={() => { setShowExitConfirm(false); BackHandler.exitApp(); }} />}
      </View>

      {/* Нижнее меню или панель редактирования */}
      {editMode ? (
        <View style={{ backgroundColor: bar, paddingTop: 8, paddingBottom: 10, paddingHorizontal: 10, shadowColor: ink, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
            <Pressable onPress={() => pushNav(NAV.ADD_MARKER)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1.5, borderColor: ink }}>
              <Text style={{ fontSize: 16 }}>＋</Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: ink, marginTop: 2 }}>Метка</Text>
            </Pressable>
            <Pressable onPress={() => pushNav(NAV.ADD_SCREEN)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1.5, borderColor: ink }}>
              <Text style={{ fontSize: 16 }}>▤</Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: ink, marginTop: 2 }}>Поле</Text>
            </Pressable>
            <Pressable onPress={() => setEditAction((a) => (a === "delete" ? "none" : "delete"))} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14, backgroundColor: editAction === "delete" ? ink : "#fff", borderWidth: 1.5, borderColor: ink }}>
              <Text style={{ fontSize: 16 }}>🗑</Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: editAction === "delete" ? "#fff" : ink, marginTop: 2 }}>Удалить</Text>
            </Pressable>
            <Pressable onPress={() => setEditMode(false)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 14, backgroundColor: GREEN, borderWidth: 1.5, borderColor: ink }}>
              <Text style={{ fontSize: 16 }}>✓</Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#fff", marginTop: 2 }}>Готово</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <BottomBar onAction={handleBottomAction} />
      )}

      {/* Боковое меню */}
      <SideMenu
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onAction={handleSideMenuAction}
      />
    </SafeAreaView>
  );
}