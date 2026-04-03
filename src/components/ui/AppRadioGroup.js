import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

/**
 * AppRadioGroup
 * Props:
 *   label       — section label above the group
 *   options     — [{ value, label, icon? }]
 *   value       — currently selected value
 *   onChange    — (value) => void
 *   error       — error string
 *   direction   — 'row' | 'column' (default: 'row')
 */
export default function AppRadioGroup({
  label,
  options = [],
  value,
  onChange,
  error,
  direction = "row",
}) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[styles.group, direction === "column" && styles.groupColumn]}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.card,
                direction === "column" && styles.cardColumn,
                selected && styles.cardSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={opt.label}
            >
              <View style={styles.inner}>
                <View
                  style={[styles.circle, selected && styles.circleSelected]}
                >
                  {selected && <View style={styles.dot} />}
                </View>

                {opt.icon && (
                  <Ionicons
                    name={opt.icon}
                    size={15}
                    color={selected ? COLORS.primary : COLORS.textMuted}
                  />
                )}

                <Text
                  style={[styles.optLabel, selected && styles.optLabelSelected]}
                >
                  {opt.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  label: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  group: {
    flexDirection: "row",
    gap: SIZES.sm,
  },
  groupColumn: {
    flexDirection: "column",
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    paddingVertical: SIZES.sm + 2,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  cardColumn: {
    flex: undefined,
  },
  cardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  circleSelected: {
    borderColor: COLORS.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  optLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  optLabelSelected: {
    color: COLORS.primary,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },
});
