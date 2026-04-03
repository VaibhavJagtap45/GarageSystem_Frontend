import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppRadioGroup from "../../components/ui/AppRadioGroup";
import AppSelect from "../../components/ui/AppSelect";
import AppToggle from "../../components/ui/AppToggle";
import { updateProfile, uploadImage } from "../../api/auth";
import { updateGarage, setUser } from "../../store/slices/authSlice";
import { saveGarage } from "../../utils/storage";

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total = 3 }) {
  return (
    <View style={si.wrapper}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                si.circle,
                done && si.circleDone,
                active && si.circleActive,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              ) : (
                <Text style={[si.num, active && si.numActive]}>{step}</Text>
              )}
            </View>
            {step < total && (
              <View style={si.lineWrap}>
                <View style={[si.line, step < current && si.lineDone]} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const si = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.sm,
  },
  circleDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.successLight,
  },
  num: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  numActive: { color: COLORS.white },
  lineWrap: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 999,
    overflow: "hidden",
  },
  line: { flex: 1, backgroundColor: COLORS.borderLight },
  lineDone: { backgroundColor: COLORS.success },
});

// ─── Step 1: Garage Info ──────────────────────────────────────────────────────
// garageType enum must be "twoWheeler" | "fourWheeler"  (Zod z.enum)
// garageName, garageOwnerName  → required, min 2
// fullName                     → optional, min 2 if provided
// garageAddress                → required, min 5
const GARAGE_TYPE_OPTIONS = [
  { value: "twoWheeler", label: "Two Wheeler 🛵" },
  { value: "fourWheeler", label: "Four Wheeler 🚗" },
];

function Step1({ data, setData, errors }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.sectionLabel}>Garage Info</Text>
      <View style={styles.card}>
        <AppRadioGroup
          label="Garage type *"
          options={GARAGE_TYPE_OPTIONS}
          value={data.garageType}
          onChange={(v) => setData((p) => ({ ...p, garageType: v }))}
          error={errors.garageType}
          direction="row"
        />
        <AppInput
          label="Garage name *"
          value={data.garageName}
          onChangeText={(v) => setData((p) => ({ ...p, garageName: v }))}
          placeholder="e.g. Kumar Auto Works"
          icon="business-outline"
          error={errors.garageName}
        />
        <AppInput
          label="Owner name *"
          value={data.garageOwnerName}
          onChangeText={(v) => setData((p) => ({ ...p, garageOwnerName: v }))}
          placeholder="e.g. Rahul Kumar"
          icon="person-outline"
          error={errors.garageOwnerName}
        />
        <AppInput
          label="Full name"
          value={data.fullName}
          onChangeText={(v) => setData((p) => ({ ...p, fullName: v }))}
          placeholder="As per official records (optional)"
          icon="id-card-outline"
          error={errors.fullName}
        />
        <AppInput
          label="Garage address *"
          value={data.garageAddress}
          onChangeText={(v) => setData((p) => ({ ...p, garageAddress: v }))}
          placeholder="Street, Area, City"
          icon="location-outline"
          multiline
          numberOfLines={3}
          error={errors.garageAddress}
        />
      </View>
    </View>
  );
}

// ─── Step 2: Contact & Location ───────────────────────────────────────────────
// garageContactNumber → required, regex ^[6-9]\d{9}$
// emailId             → required, valid email
// state               → optional
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

function Step2({ data, setData, errors }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.sectionLabel}>Contact & Location</Text>
      <View style={styles.card}>
        <AppInput
          label="Garage contact number *"
          value={data.garageContactNumber}
          onChangeText={(v) =>
            setData((p) => ({ ...p, garageContactNumber: v }))
          }
          placeholder="10-digit number starting with 6–9"
          icon="call-outline"
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.garageContactNumber}
        />
        <AppInput
          label="Email *"
          value={data.emailId}
          onChangeText={(v) => setData((p) => ({ ...p, emailId: v }))}
          placeholder="garage@email.com"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.emailId}
        />
        <AppSelect
          label="State"
          icon="map-outline"
          options={STATE_OPTIONS}
          value={data.state}
          onChange={(v) => setData((p) => ({ ...p, state: v }))}
          placeholder="Select State (optional)"
        />
      </View>
    </View>
  );
}

