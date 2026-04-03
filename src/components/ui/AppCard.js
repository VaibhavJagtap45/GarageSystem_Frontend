import { View, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES, SHADOWS } from "../../utils/constants";

export default function AppCard({
  children,
  onPress,
  style,
  noPadding = false,
}) {
  const content = (
    <View
      style={[styles.card, !noPadding && styles.padding, SHADOWS.sm, style]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.86}
        style={{ borderRadius: SIZES.radiusLg }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  padding: {
    padding: SIZES.md,
  },
});
