import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { Chip } from "../components/ui/Chip";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";
import { formatRemaining } from "../utils/date";

/* -------- Журнал: сортировка и «папки» -------- */

const JOURNAL_SORTS = [
  { key: "added", label: "🕐 По добавлению" },
  { key: "alpha", label: "🔤 А–Я" },
  { key: "tree", label: "🗂 По меткам" },
];

// Порядок добавления: старые сверху; при равном времени — по id (он растёт).
function byAdded(a, b) {
  const d = (a.task.createdAt || 0) - (b.task.createdAt || 0);
  if (d !== 0) return d;
  return (Number(a.task.id) || 0) - (Number(b.task.id) || 0);
}

function byAlpha(a, b) {
  const d = String(a.task.title || "").localeCompare(String(b.task.title || ""), "ru", { sensitivity: "base" });
  return d !== 0 ? d : byAdded(a, b);
}

function JournalTaskRow({ e, showPath, onOpenDetail, ink, card }) {
  return (
    <Pressable
      onPress={() => onOpenDetail(e)}
      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: card, borderWidth: 2, borderColor: ink, borderRadius: 10, padding: 10 }}
    >
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: e.markerColor, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 14 }}>{e.markerEmoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, color: ink, fontWeight: "bold" }}>{e.task.title}</Text>
        {showPath && (
          <Text style={{ fontSize: 10.5, color: ink, opacity: 0.6 }}>
            {e.screenName.replace(/^[^\wА-Яа-я]+/, "")} · {e.markerName}
          </Text>
        )}
        {e.task.repeat && (
          <View style={{ marginTop: 5 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: ink, opacity: 0.15, overflow: "hidden" }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: GREEN, width: `${Math.min(100, (e.task.repeat.count / e.task.repeat.target) * 100)}%` }} />
            </View>
            <Text style={{ fontSize: 10, color: ink, opacity: 0.6, marginTop: 2 }}>
              {e.task.repeat.count}/{e.task.repeat.target}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 10.5, color: ink, opacity: 0.75, fontFamily: "monospace" }}>{formatRemaining(e.task.due)}</Text>
    </Pressable>
  );
}

export function JournalList({ entries, onClose, onOpenDetail }) {
  const { ink, card } = useTheme();
  const [mode, setMode] = useState("added");
  const [closed, setClosed] = useState({}); // ключ папки -> true, если свёрнута
  const toggle = (key) => setClosed((c) => ({ ...c, [key]: !c[key] }));

  const flat = [...entries].sort(mode === "alpha" ? byAlpha : byAdded);

  // Дерево: поле → метка → дела. Порядок папок — как в приложении,
  // дела внутри метки — в порядке добавления.
  const tree = [];
  if (mode === "tree") {
    const scrMap = new Map();
    entries.forEach((e) => {
      let s = scrMap.get(e.screenId);
      if (!s) {
        s = { id: e.screenId, name: e.screenName, count: 0, markers: new Map() };
        scrMap.set(e.screenId, s);
        tree.push(s);
      }
      let m = s.markers.get(e.markerId);
      if (!m) {
        m = { id: e.markerId, name: e.markerName, emoji: e.markerEmoji, color: e.markerColor, items: [] };
        s.markers.set(e.markerId, m);
      }
      m.items.push(e);
      s.count += 1;
    });
    tree.forEach((s) => s.markers.forEach((m) => m.items.sort(byAdded)));
  }

  const branch = (children) => (
    <View style={{ marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1.5, borderColor: ink, gap: 6, marginTop: 6 }}>{children}</View>
  );

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title="📖 ЖУРНАЛ" onClose={onClose} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingTop: 12 }}>
        {JOURNAL_SORTS.map((s) => (
          <Chip key={s.key} label={s.label} active={mode === s.key} onPress={() => setMode(s.key)} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {entries.length === 0 && <Text style={{ color: ink, opacity: 0.5, fontSize: 13, fontStyle: "italic" }}>Активных дел пока нет.</Text>}

        {mode !== "tree" &&
          flat.map((e) => (
            <View key={e.task.id} style={{ flexDirection: "row" }}>
              <JournalTaskRow e={e} showPath onOpenDetail={onOpenDetail} ink={ink} card={card} />
            </View>
          ))}

        {mode === "tree" &&
          tree.map((s) => {
            const sKey = `s:${s.id}`;
            const sClosed = !!closed[sKey];
            return (
              <View key={sKey}>
                <Pressable onPress={() => toggle(sKey)} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, color: ink, width: 14 }}>{sClosed ? "▸" : "▾"}</Text>
                  <Text style={{ fontSize: 18 }}>{sClosed ? "📁" : "📂"}</Text>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "bold", color: ink }}>{s.name.replace(/^[^\wА-Яа-я]+/, "")}</Text>
                  <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>{s.count}</Text>
                </Pressable>
                {!sClosed &&
                  branch(
                    [...s.markers.values()].map((m) => {
                      const mKey = `m:${s.id}:${m.id}`;
                      const mClosed = !!closed[mKey];
                      return (
                        <View key={mKey}>
                          <Pressable onPress={() => toggle(mKey)} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, color: ink, width: 14 }}>{mClosed ? "▸" : "▾"}</Text>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: m.color, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: 11 }}>{m.emoji}</Text>
                            </View>
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: "bold", color: ink }}>{m.name}</Text>
                            <Text style={{ fontSize: 11, color: ink, opacity: 0.6 }}>{m.items.length}</Text>
                          </Pressable>
                          {!mClosed &&
                            branch(
                              m.items.map((e) => (
                                <View key={e.task.id} style={{ flexDirection: "row", alignItems: "center" }}>
                                  <View style={{ width: 10, height: 1.5, backgroundColor: ink, marginLeft: -10, marginRight: 4 }} />
                                  <JournalTaskRow e={e} showPath={false} onOpenDetail={onOpenDetail} ink={ink} card={card} />
                                </View>
                              ))
                            )}
                        </View>
                      );
                    })
                  )}
              </View>
            );
          })}
      </ScrollView>
    </Overlay>
  );
}