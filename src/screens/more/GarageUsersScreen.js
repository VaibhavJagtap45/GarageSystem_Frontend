import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import EmptyState from "../../components/ui/EmptyState";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import AppSelect from "../../components/ui/AppSelect";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import {
  getMembers,
  getVendors,
  addUser,
  updateGarageUser,
  deleteGarageUser,
} from "../../api/user";
import useAuth from "../../hooks/useAuth";
import ContactPickerModal from "../../components/ui/ContactPickerModal";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "member", label: "Members", icon: "construct-outline" },
  { id: "vendor", label: "Vendors", icon: "storefront-outline" },
];

const ROLE_META = {
  owner: { label: "Owner", color: COLORS.primary },
  member: { label: "Member", color: COLORS.secondary },
  vendor: { label: "Vendor", color: "#6184C6" },
};

const ROLE_HINTS = {
  member: "Can manage jobs, vehicles and service records.",
  vendor: "External supplier — can be linked to parts and purchases.",
};

const FORM_INIT = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  role: null,
  baseSalary: "",
};

// ─── Action icon button ───────────────────────────────────────────────────────
function ActionIconBtn({ icon, label, onPress, color = COLORS.primary }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={color} />
    </TouchableOpacity>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({
  user,
  isOwner = false,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const roleMeta = ROLE_META[user.role] ?? {
    label: user.role,
    color: COLORS.primary,
  };

  const handleWhatsApp = () =>
    Linking.openURL(`whatsapp://send?phone=91${user.phoneNo}`).catch(() =>
      Alert.alert(
        "WhatsApp not installed",
        "Please install WhatsApp to use this feature.",
      ),
    );

  const handleCall = () => Linking.openURL(`tel:${user.phoneNo}`);

  return (
    <View style={[styles.card, isOwner && styles.ownerCard]}>
      {/* Owner crown indicator */}
      {isOwner && (
        <View style={styles.ownerBanner}>
          <Ionicons name="star" size={11} color={COLORS.primary} />
          <Text style={styles.ownerBannerText}>Garage Owner</Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.cardHeader}>
        <Avatar name={user.fullName || user.name} size={46} />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName || user.name || "—"}
            </Text>
            <Badge
              label={roleMeta.label}
              variant="custom"
              color={roleMeta.color}
            />
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{user.phoneNo || "—"}</Text>
          </View>
          {user.emailId || user.email ? (
            <View style={styles.metaRow}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {user.emailId || user.email}
              </Text>
            </View>
          ) : null}
          {user.role === "member" ? (
            <View style={styles.metaRow}>
              <Ionicons
                name="cash-outline"
                size={12}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>
                {user.baseSalary > 0
                  ? `₹${Number(user.baseSalary).toLocaleString("en-IN")} / month`
                  : "Salary not set"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Action row — hidden for owner (can't call/whatsapp yourself) */}
      {!isOwner && (
        <View style={styles.cardActions}>
          <ActionIconBtn
            icon="logo-whatsapp"
            label={`WhatsApp ${user.fullName}`}
            onPress={handleWhatsApp}
          />
          <View style={styles.actionDivider} />
          <ActionIconBtn
            icon="call-outline"
            label={`Call ${user.fullName}`}
            onPress={handleCall}
          />
          {canManage && (
            <>
              <View style={styles.actionDivider} />
              <ActionIconBtn
                icon="create-outline"
                label={`Edit ${user.fullName}`}
                onPress={() => onEdit?.(user)}
              />
              <View style={styles.actionDivider} />
              <ActionIconBtn
                icon="trash-outline"
                label={`Delete ${user.fullName}`}
                color={COLORS.error}
                onPress={() => onDelete?.(user)}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Add User Bottom Sheet Modal ──────────────────────────────────────────────
function AddUserModal({ visible, defaultRole, onClose, onSuccess }) {
  const [form, setForm] = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const handleContactSelected = (contact, phone) => {
    if (contact.name) {
      const parts = contact.name.trim().split(/\s+/);
      setForm((p) => ({
        ...p,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
      }));
      setErrors((p) => ({ ...p, firstName: null }));
    }
    if (phone) {
      setForm((p) => ({ ...p, phone }));
      setErrors((p) => ({ ...p, phone: null }));
    }
  };

  // Role select options — both tabs can switch role inside modal
  const ROLE_OPTIONS = [
    { value: "member", label: "Member", icon: "construct-outline" },
    { value: "vendor", label: "Vendor", icon: "storefront-outline" },
  ];

  useEffect(() => {
    if (visible) {
      setForm({ ...FORM_INIT, role: defaultRole });
      setErrors({});
    }
  }, [visible, defaultRole]);

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    if (!form.role) e.role = "Please select a role";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const fullName = [form.firstName.trim(), form.lastName.trim()]
      .filter(Boolean)
      .join(" ");
    try {
      setSaving(true);
      await addUser({
        fullName,
        phoneNo: form.phone.trim(),
        role: form.role,
        ...(form.email.trim() && { emailId: form.email.trim() }),
        ...(form.role === "member" &&
          form.baseSalary.trim() && {
            baseSalary: Number(form.baseSalary.trim()),
          }),
      });
      const label = form.role === "vendor" ? "Vendor" : "Member";
      Alert.alert(`${label} Added`, `${fullName} has been added successfully.`);
      onSuccess(form.role);
      onClose();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = form.role === "vendor" ? "Vendor" : "Member";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Garage User</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalDivider} />

        <ScrollView
          contentContainerStyle={styles.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic info */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              <TouchableOpacity
                style={styles.importBtn}
                onPress={() => setShowContacts(true)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="people-outline"
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.importBtnText}>Import</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <AppInput
                  label="First Name *"
                  icon="person-outline"
                  placeholder="First name"
                  value={form.firstName}
                  onChangeText={set("firstName")}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.rowField}>
                <AppInput
                  label="Last Name"
                  icon="person-outline"
                  placeholder="Last name"
                  value={form.lastName}
                  onChangeText={set("lastName")}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <AppInput
              label="Phone Number *"
              icon="call-outline"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChangeText={set("phone")}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />
            <AppInput
              label="Email Address"
              icon="mail-outline"
              placeholder="Optional"
              value={form.email}
              onChangeText={set("email")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Role */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Role</Text>
            <AppSelect
              label="Assign Role *"
              icon="shield-checkmark-outline"
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={set("role")}
              placeholder="Select a role"
              error={errors.role}
            />
            {form.role && (
              <View style={styles.roleHint}>
                <View style={styles.roleHintDot} />
                <Text style={styles.roleHintText}>{ROLE_HINTS[form.role]}</Text>
              </View>
            )}
          </View>

          {/* Salary — members (mechanics) only */}
          {form.role === "member" && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Salary</Text>
              <AppInput
                label="Monthly base salary (₹)"
                icon="cash-outline"
                placeholder="e.g. 15000"
                value={form.baseSalary}
                onChangeText={(t) =>
                  set("baseSalary")(t.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
              />
              <View style={styles.roleHint}>
                <View style={styles.roleHintDot} />
                <Text style={styles.roleHintText}>
                  Optional now — you can set or update it later from Mechanic
                  Payroll. Mechanics who cross the monthly service target earn a
                  bonus on top.
                </Text>
              </View>
            </View>
          )}

          <AppButton
            title={saving ? "Adding…" : `Add ${roleLabel}`}
            variant="gradient"
            size="lg"
            onPress={handleSubmit}
            disabled={saving}
          />
        </ScrollView>

        <ContactPickerModal
          visible={showContacts}
          onClose={() => setShowContacts(false)}
          onSelect={handleContactSelected}
          title={`Pick ${roleLabel} Contact`}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ visible, user, onClose, onSuccess }) {
  const role = user?.role;
  const isMember = role === "member";
  const roleLabel = role === "vendor" ? "Vendor" : "Member";

  const [form, setForm] = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      const parts = (user.fullName || "").trim().split(/\s+/);
      setForm({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
        phone: user.phoneNo || "",
        email: user.emailId || user.email || "",
        role,
        baseSalary: user.baseSalary != null ? String(user.baseSalary) : "",
      });
      setErrors({});
    }
  }, [visible, user, role]);

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    const fullName = [form.firstName.trim(), form.lastName.trim()]
      .filter(Boolean)
      .join(" ");
    try {
      setSaving(true);
      await updateGarageUser(role, user._id, {
        fullName,
        phoneNo: form.phone.trim(),
        emailId: form.email.trim() || undefined,
        ...(isMember &&
          form.baseSalary.trim() !== "" && {
            baseSalary: Number(form.baseSalary.trim()),
          }),
      });
      onSuccess?.(role);
      onClose();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit {roleLabel}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalDivider} />

        <ScrollView
          contentContainerStyle={styles.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <AppInput
                  label="First Name *"
                  icon="person-outline"
                  placeholder="First name"
                  value={form.firstName}
                  onChangeText={set("firstName")}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.rowField}>
                <AppInput
                  label="Last Name"
                  icon="person-outline"
                  placeholder="Last name"
                  value={form.lastName}
                  onChangeText={set("lastName")}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <AppInput
              label="Phone Number *"
              icon="call-outline"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChangeText={set("phone")}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />
            <AppInput
              label="Email Address"
              icon="mail-outline"
              placeholder="Optional"
              value={form.email}
              onChangeText={set("email")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {isMember && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Salary</Text>
              <AppInput
                label="Monthly base salary (₹)"
                icon="cash-outline"
                placeholder="e.g. 15000"
                value={form.baseSalary}
                onChangeText={(t) =>
                  set("baseSalary")(t.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
              />
            </View>
          )}

          <AppButton
            title={saving ? "Saving…" : "Save Changes"}
            variant="gradient"
            size="lg"
            onPress={handleSubmit}
            disabled={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <SkeletonListItem key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GarageUsersScreen() {
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState("member");
  const [members, setMembers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Only owners can edit/delete garage users (backend enforces this too).
  const canManage = authUser?.role === "owner";

  // ── Build the owner card from Redux auth state ────────────────────
  const ownerUser = authUser
    ? {
        _id: authUser._id,
        fullName: authUser.fullName || "Garage Owner",
        phoneNo: authUser.phoneNo || "",
        emailId: authUser.emailId || "",
        role: "owner",
      }
    : null;

  // ── Fetch both lists in one shot ─────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const [mRes, vRes] = await Promise.all([getMembers(), getVendors()]);
      setMembers(mRes.data?.users ?? []);
      setVendors(vRes.data?.users ?? []);
    } catch (err) {
      setError(err.displayMessage || "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Re-fetch after a successful add / edit
  const handleAddSuccess = (role) => {
    setActiveTab(role === "vendor" ? "vendor" : "member");
    fetchAll();
  };

  // ── Edit / delete a member or vendor ─────────────────────────────
  const handleEdit = (user) => setEditTarget(user);

  const handleDelete = (user) => {
    const noun = user.role === "vendor" ? "Vendor" : "Member";
    Alert.alert(
      `Delete ${noun}`,
      `Remove ${user.fullName || `this ${noun.toLowerCase()}`}? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGarageUser(user.role, user._id);
              fetchAll();
            } catch (err) {
              Alert.alert("Error", err.displayMessage || "Could not delete.");
            }
          },
        },
      ],
    );
  };

  // ── Tab data ──────────────────────────────────────────────────────
  const activeData = activeTab === "member" ? members : vendors;

  // ── Summary counts ────────────────────────────────────────────────
  const totalCount = members.length + vendors.length + (ownerUser ? 1 : 0);
  const memberCount = members.length;
  const vendorCount = vendors.length;

  // ── Render helpers ────────────────────────────────────────────────
  const renderList = () => {
    if (loading) return <SkeletonCards />;
    if (error)
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchAll()}
        />
      );

    return (
      <FlatList
        data={activeData}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            canManage={canManage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchAll(true)}
        refreshing={refreshing}
        ListEmptyComponent={
          <EmptyState
            emoji={activeTab === "member" ? "🔧" : "🏪"}
            title={`No ${activeTab === "member" ? "members" : "vendors"} yet`}
            description={`Tap "+ Add" to add a ${activeTab}.`}
            ctaLabel={`Add ${activeTab === "member" ? "Member" : "Vendor"}`}
            onCtaPress={() => setShowAdd(true)}
          />
        }
      />
    );
  };

  return (
    <View style={styles.safe}>
      {/* Top Nav */}
      <TopNav
        title="Garage Users"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => setShowAdd(true)}
            activeOpacity={0.8}
            accessibilityLabel="Add user"
            accessibilityRole="button"
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        }
      />

      {/* Summary strip */}
      {!loading && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>1</Text>
            <Text style={styles.summaryLabel}>Owner</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{memberCount}</Text>
            <Text style={styles.summaryLabel}>Members</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{vendorCount}</Text>
            <Text style={styles.summaryLabel}>Vendors</Text>
          </View>
        </View>
      )}

      {/* Owner card — always pinned first */}
      {!loading && ownerUser && (
        <View style={styles.ownerSection}>
          <UserCard user={ownerUser} isOwner />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = tab.id === "member" ? memberCount : vendorCount;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabPill, active && styles.tabPillActive]}>
                <Text
                  style={[
                    styles.tabPillText,
                    active && styles.tabPillTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List area */}
      {renderList()}

      {/* Inline Add User Modal */}
      <AddUserModal
        visible={showAdd}
        defaultRole={activeTab}
        onClose={() => setShowAdd(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit User Modal */}
      <EditUserModal
        visible={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleAddSuccess}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // TopNav right icon
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight },

  // Owner section
  ownerSection: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
  },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  ownerCard: {
    borderColor: `${COLORS.primary}40`,
    borderWidth: 1.5,
  },
  ownerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.primary}20`,
  },
  ownerBannerText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  userInfo: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
    marginBottom: 2,
  },
  userName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    flex: 1,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Card actions
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.sm + 2,
  },
  actionDivider: { width: 1, height: 20, backgroundColor: COLORS.borderLight },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.sm + 2,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  tabTextActive: { color: COLORS.primary },
  tabPill: {
    minWidth: 20,
    height: 18,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabPillActive: { backgroundColor: COLORS.primaryLight },
  tabPillText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  tabPillTextActive: { color: COLORS.primary },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: 130,
    gap: SIZES.sm,
  },
  skeletonWrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    gap: SIZES.sm,
  },
  skeletonCard: {
    height: 110,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.bgSection,
  },

  // Add user modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  modalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: { height: 1, backgroundColor: COLORS.borderLight },
  modalBody: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 60,
    gap: SIZES.md,
  },

  // Form section card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.xs,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.sm,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
  },
  importBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  rowFields: { flexDirection: "row", gap: SIZES.sm },
  rowField: { flex: 1 },

  // Role hint
  roleHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 4,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  roleHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  roleHintText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
});
