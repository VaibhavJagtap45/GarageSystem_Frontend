import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";
import AppButton from "./AppButton";

export default function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  onCtaPress,
  style,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        style,
      ]}
    >
      {emoji ? (
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <AppButton
          title={ctaLabel}
          onPress={onCtaPress}
          variant="primary"
          size="md"
          style={styles.cta}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xxl,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.lg,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}30`,
  },
  emoji: { fontSize: 36 },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SIZES.sm,
    letterSpacing: -0.2,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  cta: { marginTop: SIZES.sm },
});
