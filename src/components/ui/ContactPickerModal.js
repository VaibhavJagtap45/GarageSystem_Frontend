import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

// ─── Helpers (exported for reuse) ─────────────────────────────────────────────
export function normalisePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0"))  return digits.slice(1);
  return digits.slice(-10);
}

export function pickPhone(contact) {
  const phones = contact.phoneNumbers ?? [];
  const mobile = phones.find((p) => /mobile|cell|phone/i.test(p.label ?? ""));
  const raw = (mobile ?? phones[0])?.number ?? "";
  return normalisePhone(raw);
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

// ─── Contact Row ──────────────────────────────────────────────────────────────
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

// ─── Contact Picker Modal ─────────────────────────────────────────────────────
export default function ContactPickerModal({
  visible,
  onClose,
  onSelect,
  title = "Pick a Contact",
}) {
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
      setContacts(data.filter((c) => c.phoneNumbers?.length > 0));
    } catch {
      Alert.alert("Error", "Could not load contacts.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose]);

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
            <Text style={styles.modalTitle}>{title}</Text>
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

const styles = StyleSheet.create({
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

  modalSearchWrap:    { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalSearch:        { flexDirection: "row", alignItems: "center", gap: SIZES.sm, backgroundColor: COLORS.bg, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SIZES.md, height: 44 },
  modalSearchFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  modalSearchInput:   { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary, paddingVertical: 0 },

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

  modalCenter:     { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.xs, paddingHorizontal: SIZES.xl },
  emptyIconCircle: { width: 72, height: 72, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center", marginBottom: SIZES.sm },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, letterSpacing: -0.2 },
  emptyText:       { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  loadingText:     { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
});
