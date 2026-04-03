import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const fontMedium = (FONTS && FONTS.medium) || "Inter_500Medium";

export default function Loader({ fullScreen = false, text = "Loading..." }) {
  const content = (
    <View style={styles.inner}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );

  if (!fullScreen) return content;

  return <View style={styles.screen}>{content}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  inner: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  text: {
    fontFamily: fontMedium,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
