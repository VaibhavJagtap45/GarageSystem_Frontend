import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function CourseBadge({ type = "recorded", size = "sm" }) {
  const isLive = type === "live";
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isLive ? COLORS.liveLight : COLORS.primaryLight,
          borderColor: isLive ? `${COLORS.live}50` : `${COLORS.primary}40`,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 7 : 10,
        },
      ]}
    >
      <Ionicons
        name={isLive ? "radio-button-on" : "play-circle"}
        size={isSmall ? 9 : 12}
        color={isLive ? COLORS.live : COLORS.primary}
        style={{ marginRight: 3 }}
      />
      <Text
        style={[
          styles.text,
          {
            color: isLive ? COLORS.live : COLORS.primary,
            fontSize: isSmall ? SIZES.textXs - 1 : SIZES.textXs,
          },
        ]}
      >
        {isLive ? "LIVE" : "Recorded"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: FONTS.bold,
  },
});
