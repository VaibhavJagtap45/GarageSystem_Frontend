import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

export default function Empty({ icon, title, sub, actionLabel, onAction }) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={30} color="#3b82f6" />
      </View>
      <Text style={s.title}>
        {title}
      </Text>
      {sub ? (
        <Text style={s.sub}>
          {sub}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={s.action} onPress={onAction} activeOpacity={0.85}>
          <Text style={s.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
  },
});
