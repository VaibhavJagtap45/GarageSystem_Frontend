import { View, Text, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SIZES } from "../../utils/constants";
import { getProgressColor } from "../../utils/helpers";

export default function ProgressBar({
  progress = 0,
  showLabel = false,
  height = 8,
  color,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(100, Math.max(0, progress));
  const fill = color || getProgressColor(pct);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  const widthInterp = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View>
      {showLabel ? (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Progress</Text>
          <Text style={[styles.labelPct, { color: fill }]}>{pct}%</Text>
        </View>
      ) : null}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={{
            width: widthInterp,
            height,
            borderRadius: height / 2,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: height / 2 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.primaryLight,
    overflow: "hidden",
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  labelText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  labelPct: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
  },
});
