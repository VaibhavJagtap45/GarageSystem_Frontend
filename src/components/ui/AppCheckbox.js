import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

/**
 * AppCheckbox
 * Props:
 *   label      — main label text
 *   sublabel   — optional description below label
 *   value      — boolean
 *   onChange   — (value) => void
 *   disabled   — bool
 *   error      — error string
 */
export default function AppCheckbox({
  label,
  sublabel,
  value,
  onChange,
  disabled = false,
  error,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(!value);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.row, disabled && styles.disabled]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            styles.box,
            value && styles.boxChecked,
            error && !value && styles.boxError,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {value && (
            <Ionicons name="checkmark" size={13} color={COLORS.white} />
          )}
        </Animated.View>

        <View style={styles.textWrap}>
          {label && (
            <Text style={[styles.label, value && styles.labelChecked]}>
              {label}
            </Text>
          )}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SIZES.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
  },
  disabled: {
    opacity: 0.55,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: SIZES.radiusSm - 2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCard,
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  boxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  labelChecked: {
    color: COLORS.primary,
  },
  sublabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 30,
  },
});
