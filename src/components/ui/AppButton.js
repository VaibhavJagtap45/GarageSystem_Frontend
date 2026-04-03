import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

// ─── Variant styles ───────────────────────────────────────────────────────────
const VARIANT_STYLES = {
  primary: { bg: COLORS.primary, label: COLORS.white, border: null },
  secondary: {
    bg: COLORS.bgCard,
    label: COLORS.primary,
    border: COLORS.primary,
  },
  ghost: { bg: COLORS.primaryLight, label: COLORS.primary, border: null },
  destructive: { bg: COLORS.error, label: COLORS.white, border: null },
  gradient: { bg: COLORS.primary, label: COLORS.white, border: null }, // legacy compat
  outline: { bg: "transparent", label: COLORS.primary, border: COLORS.primary },
  danger: { bg: COLORS.error, label: COLORS.white, border: null },
};

const SIZE_MAP = {
  sm: {
    height: SIZES.btnHeightSm,
    px: SIZES.md,
    fontSize: SIZES.textSm,
    radius: SIZES.radiusFull,
  },
  md: {
    height: SIZES.btnHeightMd,
    px: SIZES.lg,
    fontSize: SIZES.textBase,
    radius: SIZES.radiusFull,
  },
  lg: {
    height: SIZES.btnHeightLg,
    px: SIZES.xl,
    fontSize: SIZES.textMd,
    radius: SIZES.radiusFull,
  },
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  style,
  containerStyle: containerStyleProp,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const ss = SIZE_MAP[size] || SIZE_MAP.md;
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    {
      backgroundColor: vs.bg,
      height: ss.height,
      paddingHorizontal: ss.px,
      borderRadius: ss.radius,
      ...(vs.border ? { borderWidth: 1.5, borderColor: vs.border } : {}),
    },
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    !isDisabled &&
      variant !== "ghost" &&
      variant !== "outline" &&
      variant !== "secondary" &&
      SHADOWS.sm,
    style,
    containerStyleProp,
  ];

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        ...(fullWidth ? { width: "100%" } : {}),
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={buttonStyle}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={vs.label} />
        ) : (
          <View style={styles.inner}>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={ss.fontSize + 2}
                color={vs.label}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.label,
                { fontSize: ss.fontSize, color: vs.label },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={ss.fontSize + 2}
                color={vs.label}
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.5 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FONTS.semibold,
    textAlign: "center",
  },
  iconLeft: { marginRight: SIZES.sm },
  iconRight: { marginLeft: SIZES.sm },
});
