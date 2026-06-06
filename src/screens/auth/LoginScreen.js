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
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { login, register } from "../../api/auth";
import {
  saveToken,
  saveTokenExpiry,
  saveUser,
  saveGarage,
} from "../../utils/storage";
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
  const [registeredBanner, setRegisteredBanner] = useState(false);

  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 4,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setPassword("");
    setErrors({});
    setRegisteredBanner(false);
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

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await login({ phoneNo: phone.trim(), password });
      if (response?.success) {
        const {
          accessToken,
          accessTokenExpiresAt,
          user,
          garage,
        } = response.data ?? {};
        if (accessToken) await saveToken(accessToken);
        await saveTokenExpiry(accessTokenExpiresAt ?? null);
        if (user) await saveUser(user);
        if (garage) await saveGarage(garage);
        dispatch(
          loginSuccess({
            user,
            garage: garage ?? null,
            accessToken,
            accessTokenExpiresAt: accessTokenExpiresAt ?? null,
          }),
        );
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Login failed. Try again.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Login failed. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await register({ phoneNo: phone.trim() });
      if (response?.success) {
        setMode(MODES.LOGIN);
        setPassword(DEFAULT_PASSWORD);
        setErrors({});
        setRegisteredBanner(true);
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Registration failed. Try again.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Registration failed. Try again.",
      });
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ──────────────────────────────────────────────── */}
          <Animated.View style={{ transform: [{ scale: heroScale }] }}>
            <LinearGradient
              colors={[COLORS.primaryDark, COLORS.primary, "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {/* Decorative circles */}
              <View style={[styles.heroDeco, styles.heroDecoTL]} />
              <View style={[styles.heroDeco, styles.heroDecoBR]} />

              <View style={styles.heroContent}>
                <View style={styles.logoCircle}>
                  <Ionicons name="construct" size={32} color={COLORS.white} />
                </View>
                <Text style={styles.brand}>Aapno Garage</Text>
                <Text style={styles.tagline}>Smart Workshop Management</Text>

                {/* Feature pills */}
                <View style={styles.pillRow}>
                  {["Invoicing", "Inventory", "Reports"].map((label) => (
                    <View key={label} style={styles.pill}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.pillText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Form Card ─────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.cardWrapper,
              { transform: [{ translateY }], opacity },
            ]}
          >
            <View style={styles.formCard}>
              <Text style={styles.heading}>
                {isLogin ? "Welcome Back" : "Get Started"}
              </Text>
              <Text style={styles.sub}>
                {isLogin
                  ? "Sign in to continue"
                  : "Create your customer account in seconds"}
              </Text>

              {/* ── Success banner after registration ──────────────── */}
              {registeredBanner && (
                <View style={styles.successBanner}>
                  <View style={styles.successIconWrap}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.success}
                    />
                  </View>
                  <View style={styles.successBannerText}>
                    <Text style={styles.successBannerTitle}>
                      Account created successfully!
                    </Text>
                    <Text style={styles.successBannerSub}>
                      Default password pre-filled below.{"\n"}Change it from
                      Settings after login.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Register info card ─────────────────────────────── */}
              {!isLogin && (
                <View style={styles.infoBanner}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoBannerText}>
                      Your customer account will be created with default password:
                    </Text>
                    <View style={styles.passwordChip}>
                      <Text style={styles.defaultPasswordText}>
                        {DEFAULT_PASSWORD}
                      </Text>
                    </View>
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
                    if (errors.phone)
                      setErrors((p) => ({ ...p, phone: undefined }));
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
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: undefined }));
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
                  title={isLogin ? "Sign In" : "Create Account"}
                  variant="gradient"
                  size="lg"
                  onPress={isLogin ? handleLogin : handleRegister}
                  loading={submitting}
                  leftIcon={isLogin ? "log-in-outline" : "person-add-outline"}
                  style={styles.cta}
                  accessibilityLabel={isLogin ? "Sign In" : "Create Account"}
                />
              </View>

              {/* ── Mode toggle ─────────────────────────────────────── */}
              <View style={styles.modeRow}>
                <Text style={styles.modeText}>
                  {isLogin ? "New here? " : "Already have an account? "}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    switchMode(isLogin ? MODES.REGISTER : MODES.LOGIN)
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.modeLink}>
                    {isLogin ? "Create account" : "Sign in"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Legal footer ────────────────────────────────────── */}
              <Text style={styles.footerNote}>
                By continuing you agree to our{" "}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate("TermsOfService")}
                >
                  Terms of Service
                </Text>
                {"  &  "}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    height: 280,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroDecoTL: { width: 180, height: 180, top: -40, left: -40 },
  heroDecoBR: { width: 120, height: 120, bottom: -20, right: -20 },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 10,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.sm,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: {
    fontFamily: FONTS.extrabold,
    fontSize: 30,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  pillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
  },

  // ── Card ──────────────────────────────────────────────────────
  cardWrapper: { flex: 1, marginTop: -36 },
  formCard: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl + 4,
    paddingBottom: 120,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.lg,
  },
  heading: {
    fontFamily: FONTS.extrabold,
    fontSize: 28,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: SIZES.lg,
  },

  // ── Success banner ────────────────────────────────────────────
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  successIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(29,158,117,0.1)",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 3,
    lineHeight: 17,
  },

  // ── Info banner ───────────────────────────────────────────────
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(29,158,117,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBannerText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    lineHeight: 17,
  },
  passwordChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(29,158,117,0.12)",
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    marginVertical: 5,
  },
  defaultPasswordText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },

  form: { gap: SIZES.sm },
  cta: { marginTop: SIZES.md },

  // ── Mode toggle ───────────────────────────────────────────────
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.xl,
  },
  modeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  modeLink: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // ── Footer ────────────────────────────────────────────────────
  footerNote: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
    lineHeight: 18,
  },
  link: { color: COLORS.primary, fontFamily: FONTS.semibold },
});
