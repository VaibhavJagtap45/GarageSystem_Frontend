import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const VARIANT_MAP = {
  success: { bg: COLORS.primaryLight, text: COLORS.primary, border: null },
  warning: { bg: "#FFFBEB", text: "#BA7517", border: null },
  error: { bg: COLORS.errorLight, text: COLORS.error, border: null },
  info: { bg: "#EFF6FF", text: "#3B82F6", border: null },
  neutral: { bg: COLORS.bgSection, text: COLORS.textSecondary, border: null },
};

export default function Badge({
  label,
  variant = "success",
  style,
  textStyle,
  dot = false,
}) {
  const v = VARIANT_MAP[variant] || VARIANT_MAP.neutral;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        style,
      ]}
      accessibilityLabel={label}
    >
      {dot && <View style={[styles.dot, { backgroundColor: v.text }]} />}
      <Text style={[styles.text, { color: v.text }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    alignSelf: "flex-start",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    letterSpacing: 0.2,
  },
});
