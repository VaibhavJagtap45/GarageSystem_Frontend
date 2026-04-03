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
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { requestOtp } from "../../api/auth";

export default function LoginScreen({ navigation }) {

  const [phone, setPhoneNo] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const validate = () => {
    const e = {};
    if (!phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone.trim())) {
      e.phone = "Enter a valid 10-digit phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const response = await requestOtp({ phoneNo: phone.trim() });

      if (response?.success) {
        navigation.navigate("OtpScreen", {
          phone: phone.trim(),
        });
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
              <Text style={styles.heading}>Welcome 👋</Text>
              <Text style={styles.sub}>
                Enter your phone number to continue
              </Text>

              <View style={styles.form}>
                <AppInput
                  label="Phone number"
                  icon="call-outline"
                  value={phone}
                  onChangeText={(t) => {
                    setPhoneNo(t);
                    if (errors.phone) {
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }
                  }}
                  placeholder="Enter 10-digit phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={errors.phone}
                  accessibilityLabel="Phone number"
                  accessibilityHint="Enter your 10-digit phone number"
                />
                <AppButton
                  title="Request OTP"
                  variant="gradient"
                  size="lg"
                  onPress={handleSubmit}
                  loading={submitting}
                  style={styles.cta}
                  accessibilityLabel="Request OTP"
                />
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
  },

  // Hero
  hero: {
    height: 260,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 42,
    marginBottom: 4,
  },
  brand: {
    fontFamily: FONTS.extrabold,
    fontSize: 28,
    color: COLORS.white,
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  // Card
  cardWrapper: {
    flex: 1,
    marginTop: -32,
  },
  formCard: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: 140,
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
    marginBottom: SIZES.lg,
  },
  form: {
    gap: SIZES.xs,
  },
  cta: {
    marginTop: SIZES.sm,
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
