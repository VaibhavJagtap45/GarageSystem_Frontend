/**
 * ChangePasswordScreen
 *
 * Allows an authenticated user to update their password.
 * Accessible from the profile / settings section of the app
 * (not part of the auth stack).
 *
 * File kept at OtpScreen.js path to preserve git history references.
 * Import it as ChangePasswordScreen in any navigator that needs it.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import TopNav from "../../components/ui/TopNav";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { changePassword } from "../../api/auth";

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};

    if (!currentPassword)
      e.currentPassword = "Current password is required";

    if (!newPassword) {
      e.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      e.newPassword = "Password must be at least 6 characters";
    } else if (newPassword === currentPassword) {
      e.newPassword = "New password must be different from current password";
    }

    if (!confirmPassword) {
      e.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response?.success) {
        Toast.show({
          type: "success",
          text1: "Password changed successfully!",
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Failed to change password.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Failed to change password.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TopNav title="Change Password" showBack />

          <LinearGradient
            colors={COLORS.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="key" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.heroTitle}>Change Password</Text>
              <Text style={styles.heroSub}>
                Keep your account secure with a strong password
              </Text>
            </View>
          </LinearGradient>

          {/* Form Card */}
          <LinearGradient
            colors={COLORS.gradCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.formCard}
          >
            <View style={styles.form}>
              <AppInput
                label="Current password"
                icon="lock-closed-outline"
                value={currentPassword}
                onChangeText={(t) => {
                  setCurrentPassword(t);
                  if (errors.currentPassword)
                    setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                placeholder="Enter current password"
                secureTextEntry
                error={errors.currentPassword}
                returnKeyType="next"
                accessibilityLabel="Current password"
              />

              <AppInput
                label="New password"
                icon="lock-open-outline"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (errors.newPassword)
                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="Enter new password (min 6 characters)"
                secureTextEntry
                error={errors.newPassword}
                returnKeyType="next"
                accessibilityLabel="New password"
              />

              <AppInput
                label="Confirm new password"
                icon="checkmark-circle-outline"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Re-enter new password"
                secureTextEntry
                error={errors.confirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Confirm new password"
              />

              <AppButton
                title="Update Password"
                variant="gradient"
                size="lg"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.cta}
                accessibilityLabel="Update password"
              />
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: 24,
    paddingBottom: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.sm,
  },
  heroTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },

  formCard: {
    marginTop: -24,
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xxl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.md,
  },
  form: { gap: SIZES.xs },
  cta: { marginTop: SIZES.sm },
});
