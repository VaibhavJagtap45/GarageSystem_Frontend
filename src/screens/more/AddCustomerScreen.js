import React, { useState, useCallback, useMemo, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

/** Strip country code and non-digits, return last 10 digits */
function normalisePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // Remove leading 91 (India) or 0
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(-10);
}

/** Get first valid phone number from a contact */
function pickPhone(contact) {
  const phones = contact.phoneNumbers ?? [];
  // Prefer mobile numbers
  const mobile = phones.find((p) =>
    /mobile|cell|phone/i.test(p.label ?? ""),
  );
  const raw = (mobile ?? phones[0])?.number ?? "";
  return normalisePhone(raw);
}

// ─── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({ contact, onSelect }) {
  const phone = pickPhone(contact);
  const name  = contact.name || "Unknown";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => onSelect(contact, phone)}
      activeOpacity={0.7}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitials}>{initials}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{name}</Text>
        <Text style={styles.contactPhone}>{phone || "No valid number"}</Text>
      </View>
      {phone ? (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      ) : (
        <Text style={styles.noPhoneBadge}>No number</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Contacts Picker Modal ────────────────────────────────────────────────────

function ContactsModal({ visible, onClose, onSelect }) {
  const [contacts,  setContacts]  = useState([]);
  const [query,     setQuery]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow contacts access in your phone settings to use this feature.",
        );
        onClose();
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });
      // Keep only contacts that have at least one phone number
      const withPhone = data.filter((c) => c.phoneNumbers?.length > 0);
      setContacts(withPhone);
    } catch {
      Alert.alert("Error", "Could not load contacts.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when modal opens
  React.useEffect(() => {
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
        (c.phoneNumbers ?? []).some((p) =>
          p.number?.replace(/\D/g, "").includes(q),
        ),
    );
  }, [contacts, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick a Contact</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or number…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading contacts…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.modalCenter}>
            <Ionicons name="people-outline" size={48} color={COLORS.borderLight} />
            <Text style={styles.emptyText}>
              {query ? "No contacts match your search" : "No contacts with phone numbers"}
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
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children, rightElement }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {rightElement}
      </View>
      <View style={styles.sectionBody}>{children}</View>
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

  // ── Vehicle fields (optional) ─────────────────────────────────────
  const [includeVehicle,    setIncludeVehicle]    = useState(false);
  const [vehicleBrand,      setVehicleBrand]      = useState(null);
  const [vehicleModel,      setVehicleModel]      = useState(null);
  const [vehicleRegisterNo, setVehicleRegisterNo] = useState("");
  const [vehicleVariant,    setVehicleVariant]    = useState("");
  const [brandOptions,      setBrandOptions]      = useState([]);
  const [modelOptions,      setModelOptions]      = useState([]);
  const [brandsLoading,     setBrandsLoading]     = useState(false);
  const [modelsLoading,     setModelsLoading]     = useState(false);

  // Load brands once on mount
  useEffect(() => {
    setBrandsLoading(true);
    axiosClient
      .get(VEHICLE_ENDPOINTS.BRANDS)
      .then((r) =>
        setBrandOptions(
          (r.data?.data?.brands ?? []).map((b) => ({ value: b, label: b })),
        ),
      )
      .catch(() => setBrandOptions([]))
      .finally(() => setBrandsLoading(false));
  }, []);

  // Reload models whenever brand changes
  useEffect(() => {
    if (!vehicleBrand) { setModelOptions([]); return; }
    setModelsLoading(true);
    axiosClient
      .get(VEHICLE_ENDPOINTS.MODELS, { params: { brand: vehicleBrand } })
      .then((r) =>
        setModelOptions(
          (r.data?.data?.models ?? []).map((m) => ({ value: m, label: m })),
        ),
      )
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
        // Vehicle fields — only sent when owner opts in
        ...(includeVehicle && {
          vehicleBrand,
          vehicleModel,
          vehicleRegisterNo: vehicleRegisterNo.trim().toUpperCase(),
          ...(vehicleVariant.trim() && { vehicleVariant: vehicleVariant.trim() }),
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

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Add Customer" transparent={false} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard
          title="Personal Details"
          icon="person-outline"
          rightElement={
            <TouchableOpacity
              style={styles.contactsBtn}
              onPress={() => setShowContacts(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={14} color={COLORS.primary} />
              <Text style={styles.contactsBtnText}>From Contacts</Text>
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

        {/* ── Vehicle Section ── */}
        <SectionCard
          title="Vehicle Details"
          icon="car-outline"
          rightElement={
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                includeVehicle && styles.toggleBtnActive,
              ]}
              onPress={() => {
                setIncludeVehicle((v) => !v);
                // Reset vehicle fields when toggling off
                if (includeVehicle) {
                  setVehicleBrand(null);
                  setVehicleModel(null);
                  setVehicleRegisterNo("");
                  setVehicleVariant("");
                  setErrors((e) => ({
                    ...e,
                    vehicleBrand: null,
                    vehicleModel: null,
                    vehicleRegisterNo: null,
                  }));
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={includeVehicle ? "checkmark-circle" : "add-circle-outline"}
                size={14}
                color={includeVehicle ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  includeVehicle && styles.toggleBtnTextActive,
                ]}
              >
                {includeVehicle ? "Added" : "Add Vehicle"}
              </Text>
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
                        ? "Select brand first"
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

              <AppInput
                label="Variant / Trim"
                icon="layers-outline"
                placeholder="e.g. Disc, CBS, V3 (optional)"
                value={vehicleVariant}
                onChangeText={setVehicleVariant}
              />
            </>
          ) : (
            <View style={styles.vehicleEmptyHint}>
              <Ionicons name="car-outline" size={22} color={COLORS.textMuted} />
              <Text style={styles.vehicleEmptyText}>
                Tap "Add Vehicle" to include a vehicle with this customer.
              </Text>
            </View>
          )}
        </SectionCard>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.noteText}>
            Tap "From Contacts" to auto-fill name and number from your phone.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <AppButton
          title="Create Customer"
          variant="gradient"
          size="lg"
          onPress={handleCreate}
          loading={loading}
        />
      </View>

      {/* Contacts Modal */}
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
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  sectionLeft:    { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary,
  },
  sectionBody: { padding: SIZES.md, paddingBottom: SIZES.sm },

  // "From Contacts" button
  contactsBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2, paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  contactsBtnText: {
    fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.primary,
  },

  // Info note
  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd, borderWidth: 1,
    borderColor: COLORS.primary + "30", padding: SIZES.md,
  },
  noteText: {
    flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.primary, lineHeight: 20,
  },

  // Vehicle section
  rowFields:       { flexDirection: "row", gap: SIZES.sm },
  rowField:        { flex: 1 },
  vehicleEmptyHint: {
    flexDirection: "row", alignItems: "center", gap: SIZES.sm,
    paddingVertical: SIZES.sm,
  },
  vehicleEmptyText: {
    flex: 1,
    fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.textMuted, lineHeight: 20,
  },

  // Toggle button (Add Vehicle / Added)
  toggleBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2, paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleBtnText: {
    fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.primary,
  },
  toggleBtnTextActive: {
    color: COLORS.white,
  },

  // Footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },

  // ── Modal ──────────────────────────────────────────────────────
  modalSafe:   { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  modalTitle: {
    fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary,
  },

  // Search bar
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    margin: SIZES.screenPadding,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd, borderWidth: 1,
    borderColor: COLORS.borderLight, paddingHorizontal: SIZES.sm,
    ...SHADOWS.sm,
  },
  searchIcon:  { marginRight: SIZES.xs },
  searchInput: {
    flex: 1, height: 42,
    fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  // Contact row
  contactRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm + 2,
    gap: SIZES.sm, backgroundColor: COLORS.bgCard,
  },
  contactAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primary + "30",
    alignItems: "center", justifyContent: "center",
  },
  contactInitials: {
    fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary,
  },
  contactInfo:  { flex: 1 },
  contactName:  {
    fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary,
  },
  contactPhone: {
    fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, marginTop: 1,
  },
  noPhoneBadge: {
    fontFamily: FONTS.medium, fontSize: SIZES.textXs,
    color: COLORS.error, backgroundColor: COLORS.errorLight,
    borderRadius: SIZES.radiusFull, paddingHorizontal: 8, paddingVertical: 3,
  },
  separator: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: SIZES.screenPadding + 42 + SIZES.sm },

  // Empty / loading states
  modalCenter: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.md, paddingHorizontal: SIZES.xl,
  },
  loadingText: {
    fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted,
  },
  emptyText: {
    fontFamily: FONTS.regular, fontSize: SIZES.textBase,
    color: COLORS.textMuted, textAlign: "center", lineHeight: 22,
  },
});
