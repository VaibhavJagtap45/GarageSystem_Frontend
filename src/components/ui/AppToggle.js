import React, { useRef } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

/**
 * AppToggle
 * Props:
 *   label       — main label
 *   sublabel    — optional description below label
 *   icon        — Ionicons name for left icon
 *   value       — boolean
 *   onChange    — (value) => void
 *   disabled    — bool
 *   variant     — 'default' | 'card' (default: 'card')
 */
export default function AppToggle({
  label,
  sublabel,
  icon,
  value,
  onChange,
  disabled = false,
  variant = "card",
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(!value);
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        variant === "card" && styles.card,
        variant === "card" && value && styles.cardActive,
        disabled && styles.disabled,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.8}
        onPress={handlePress}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={label}
      >
        {icon && (
          <View style={[styles.iconWrap, value && styles.iconWrapActive]}>
            <Ionicons
              name={icon}
              size={16}
              color={value ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        )}

        <View style={styles.textWrap}>
          <Text style={[styles.label, value && styles.labelActive]}>
            {label}
          </Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>

        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{
            false: COLORS.borderLight,
            true: `${COLORS.primary}80`,
          }}
          thumbColor={value ? COLORS.primary : COLORS.white}
          ios_backgroundColor={COLORS.borderLight}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  cardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    gap: SIZES.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  iconWrapActive: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.primary,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  labelActive: {
    color: COLORS.primary,
  },
  sublabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
