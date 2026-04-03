import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const SIZE_MAP = {
  xs: { size: 28, fontSize: SIZES.textXs, borderWidth: 1.5 },
  sm: { size: 36, fontSize: SIZES.textSm, borderWidth: 2 },
  md: { size: 48, fontSize: SIZES.textBase, borderWidth: 2 },
  lg: { size: 64, fontSize: SIZES.textLg, borderWidth: 2.5 },
  xl: { size: 80, fontSize: SIZES.textXl, borderWidth: 3 },
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToHue(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export default function Avatar({
  name,
  uri,
  size = "md",
  showBorder = false,
  onlineDot = false,
  style,
}) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;
  const hue = stringToHue(name);
  const bg = `hsl(${hue}, 45%, 60%)`;

  return (
    <View
      style={[
        styles.wrapper,
        { width: s.size, height: s.size, borderRadius: s.size / 2 },
        showBorder && {
          borderWidth: s.borderWidth,
          borderColor: COLORS.primaryLight,
        },
        style,
      ]}
      accessibilityLabel={name ? `Avatar for ${name}` : "Avatar"}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: s.size, height: s.size, borderRadius: s.size / 2 },
          ]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.initials,
            {
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: bg,
            },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: s.fontSize }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {onlineDot && (
        <View
          style={[
            styles.dot,
            {
              width: s.size * 0.25,
              height: s.size * 0.25,
              borderRadius: s.size * 0.125,
              right: 1,
              bottom: 1,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  image: { resizeMode: "cover" },
  initials: { alignItems: "center", justifyContent: "center" },
  initialsText: { fontFamily: FONTS.semibold, color: COLORS.white },
  dot: {
    position: "absolute",
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bgCard,
  },
});
