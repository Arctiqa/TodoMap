import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  Platform,
  Dimensions,
  findNodeHandle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE, RED, TEAL } from "../theme/palettes";
import { isTaskExpired, formatRemaining } from "../utils/date";

const KEYBOARD_PADDING = 24;

export function TaskDetailOverlay({
  task,
  markerColor,
  markerName,
  screenName,
  onBack,
  onRename,
  onAddNote,
  onRemoveNote,
  onToggleNote,
  onIncrementRepeat,
  onDecrementRepeat,
  onDelete,
  onComplete,
  onUncomplete,
}) {
  const { ink, card, paper, inputBg } = useTheme();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(task?.title || "");
  const [pendingDelete, setPendingDelete] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const inputWrapperRef = useRef(null);
  const scrollOffsetRef = useRef(0);

  // Сдвигаем скролл, только если инпут перекрыт клавиатурой
  const ensureInputVisible = useCallback(() => {
    if (!inputWrapperRef.current || !scrollRef.current) return;
    const handle = findNodeHandle(inputWrapperRef.current);
    if (!handle) return;

    const keyboardHeight = Keyboard.metrics?.()?.height ?? 0;
    if (!keyboardHeight) return;

    const windowHeight = Dimensions.get("window").height;

    inputWrapperRef.current.measureInWindow((x, y, width, height) => {
      const inputBottom = y + height;
      const keyboardTop = windowHeight - keyboardHeight;
      const overlap = inputBottom - keyboardTop;

      if (overlap > 0) {
        scrollRef.current.scrollTo({
          y: scrollOffsetRef.current + overlap + KEYBOARD_PADDING,
          animated: true,
        });
      }
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, () => {
      // даём layout устояться
      requestAnimationFrame(ensureInputVisible);
      setTimeout(ensureInputVisible, 80);
    });
    const subHide = Keyboard.addListener(hideEvent, () => {});

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [ensureInputVisible]);

  if (!task) return null;

  const expired = isTaskExpired(task);
  const notes = task.notes || [];

  const submitNote = () => {
    const v = note.trim();
    if (!v) return;
    onAddNote(v);
    setNote("");
    setTimeout(() => {
      inputRef.current?.focus();
      ensureInputVisible();
    }, 80);
  };

  const commitRename = () => {
    const v = tempTitle.trim();
    if (v && v !== task.title) onRename(v);
    else setTempTitle(task.title);
    setRenaming(false);
  };

  const cancelRename = () => {
    setTempTitle(task.title);
    setRenaming(false);
  };

  return (
    <Overlay zIndex={58}>
      <SafeAreaView style={{ flex: 1, backgroundColor: paper }} edges={["top"]}>
        <OverlayHeader onBack={onBack} title="" onClose={onBack} />

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={(e) => {
            scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* ---------- Заголовок дела ---------- */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            {renaming ? (
              <TextInput
                value={tempTitle}
                onChangeText={setTempTitle}
                autoFocus
                onBlur={commitRename}
                onSubmitEditing={commitRename}
                returnKeyType="done"
                style={{
                  flex: 1,
                  fontSize: 19,
                  fontWeight: "bold",
                  color: expired ? BLUE : ink,
                  borderWidth: 1.5,
                  borderColor: ink,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: inputBg,
                }}
              />
            ) : (
              <>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 19,
                    fontWeight: "bold",
                    color: expired ? BLUE : ink,
                  }}
                >
                  {task.title}
                </Text>
                <Pressable
                  onPress={() => setRenaming(true)}
                  hitSlop={8}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: ink,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: card,
                    marginTop: 2,
                  }}
                >
                  <MaterialIcons name="edit" size={18} color={ink} />
                </Pressable>
              </>
            )}
          </View>

          {(markerName || screenName) && (
            <Text style={{ fontSize: 11.5, color: ink, opacity: 0.6, marginBottom: 16 }}>
              {markerName}
              {screenName ? ` · ${screenName.replace(/^[^\wА-Яа-я]+/, "")}` : ""}
            </Text>
          )}

          {/* ---------- Прогресс дела ---------- */}
          {task.repeat && (
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ink,
                  opacity: 0.15,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: GREEN,
                    width: `${Math.min(100, (task.repeat.count / task.repeat.target) * 100)}%`,
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: ink, opacity: 0.7, fontWeight: "bold" }}>
                  {task.repeat.count}/{task.repeat.target}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={onDecrementRepeat}
                    disabled={task.repeat.count <= 0}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: ink,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: paper,
                      opacity: task.repeat.count <= 0 ? 0.4 : 1,
                    }}
                  >
                    <View style={{ width: 16, height: 3, borderRadius: 1.5, backgroundColor: ink }} />
                  </Pressable>

                  <Pressable
                    onPress={onIncrementRepeat}
                    disabled={task.repeat.count >= task.repeat.target}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: ink,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: paper,
                      opacity: task.repeat.count >= task.repeat.target ? 0.4 : 1,
                    }}
                  >
                    <View style={{ width: 3, height: 16, borderRadius: 1.5, backgroundColor: ink, position: "absolute" }} />
                    <View style={{ width: 16, height: 3, borderRadius: 1.5, backgroundColor: ink, position: "absolute" }} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ---------- Пометки ---------- */}
          <View style={{ gap: 6, marginBottom: 16 }}>
            {notes.length === 0 && (
              <Text style={{ color: ink, opacity: 0.5, fontSize: 12.5, fontStyle: "italic" }}>
                Пометок пока нет. Добавь первую — это этапы квеста.
              </Text>
            )}

            {notes.map((n, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: card,
                  borderWidth: 1.5,
                  borderColor: ink,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Pressable
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => onToggleNote(i)}
                >
                  <View
                    style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 1.5, borderColor: ink,
                      backgroundColor: n.done ? GREEN : "transparent",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {n.done && <MaterialIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: ink,
                      opacity: n.done ? 0.4 : 1,
                      textDecorationLine: n.done ? "line-through" : "none",
                    }}
                  >
                    {n.text}
                  </Text>
                </Pressable>

                <Pressable onPress={() => onRemoveNote(i)} hitSlop={6}>
                  <MaterialIcons name="close" size={18} color={RED} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* ---------- Инпут новой пометки (измеряем его) ---------- */}
          <View ref={inputWrapperRef} collapsable={false} style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            <TextInput
              ref={inputRef}
              value={note}
              onChangeText={setNote}
              onFocus={() => {
                // после фокуса даём layout и проверяем перекрытие
                setTimeout(ensureInputVisible, 120);
              }}
              placeholder="Новая пометка..."
              placeholderTextColor="#9A9A9A"
              onSubmitEditing={submitNote}
              returnKeyType="done"
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: ink,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13.5,
                color: ink,
                backgroundColor: inputBg,
              }}
            />
            <Pressable
              onPress={submitNote}
              style={{
                backgroundColor: markerColor || GREEN,
                borderWidth: 1.5,
                borderColor: ink,
                borderRadius: 10,
                paddingHorizontal: 14,
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="add" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* ---------- Срок ---------- */}
          <View
            style={{
              borderWidth: 1.5,
              borderColor: ink,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: expired ? BLUE : ink }}>
              {formatRemaining(task.due)}
            </Text>
          </View>

          {/* ---------- Выполнить / Вернуть ---------- */}
          {task.done ? (
            <Pressable
              onPress={onUncomplete}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1.5,
                borderColor: ink,
                borderRadius: 10,
                paddingVertical: 12,
                backgroundColor: card,
                marginBottom: 10,
              }}
            >
              <MaterialIcons name="undo" size={20} color={ink} />
              <Text style={{ fontSize: 13.5, color: ink, fontWeight: "bold" }}>
                Вернуть в активные
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onComplete}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1.5,
                borderColor: ink,
                borderRadius: 10,
                paddingVertical: 12,
                backgroundColor: TEAL,
                marginBottom: 10,
              }}
            >
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={{ fontSize: 13.5, color: "#fff", fontWeight: "bold" }}>
                Отметить выполненным
              </Text>
            </Pressable>
          )}

          {/* ---------- Удалить ---------- */}
          <Pressable
            onPress={() => setPendingDelete(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1.5,
              borderColor: RED,
              borderRadius: 10,
              paddingVertical: 12,
              backgroundColor: card,
            }}
          >
            <MaterialIcons name="delete-outline" size={20} color={RED} />
            <Text style={{ fontSize: 13.5, color: RED, fontWeight: "bold" }}>
              Удалить дело
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {pendingDelete && (
        <ConfirmDialog
          message={`Удалить дело «${task.title}»?`}
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setPendingDelete(false);
            onDelete();
          }}
        />
      )}
    </Overlay>
  );
}
