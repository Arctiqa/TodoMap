import React, { useState, useMemo, useCallback, memo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { Chip } from "../components/ui/Chip";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { GREEN, BLUE, RED, TEAL } from "../theme/palettes";
import { formatRemaining, fmtDate } from "../utils/date";
import { ThoughtsSection } from "./ThoughtsSection";

/* ---------- Сортировки ---------- */
const SORTS = [
  { key: "added", label: "🕐 Добавление" },
  { key: "alpha", label: "🔤 А–Я" },
  { key: "markers",  label: "📍 По меткам" },
];

function byAdded(a, b) {
  const d = (b.task.createdAt || 0) - (a.task.createdAt || 0);   // новые сверху
  if (d !== 0) return d;
  return (Number(b.task.id) || 0) - (Number(a.task.id) || 0);
}

function byAlpha(a, b) {
  const d = String(a.task.title || "").localeCompare(String(b.task.title || ""), "ru", { sensitivity: "base" });
  return d !== 0 ? d : byAdded(a, b);
}

/* ---------- Строка дела (мемоизированная) ---------- */
const TaskRow = memo(function TaskRow({ e, showPath, onOpenDetail, onReturn, onComplete, onDelete, ink, card, isDone }) {
  return (
    <Pressable
      onPress={() => onOpenDetail(e)}
      style={{
        backgroundColor: card,
        borderWidth: 2,
        borderColor: ink,
        borderRadius: 10,
        padding: 10,
        opacity: isDone ? 0.65 : 1,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: e.markerColor, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 14 }}>{e.markerEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, color: ink, fontWeight: "bold", textDecorationLine: isDone ? "line-through" : "none" }}>
            {e.task.title}
          </Text>
          {showPath && (
            <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6 }}>
              {e.screenName.replace(/^[^\wА-Яа-я]+/, "")} · {e.markerName}
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 10.5, color: ink, opacity: 0.75, fontFamily: "monospace" }}>
          {isDone && e.task.completedAt ? fmtDate(e.task.completedAt) : formatRemaining(e.task.due)}
        </Text>
      </View>

      {e.task.notes && e.task.notes.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {(() => {
            const done = e.task.notes.filter((n) => n.done).length;
            const total = e.task.notes.length;
            return (
              <>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: ink, opacity: 0.15, overflow: "hidden" }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: GREEN, width: `${Math.min(100, (done / total) * 100)}%` }} />
                </View>
                <Text style={{ fontSize: 10, color: ink, opacity: 0.6, marginTop: 2 }}>
                  {done}/{total}
                </Text>
              </>
            );
          })()}
        </View>
      )}

      {e.task.repeat && (
        <View style={{ marginTop: 8 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: ink, opacity: 0.15, overflow: "hidden" }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: GREEN, width: `${Math.min(100, (e.task.repeat.count / e.task.repeat.target) * 100)}%` }} />
          </View>
          <Text style={{ fontSize: 10, color: ink, opacity: 0.6, marginTop: 2 }}>
            🔁 {e.task.repeat.count}/{e.task.repeat.target}
          </Text>
        </View>
      )}

      {(onReturn || onComplete || onDelete) && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {onReturn && (
            <Pressable
              onPress={(ev) => { ev.stopPropagation?.(); onReturn(); }}
              style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: card }}
            >
              <Text style={{ fontSize: 11, color: ink, fontWeight: "bold" }}>↺ Вернуть</Text>
            </Pressable>
          )}
          {onComplete && (
            <Pressable
              onPress={(ev) => { ev.stopPropagation?.(); onComplete(); }}
              style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: TEAL }}
            >
              <Text style={{ fontSize: 11, color: "#fff", fontWeight: "bold" }}>✓ Выполнено</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={(ev) => { ev.stopPropagation?.(); onDelete(); }}
              style={{ borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: card }}
            >
              <Text style={{ fontSize: 11, color: RED, fontWeight: "bold" }}>🗑 Удалить</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
});

/* ---------- Заголовок раздела ---------- */
const SectionHeader = memo(function SectionHeader({ title, count, color, open, onToggle, ink }) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 4,
        backgroundColor: "transparent",
      }}
    >
      <MaterialIcons name={open ? "expand-more" : "chevron-right"} size={22} color={ink} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "900", color: color || ink, letterSpacing: 1 }}>
        {title}
      </Text>
      <View
        style={{
          minWidth: 26,
          height: 22,
          paddingHorizontal: 6,
          borderRadius: 11,
          backgroundColor: color || ink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "bold", color: "#fff" }}>{count}</Text>
      </View>
    </Pressable>
  );
});

