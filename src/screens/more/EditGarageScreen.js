import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
].map((s) => ({ value: s, label: s }));

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={15} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function EditGarageScreen() {
  const navigation    = useNavigation();
  const route         = useRoute();
  const dispatch      = useDispatch();
  const tabBarHeight  = useBottomTabBarHeight();

  const reduxGarage = useSelector((state) => state.auth.garage);
  const reduxUser   = useSelector((state) => state.auth.user);

  // Prefer route param (freshly passed from profile screen), fall back to Redux
  const init = route.params?.garage ?? reduxGarage ?? {};

  const [garageType,          setGarageType]          = useState(init.garageType          ?? "twoWheeler");
  const [garageName,          setGarageName]          = useState(init.garageName          ?? "");
  const [garageOwnerName,     setGarageOwnerName]     = useState(init.garageOwnerName     ?? "");
  const [garageContactNumber, setGarageContactNumber] = useState(init.garageContactNumber ?? "");
  const [emailId,             setEmailId]             = useState(reduxUser?.emailId        ?? "");
  const [state,               setStateVal]            = useState(init.state               ?? "");
  const [garageAddress,       setGarageAddress]       = useState(init.garageAddress       ?? "");
  const [isGstApplicable,     setIsGstApplicable]     = useState(init.isGstApplicable     ?? false);
  const [gstNumber,           setGstNumber]           = useState(init.gstNumber           ?? "");
  const [garageLogo,          setGarageLogo]          = useState(init.garageLogo          ?? null);
  const [saving,              setSaving]              = useState(false);
  const [errors,              setErrors]              = useState({});

  const validate = () => {
    const e = {};
    if (!garageName.trim())          e.garageName          = "Garage name is required";
    if (!garageOwnerName.trim())     e.garageOwnerName     = "Owner name is required";
    if (!/^[6-9]\d{9}$/.test(garageContactNumber.trim()))
                                     e.garageContactNumber = "Valid 10-digit number required";
    if (!garageAddress.trim())       e.garageAddress       = "Address is required";
    if (isGstApplicable && !gstNumber.trim())
                                     e.gstNumber           = "GST number is required";
    return e;
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access to upload a logo.");
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
      setGarageLogo(`data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`);
    }
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setErrors({});
    try {
      const res = await axiosClient.post(AUTH_ENDPOINTS.UPDATE_PROFILE, {
        garageName:          garageName.trim(),
        garageOwnerName:     garageOwnerName.trim(),
        garageContactNumber: garageContactNumber.trim(),
        emailId:             emailId.trim() || undefined,
        state:               state         || undefined,
        garageAddress:       garageAddress.trim(),
        garageType,
        isGstApplicable,
        gstNumber:           isGstApplicable ? gstNumber.trim() : "",
        garageLogo:          garageLogo ?? undefined,
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
      Alert.alert("Save Failed", err.displayMessage ?? "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <TopNav title="Edit Garage" transparent={false} showBack />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Garage Type ── */}
        <SectionCard title="Garage Type" icon="construct-outline">
          <AppRadioGroup
            options={[
              { value: "twoWheeler",  label: "Two Wheeler",  icon: "bicycle-outline" },
              { value: "fourWheeler", label: "Four Wheeler", icon: "car-outline"     },
              { value: "both",        label: "Both",         icon: "swap-horizontal-outline" },
            ]}
            value={garageType}
            onChange={setGarageType}
            direction="row"
          />
        </SectionCard>

        {/* ── Garage Logo ── */}
        <SectionCard title="Garage Logo" icon="image-outline">
          <View style={styles.logoRow}>
            <TouchableOpacity style={styles.logoPreview} onPress={pickLogo} activeOpacity={0.8}>
              {garageLogo ? (
                <Image source={{ uri: garageLogo }} style={styles.logoImg} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={32} color={COLORS.textMuted} />
                  <Text style={styles.logoPlaceholderTxt}>No logo</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity style={styles.logoPickBtn} onPress={pickLogo} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={15} color={COLORS.primary} />
                <Text style={styles.logoPickTxt}>Choose from Gallery</Text>
              </TouchableOpacity>
              {garageLogo && (
                <TouchableOpacity style={styles.logoRemoveBtn} onPress={() => setGarageLogo(null)} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                  <Text style={styles.logoRemoveTxt}>Remove Logo</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.logoHint}>Square image recommended (1:1)</Text>
            </View>
          </View>
        </SectionCard>

        {/* ── Basic Info ── */}
        <SectionCard title="Basic Info" icon="information-circle-outline">
          <AppInput
            label="Garage Name"
            icon="storefront-outline"
            value={garageName}
            onChangeText={(v) => { setGarageName(v); setErrors((p) => ({ ...p, garageName: "" })); }}
            placeholder="Enter garage name"
            error={errors.garageName}
          />
          <AppInput
            label="Owner Name"
            icon="person-outline"
            value={garageOwnerName}
            onChangeText={(v) => { setGarageOwnerName(v); setErrors((p) => ({ ...p, garageOwnerName: "" })); }}
            placeholder="Enter owner name"
            error={errors.garageOwnerName}
          />
          <AppInput
            label="Contact Number"
            icon="call-outline"
            value={garageContactNumber}
            onChangeText={(v) => { setGarageContactNumber(v); setErrors((p) => ({ ...p, garageContactNumber: "" })); }}
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

        {/* ── Location ── */}
        <SectionCard title="Location" icon="location-outline">
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
            onChangeText={(v) => { setGarageAddress(v); setErrors((p) => ({ ...p, garageAddress: "" })); }}
            placeholder="Enter full address"
            error={errors.garageAddress}
          />
        </SectionCard>

        {/* ── Tax Settings ── */}
        <SectionCard title="Tax Settings" icon="receipt-outline">
          <AppToggle
            label="GST Applicable"
            sublabel="Enable if your garage is GST registered"
            icon="document-text-outline"
            value={isGstApplicable}
            onChange={(v) => { setIsGstApplicable(v); if (!v) setGstNumber(""); }}
          />
          {isGstApplicable && (
            <AppInput
              label="GST Number"
              icon="card-outline"
              value={gstNumber}
              onChangeText={(v) => { setGstNumber(v.toUpperCase()); setErrors((p) => ({ ...p, gstNumber: "" })); }}
              placeholder="e.g. 27AAPFU0939F1ZV"
              autoCapitalize="characters"
              maxLength={15}
              error={errors.gstNumber}
            />
          )}
        </SectionCard>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <AppButton
          title={saving ? "Saving…" : "Save Changes"}
          variant="gradient"
          size="lg"
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="Save Garage Details"
        />
        {saving && <ActivityIndicator color={COLORS.primary} style={styles.savingIndicator} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 160,
    gap: SIZES.md,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
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
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  // Logo
  logoRow: { flexDirection: "row", alignItems: "center", gap: SIZES.md },
  logoPreview: {
    width: 80, height: 80, borderRadius: SIZES.radiusMd,
    overflow: "hidden", borderWidth: 1, borderColor: COLORS.borderLight,
  },
  logoImg: { width: 80, height: 80 },
  logoPlaceholder: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bgSection, gap: 4,
  },
  logoPlaceholderTxt: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  logoPickBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: SIZES.radiusSm, paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: COLORS.primaryLight,
  },
  logoPickTxt: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.primary },
  logoRemoveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.error + "50",
    borderRadius: SIZES.radiusSm, paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: COLORS.errorLight,
  },
  logoRemoveTxt: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.error },
  logoHint: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.sm,
    ...SHADOWS.md,
  },
  savingIndicator: { marginTop: SIZES.xs },
});