// ─── Step 3: Optional Details ─────────────────────────────────────────────────
// isGstApplicable → boolean, default false
// gstNumber       → required when isGstApplicable, regex validated, "" transforms to undefined
// garageLogo      → optional valid URL; local URI must be uploaded first → URL
function Step3({ data, setData, errors, logoUploading }) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to upload logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      // Stage local URI; actual upload happens on submit
      setData((p) => ({
        ...p,
        _logoLocalUri: result.assets[0].uri,
        garageLogo: null,
      }));
    }
  };

  const previewUri = data._logoLocalUri || data.garageLogo || null;

  return (
    <View style={styles.stepContent}>
      <Text style={styles.sectionLabel}>Optional Details</Text>
      <View style={styles.card}>
        <AppToggle
          label="GST Applicable?"
          sublabel="Enable if you charge GST"
          icon="document-text-outline"
          value={data.isGstApplicable}
          onChange={(v) =>
            setData((p) => ({
              ...p,
              isGstApplicable: v,
              gstNumber: v ? p.gstNumber : "",
            }))
          }
        />

        {data.isGstApplicable && (
          <AppInput
            label="GSTIN number *"
            value={data.gstNumber}
            onChangeText={(v) =>
              setData((p) => ({ ...p, gstNumber: v.toUpperCase() }))
            }
            placeholder="e.g. 27AAAAA0000A1Z5"
            icon="document-text-outline"
            autoCapitalize="characters"
            maxLength={15}
            error={errors.gstNumber}
          />
        )}

        <Text style={[styles.fieldLabel, { marginTop: SIZES.sm }]}>
          Garage logo
        </Text>
        <View style={styles.logoArea}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons
                name="image-outline"
                size={36}
                color={COLORS.textMuted}
              />
              <Text style={styles.logoPlaceholderText}>ADD LOGO</Text>
            </View>
          )}
        </View>
        {logoUploading && (
          <Text style={styles.uploadingText}>Uploading logo…</Text>
        )}
        <AppButton
          title={previewUri ? "Change Logo" : "Add Logo"}
          leftIcon="camera-outline"
          variant="ghost"
          size="sm"
          fullWidth={false}
          onPress={pickImage}
          style={{
            alignSelf: "center",
            marginTop: SIZES.sm,
            paddingHorizontal: SIZES.xl,
          }}
        />
      </View>
    </View>
  );
}

// ─── Validation — mirrors Zod schema rules exactly ────────────────────────────
// ^[6-9]\d{9}$  (Zod garageContactNumber)
const PHONE_REGEX = /^[6-9]\d{9}$/;
// GST regex from Zod schema
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Main Screen ──────────────────────────────────────────────────────────────
const STEP_LABELS = ["Garage Info", "Contact & Location", "Optional Details"];

