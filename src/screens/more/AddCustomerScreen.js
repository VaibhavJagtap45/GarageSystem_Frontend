import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Contacts from "expo-contacts";
import { COLORS, FONTS, SIZES, SHADOWS, VEHICLE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import axiosClient from "../../api/axios";
import { addUser } from "../../api/user";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalisePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0"))  return digits.slice(1);
  return digits.slice(-10);
}

function pickPhone(contact) {
  const phones = contact.phoneNumbers ?? [];
  const mobile = phones.find((p) => /mobile|cell|phone/i.test(p.label ?? ""));
  const raw = (mobile ?? phones[0])?.number ?? "";
  return normalisePhone(raw);
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

// ─── Contact row ──────────────────────────────────────────────────────────────
function ContactRow({ contact, onSelect }) {
  const phone = pickPhone(contact);
  const name  = contact.name || "Unknown";
  const initials = getInitials(name);
  const disabled = !phone;

  return (
    <TouchableOpacity
      style={[styles.contactRow, disabled && { opacity: 0.55 }]}
      onPress={() => !disabled && onSelect(contact, phone)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitials}>{initials}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{name}</Text>
        <View style={styles.contactPhoneRow}>
          <Ionicons name="call-outline" size={11} color={COLORS.textMuted} />
          <Text style={styles.contactPhone}>{phone || "No valid number"}</Text>
        </View>
      </View>
      {disabled ? (
        <View style={styles.noPhoneBadge}>
          <Text style={styles.noPhoneBadgeText}>No number</Text>
        </View>
      ) : (
        <View style={styles.contactArrow}>
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Contacts Picker Modal ────────────────────────────────────────────────────
function ContactsModal({ visible, onClose, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please allow contacts access in your phone settings.");
        onClose();
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });
      const withPhone = data.filter((c) => c.phoneNumbers?.length > 0);
      setContacts(withPhone);
    } catch {
      Alert.alert("Error", "Could not load contacts.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery("");
      loadContacts();
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phoneNumbers ?? []).some((p) => p.number?.replace(/\D/g, "").includes(q)),
    );
  }, [contacts, query]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Pick a Contact</Text>
            <Text style={styles.modalSubtitle}>
              {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "contact" : "contacts"}`}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalSearchWrap}>
          <View style={[styles.modalSearch, searchFocused && styles.modalSearchFocused]}>
            <Ionicons
              name="search-outline"
              size={18}
              color={searchFocused ? COLORS.primary : COLORS.textMuted}
            />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search name or number…"
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {query.length > 0 && Platform.OS === "android" && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading contacts…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.modalCenter}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {query ? "No matches found" : "No contacts available"}
            </Text>
            <Text style={styles.emptyText}>
              {query
                ? `Nothing matches "${query}"`
                : "We couldn't find any contacts with phone numbers"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id ?? item.name}
            renderItem={({ item }) => (
              <ContactRow
                contact={item}
                onSelect={(c, phone) => {
                  onSelect(c, phone);
                  onClose();
                }}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children, rightElement, accent = COLORS.primary }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={[styles.sectionIconWrap, { backgroundColor: accent + "18" }]}>
            <Ionicons name={icon} size={16} color={accent} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightElement}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Stepper Indicator ────────────────────────────────────────────────────────
function StepIndicator({ name, phone, vehicle }) {
  const personalDone = !!(name && phone);
  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepNode}>
        <View style={[styles.stepCircle, personalDone && styles.stepCircleDone]}>
          {personalDone ? (
            <Ionicons name="checkmark" size={12} color={COLORS.white} />
          ) : (
            <Text style={styles.stepNumber}>1</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, personalDone && styles.stepLabelDone]}>Personal</Text>
      </View>
      <View style={[styles.stepLine, personalDone && styles.stepLineActive]} />
      <View style={styles.stepNode}>
        <View style={[styles.stepCircle, vehicle && styles.stepCircleDone]}>
          {vehicle ? (
            <Ionicons name="checkmark" size={12} color={COLORS.white} />
          ) : (
            <Text style={styles.stepNumber}>2</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, vehicle && styles.stepLabelDone]}>Vehicle</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AddCustomerScreen() {
  const navigation   = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();

  // ── Customer fields ───────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phoneNo,  setPhoneNo]  = useState("");
  const [email,    setEmail]    = useState("");
  const [address,  setAddress]  = useState("");
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // ── Vehicle fields ─────────────────────────────────────────────────
  const [includeVehicle,    setIncludeVehicle]    = useState(false);
  const [vehicleBrand,      setVehicleBrand]      = useState(null);
  const [vehicleModel,      setVehicleModel]      = useState(null);
  const [vehicleRegisterNo, setVehicleRegisterNo] = useState("");
  const [vehicleVariant,    setVehicleVariant]    = useState("");
  const [vehicleKmDriven,   setVehicleKmDriven]   = useState("");
  const [brandOptions,      setBrandOptions]      = useState([]);
  const [modelOptions,      setModelOptions]      = useState([]);
  const [brandsLoading,     setBrandsLoading]     = useState(false);
  const [modelsLoading,     setModelsLoading]     = useState(false);

  useEffect(() => {
    setBrandsLoading(true);
    axiosClient.get(VEHICLE_ENDPOINTS.BRANDS)
      .then((r) => setBrandOptions((r.data?.data?.brands ?? []).map((b) => ({ value: b, label: b }))))
      .catch(() => setBrandOptions([]))
      .finally(() => setBrandsLoading(false));
  }, []);

  useEffect(() => {
    if (!vehicleBrand) { setModelOptions([]); return; }
    setModelsLoading(true);
    axiosClient.get(VEHICLE_ENDPOINTS.MODELS, { params: { brand: vehicleBrand } })
      .then((r) => setModelOptions((r.data?.data?.models ?? []).map((m) => ({ value: m, label: m }))))
      .catch(() => setModelOptions([]))
      .finally(() => setModelsLoading(false));
  }, [vehicleBrand]);

  const handleContactSelected = (contact, phone) => {
    if (contact.name) {
      setFullName(contact.name);
      setErrors((e) => ({ ...e, fullName: null }));
    }
    if (phone) {
      setPhoneNo(phone);
      setErrors((e) => ({ ...e, phoneNo: null }));
    }
  };

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = "Customer name is required";
    if (!phoneNo.trim()) e.phoneNo = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(phoneNo.trim()))
      e.phoneNo = "Enter a valid 10-digit Indian mobile number";
    if (includeVehicle) {
      if (!vehicleBrand)              e.vehicleBrand      = "Brand is required";
      if (!vehicleModel)              e.vehicleModel      = "Model is required";
      if (!vehicleRegisterNo.trim())  e.vehicleRegisterNo = "Registration number is required";
      if (vehicleKmDriven !== "" && vehicleKmDriven != null) {
        const km = Number(vehicleKmDriven);
        if (!Number.isFinite(km) || km < 0 || !Number.isInteger(km))
          e.vehicleKmDriven = "Enter a valid non-negative number";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await addUser({
        fullName: fullName.trim(),
        phoneNo:  phoneNo.trim(),
        role:     "customer",
        ...(email.trim()   && { emailId: email.trim() }),
        ...(address.trim() && { address: address.trim() }),
        ...(includeVehicle && {
          vehicleBrand,
          vehicleModel,
          vehicleRegisterNo: vehicleRegisterNo.trim().toUpperCase(),
          ...(vehicleVariant.trim() && { vehicleVariant: vehicleVariant.trim() }),
          ...(vehicleKmDriven !== "" && vehicleKmDriven != null && {
            vehicleKmDriven: Number(vehicleKmDriven),
          }),
        }),
      });
      Alert.alert(
        "Customer Created",
        includeVehicle
          ? `${fullName.trim()} and their vehicle have been saved.`
          : `${fullName.trim()} has been saved.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to create customer.");
    } finally {
      setLoading(false);
    }
  };

  // Live preview avatar
  const previewInitials = useMemo(() => getInitials(fullName) || "?", [fullName]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Add Customer" transparent={false} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Live Hero Preview */}
        <LinearGradient
          colors={COLORS.gradPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{previewInitials}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>
              {fullName || "New Customer"}
            </Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="call-outline" size={12} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.heroMetaText}>
                {phoneNo ? `+91 ${phoneNo}` : "Phone number pending"}
              </Text>
            </View>
            {includeVehicle && (vehicleBrand || vehicleRegisterNo) && (
              <View style={styles.heroMetaRow}>
                <Ionicons name="car-outline" size={12} color="rgba(255, 255, 255, 0.85)" />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {[vehicleBrand, vehicleModel, vehicleRegisterNo?.toUpperCase()]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Stepper */}
        <StepIndicator
          name={fullName.trim()}
          phone={phoneNo.trim()}
          vehicle={includeVehicle && vehicleBrand && vehicleModel && vehicleRegisterNo.trim()}
        />

        {/* Personal Details */}
        <SectionCard
          title="Personal Details"
          subtitle="Basic customer information"
          icon="person-outline"
          rightElement={
            <TouchableOpacity
              style={styles.contactsBtn}
              onPress={() => setShowContacts(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={13} color={COLORS.primary} />
              <Text style={styles.contactsBtnText}>Import</Text>
            </TouchableOpacity>
          }
        >
          <AppInput
            label="Full Name *"
            icon="person-outline"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              setErrors((e) => ({ ...e, fullName: null }));
            }}
            placeholder="Enter full name"
            error={errors.fullName}
            autoCapitalize="words"
          />
          <AppInput
            label="Phone Number *"
            icon="call-outline"
            value={phoneNo}
            onChangeText={(t) => {
              setPhoneNo(t);
              setErrors((e) => ({ ...e, phoneNo: null }));
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phoneNo}
          />
          <AppInput
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Optional"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            label="Address"
            icon="location-outline"
            value={address}
            onChangeText={setAddress}
            placeholder="Optional"
            multiline
            numberOfLines={3}
          />
        </SectionCard>

        {/* Vehicle Details */}
        <SectionCard
          title="Vehicle Details"
          subtitle={includeVehicle ? "Required when adding a vehicle" : "Optional"}
          icon="car-outline"
          accent={includeVehicle ? COLORS.primary : COLORS.textMuted}
          rightElement={
            <TouchableOpacity
              style={[styles.toggleSwitch, includeVehicle && styles.toggleSwitchActive]}
              onPress={() => {
                const next = !includeVehicle;
                setIncludeVehicle(next);
                if (!next) {
                  setVehicleBrand(null);
                  setVehicleModel(null);
                  setVehicleRegisterNo("");
                  setVehicleVariant("");
                  setVehicleKmDriven("");
                  setErrors((e) => ({
                    ...e,
                    vehicleBrand: null,
                    vehicleModel: null,
                    vehicleRegisterNo: null,
                    vehicleKmDriven: null,
                  }));
                }
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.toggleThumb, includeVehicle && styles.toggleThumbActive]}>
                <Ionicons
                  name={includeVehicle ? "checkmark" : "close"}
                  size={11}
                  color={includeVehicle ? COLORS.primary : COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>
          }
        >
          {includeVehicle ? (
            <>
              <View style={styles.rowFields}>
                <View style={styles.rowField}>
                  <AppSelect
                    label="Brand *"
                    icon="car-outline"
                    placeholder={brandsLoading ? "Loading…" : "Select brand"}
                    options={brandOptions}
                    value={vehicleBrand}
                    onChange={(val) => {
                      setVehicleBrand(val);
                      setVehicleModel(null);
                      setErrors((e) => ({ ...e, vehicleBrand: null, vehicleModel: null }));
                    }}
                    error={errors.vehicleBrand}
                  />
                </View>
                <View style={styles.rowField}>
                  <AppSelect
                    label="Model *"
                    icon="git-branch-outline"
                    placeholder={
                      !vehicleBrand
                        ? "Brand first"
                        : modelsLoading
                          ? "Loading…"
                          : "Select model"
                    }
                    options={modelOptions}
                    value={vehicleModel}
                    onChange={(val) => {
                      setVehicleModel(val);
                      setErrors((e) => ({ ...e, vehicleModel: null }));
                    }}
                    disabled={!vehicleBrand}
                    error={errors.vehicleModel}
                  />
                </View>
              </View>

              <AppInput
                label="Registration Number *"
                icon="id-card-outline"
                placeholder="MH12AB1234"
                value={vehicleRegisterNo}
                onChangeText={(v) => {
                  setVehicleRegisterNo(v);
                  setErrors((e) => ({ ...e, vehicleRegisterNo: null }));
                }}
                autoCapitalize="characters"
                error={errors.vehicleRegisterNo}
              />

              <View style={styles.rowFields}>
                <View style={styles.rowField}>
                  <AppInput
                    label="Variant / Trim"
                    icon="layers-outline"
                    placeholder="e.g. Disc, CBS (optional)"
                    value={vehicleVariant}
                    onChangeText={setVehicleVariant}
                  />
                </View>
                <View style={styles.rowField}>
                  <AppInput
                    label="Km Driven"
                    icon="speedometer-outline"
                    placeholder="e.g. 12500"
                    value={vehicleKmDriven}
                    onChangeText={(v) => {
                      setVehicleKmDriven(v.replace(/[^0-9]/g, ""));
                      setErrors((e) => ({ ...e, vehicleKmDriven: null }));
                    }}
                    keyboardType="numeric"
                    maxLength={7}
                    error={errors.vehicleKmDriven}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.vehicleEmptyHint}>
              <View style={styles.vehicleEmptyIcon}>
                <Ionicons name="car-outline" size={22} color={COLORS.textMuted} />
              </View>
              <Text style={styles.vehicleEmptyTitle}>No vehicle linked</Text>
              <Text style={styles.vehicleEmptyText}>
                Toggle on to register a vehicle alongside this customer
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Tip Note */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.noteText}>
            <Text style={styles.noteBold}>Pro tip: </Text>
            Tap "Import" to auto-fill name and number from your phone contacts.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Ready to save</Text>
          <Text style={styles.footerSub}>
            {includeVehicle ? "Customer + Vehicle" : "Customer only"}
          </Text>
        </View>
        <View style={styles.footerBtnWrap}>
          <AppButton
            title="Create Customer"
            variant="gradient"
            size="lg"
            onPress={handleCreate}
            loading={loading}
          />
        </View>
      </View>

      <ContactsModal
        visible={showContacts}
        onClose={() => setShowContacts(false)}
        onSelect={handleContactSelected}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.screenPadding, gap: SIZES.md },

  // Hero
  hero:           { flexDirection: "row", alignItems: "center", gap: SIZES.md, padding: SIZES.md, borderRadius: SIZES.radiusLg, ...SHADOWS.md },
  heroAvatar:     { width: 56, height: 56, borderRadius: SIZES.radiusFull, backgroundColor: "rgba(255, 255, 255, 0.2)", borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.4)", alignItems: "center", justifyContent: "center" },
  heroAvatarText: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.white, letterSpacing: -0.3 },
  heroInfo:       { flex: 1, gap: 4 },
  heroName:       { fontFamily: FONTS.bold, fontSize: SIZES.textMd, color: COLORS.white, letterSpacing: -0.3 },
  heroMetaRow:    { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: "rgba(255, 255, 255, 0.9)", flex: 1 },

  // Stepper
  stepperWrap:     { flexDirection: "row", alignItems: "center", gap: SIZES.sm, paddingVertical: SIZES.xs, paddingHorizontal: SIZES.sm, justifyContent: "center" },
  stepNode:        { alignItems: "center", gap: 4 },
  stepCircle:      { width: 26, height: 26, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.borderLight, alignItems: "center", justifyContent: "center" },
  stepCircleDone:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNumber:      { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted },
  stepLabel:       { fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.4, textTransform: "uppercase" },
  stepLabelDone:   { color: COLORS.primary },
  stepLine:        { flex: 1, height: 2, backgroundColor: COLORS.borderLight, borderRadius: 1, marginBottom: 14, maxWidth: 60 },
  stepLineActive:  { backgroundColor: COLORS.primary },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  sectionLeft:     { flexDirection: "row", alignItems: "center", gap: SIZES.sm + 2, flex: 1 },
  sectionIconWrap: { width: 32, height: 32, borderRadius: SIZES.radiusSm, alignItems: "center", justifyContent: "center" },
  sectionTitle:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, letterSpacing: -0.2 },
  sectionSubtitle: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  sectionBody:     { padding: SIZES.md, gap: SIZES.sm + 4 },

  // Import contacts button
  contactsBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2, paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  contactsBtnText: {
    fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.primary, letterSpacing: 0.2,
  },

  // Toggle Switch (vehicle on/off)
  toggleSwitch:       { width: 44, height: 26, borderRadius: 13, backgroundColor: COLORS.bgSection, padding: 2, justifyContent: "center" },
  toggleSwitchActive: { backgroundColor: COLORS.primary },
  toggleThumb:        { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", ...SHADOWS.sm },
  toggleThumbActive:  { transform: [{ translateX: 18 }] },

  // Note card
  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd, borderWidth: 1,
    borderColor: COLORS.primary + "30", padding: SIZES.sm + 4,
  },
  noteIcon: { width: 24, height: 24, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, alignItems: "center", justifyContent: "center", ...SHADOWS.sm },
  noteText: {
    flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.primary, lineHeight: 20,
  },
  noteBold: { fontFamily: FONTS.semibold },

  // Vehicle empty
  rowFields:         { flexDirection: "row", gap: SIZES.sm },
  rowField:          { flex: 1 },
  vehicleEmptyHint:  { alignItems: "center", paddingVertical: SIZES.lg, gap: 6 },
  vehicleEmptyIcon:  { width: 48, height: 48, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  vehicleEmptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  vehicleEmptyText:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: SIZES.md, lineHeight: 18 },

  // Footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: SIZES.md,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 4,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  footerInfo:    { gap: 2 },
  footerLabel:   { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textPrimary, letterSpacing: 0.2 },
  footerSub:     { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.3, textTransform: "uppercase" },
  footerBtnWrap: { flex: 1 },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalSafe:    { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  modalTitle:    { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, letterSpacing: -0.2 },
  modalSubtitle: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  modalClose:    { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection },

  // Modal search
  modalSearchWrap:    { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalSearch:        { flexDirection: "row", alignItems: "center", gap: SIZES.sm, backgroundColor: COLORS.bg, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SIZES.md, height: 44 },
  modalSearchFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  modalSearchInput:   { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary, paddingVertical: 0 },

  // Contact row
  contactRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm + 4,
    gap: SIZES.sm + 4, backgroundColor: COLORS.bgCard,
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5, borderColor: COLORS.primary + "30",
    alignItems: "center", justifyContent: "center",
  },
  contactInitials:  { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primaryDark },
  contactInfo:      { flex: 1, gap: 2 },
  contactName:      { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, letterSpacing: -0.1 },
  contactPhoneRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  contactPhone:     { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  contactArrow:     { width: 28, height: 28, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center" },
  noPhoneBadge:     { backgroundColor: COLORS.errorLight, borderRadius: SIZES.radiusFull, paddingHorizontal: 8, paddingVertical: 3 },
  noPhoneBadgeText: { fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.error, letterSpacing: 0.3 },
  contactSeparator: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: SIZES.screenPadding + 44 + SIZES.sm + 4 },

  // Empty / loading states
  modalCenter:     { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.xs, paddingHorizontal: SIZES.xl },
  emptyIconCircle: { width: 72, height: 72, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center", marginBottom: SIZES.sm },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, letterSpacing: -0.2 },
  emptyText:       { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  loadingText:     { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
});
