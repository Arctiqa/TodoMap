import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Overlay } from "../ui/Overlay";
import { PrimaryButton } from "../ui/PrimaryButton";
import { HintsModal } from "../HintsModal";
import { useTheme } from "../../theme/ThemeContext";
import { PALETTE } from "../../theme/palettes";
import { PLACE_HINTS } from "../../constants/hints";

export function NewPinForm({ title, onClose, onCreate, confirmLabel, showColor = true, showPlaceHints = true, imageAspect = [1, 1] }) {
  const { ink, paper, card } = useTheme();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [color, setColor] = useState(PALETTE[0]);
  const [type, setType] = useState("general");
  const [image, setImage] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [asField, setAsField] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: imageAspect,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const src = result.assets[0].uri;
      const ext = src.split(".").pop() || "jpg";
      const dst = `${FileSystem.documentDirectory}pin_${Date.now()}.${ext}`;
      try {
        await FileSystem.copyAsync({ from: src, to: dst });
        setImage(dst);
      } catch (e) {
        console.warn("QuestMap: не удалось скопировать изображение", e);
        setImage(src);
      }
    }
  };

  return (
    <Overlay zIndex={60} background="rgba(59,47,47,0.45)">
      <Pressable style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: paper, borderWidth: 3, borderColor: ink, borderRadius: 18, width: "100%", maxWidth: 280, padding: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: "bold", color: ink }}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>

          {showColor && showPlaceHints && (
            <Text style={{ fontSize: 11.5, color: "#8a7a6a", fontStyle: "italic", marginBottom: 8, lineHeight: 16 }}>
              Введите места, которые представляют для вас интерес — например: универмаг, огород соседа, библиотека, дома родственников и знакомых, или места, в которых вы ещё даже не были, но в них могут быть какие-то ваши цели
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Pressable
              onPress={pickImage}
              style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: ink, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#fff" }}
            >
              {image ? <Image source={{ uri: image }} style={{ width: 52, height: 52 }} /> : <Text style={{ fontSize: 18 }}>📷</Text>}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11.5, color: ink, fontWeight: "bold" }}>{image ? "Фото выбрано" : "Своё фото (необязательно)"}</Text>
              <Text style={{ fontSize: 10.5, color: "#8a7a6a" }}>Из галереи телефона</Text>
            </View>
            {image && (
              <Pressable onPress={() => setImage(null)}>
                <Text style={{ opacity: 0.5 }}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
            <TextInput
              value={emoji}
              onChangeText={(v) => setEmoji(Array.from(v).slice(0, 4).join(""))}
              style={{ width: 44, textAlign: "center", fontSize: 18, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingVertical: 6 }}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Название"
              placeholderTextColor="#a0907e"
              style={{ flex: 1, borderWidth: 2, borderColor: ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13.5 }}
            />
          </View>

          {showColor && showPlaceHints && (
            <Pressable
              onPress={() => setShowHints(true)}
              style={{ alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: ink, borderRadius: 8, paddingVertical: 6, marginBottom: 12, backgroundColor: card }}
            >
              <Text style={{ fontSize: 12, color: ink }}>💡 Подсказки — какие места бывают?</Text>
            </Pressable>
          )}

          {!showColor && (
            <Text style={{ textAlign: "center", fontSize: 11.5, color: "#8a7a6a", fontStyle: "italic", marginBottom: 12, lineHeight: 16 }}>
              💡 Поле — это большая локация (например, другой город, или страна). Создавайте его, если в локации требуется много меток или категорий
            </Text>
          )}

          {showColor && (
            <>
              <Text style={{ fontSize: 11.5, color: "#8a7a6a", marginBottom: 6 }}>Цвет метки</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {PALETTE.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c, borderWidth: color === c ? 3 : 2, borderColor: color === c ? ink : "transparent" }}
                  />
                ))}
              </View>

              <Pressable onPress={() => setAsField((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center", backgroundColor: asField ? ink : "#fff" }}>
                  {asField && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12.5, color: ink, fontWeight: "bold" }}>🗺 Сделать полем (как «Дом»)</Text>
                  <Text style={{ fontSize: 10.5, color: "#8a7a6a" }}>Своя карта с метками вместо списка дел</Text>
                </View>
              </Pressable>
            </>
          )}

          <PrimaryButton
            label={confirmLabel}
            color={color}
            onPress={() => name.trim() && onCreate({ name: name.trim(), emoji: emoji.trim(), color, type, image, asField })}
          />
        </Pressable>
      </Pressable>

      {showHints && showPlaceHints && (
        <HintsModal
          title="💡 Места, куда можно попасть"
          groups={PLACE_HINTS}
          onClose={() => setShowHints(false)}
          onPick={(it) => {
            setName(it.name);
            setEmoji(it.emoji);
            setType(it.type || "general");
            setShowHints(false);
          }}
        />
      )}
    </Overlay>
  );
}