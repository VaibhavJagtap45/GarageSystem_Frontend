import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";
import { useFontSizes } from "../../context/PreferencesContext";

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  icon,
  rightIcon,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  maxLength,
  autoCapitalize = "none",
  autoCorrect = false,
  style,
  inputStyle,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  accessibilityLabel,
  accessibilityHint,
}) {
  const fs = useFontSizes();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  // 0 = default, 1 = focused, 2 = error
  const updateBorder = (val) => {
    Animated.timing(borderAnim, {
      toValue: val,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setFocused(true);
    updateBorder(1);
  };

  const handleBlur = () => {
    setFocused(false);
    updateBorder(error ? 2 : 0);
  };

  useEffect(() => {
    if (!focused) updateBorder(error ? 2 : 0);
  }, [error]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [COLORS.borderLight, COLORS.primary, COLORS.error],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1.5, 2, 2],
  });

  const charCount = maxLength && value != null ? value.length : null;

  return (
    <View style={[styles.wrap, style]}>
      {(label || charCount !== null) && (
        <View style={styles.labelRow}>
          {label ? <Text style={[styles.label, { fontSize: fs.textSm }]}>{label}</Text> : <View />}
          {charCount !== null && (
            <Text style={[styles.charCount, { fontSize: fs.textXs }]}>
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      )}

      <Animated.View
        style={[
          styles.row,
          { borderColor, borderWidth },
          multiline && styles.rowMultiline,
          !editable && styles.rowDisabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? COLORS.primary : COLORS.textMuted}
            style={styles.iconLeft}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          style={[styles.input, { fontSize: fs.textBase }, multiline && styles.inputMultiline, inputStyle]}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <Ionicons name={rightIcon} size={18} color={COLORS.textMuted} />
        )}
      </Animated.View>

      {error ? <Text style={[styles.error, { fontSize: fs.textXs }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  charCount: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    minHeight: SIZES.inputHeight,
  },
  rowMultiline: {
    alignItems: "flex-start",
    paddingVertical: SIZES.sm,
  },
  rowDisabled: { opacity: 0.55 },
  iconLeft: { marginRight: SIZES.sm },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  inputMultiline: {
    textAlignVertical: "top",
    paddingTop: 4,
    minHeight: 80,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },
});
