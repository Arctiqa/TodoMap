import React, { useState, useMemo, useReducer, useEffect, useCallback } from "react";
import { View, Text, Pressable, StatusBar, Image, BackHandler, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { GREEN, BLUE, RED } from "./theme/palettes";
import { useQuestStore } from "./state/useQuestStore";
import { navReducer, NAV } from "./state/navigation";
import { activeEntries, expiredEntries, doneEntries, historyEntries } from "./state/selectors";

import { BottomBar } from "./components/BottomBar";
import { SideMenu } from "./components/SideMenu";
import { Pin } from "./components/Pin";
import { MarkerPickerModal } from "./components/MarkerPickerModal";
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
import { TitlesOverlay } from "./screens/TitlesOverlay";
import { TitleUnlockDialog } from "./screens/TitleUnlockDialog";
import { ThemePickerOverlay } from "./screens/ThemePickerOverlay";
import { BackgroundPickerOverlay } from "./screens/BackgroundPickerOverlay";
import { TaskDetailOverlay } from "./screens/TaskDetailOverlay";
import { OnboardingOverlay } from "./screens/OnboardingOverlay";

import { screenTitle } from "./utils/text";
import { cancelTaskNotifications } from "./utils/notifications";
import { resolveImageSource, DOM_DEFAULT_BG, MAP_DEFAULT_BG } from "./data/initialScreens";

// Хуки
import { useOverlayState } from "./hooks/useOverlayState";
import { useKeyboardOffset } from "./hooks/useKeyboardOffset";
import { useThoughts } from "./hooks/useThoughts";
import { useJournalActions } from "./hooks/useJournalActions";
import { useGuides } from "./hooks/useGuides";
import { useSharedPool } from "./hooks/useSharedPool";
import { useTasks } from "./hooks/useTasks";
import { useScreens } from "./hooks/useScreens";
import { useSlide } from "./hooks/useSlide";
import { useNotifications } from "./hooks/useNotifications";
import { useBackHandler } from "./hooks/useBackHandler";

// ============ Корневой App ============
export default function App() {
  const [themeName, setThemeName] = useState("light");

  useEffect(() => {
    AsyncStorage.getItem("questmap_theme")
      .then((v) => v && setThemeName(v))
      .catch((e) => console.warn("QuestMap: тема не загрузилась", e));
  }, []);

  const handleThemeChange = useCallback((key) => {
    setThemeName(key);
    AsyncStorage.setItem("questmap_theme", key).catch((e) =>
      console.warn("QuestMap: тема не сохранилась", e)
    );
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider name={themeName}>
        <AppShell onThemeChange={handleThemeChange} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ============ AppShell ============
function AppShell({ onThemeChange }) {
  const { name: themeName, ink, paper, card, bar, fieldBg } = useTheme();

  const store = useQuestStore();
  const {
    state, setScreens, updateScreen, setTopLevelOrder, setHistory, setThoughts,
    setGuideProgress, setGuideUsedOffers, setGuideTakenCount, setSharedPool,
  } = store;
  const {
    screens, topLevelOrder, historyLog, thoughts,
    guideProgress, guideUsedOffers, guideTakenCount, sharedPool, loaded,
  } = state;

  // Онбординг — после loaded
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.getItem("questmap_onboarded_v1")
      .then((v) => { if (!v) setShowOnboarding(true); })
      .catch(() => {});
  }, [loaded]);

  const finishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    AsyncStorage.setItem("questmap_onboarded_v1", "1").catch(() => {});
  }, []);

  // Навигация
  const [navStack, navDispatch] = useReducer(navReducer, [{ type: NAV.ROOT }]);
  const pushNav = useCallback((navType, payload) => navDispatch({ type: "PUSH", navType, payload }), []);
  const popNav = useCallback(() => navDispatch({ type: "POP" }), []);
  const resetNav = useCallback(() => navDispatch({ type: "RESET" }), []);
  const topNav = navStack[navStack.length - 1];

  // Текущее поле
  const [currentId, setCurrentId] = useState("main");
  const screen = screens[currentId];

  // UI-состояние
  const overlay = useOverlayState();
  const {
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
  } = overlay;

  const openTaskDetail = useCallback((task, marker, screenId) => {
    setTaskDetail({
      taskId: task.id,
      markerId: marker.id,
      screenId,
    });
  }, [setTaskDetail]);

  const taskDetailData = useMemo(() => {
    if (!taskDetail) return null;
    const scr = screens[taskDetail.screenId];
    if (!scr) return null;
    const mk = scr.markers.find((m) => m.id === taskDetail.markerId);
    if (!mk) return null;
    const t = mk.tasks.find((x) => x.id === taskDetail.taskId);
    if (!t) return null;
    return { task: t, marker: mk, screen: scr };
  }, [taskDetail, screens]);

  // Переименование
  const renameTask = useCallback((newTitle) => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t)) }
            : m
        ),
      },
    }));
  }, [taskDetail, setScreens]);

  // Пометки
  const addNoteGlobal = useCallback((text) => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: [...(t.notes || []), { text, done: false }] } : t)) }
            : m
        ),
      },
    }));
  }, [taskDetail, setScreens]);

  const removeNoteGlobal = useCallback((idx) => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.filter((_, i) => i !== idx) } : t)) }
            : m
        ),
      },
    }));
  }, [taskDetail, setScreens]);

  const toggleNoteGlobal = useCallback((idx) => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.map((n, i) => (i === idx ? { ...n, done: !n.done } : n)) } : t)) }
            : m
        ),
      },
    }));
  }, [taskDetail, setScreens]);

  const completeTaskFromDetail = useCallback(() => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: true, completedAt: Date.now() } : t)) }
            : m
        ),
      },
    }));
    setTaskDetail(null);
  }, [taskDetail, setScreens, setTaskDetail]);

  const uncompleteTaskFromDetail = useCallback(() => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: false, completedAt: null } : t)) }
            : m
        ),
      },
    }));
  }, [taskDetail, setScreens]);

  const deleteTaskFromDetail = useCallback(() => {
    if (!taskDetail) return;
    const { screenId, markerId, taskId } = taskDetail;
    cancelTaskNotifications(taskId);
    setScreens((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        markers: prev[screenId].markers.map((m) =>
          m.id === markerId
            ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
            : m
        ),
      },
    }));
    setTaskDetail(null);
  }, [taskDetail, setScreens, setTaskDetail]);

  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  const activeTaskId = topNav.type === NAV.TASK ? topNav.payload.markerId : null;
  const activeMarker = activeTaskId ? (screen.markers || []).find((m) => m.id === activeTaskId) : null;

  const keyboardOffset = useKeyboardOffset();

  const {
    bumpProgress: bumpGuideProgress,
    nextChainOfferFor,
    takeChainOffer,
    takeCustomInstead,
    takeRandom: takeGuideRandom,
    openGuide,
  } = useGuides({
    guideUsedOffers, setGuideUsedOffers,
    setGuideTakenCount, setGuideProgress,
    setTitleUnlock, setPendingPlacement,
    pushNav, popNav, topNav,
  });

  const {
    addTaskCore, toggleTask, incrementRepeat, decrementRepeat, deleteTask,
  } = useTasks({
    updateScreen, setScreens, setHistory,
    bumpGuideProgress,
  });

  const {
    createMarker, saveMarkerEdits, deleteMarker, handleDragMove,
    createScreen, saveFieldEdits, deleteField, updateScreenImage,
  } = useScreens({
    screens, screen, currentId, setScreens, updateScreen,
    setTopLevelOrder, setHistory, setEditMode, popNav, setCurrentId,
  });

  const {
    addOrUpdate: addOrUpdateThought,
    remove: deleteThought,
    convertToTask: convertThoughtToTask,
  } = useThoughts({ setThoughts, setPendingPlacement, popNav });

  const {
    returnToActive: returnTaskToActive,
    complete: completeTaskFromJournal,
    remove: deleteTaskFromJournal,
    hardDeleteArchive,
  } = useJournalActions({ setScreens, setHistory });

  const {
    load: loadSharedPool,
    share: shareTaskToPool,
  } = useSharedPool({ setSharedPool });

  const {
    slideX, swipeResponder, siblings, animateSlide,
  } = useSlide({ topLevelOrder, currentId, setCurrentId, editMode });

  useNotifications({ screens, loaded });

  useBackHandler({
    overlay: {
      ...overlay,
      pendingPlacement,
    },
    navStack, navDispatch,
    editMode, setEditMode, setEditAction,
    currentId, setCurrentId, screens,
    cancelPendingPlacement: () => setPendingPlacement(null),
  });

  const active = useMemo(() => activeEntries(screens), [screens]);
  const expired = useMemo(() => expiredEntries(screens), [screens]);
  const doneList = useMemo(() => doneEntries(screens), [screens]);
  const archive = useMemo(() => historyLog, [historyLog]);

  const handleOpen = useCallback((marker) => {
    if (marker.linkTo) {
      setEditMode(false);
      setCurrentId(marker.linkTo);
      return;
    }
    pushNav(NAV.TASK, { markerId: marker.id });
  }, [setEditMode, setCurrentId, pushNav]);

  const placeTask = useCallback((screenId, markerId) => {
    if (!pendingPlacement) return;
    addTaskCore(screenId, markerId, {
      title: pendingPlacement.title,
      due: pendingPlacement.due,
      notes: pendingPlacement.notes,
      source: pendingPlacement.source,
      repeat: pendingPlacement.repeat,
    });
    const mk = screens[screenId]?.markers.find((m) => m.id === markerId);
    setPlacementConfirm({ title: pendingPlacement.title, markerName: mk ? mk.name : "" });
    setPendingPlacement(null);
  }, [pendingPlacement, addTaskCore, screens, setPlacementConfirm, setPendingPlacement]);

  const handleAddTaskFromBar = useCallback(({ title, due, repeat, share }) => {
    setPendingPlacement({ title, due, notes: [], source: undefined, repeat });
    if (share) shareTaskToPool(title, due);
  }, [setPendingPlacement, shareTaskToPool]);

  const handleBottomAction = useCallback((action) => {
    switch (action) {
      case "menu": setShowSideMenu(true); break;
      case "journal": resetNav(); pushNav(NAV.JOURNAL); break;
      case "history": resetNav(); pushNav(NAV.HISTORY); break;
      case "others": resetNav(); pushNav(NAV.OTHERS); loadSharedPool(); break;
    }
  }, [setShowSideMenu, resetNav, pushNav, loadSharedPool]);

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
        setPendingResetBg(true);
        break;
      case "delete-field":
        if (topLevelOrder.includes(currentId) && currentId !== "main") {
          setPendingDeleteField(screen);
        }
        break;
      case "guides":
        resetNav(); pushNav(NAV.GUIDES_LIST); break;
      case "titles":
        resetNav(); pushNav(NAV.TITLES); break;
      case "settings":
        resetNav(); pushNav(NAV.SETTINGS); break;
    }
  }, [
    screen, currentId, topLevelOrder, resetNav, pushNav,
    setShowSideMenu, setEditMode, setEditAction,
    setEditingField, setPendingDeleteField, setPendingResetBg,
  ]);

  const renderTopNav = () => {
    switch (topNav.type) {
      case NAV.TASK:
        return activeMarker ? (
          <TaskScreen
            marker={activeMarker}
            onClose={popNav}
            onToggle={(markerId, taskId) => toggleTask(currentId, markerId, taskId)}
            onAdd={(markerId, title, due, repeat) => addTaskCore(currentId, markerId, { title, due, repeat })}
            onDelete={(markerId, taskId) => deleteTask(currentId, markerId, taskId)}
            onShare={shareTaskToPool}
            onIncrementRepeat={(markerId, taskId) => incrementRepeat(currentId, markerId, taskId)}
            onOpenDetail={(t) => openTaskDetail(t, activeMarker, currentId)}
          />
        ) : null;

      case NAV.JOURNAL:
        return (
          <JournalList
            active={active}
            expired={expired}
            done={doneList}
            archive={archive}
            thoughts={thoughts}
            onClose={popNav}
            onOpenDetail={(e) => {
              const scr = screens[e.screenId];
              const mk = scr?.markers.find((m) => m.id === e.markerId);
              if (mk) {
                openTaskDetail(e.task, mk, e.screenId);
              }
            }}
            onAddThought={addOrUpdateThought}
            onDeleteThought={deleteThought}
            onConvertThought={convertThoughtToTask}
            onReturnTask={returnTaskToActive}
            onCompleteTask={completeTaskFromJournal}
            onDeleteTask={deleteTaskFromJournal}
            onHardDeleteArchive={hardDeleteArchive}
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
              setPendingPlacement({ title: p.title, due: p.due || null, notes: [], source: undefined });
              popNav();
            }}
          />
        );

      case NAV.TITLES:
        return <TitlesOverlay guideProgress={guideProgress} onClose={popNav} />;

      case NAV.THEME_PICKER:
        return (
          <ThemePickerOverlay
            current={themeName}
            onSelect={(key) => onThemeChange(key)}
            onClose={popNav}
          />
        );

      case NAV.GUIDES_LIST:
        return (
          <GuidesListOverlay
            onSelect={(key) => { popNav(); openGuide(key); }}
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
            chainOffer={nextChainOfferFor(topNav.payload.guideKey)}
            takenCount={guideTakenCount[topNav.payload.guideKey]}
            onTakeChain={(offer) => takeChainOffer(topNav.payload.guideKey, offer)}
            onCustom={(text) => takeCustomInstead(topNav.payload.guideKey, text)}
            onTakeRandom={takeGuideRandom}
            onBack={() => { popNav(); pushNav(NAV.GUIDES_LIST); }}
            onClose={popNav}
          />
        );

      case NAV.SETTINGS:
        return (
          <SettingsOverlay
            onClose={popNav}
            onOpenTheme={() => pushNav(NAV.THEME_PICKER)}
            onOpenLanguage={() => {}}
            onOpenNotifications={() => {}}
            onOpenAbout={() => {}}
            exportData={{
              screens,
              historyLog,
              thoughts,
              guideProgress,
            }}
          />
        );

      default:
        return null;
    }
  };

  if (!screen) return null;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: paper,
        transform: [{ translateY: keyboardOffset }],
      }}
    >
      <SafeAreaView
        key={themeName}
        style={{ flex: 1, backgroundColor: fieldBg, overflow: "hidden" }}
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="dark-content" />

        {editMode && editAction === "delete" && (
          <Pressable
            onPress={() => { setEditMode(false); setEditAction("none"); }}
            style={{ backgroundColor: RED, paddingVertical: 6, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
              ТАПНИ МЕТКУ, ЧТОБЫ УДАЛИТЬ · НАЖМИ СЮДА, ЧТОБЫ ВЫЙТИ
            </Text>
          </Pressable>
        )}

        {editMode && editAction === "edit" && (
          <Pressable
            onPress={() => { setEditMode(false); setEditAction("none"); }}
            style={{ backgroundColor: BLUE, paddingVertical: 6, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
              ТАПНИ МЕТКУ, ЧТОБЫ РЕДАКТИРОВАТЬ · НАЖМИ СЮДА, ЧТОБЫ ВЫЙТИ
            </Text>
          </Pressable>
        )}

        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 16, paddingVertical: 12, backgroundColor: bar,
        }}>
          {screen.parentId ? (
            <Pressable
              onPress={() => { setEditMode(false); setCurrentId(screen.parentId); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 46 }}
            >
              <Text style={{ color: ink }}>← Карта</Text>
            </Pressable>
          ) : <View style={{ width: 46 }} />}
          <Text
            style={{ fontSize: 16, fontWeight: "bold", color: ink, textAlign: "center", flex: 1 }}
            numberOfLines={1}
          >
            {screenTitle(screen)}
          </Text>
          <View style={{ width: 46 }} />
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
                <Pressable onPress={() => animateSlide(1)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                  <MaterialIcons name="arrow-back" size={30} color={ink} />
                </Pressable>
              ) : <View style={{ width: 30 }} />}

              {siblings.index !== -1 && siblings.index < siblings.list.length - 1 ? (
                <Pressable onPress={() => animateSlide(-1)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                  <MaterialIcons name="arrow-forward" size={30} color={ink} />
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
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              resizeMode="cover"
            />
          )}

          {screen.markers.map((m) => (
            <Pin
              key={m.id}
              marker={m}
              editMode={editMode}
              editAction={editAction}
              containerSize={mapSize}
              onOpen={handleOpen}
              onDragMove={handleDragMove}
              onDelete={(mk) => setPendingDelete(mk)}
              onEdit={(mk) => setEditingMarker(mk)}
            />
          ))}

          {renderTopNav()}

          {!editMode &&
            navStack.length === 1 &&
            !showSideMenu &&
            !pendingDelete &&
            !pendingDeleteField &&
            !pendingPlacement &&
            !showExitConfirm &&
            !placementConfirm &&
            !titleUnlock && (
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10 }}>
                <AddTaskBar
                  visible={true}
                  targetMarkerId={null}
                  onSubmit={handleAddTaskFromBar}
                  bgColor="transparent"
                />
              </View>
            )}
        </Animated.View>

        <BottomBar onAction={handleBottomAction} />

        <NewPinForm
          mode="create"
          title="Новая метка"
          confirmLabel="Добавить метку"
          showPlaceHints={currentId !== "home"}
          onClose={popNav}
          onCreate={createMarker}
          visible={topNav.type === NAV.ADD_MARKER}
        />

        <NewPinForm
          mode="create"
          title="Новое поле"
          confirmLabel="Создать поле"
          showColor={false}
          imageAspect={[9, 16]}
          onClose={popNav}
          onCreate={createScreen}
          visible={topNav.type === NAV.ADD_SCREEN}
        />

        {editingMarker && (
          <NewPinForm
            mode="edit"
            title="Редактировать метку"
            confirmLabel="Сохранить"
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
            mode="editField"
            title="Редактировать поле"
            confirmLabel="Сохранить"
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

        {titleUnlock && <TitleUnlockDialog title={titleUnlock} onClose={() => setTitleUnlock(null)} />}

        {pendingPlacement && (
          <MarkerPickerModal
            screens={screens}
            screenId={currentId}
            onClose={() => setPendingPlacement(null)}
            onPick={(screenId, markerId) => placeTask(screenId, markerId)}
          />
        )}

        {placementConfirm && (
          <InfoDialog
            message={`«${placementConfirm.title}» добавлено в «${placementConfirm.markerName}».`}
            onClose={() => setPlacementConfirm(null)}
          />
        )}

        {pendingDelete && (
          <ConfirmDialog
            message={`Удалить метку «${pendingDelete.name}»?`}
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
            message={`Удалить поле «${pendingDeleteField.name}» вместе со всеми метками?`}
            onCancel={() => setPendingDeleteField(null)}
            onConfirm={() => {
              deleteField(pendingDeleteField.id);
              setPendingDeleteField(null);
            }}
          />
        )}

        {pendingResetBg && (
          <ConfirmDialog
            message="Сбросить фон на стандартный?"
            confirmLabel="Сбросить"
            confirmColor={RED}
            onCancel={() => setPendingResetBg(false)}
            onConfirm={() => {
              updateScreenImage(
                currentId,
                currentId === "main" ? MAP_DEFAULT_BG
                  : currentId === "home" ? DOM_DEFAULT_BG
                  : null
              );
              setPendingResetBg(false);
            }}
          />
        )}

        {showExitConfirm && (
          <ConfirmDialog
            message="Выйти из приложения?"
            confirmLabel="Выйти"
            confirmColor={BLUE}
            onCancel={() => setShowExitConfirm(false)}
            onConfirm={() => { setShowExitConfirm(false); BackHandler.exitApp(); }}
          />
        )}

        {taskDetailData && (
          <TaskDetailOverlay
            task={taskDetailData.task}
            markerColor={taskDetailData.marker.color}
            markerName={taskDetailData.marker.name}
            screenName={taskDetailData.screen.name}
            onBack={() => setTaskDetail(null)}
            onRename={renameTask}
            onAddNote={addNoteGlobal}
            onRemoveNote={removeNoteGlobal}
            onToggleNote={toggleNoteGlobal}
            onIncrementRepeat={() => incrementRepeat(taskDetailData.screen.id, taskDetailData.marker.id, taskDetailData.task.id)}
            onDecrementRepeat={() => decrementRepeat(taskDetailData.screen.id, taskDetailData.marker.id, taskDetailData.task.id)}
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
    </Animated.View>
  );
}
