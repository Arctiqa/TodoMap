import React, { useState, useMemo, useCallback, memo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useTheme } from "../theme/ThemeContext";
import { useT, useRTL } from "../i18n/LanguageContext";
import { BLUE, GREEN, RED, TEAL } from "../theme/palettes";
import { isTaskExpired, fmtDate } from "../utils/date";

function fmtDateTime(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hh}:${mm}`;
}

const HistoryRow = memo(function HistoryRow({ item, ink, card, t, isRTL }) {
  return (
    <View
      style={{
        backgroundColor: card,
        borderWidth: 2,
        borderColor: ink,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: item.markerColor,
            borderWidth: 2,
            borderColor: ink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13 }}>{item.markerEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              color: ink,
              fontWeight: "bold",
              textDecorationLine: item.isDone ? "line-through" : "none",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {item.task.title}
          </Text>
          <Text style={{ fontSize: 10, color: ink, opacity: 0.6, textAlign: isRTL ? "right" : "left" }}>
            {item.markerName} · {item.screenName.replace(/^[^\wА-Яа-я]+/, "")}
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "bold", color: item.statusColor }}>
          {item.status}
        </Text>
      </View>

      <View style={{ marginTop: 8, gap: 2, paddingLeft: isRTL ? 0 : 4, paddingRight: isRTL ? 4 : 0 }}>
        <LogLine icon="add-circle-outline" label={t("history.created")} value={fmtDateTime(item.task.createdAt)} ink={ink} isRTL={isRTL} />
        {item.task.done && item.task.completedAt && (
          <LogLine icon="check-circle-outline" label={t("history.completed")} value={fmtDateTime(item.task.completedAt)} color={TEAL} ink={ink} isRTL={isRTL} />
        )}
        {item.isExpired && !item.task.done && (
          <LogLine
            icon="error-outline"
            label={t("history.failed")}
            value={
              item.task.due
                ? `→ ${fmtDateTime(
                    item.task.due.kind === "duration"
                      ? item.task.due.target
                      : item.task.due.date
                      ? new Date(`${item.task.due.date}T${item.task.due.time || "23:59"}`).getTime()
                      : Date.now()
                  )}`
                : "—"
            }
            color={BLUE}
            ink={ink}
            isRTL={isRTL}
          />
        )}
        {item.removedAt && (
          <LogLine
            icon="delete-outline"
            label={t("history.removed")}
            value={fmtDateTime(item.removedAt)}
            color={RED}
            ink={ink}
            isRTL={isRTL}
          />
        )}
      </View>
    </View>
  );
});

function LogLine({ icon, label, value, color, ink, isRTL }) {
  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
      <MaterialIcons name={icon} size={12} color={color || ink} style={{ opacity: color ? 1 : 0.5 }} />
      <Text style={{ fontSize: 10.5, color: ink, opacity: 0.55, minWidth: 70, textAlign: isRTL ? "right" : "left" }}>
        {label}:
      </Text>
      <Text style={{ fontSize: 10.5, color: color || ink, opacity: color ? 1 : 0.75, fontFamily: "monospace" }}>
        {value || "—"}
      </Text>
    </View>
  );
}

export function HistoryList({ entries, onClose, onClearHistory }) {
  const { ink, card, paper } = useTheme();
  const t = useT();
  const isRTL = useRTL();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const enriched = useMemo(() => {
    return entries
      .map((e) => {
        const isDone = e.task.done;
        const isRemoved = !!e.removedAt;
        const isExpired = !isDone && !isRemoved ? isTaskExpired(e.task) : false;

        const status = isRemoved
          ? isDone ? t("history.statusDone") : t("history.statusRemoved")
          : isDone ? t("history.statusDone")
          : isExpired ? t("history.statusFailed")
          : t("history.statusActive");

        const statusColor = isDone
          ? TEAL
          : isRemoved
          ? RED
          : isExpired
          ? BLUE
          : ink;

        return {
          key: `${e.task.id}-${e.removedAt || "live"}`,
          task: e.task,
          markerName: e.markerName,
          markerEmoji: e.markerEmoji,
          markerColor: e.markerColor,
          screenName: e.screenName || "",
          status,
          statusColor,
          isDone,
          isExpired,
          removedAt: e.removedAt,
        };
      })
      .sort((a, b) => {
        const aTime = a.removedAt || a.task.completedAt || a.task.createdAt || 0;
        const bTime = b.removedAt || b.task.completedAt || b.task.createdAt || 0;
        return bTime - aTime;
      });
  }, [entries, t, ink]);

  const renderItem = useCallback(
    ({ item }) => <HistoryRow item={item} ink={ink} card={card} t={t} isRTL={isRTL} />,
    [ink, card, t, isRTL]
  );

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <Overlay zIndex={55}>
      <OverlayHeader onBack={onClose} title={t("history.title")} onClose={onClose} />

      {enriched.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <Pressable
            onPress={() => setShowClearConfirm(true)}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              borderWidth: 1.5,
              borderColor: ink,
              borderRadius: 10,
              paddingVertical: 8,
              backgroundColor: card,
            }}
          >
            <MaterialIcons name="delete-sweep" size={18} color={RED} />
            <Text style={{ fontSize: 12, color: RED, fontWeight: "bold" }}>
              {t("history.clear")}
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={enriched}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ color: ink, opacity: 0.5, fontSize: 13, fontStyle: "italic", textAlign: isRTL ? "right" : "left" }}>
            {t("history.empty")}
          </Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
      />

      {showClearConfirm && (
        <ConfirmDialog
          message={t("history.clearConfirm")}
          confirmLabel={t("confirm.clear")}
          confirmColor={RED}
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={() => {
            onClearHistory();
            setShowClearConfirm(false);
          }}
        />
      )}
    </Overlay>
  );
}