/* ---------- Строка архива ---------- */
const ArchiveRow = memo(function ArchiveRow({ item, ink, card, onDelete }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: card,
        borderWidth: 2,
        borderColor: ink,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        opacity: 0.7,
      }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.markerColor, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 13 }}>{item.markerEmoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: ink, fontWeight: "bold", textDecorationLine: "line-through" }}>
          {item.task.title}
        </Text>
        <Text style={{ fontSize: 10, color: ink, opacity: 0.6 }}>
          {item.markerName} · {fmtDate(item.removedAt || item.task.createdAt)}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: item.task.done ? TEAL : RED, fontWeight: "bold" }}>
        {item.task.done ? "Выполнено" : "Удалено"}
      </Text>
      {onDelete && (
        <Pressable onPress={() => onDelete(item)} hitSlop={8} style={{ padding: 4 }}>
          <MaterialIcons name="delete-outline" size={18} color={RED} />
        </Pressable>
      )}
    </View>
  );
});

/* ---------- Основной компонент ---------- */
export function JournalList({
  active, expired, done, archive, thoughts,
  onClose, onOpenDetail,
  onAddThought, onDeleteThought, onConvertThought,
  onReturnTask, onCompleteTask, onDeleteTask,
  onHardDeleteArchive,
}) {
  const { ink, card } = useTheme();
  const [mode, setMode] = useState("added");
  const [doneFilter, setDoneFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);

  // Состояние свёрнутости разделов — все закрыты по умолчанию
  const [openSections, setOpenSections] = useState({
    active: false,
    expired: false,
    done: false,
    thoughts: false,
    archive: false,
  });
  const toggle = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // ---- Активные ----
  const flatActive = useMemo(
    () => [...active].sort(mode === "alpha" ? byAlpha : byAdded),
    [active, mode]
  );

  // ---- Проваленные ----
  const flatExpired = useMemo(
    () => [...expired].sort(byAdded),
    [expired]
  );

  // ---- Выполненные ----
  const filteredDone = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    return [...done]
      .filter((e) => {
        const t = e.task.completedAt || 0;
        if (doneFilter === "today") return now - t < day;
        if (doneFilter === "week") return now - t < day * 7;
        if (doneFilter === "month") return now - t < day * 30;
        return true;
      })
      .sort((a, b) => (b.task.completedAt || 0) - (a.task.completedAt || 0));
  }, [done, doneFilter]);

  // ---- Архив ----
  const flatArchive = useMemo(
    () => [...archive].sort((a, b) => (b.removedAt || 0) - (a.removedAt || 0)),
    [archive]
  );

  // ---- Собираем плоский список элементов для FlatList ----
  const items = useMemo(() => {
    const out = [];

    // Активные
    out.push({ type: "header", key: "h_active", section: "active", title: "🔥 АКТИВНЫЕ", count: active.length, color: RED });
	if (openSections.active) {
	  out.push({ type: "sortChips", key: "sort_active" });

	  if (flatActive.length === 0) {
		out.push({ type: "empty", key: "e_active", text: "Активных дел пока нет." });
	  } else if (mode === "markers") {
		// Группируем по метке
		const byMarker = new Map();
		flatActive.forEach((e) => {
		  const key = `${e.screenId}::${e.markerId}`;
		  if (!byMarker.has(key)) {
			byMarker.set(key, {
			  markerId: e.markerId,
			  markerName: e.markerName,
			  markerEmoji: e.markerEmoji,
			  markerColor: e.markerColor,
			  screenName: e.screenName,
			  items: [],
			});
		  }
		  byMarker.get(key).items.push(e);
		});
		const blocks = [...byMarker.values()].sort((a, b) =>
		  a.markerName.localeCompare(b.markerName, "ru", { sensitivity: "base" })
		);
		blocks.forEach((block, bi) => {
		  out.push({
			type: "markerBlock",
			key: `mb_${block.markerId}_${bi}`,
			block,
		  });
		});
	  } else {
		flatActive.forEach((e) => out.push({ type: "task", key: `a_${e.task.id}`, entry: e, showPath: true }));
	  }
	}

    // Проваленные
    out.push({ type: "header", key: "h_expired", section: "expired", title: "⏰ ПРОВАЛЕННЫЕ", count: expired.length, color: BLUE });
    if (openSections.expired) {
      if (flatExpired.length === 0) {
        out.push({ type: "empty", key: "e_expired", text: "Проваленных дел нет. Отлично!" });
      } else {
        flatExpired.forEach((e) => out.push({ type: "task", key: `x_${e.task.id}`, entry: e, showPath: true, withActions: true, actionKind: "expired" }));
      }
    }

    // Выполненные
    out.push({ type: "header", key: "h_done", section: "done", title: "✅ ВЫПОЛНЕННЫЕ", count: done.length, color: TEAL });
    if (openSections.done) {
      out.push({ type: "doneChips", key: "done_chips" });
      if (filteredDone.length === 0) {
        out.push({ type: "empty", key: "e_done", text: "Ничего не найдено." });
      } else {
        filteredDone.forEach((e) => out.push({ type: "task", key: `d_${e.task.id}`, entry: e, showPath: true, isDone: true, withActions: true, actionKind: "done" }));
      }
    }

    // Мысли
    out.push({ type: "header", key: "h_thoughts", section: "thoughts", title: "💭 МЫСЛИ", count: thoughts.length, color: ink });
    if (openSections.thoughts) {
      out.push({ type: "thoughts", key: "thoughts_block" });
    }

    // Архив
    out.push({ type: "header", key: "h_archive", section: "archive", title: "📦 АРХИВ", count: archive.length, color: ink });
    if (openSections.archive) {
      if (flatArchive.length === 0) {
        out.push({ type: "empty", key: "e_archive", text: "Архив пуст." });
      } else {
        flatArchive.slice(0, 100).forEach((e, i) => out.push({ type: "archive", key: `ar_${e.task.id}_${e.removedAt || "live"}_${i}`, item: e }));
      }
    }

    return out;
  }, [active, expired, done, archive, thoughts, flatActive, flatExpired, filteredDone, flatArchive, openSections, doneFilter, mode]);

  const renderItem = useCallback(({ item }) => {
    switch (item.type) {
      case "header":
        return (
          <SectionHeader
            title={item.title}
            count={item.count}
            color={item.color}
            open={openSections[item.section]}
            onToggle={() => toggle(item.section)}
            ink={ink}
          />
        );
      case "sortChips":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {SORTS.map((s) => (
              <Chip key={s.key} label={s.label} active={mode === s.key} onPress={() => setMode(s.key)} />
            ))}
          </View>
        );
		
		case "markerBlock":
		  return (
			<View style={{ marginBottom: 14 }}>
			  {/* Заголовок метки */}
			  <View
				style={{
				  flexDirection: "row",
				  alignItems: "center",
				  gap: 8,
				  paddingVertical: 6,
				  paddingHorizontal: 4,
				  marginBottom: 6,
				}}
			  >
				<View
				  style={{
					width: 26,
					height: 26,
					borderRadius: 13,
					backgroundColor: item.block.markerColor,
					borderWidth: 2,
					borderColor: ink,
					alignItems: "center",
					justifyContent: "center",
				  }}
				>
				  <Text style={{ fontSize: 12 }}>{item.block.markerEmoji}</Text>
				</View>
				<View style={{ flex: 1 }}>
				  <Text style={{ fontSize: 13.5, fontWeight: "bold", color: ink }}>
					{item.block.markerName}
				  </Text>
				  <Text style={{ fontSize: 10, color: ink, opacity: 0.5 }}>
					{item.block.screenName.replace(/^[^\wА-Яа-я]+/, "")}
				  </Text>
				</View>
				<View
				  style={{
					minWidth: 22,
					height: 20,
					paddingHorizontal: 6,
					borderRadius: 10,
					backgroundColor: ink,
					opacity: 0.75,
					alignItems: "center",
					justifyContent: "center",
				  }}
				>
				  <Text style={{ fontSize: 10, fontWeight: "bold", color: card }}>
					{item.block.items.length}
				  </Text>
				</View>
			  </View>

			  {/* Дела внутри метки */}
			  {item.block.items.map((e) => (
				<TaskRow
				  key={e.task.id}
				  e={e}
				  showPath={false}
				  onOpenDetail={onOpenDetail}
				  ink={ink}
				  card={card}
				/>
			  ))}
			</View>
		  );		

      case "doneChips":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {[
              { key: "today", label: "Сегодня" },
              { key: "week", label: "Неделя" },
              { key: "month", label: "Месяц" },
              { key: "all", label: "Всё" },
            ].map((f) => (
              <Chip key={f.key} label={f.label} active={doneFilter === f.key} onPress={() => setDoneFilter(f.key)} />
            ))}
          </View>
        );
      case "empty":
        return (
          <Text style={{ color: ink, opacity: 0.5, fontSize: 13, fontStyle: "italic", marginBottom: 8 }}>
            {item.text}
          </Text>
        );
      case "task":
        return (
          <TaskRow
            e={item.entry}
            showPath={item.showPath}
            isDone={!!item.isDone}
            onOpenDetail={onOpenDetail}
            onReturn={item.withActions ? () => onReturnTask(item.entry) : undefined}
            onComplete={item.actionKind === "expired" ? () => onCompleteTask(item.entry) : undefined}
            onDelete={item.withActions ? () => setPendingDelete(item.entry) : undefined}
            ink={ink}
            card={card}
          />
        );
      case "thoughts":
        return (
          <ThoughtsSection
            thoughts={thoughts}
            onAdd={onAddThought}
            onDelete={onDeleteThought}
            onConvert={onConvertThought}
          />
        );
      case "archive":
        return <ArchiveRow item={item.item} ink={ink} card={card} onDelete={onHardDeleteArchive} />;
      default:
        return null;
    }
  }, [openSections, ink, card, mode, doneFilter, thoughts, onOpenDetail, onReturnTask, onCompleteTask, onAddThought, onDeleteThought, onConvertThought, onHardDeleteArchive]);

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="📖 ЖУРНАЛ" onClose={onClose} />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
      />

      {pendingDelete && (
        <ConfirmDialog
          message={`Удалить «${pendingDelete.task.title}» из журнала?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDeleteTask(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </Overlay>
  );
}