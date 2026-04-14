import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { login, register } from "../../api/auth";
import { saveToken, saveUser, saveGarage } from "../../utils/storage";
import { loginSuccess } from "../../store/slices/authSlice";

const DEFAULT_PASSWORD = "Aapnogarage123";
const MODES = { LOGIN: "login", REGISTER: "register" };

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();

  const [mode, setMode] = useState(MODES.LOGIN);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Shows a banner after successful registration
  const [registeredBanner, setRegisteredBanner] = useState(false);

  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setPassword("");
    setErrors({});
    setRegisteredBanner(false);
    // Keep phone number pre-filled when switching modes
  };

  const validate = () => {
    const e = {};
    if (!phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      e.phone = "Enter a valid 10-digit phone number";
    }
    if (mode === MODES.LOGIN && !password) {
      e.password = "Password is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Login ───────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await login({ phoneNo: phone.trim(), password });
      if (response?.success) {
        const { accessToken, user, garage } = response.data ?? {};
        if (accessToken) await saveToken(accessToken);
        if (user) await saveUser(user);
        if (garage) await saveGarage(garage);
        dispatch(loginSuccess({ user, garage: garage ?? null, accessToken }));
      } else {
        Toast.show({ type: "error", text1: response?.message || "Login failed. Try again." });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err?.displayMessage || "Login failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Register — creates account then auto-fills default password ──
  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await register({ phoneNo: phone.trim() });
      if (response?.success) {
        // Switch to login mode, pre-fill password, show banner
        setMode(MODES.LOGIN);
        setPassword(DEFAULT_PASSWORD);
        setErrors({});
        setRegisteredBanner(true);
      } else {
        Toast.show({ type: "error", text1: response?.message || "Registration failed. Try again." });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err?.displayMessage || "Registration failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === MODES.LOGIN;

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
          {/* Hero */}
          <LinearGradient
            colors={COLORS.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <Text style={styles.logo}>🔧</Text>
              <Text style={styles.brand}>Garage System</Text>
              <Text style={styles.tagline}>Workshop Management Platform</Text>
            </View>
          </LinearGradient>

          {/* Form Card */}
          <Animated.View style={[styles.cardWrapper, { transform: [{ translateY }], opacity }]}>
            <LinearGradient
              colors={COLORS.gradCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formCard}
            >
              <Text style={styles.heading}>
                {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
              </Text>
              <Text style={styles.sub}>
                {isLogin ? "Sign in to manage your garage" : "Register with your phone number"}
              </Text>

              {/* ── Success banner after registration ─────────────── */}
              {registeredBanner && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <View style={styles.successBannerText}>
                    <Text style={styles.successBannerTitle}>Account created!</Text>
                    <Text style={styles.successBannerSub}>
                      Default password pre-filled below.{"\n"}Login and change it from Settings.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Register info card ────────────────────────────── */}
              {!isLogin && (
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoBannerText}>
                      Your account will be created with default password:
                    </Text>
                    <Text style={styles.defaultPasswordText}>{DEFAULT_PASSWORD}</Text>
                    <Text style={styles.infoBannerText}>
                      You can change it from Settings after logging in.
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.form}>
                <AppInput
                  label="Phone number"
                  icon="call-outline"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder="Enter 10-digit phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={errors.phone}
                  returnKeyType={isLogin ? "next" : "done"}
                  onSubmitEditing={!isLogin ? handleRegister : undefined}
                  accessibilityLabel="Phone number"
                />

                {isLogin && (
                  <AppInput
                    label="Password"
                    icon="lock-closed-outline"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="Enter your password"
                    secureTextEntry
                    error={errors.password}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    accessibilityLabel="Password"
                  />
                )}

                <AppButton
                  title={isLogin ? "Login" : "Create Account"}
                  variant="gradient"
                  size="lg"
                  onPress={isLogin ? handleLogin : handleRegister}
                  loading={submitting}
                  style={styles.cta}
                  accessibilityLabel={isLogin ? "Login" : "Create Account"}
                />
              </View>

              {/* ── Mode toggle ────────────────────────────────────── */}
              <View style={styles.modeRow}>
                <Text style={styles.modeText}>
                  {isLogin ? "New here? " : "Already have an account? "}
                </Text>
                <TouchableOpacity
                  onPress={() => switchMode(isLogin ? MODES.REGISTER : MODES.LOGIN)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.modeLink}>
                    {isLogin ? "Create account" : "Sign in"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Legal footer ───────────────────────────────────── */}
              <Text style={styles.footerNote}>
                By continuing you agree to our{" "}
                <Text style={styles.link} onPress={() => navigation.navigate("TermsOfService")}>
                  Terms of Service
                </Text>
                {"  &  "}
                <Text style={styles.link} onPress={() => navigation.navigate("PrivacyPolicy")}>
                  Privacy Policy
                </Text>
              </Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    height: 240,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 42, marginBottom: 4 },
  brand: { fontFamily: FONTS.extrabold, fontSize: 28, color: COLORS.white },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  // Card
  cardWrapper: { flex: 1, marginTop: -32 },
  formCard: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: 120,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.md,
  },
  heading: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textH,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: SIZES.md,
  },

  // Success banner (after registration)
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  successBannerText: { flex: 1 },
  successBannerTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.success,
  },
  successBannerSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.success,
    marginTop: 2,
    lineHeight: 16,
  },

  // Info banner (register mode)
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  infoBannerText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    lineHeight: 16,
  },
  defaultPasswordText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
    marginVertical: 4,
    letterSpacing: 0.5,
  },

  form: { gap: SIZES.xs },
  cta: { marginTop: SIZES.sm },

  // Mode toggle
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.lg,
  },
  modeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  modeLink: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Footer
  footerNote: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
    lineHeight: 18,
  },
  link: { color: COLORS.primary, fontFamily: FONTS.medium },
});
