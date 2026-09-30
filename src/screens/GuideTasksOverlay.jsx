// screens/GuideTasksOverlay.jsx
import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Overlay } from "../components/ui/Overlay";
import { OverlayHeader } from "../components/ui/OverlayHeader";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { GREEN } from "../theme/palettes";
import { GUIDE_BY_KEY } from "../constants/guides";

export function GuideTasksOverlay({
  guideKey,
  chainOffer,
  takenCount,
  onTakeChain,
  onCustom,
  onTakeRandom,
  onBack,
  onClose,
}) {
  const { ink, card, paper } = useTheme();
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const [rolledInSession, setRolledInSession] = useState([]);
  const [currentRoll, setCurrentRoll] = useState(null);

  const guide = GUIDE_BY_KEY[guideKey];

  const meta = guide
    ? { name: guide.name, icon: guide.icon, color: guide.color }
    : { name: "ГИД", icon: "person", color: "#EEE" };

  const randomUnlockAt = guide ? guide.randomUnlockAt : 10;
  const randomUnlocked = (takenCount || 0) >= randomUnlockAt;
  const pool = useMemo(() => (guide ? guide.randomPool : []), [guide]);

  const roll = useCallback(() => {
    if (!pool.length) return;
    let fresh = pool.filter((t) => !rolledInSession.includes(t));

    if (fresh.length === 0) {
      setRolledInSession([]);
      fresh = pool;
    }
    if (fresh.length === 0) return;

    const title = fresh[Math.floor(Math.random() * fresh.length)];
    setRolledInSession((prev) => [...prev, title]);
    setCurrentRoll(title);
  }, [pool, rolledInSession]);

  const handleTake = () => {
    if (!currentRoll) return;
    onTakeRandom(currentRoll);
    setCurrentRoll(null);
    setRolledInSession([]);
  };

  return (
    <Overlay zIndex={74} background={paper}>
      <OverlayHeader onBack={onBack} title="" onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View
            style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: meta.color,
              borderWidth: 2, borderColor: ink,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <MaterialIcons name={meta.icon} size={30} color={ink} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: "800", color: ink, marginTop: 8, letterSpacing: 1 }}>
            {meta.name}
          </Text>
          <Text style={{ fontSize: 11, color: ink, opacity: 0.6, marginTop: 2 }}>
            Принято заданий: {takenCount || 0}
          </Text>
        </View>

        {chainOffer ? (
          <View
            style={{
              borderWidth: 1.5, borderColor: ink, borderRadius: 14,
              padding: 16, marginBottom: 18, backgroundColor: card,
            }}
          >
            <Text style={{ fontSize: 14, color: ink, textAlign: "center", marginBottom: 14, lineHeight: 20 }}>
              {chainOffer.text || `Взять задачу «${chainOffer.taskTitle}»?`}
            </Text>
            {!showCustom ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <PrimaryButton label="Да" color={GREEN} onPress={() => onTakeChain(chainOffer)} style={{ flex: 1 }} />
                <PrimaryButton label="Нет" color="#fff" textColor={ink} onPress={() => setShowCustom(true)} style={{ flex: 1 }} />
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 12, color: ink, opacity: 0.6, textAlign: "center", marginBottom: 10 }}>
                  А что-то своё хочешь? Напиши — я подумаю.
                </Text>
                <TextInput
                  value={customText}
                  onChangeText={setCustomText}
                  placeholder="Например: заказать пиццу"
                  placeholderTextColor={ink}
                  style={{
                    borderWidth: 1.5, borderColor: ink, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
                    marginBottom: 10, color: ink, backgroundColor: card,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <PrimaryButton label="Ничего" color="#fff" textColor={ink} onPress={() => setShowCustom(false)} style={{ flex: 1 }} />
                  <PrimaryButton
                    label="Добавить"
                    color={GREEN}
                    onPress={() => customText.trim() && onCustom(customText.trim())}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          !randomUnlocked && (
            <Text style={{ fontSize: 13, color: ink, opacity: 0.6, textAlign: "center", marginBottom: 18 }}>
              Сюжетные задания закончились. Бери случайные ниже.
            </Text>
          )
        )}

        {randomUnlocked ? (
          <View
            style={{
              borderWidth: 1.5, borderColor: ink, borderStyle: "dashed",
              borderRadius: 14, padding: 16, alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 11, color: ink, opacity: 0.6, marginBottom: 10 }}>
              🎲 Рандомайзер · прокручено {rolledInSession.length}/{pool.length}
            </Text>
            {currentRoll ? (
              <>
                <Text style={{ fontSize: 15, fontWeight: "bold", color: ink, textAlign: "center", marginBottom: 14 }}>
                  {currentRoll}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
                  <PrimaryButton label="🎲 Ещё раз" color="#fff" textColor={ink} onPress={roll} style={{ flex: 1 }} />
                  <PrimaryButton label="Взять задачу" color={GREEN} onPress={handleTake} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <PrimaryButton label="🎲 Крутить" color={meta.color} textColor={ink} onPress={roll} style={{ width: "100%" }} />
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: ink, opacity: 0.5, textAlign: "center", marginTop: 6 }}>
            Рандомайзер откроется после {randomUnlockAt} принятых заданий (сейчас {takenCount || 0}).
          </Text>
        )}
      </ScrollView>
    </Overlay>
  );
}
