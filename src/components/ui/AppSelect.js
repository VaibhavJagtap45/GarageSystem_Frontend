import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

/**
 * AppSelect
 * Props:
 *   label       — label above the field
 *   icon        — Ionicons name for left icon
 *   options     — [{ value, label, icon? }]
 *   value       — currently selected value
 *   onChange    — (value) => void
 *   placeholder — placeholder text
 *   error       — error string
 *   disabled    — bool
 */
export default function AppSelect({
  label,
  icon,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  error,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      {/* Trigger */}
      <TouchableOpacity
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        activeOpacity={0.8}
        onPress={() => !disabled && setOpen(true)}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={open ? COLORS.primary : COLORS.textMuted}
            style={styles.iconLeft}
          />
        )}
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Dropdown Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                {label && (
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{label}</Text>
                    <TouchableOpacity onPress={() => setOpen(false)}>
                      <Ionicons
                        name="close"
                        size={20}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <FlatList
                  data={options}
                  keyExtractor={(item) => String(item.value)}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.option,
                          isSelected && styles.optionSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelect(item)}
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected: isSelected }}
                      >
                        {item.icon && (
                          <Ionicons
                            name={item.icon}
                            size={18}
                            color={
                              isSelected ? COLORS.primary : COLORS.textMuted
                            }
                            style={styles.optionIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  labelRow: {
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },

  // Trigger
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    minHeight: SIZES.inputHeight,
    gap: SIZES.sm,
  },
  triggerOpen: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  triggerError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  iconLeft: {
    marginRight: 2,
  },
  triggerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  placeholder: {
    color: COLORS.textMuted,
  },

  // Error
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: SIZES.xxl,
    maxHeight: "60%",
    ...SHADOWS.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sheetTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.screenPadding,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  optionIcon: {},
  optionText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});
