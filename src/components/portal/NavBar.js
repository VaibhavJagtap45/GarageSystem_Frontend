import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

export default function NavBar({ title, onBack, right, subtitle }) {
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <TouchableOpacity
          onPress={onBack}
          style={s.side}
          disabled={!onBack}
          activeOpacity={0.8}
        >
          {onBack ? (
            <View style={s.sidePill}>
              <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={s.center}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={s.side}>{right || null}</View>
      </View>
      <View style={s.divider} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: 12,
    paddingBottom: 12,
    gap: SIZES.sm,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  side: {
    width: 44,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sidePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.screenPadding,
  },
});
