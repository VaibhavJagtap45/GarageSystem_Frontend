import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function NavBar({ title, onBack, right }) {
  return (
    <View style={s.row}>
      <TouchableOpacity onPress={onBack} style={s.side} disabled={!onBack}>
        {onBack ? <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} /> : null}
      </TouchableOpacity>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.side}>{right || null}</View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  side:  { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
