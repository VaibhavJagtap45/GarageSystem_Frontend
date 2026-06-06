import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSelector, useDispatch } from "react-redux";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  AUTH_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppRadioGroup from "../../components/ui/AppRadioGroup";
import AppSelect from "../../components/ui/AppSelect";
import AppToggle from "../../components/ui/AppToggle";
import axiosClient from "../../api/axios";
import { updateGarage, setUser } from "../../store/slices/authSlice";
import { saveGarage, saveUser } from "../../utils/storage";

const STATES = [
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
].map((s) => ({ value: s, label: s }));

// ── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, gradientColors, children, index = 0 }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.sectionCard, { transform: [{ translateY }], opacity }]}
    >
      {/* Accent strip */}
      <LinearGradient
        colors={gradientColors || [COLORS.primary, "#34D399"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sectionAccent}
      />

      <View style={styles.sectionCardInner}>
        <View style={styles.sectionCardHeader}>
          <LinearGradient
            colors={gradientColors || [COLORS.primary, "#34D399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconGrad}
          >
            <Ionicons name={icon} size={15} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.sectionCardTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function EditGarageScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const tabBarHeight = useBottomTabBarHeight();

  const reduxGarage = useSelector((state) => state.auth.garage);
  const reduxUser = useSelector((state) => state.auth.user);

  const init = route.params?.garage ?? reduxGarage ?? {};

  const [garageType, setGarageType] = useState(init.garageType ?? "twoWheeler");
  const [garageName, setGarageName] = useState(init.garageName ?? "");
  const [garageOwnerName, setGarageOwnerName] = useState(
    init.garageOwnerName ?? "",
  );
  const [garageContactNumber, setGarageContactNumber] = useState(
    init.garageContactNumber ?? "",
  );
  const [emailId, setEmailId] = useState(reduxUser?.emailId ?? "");
  const [state, setStateVal] = useState(init.state ?? "");
  const [garageAddress, setGarageAddress] = useState(init.garageAddress ?? "");
  const [isGstApplicable, setIsGstApplicable] = useState(
    init.isGstApplicable ?? false,
  );
  const [gstNumber, setGstNumber] = useState(init.gstNumber ?? "");
  const [garageLogo, setGarageLogo] = useState(init.garageLogo ?? null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Hero animation
  const heroScale = useRef(new Animated.Value(0.95)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 3,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = () => {
    const e = {};
    if (!garageName.trim()) e.garageName = "Garage name is required";
    if (!garageOwnerName.trim()) e.garageOwnerName = "Owner name is required";
    if (!/^[6-9]\d{9}$/.test(garageContactNumber.trim()))
      e.garageContactNumber = "Valid 10-digit number required";
    if (!garageAddress.trim()) e.garageAddress = "Address is required";
    if (isGstApplicable && !gstNumber.trim())
      e.gstNumber = "GST number is required";
    return e;
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow photo library access to upload a logo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setGarageLogo(
        `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`,
      );
    }
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const res = await axiosClient.post(AUTH_ENDPOINTS.UPDATE_PROFILE, {
        garageName: garageName.trim(),
        garageOwnerName: garageOwnerName.trim(),
        garageContactNumber: garageContactNumber.trim(),
        emailId: emailId.trim() || undefined,
        state: state || undefined,
        garageAddress: garageAddress.trim(),
        garageType,
        isGstApplicable,
        gstNumber: isGstApplicable ? gstNumber.trim() : "",
        garageLogo: garageLogo ?? undefined,
      });

      const { garage: updatedGarage, user: updatedUser } = res.data?.data ?? {};

      if (updatedGarage) {
        dispatch(updateGarage(updatedGarage));
        await saveGarage(updatedGarage);
      }
      if (updatedUser) {
        dispatch(setUser(updatedUser));
        await saveUser(updatedUser);
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Save Failed",
        err.displayMessage ?? "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />
      <TopNav title="Edit Garage" transparent={false} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.heroWrapper,
            { transform: [{ scale: heroScale }], opacity: heroOpacity },
          ]}
        >
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
              {/* Logo preview in hero */}
              <TouchableOpacity
                onPress={pickLogo}
                activeOpacity={0.85}
                style={styles.heroLogoWrap}
              >
                {garageLogo ? (
                  <Image
                    source={{ uri: garageLogo }}
                    style={styles.heroLogoImg}
                  />
                ) : (
                  <View style={styles.heroLogoPlaceholder}>
                    <Ionicons
                      name="storefront"
                      size={28}
                      color="rgba(255,255,255,0.6)"
                    />
                  </View>
                )}
                <View style={styles.heroLogoEditBadge}>
                  <Ionicons name="camera" size={10} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {garageName || "Your Garage"}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {garageOwnerName
                    ? `by ${garageOwnerName}`
                    : "Edit your garage details"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Garage Type ──────────────────────────────────────────── */}
        <SectionCard
          title="Garage Type"
          icon="construct-outline"
          index={0}
          gradientColors={[COLORS.primaryDark, COLORS.primary]}
        >
          <AppRadioGroup
            options={[
              {
                value: "twoWheeler",
                label: "Two Wheeler",
                icon: "bicycle-outline",
              },
              {
                value: "fourWheeler",
                label: "Four Wheeler",
                icon: "car-outline",
              },
            ]}
            value={garageType}
            onChange={setGarageType}
            direction="row"
          />
        </SectionCard>

        {/* ── Garage Logo ──────────────────────────────────────────── */}
        <SectionCard
          title="Garage Logo"
          icon="image-outline"
          index={1}
          gradientColors={["#8B5CF6", "#A78BFA"]}
        >
          <View style={styles.logoRow}>
            <TouchableOpacity
              style={styles.logoPreview}
              onPress={pickLogo}
              activeOpacity={0.8}
            >
              {garageLogo ? (
                <Image source={{ uri: garageLogo }} style={styles.logoImg} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons
                    name="storefront-outline"
                    size={28}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.logoPlaceholderTxt}>No logo</Text>
                </View>
              )}
              {/* Overlay on hover */}
              <View style={styles.logoOverlay}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={COLORS.white}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.logoActions}>
              <TouchableOpacity
                style={styles.logoPickBtn}
                onPress={pickLogo}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, "#34D399"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.logoPickBtnGrad}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.logoPickTxt}>Upload Logo</Text>
                </LinearGradient>
              </TouchableOpacity>

              {garageLogo && (
                <TouchableOpacity
                  style={styles.logoRemoveBtn}
                  onPress={() => setGarageLogo(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text style={styles.logoRemoveTxt}>Remove</Text>
                </TouchableOpacity>
              )}

              <View style={styles.logoHintRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={12}
                  color={COLORS.textMuted}
                />
                <Text style={styles.logoHint}>
                  Square image (1:1) recommended
                </Text>
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ── Basic Info ───────────────────────────────────────────── */}
        <SectionCard
          title="Basic Info"
          icon="information-circle-outline"
          index={2}
          gradientColors={["#3B82F6", "#60A5FA"]}
        >
          <AppInput
            label="Garage Name"
            icon="storefront-outline"
            value={garageName}
            onChangeText={(v) => {
              setGarageName(v);
              setErrors((p) => ({ ...p, garageName: "" }));
            }}
            placeholder="Enter garage name"
            error={errors.garageName}
          />
          <AppInput
            label="Owner Name"
            icon="person-outline"
            value={garageOwnerName}
            onChangeText={(v) => {
              setGarageOwnerName(v);
              setErrors((p) => ({ ...p, garageOwnerName: "" }));
            }}
            placeholder="Enter owner name"
            error={errors.garageOwnerName}
          />
          <AppInput
            label="Contact Number"
            icon="call-outline"
            value={garageContactNumber}
            onChangeText={(v) => {
              setGarageContactNumber(v);
              setErrors((p) => ({ ...p, garageContactNumber: "" }));
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.garageContactNumber}
          />
          <AppInput
            label="Email Address"
            icon="mail-outline"
            value={emailId}
            onChangeText={setEmailId}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </SectionCard>

        {/* ── Location ─────────────────────────────────────────────── */}
        <SectionCard
          title="Location"
          icon="location-outline"
          index={3}
          gradientColors={["#F59E0B", "#FBBF24"]}
        >
          <AppSelect
            label="State"
            icon="map-outline"
            options={STATES}
            value={state}
            onChange={setStateVal}
            placeholder="Select State"
          />
          <AppInput
            label="Address"
            icon="location-outline"
            value={garageAddress}
            onChangeText={(v) => {
              setGarageAddress(v);
              setErrors((p) => ({ ...p, garageAddress: "" }));
            }}
            placeholder="Enter full address"
            error={errors.garageAddress}
          />
        </SectionCard>

        {/* ── Tax Settings ─────────────────────────────────────────── */}
        <SectionCard
          title="Tax Settings"
          icon="receipt-outline"
          index={4}
          gradientColors={["#EF4444", "#F87171"]}
        >
          <AppToggle
            label="GST Applicable"
            sublabel="Enable if your garage is GST registered"
            icon="document-text-outline"
            value={isGstApplicable}
            onChange={(v) => {
              setIsGstApplicable(v);
              if (!v) setGstNumber("");
            }}
          />
          {isGstApplicable && (
            <AppInput
              label="GST Number"
              icon="card-outline"
              value={gstNumber}
              onChangeText={(v) => {
                setGstNumber(v.toUpperCase());
                setErrors((p) => ({ ...p, gstNumber: "" }));
              }}
              placeholder="e.g. 27AAPFU0939F1ZV"
              autoCapitalize="characters"
              maxLength={15}
              error={errors.gstNumber}
            />
          )}
        </SectionCard>
      </ScrollView>

      {/* ── Footer CTA ─────────────────────────────────────────────── */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveOuter, saving && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary, "#34D399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGrad}
          >
            <Ionicons
              name={saving ? "hourglass-outline" : "checkmark-circle-outline"}
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    paddingBottom: 160,
  },

  // ── Hero Banner ───────────────────────────────────────────────
  heroWrapper: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    ...SHADOWS.lg,
  },
  hero: {
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    position: "relative",
    overflow: "hidden",
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroDecoTL: { width: 120, height: 120, top: -30, left: -30 },
  heroDecoBR: { width: 80, height: 80, bottom: -20, right: -20 },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
  },
  heroLogoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.35)",
    position: "relative",
  },
  heroLogoImg: {
    width: "100%",
    height: "100%",
  },
  heroLogoPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    gap: 3,
  },
  heroTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: 20,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.75)",
  },

  // ── Section Card ──────────────────────────────────────────────
  sectionCard: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  sectionAccent: {
    height: 3,
  },
  sectionCardInner: {
    padding: SIZES.md,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionIconGrad: {
    width: 30,
    height: 30,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },

  // ── Logo Section ──────────────────────────────────────────────
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.md,
  },
  logoPreview: {
    width: 88,
    height: 88,
    borderRadius: SIZES.radiusMd,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    position: "relative",
    ...SHADOWS.sm,
  },
  logoImg: { width: 88, height: 88 },
  logoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgSection,
    gap: 4,
  },
  logoPlaceholderTxt: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  logoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoActions: {
    flex: 1,
    gap: SIZES.sm,
  },
  logoPickBtn: {
    borderRadius: SIZES.radiusSm,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  logoPickBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: SIZES.radiusSm,
  },
  logoPickTxt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },
  logoRemoveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.error + "40",
    borderRadius: SIZES.radiusSm,
    paddingVertical: 8,
    backgroundColor: COLORS.errorLight,
  },
  logoRemoveTxt: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
  },
  logoHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoHint: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: Platform.OS === "ios" ? SIZES.md : SIZES.sm,
    paddingTop: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  saveOuter: {
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  saveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.sm,
    height: SIZES.btnHeightLg,
    borderRadius: SIZES.radiusFull,
  },
  saveBtnText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
});
