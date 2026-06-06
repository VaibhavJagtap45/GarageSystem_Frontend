import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onPress,
  actionIcon = "chevron-forward",
}) {
  return (
    <View style={s.row}>
      <View style={s.copy}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onPress ? (
        <TouchableOpacity style={s.action} onPress={onPress} activeOpacity={0.8}>
          <Text style={s.actionText}>{actionLabel}</Text>
          <Ionicons name={actionIcon} size={14} color="#3b82f6" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: "#3b82f6",
  },
});
