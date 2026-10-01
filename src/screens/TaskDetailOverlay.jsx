import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE, RED, TEAL } from "../theme/palettes";
import { isTaskExpired, formatRemaining } from "../utils/date";
import { GUIDE_BY_KEY } from "../constants/guides";

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
  const [note, setNote] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(task?.title || "");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [confirmRepeatFinish, setConfirmRepeatFinish] = useState(false);
  const inputRef = useRef(null);

  if (!task) return null;

  const expired = isTaskExpired(task);
  const notes = task.notes || [];
  const doneCount = notes.filter((n) => n.done).length;
  const total = notes.length;
  const guide = task.source ? GUIDE_BY_KEY[task.source] : null;

  const submitNote = () => {
    const v = note.trim();
    if (!v) return;
    onAddNote(v);
    setNote("");
    setTimeout(() => inputRef.current?.focus(), 50);
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

  // Кнопка «Отметить выполненным»
  const handleComplete = () => {
    if (task.source) setConfirmDone(true);
    else onComplete();
  };

  // Кнопка «+» прогресса
  const handleIncrement = () => {
    if (!task.repeat) return;
    const nextCount = task.repeat.count + 1;
    const willFinish = nextCount >= task.repeat.target;

    if (willFinish && task.source) {
      onIncrementRepeat();
      setConfirmRepeatFinish(true);
    } else {
      onIncrementRepeat();
    }
  };

  return (
    <Overlay zIndex={58}>
      <SafeAreaView style={{ flex: 1, backgroundColor: paper }} edges={["top", "bottom"]}>
        <OverlayHeader onBack={onBack} title="" onClose={onBack} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Заголовок */}
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
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {guide && (
                      <View
                        style={{
                          width: 24, height: 24, borderRadius: 12,
                          backgroundColor: guide.color,
                          borderWidth: 1.5, borderColor: ink,
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <MaterialIcons name={guide.icon} size={14} color={ink} />
                      </View>
                    )}
                    <Text
                      style={{
                        flexShrink: 1,
                        fontSize: 19,
                        fontWeight: "bold",
                        color: expired ? BLUE : ink,
                      }}
                    >
                      {task.title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRenaming(true)}
                    hitSlop={8}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      borderWidth: 1.5, borderColor: ink,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: card, marginTop: 2,
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

            {/* Прогресс-бар (если есть repeat) */}
            {task.repeat && (
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    height: 8, borderRadius: 4,
                    backgroundColor: ink, opacity: 0.15,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 8, borderRadius: 4,
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
                    🔁 {task.repeat.count}/{task.repeat.target}
                  </Text>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={onDecrementRepeat}
                      disabled={task.repeat.count <= 0}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        borderWidth: 2, borderColor: ink,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: paper,
                        opacity: task.repeat.count <= 0 ? 0.4 : 1,
                      }}
                    >
                      <View style={{ width: 16, height: 3, borderRadius: 1.5, backgroundColor: ink }} />
                    </Pressable>

                    <Pressable
                      onPress={handleIncrement}
                      disabled={task.repeat.count >= task.repeat.target}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        borderWidth: 2, borderColor: ink,
                        alignItems: "center", justifyContent: "center",
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

            {/* Пометки */}
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

            {/* Инпут новой пометки */}
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
              <TextInput
                ref={inputRef}
                value={note}
                onChangeText={setNote}
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

            {/* Срок */}
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: expired ? BLUE : ink,
                }}
              >
                {formatRemaining(task.due)}
              </Text>
            </View>

            {/* Отметить выполненным / Вернуть */}
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
                onPress={handleComplete}
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

            {/* Удалить */}
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
        </KeyboardAvoidingView>
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

      {confirmDone && (
        <ConfirmDialog
          message="Выполнить задание гида?"
          confirmLabel="Да"
          confirmColor={GREEN}
          onCancel={() => setConfirmDone(false)}
          onConfirm={() => {
            setConfirmDone(false);
            onComplete();
          }}
        />
      )}

      {confirmRepeatFinish && (
        <ConfirmDialog
          message="Выполнить задание гида?"
          confirmLabel="Да"
          confirmColor={GREEN}
          onCancel={() => {
            setConfirmRepeatFinish(false);
            onDecrementRepeat && onDecrementRepeat();
          }}
          onConfirm={() => {
            setConfirmRepeatFinish(false);
          }}
        />
      )}
    </Overlay>
  );
}
