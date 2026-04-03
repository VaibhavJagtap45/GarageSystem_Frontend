import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

export default function MiniCard({ label, value, color }) {
  return (
    <View style={[s.card, { borderTopColor: color || COLORS.primary }]}>
      <Text style={s.val} numberOfLines={1}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: "center",
    borderTopWidth: 3,
    ...SHADOWS.sm,
  },
  val:   { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  label: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2, textAlign: "center" },
});
