import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS, SIZES } from "../../utils/constants";

// Single shimmer block
function ShimmerBlock({ width, height, borderRadius, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width || "100%",
          height: height || 16,
          borderRadius: borderRadius ?? SIZES.radiusSm,
          backgroundColor: COLORS.bgSection,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Preset skeleton layouts ──────────────────────────────────────────────────

export function SkeletonListItem({ style }) {
  return (
    <View style={[styles.listItem, style]}>
      <ShimmerBlock width={48} height={48} borderRadius={24} />
      <View style={styles.listText}>
        <ShimmerBlock
          width="60%"
          height={14}
          style={{ marginBottom: SIZES.xs }}
        />
        <ShimmerBlock width="40%" height={11} />
      </View>
    </View>
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <ShimmerBlock
        width="100%"
        height={140}
        borderRadius={SIZES.radiusMd}
        style={{ marginBottom: SIZES.sm }}
      />
      <ShimmerBlock
        width="70%"
        height={14}
        style={{ marginBottom: SIZES.xs }}
      />
      <ShimmerBlock width="45%" height={11} />
    </View>
  );
}

export default function SkeletonLoader({ width, height, borderRadius, style }) {
  return (
    <ShimmerBlock
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.md,
    gap: SIZES.md,
  },
  listText: { flex: 1 },
  card: {
    padding: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
  },
});