function GarageDetails({ navigation, route }) {
  // Accepts `garage` param (from MyGarageProfileScreen edit, or null from OTP onboarding)
  const prefill = route?.params?.garage ?? {};
  const dispatch = useDispatch();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // State keys match backend payload / Zod schema keys exactly.
  // _logoLocalUri is a local-only staging field — never sent to backend.
  const [data, setData] = useState({
    garageType: prefill.garageType || "twoWheeler",
    garageName: prefill.garageName || "",
    garageOwnerName: prefill.garageOwnerName || "",
    fullName: prefill.fullName || "",
    garageAddress: prefill.garageAddress || "",
    garageContactNumber: prefill.garageContactNumber || "",
    emailId: prefill.emailId || "",
    state: prefill.state || "",
    isGstApplicable: prefill.isGstApplicable || false,
    gstNumber: prefill.gstNumber || "",
    garageLogo: prefill.garageLogo || null, // valid URL or null
    _logoLocalUri: null, // local staging only
  });

  // Navigation is handled declaratively by AppNavigator:
  // once garage.isProfileComplete = true in Redux, AppNavigator re-renders to GarageTabs.

  const validate = () => {
    const e = {};

    if (step === 1) {
      if (data.garageName.trim().length < 2) e.garageName = "Min 2 characters";
      if (data.garageOwnerName.trim().length < 2)
        e.garageOwnerName = "Min 2 characters";
      if (data.fullName.trim() && data.fullName.trim().length < 2)
        e.fullName = "Min 2 characters";
      if (data.garageAddress.trim().length < 5)
        e.garageAddress = "Min 5 characters";
    }

    if (step === 2) {
      if (!PHONE_REGEX.test(data.garageContactNumber))
        e.garageContactNumber = "Must be 10 digits starting with 6–9";
      if (!EMAIL_REGEX.test(data.emailId.trim()))
        e.emailId = "Enter a valid email address";
    }

    if (step === 3) {
      if (data.isGstApplicable && !GST_REGEX.test(data.gstNumber))
        e.gstNumber = "Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    try {
      setSubmitting(true);

      // Upload local image first to get a URL the backend accepts
      let logoUrl = data.garageLogo || undefined;
      if (data._logoLocalUri) {
        try {
          setLogoUploading(true);
          logoUrl = await uploadImage(data._logoLocalUri); // must return a URL string
        } catch {
          Toast.show({
            type: "error",
            text1: "Logo upload failed. Continuing without logo.",
          });
          logoUrl = undefined;
        } finally {
          setLogoUploading(false);
        }
      }

      // Payload matches backend destructuring and Zod schema exactly.
      // phone and referralCode are NOT accepted by the backend — excluded.
      const payload = {
        garageType: data.garageType,
        garageName: data.garageName.trim(),
        garageOwnerName: data.garageOwnerName.trim(),
        garageAddress: data.garageAddress.trim(),
        garageContactNumber: data.garageContactNumber,
        emailId: data.emailId.trim(),
        isGstApplicable: data.isGstApplicable,
        // gstNumber: "" transforms to undefined in Zod; send "" when GST is off
        gstNumber: data.isGstApplicable ? data.gstNumber : "",
        // Optional fields — omit key entirely when empty
        ...(data.fullName.trim() && { fullName: data.fullName.trim() }),
        ...(data.state && { state: data.state }),
        ...(logoUrl && { garageLogo: logoUrl }),
      };

      const result = await updateProfile(payload);

      // Backend returns the full saved garage with isProfileComplete: true.
      // Use that as the source of truth — never construct it locally.
      const savedGarage = result?.data?.garage ?? { ...payload, isProfileComplete: true };
      const savedUser   = result?.data?.user;

      // Persist so next cold-start skips onboarding
      await saveGarage(savedGarage);

      // Sync Redux first (updates isProfileComplete in store)
      dispatch(updateGarage(savedGarage));
      if (savedUser) dispatch(setUser(savedUser));

      Toast.show({
        type: "success",
        text1: "Garage profile saved!",
        text2: "Welcome to your garage!",
      });

      // Navigate imperatively to App — App screen is always present in the
      // owner stack (AppNavigator includes it even during onboarding) so this
      // replace is safe and gives a smooth slide-in without any flicker.
      navigation.replace("App");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.displayMessage || "Failed to save profile. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (step > 1) {
      setStep((s) => s - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
    // step 1 + root screen (onboarding) — nothing to go back to, do nothing
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }} edges={["top"]}>
        <TopNav title="Garage Details" onBackPress={handlePrev} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <Text style={styles.heroText}>30 Seconds To Get Started!</Text>
            <Text style={styles.heroSub}>
              Step {step} of 3 · {STEP_LABELS[step - 1]}
            </Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicatorWrap}>
            <StepIndicator current={step} total={3} />
          </View>

          {step === 1 && (
            <Step1 data={data} setData={setData} errors={errors} />
          )}
          {step === 2 && (
            <Step2 data={data} setData={setData} errors={errors} />
          )}
          {step === 3 && (
            <Step3
              data={data}
              setData={setData}
              errors={errors}
              logoUploading={logoUploading}
            />
          )}

          {/* Navigation Buttons */}
          <View style={styles.btnRow}>
            {step > 1 ? (
              <>
                <TouchableOpacity
                  style={styles.prevBtn}
                  onPress={handlePrev}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.nextWrap}>
                  <AppButton
                    title={step === 3 ? "Finish Setup" : "Next"}
                    leftIcon={
                      step === 3
                        ? "checkmark-circle-outline"
                        : "arrow-forward-outline"
                    }
                    variant="gradient"
                    size="md"
                    fullWidth={true}
                    loading={step === 3 && (submitting || logoUploading)}
                    onPress={handleNext}
                  />
                </View>
              </>
            ) : (
              <AppButton
                title="Next"
                leftIcon="arrow-forward-outline"
                variant="gradient"
                size="md"
                fullWidth={true}
                onPress={handleNext}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: SIZES.xxl },
  heroBanner: { alignItems: "center", paddingVertical: SIZES.lg, gap: 4 },
  heroText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  heroSub: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  stepIndicatorWrap: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.bg,
  },
  stepContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
    marginBottom: SIZES.md,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  uploadingText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  logoArea: {
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: SIZES.radiusLg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: "dashed",
    marginTop: 4,
  },
  logoPreview: { width: "100%", height: "100%" },
  logoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgInput,
    gap: 6,
  },
  logoPlaceholderText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.xl,
    marginBottom: SIZES.lg,
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 45,
    width: 110,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgCard,
  },
  prevBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },
  nextWrap: { flex: 1 },
});

export default GarageDetails;
