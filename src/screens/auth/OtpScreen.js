import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import AppButton from "../../components/ui/AppButton";
import TopNav from "../../components/ui/TopNav";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { verifyOtp, resendOtp } from "../../api/auth";
import { saveToken, saveUser, saveGarage } from "../../utils/storage";
import { loginSuccess } from "../../store/slices/authSlice";



const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen({ navigation, route }) {
  const phone = route?.params?.phone ?? "";
  const dispatch = useDispatch();


  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const inputs = useRef([]);
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    setError("");
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      setSubmitting(true);
      const response = await verifyOtp({ phoneNo: phone.trim(), otp: code });
      if (response?.success) {
        const { accessToken, user, garage, isProfileComplete } = response.data ?? {};

        // Persist to AsyncStorage
        if (accessToken) await saveToken(accessToken);
        if (user) await saveUser(user);
        if (garage) await saveGarage(garage);

        // Hydrate Redux store.
        // AppNavigator watches role + garage.isProfileComplete and routes automatically:
        //   owner + incomplete  → GarageDetails (onboarding)
        //   owner + complete    → GarageTabs (full app)
        //   customer/member     → CustomerMemberTabs
        dispatch(loginSuccess({ user, garage: garage ?? null, accessToken }));
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Invalid OTP. Please try again.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Invalid OTP. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleResend = async () => {
    try {
      setResending(true);
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      inputs.current[0]?.focus();

      const response = await resendOtp({ phoneNo: phone });
      if (response?.success) {
        setCountdown(RESEND_SECONDS);
        Toast.show({
          type: "success",
          text1: response?.message || "OTP resent successfully!",
        });
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Failed to resend OTP. Try again.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Failed to resend OTP. Try again.",
      });
    } finally {
      setResending(false);
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
          <TopNav title="Verify Number" showBack transparent dark={false} />

          <LinearGradient
            colors={COLORS.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="shield-checkmark"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.brand}>Verify Number</Text>
              <Text style={styles.tagline}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.mobileText}>
                  +91 {phone || "XXXXXXXXXX"}
                </Text>
              </Text>
            </View>
          </LinearGradient>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.cardWrapper,
              { transform: [{ translateY }], opacity },
            ]}
          >
            <LinearGradient
              colors={COLORS.gradCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formCard}
            >
              <Text style={styles.heading}>Enter OTP 🔐</Text>
              <Text style={styles.sub}>Type the 6-digit code we sent you</Text>

              {/* OTP Boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(r) => (inputs.current[index] = r)}
                    style={[
                      styles.otpBox,
                      digit && styles.otpBoxFilled,
                      error && styles.otpBoxError,
                    ]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectionColor={COLORS.primary}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                  />
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AppButton
                title="Verify OTP"
                variant="gradient"
                size="lg"
                onPress={handleVerify}
                loading={submitting}
                style={styles.cta}
                accessibilityLabel="Verify OTP"
              />

              {/* Resend row */}
              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                {countdown > 0 ? (
                  <Text style={styles.countdown}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    accessibilityLabel="Resend OTP"
                    accessibilityRole="button"
                  >
                    <Text style={styles.resendLink}>
                      {resending ? "Resending…" : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.footerNote}>
                By continuing you agree to our{"\n"}
                <TouchableOpacity
                  onPress={() => navigation.navigate("TermsOfService")}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.link}>Terms of Service</Text>
                </TouchableOpacity>
                <Text>{"  &  "}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.link}>Privacy Policy</Text>
                </TouchableOpacity>
              </Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    minHeight: "100%",
  },

  // Hero
  hero: {
    height: 360,
    marginTop: -96,
    paddingTop: 96,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: SIZES.lg,
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
  brand: {
    fontFamily: FONTS.extrabold,
    fontSize: 26,
    color: COLORS.white,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  mobileText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  // Card
  cardWrapper: {
    marginTop: -32,
    flex: 1,
  },
  formCard: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xxl,
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
    marginBottom: SIZES.xl,
  },

  // OTP
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgInput,
    fontSize: SIZES.textLg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    marginBottom: SIZES.md,
  },
  cta: {
    marginTop: SIZES.md,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.lg,
  },
  resendText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  resendLink: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  countdown: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  footerNote: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: SIZES.lg,
  },
  link: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
});
