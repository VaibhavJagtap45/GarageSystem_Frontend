import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import EmptyState from "../../components/ui/EmptyState";
import AppButton from "../../components/ui/AppButton";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import { getMembers } from "../../api/user";

// Backend role → display label + color
const ROLE_META = {
  member: { label: "Member", color: COLORS.secondary },
  vendor: { label: "Vendor", color: "#6184C6" },
  owner: { label: "Owner", color: COLORS.primary },
};

// ─── Action icon button ───────────────────────────────────────────────────────
function ActionIconBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user, onDetails }) {
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
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Avatar name={user.fullName} size={46} />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName || "—"}
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
          {user.emailId ? (
            <View style={styles.metaRow}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {user.emailId}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Action row */}
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
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={onDetails}
          activeOpacity={0.8}
          accessibilityLabel={`Details for ${user.fullName}`}
          accessibilityRole="button"
        >
          <Ionicons
            name="document-text-outline"
            size={15}
            color={COLORS.primary}
          />
          <Text style={styles.detailsBtnText}>Details</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GarageUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getMembers();
      setUsers(res.data?.users ?? []);
    } catch (err) {
      setError(err.displayMessage || "Failed to load members.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Re-fetch when returning from AddGarageUser
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchMembers());
    return unsub;
  }, [navigation, fetchMembers]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => (
            <SkeletonListItem key={i} style={styles.skeletonCard} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchMembers()}
        />
      );
    }

    return (
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onDetails={() => Alert.alert("Details", "User details coming soon")}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchMembers(true)}
        refreshing={refreshing}
        ListEmptyComponent={
          <EmptyState
            emoji="👥"
            title="No members yet"
            description="Add members to manage your garage."
            ctaLabel="Add Member"
            onCtaPress={() => navigation.navigate("AddGarageUser")}
          />
        }
      />
    );
  };

  return (
    <View style={styles.safeArea}>
      <TopNav
        title="Garage Users"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => navigation.navigate("AddGarageUser")}
            activeOpacity={0.8}
            accessibilityLabel="Add member"
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
      {!loading && users.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{users.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {users.filter((u) => u.role === "member").length}
            </Text>
            <Text style={styles.summaryLabel}>Members</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {users.filter((u) => u.role === "vendor").length}
            </Text>
            <Text style={styles.summaryLabel}>Vendors</Text>
          </View>
        </View>
      )}

      {renderContent()}

      {/* Footer */}
      <View style={styles.footer}>
        <AppButton
          title="Add Member"
          variant="gradient"
          size="lg"
          onPress={() => navigation.navigate("AddGarageUser")}
          accessibilityLabel="Add garage member"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

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

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: 100,
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

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
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

  // Actions
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
  detailsBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.sm + 2,
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderLight,
  },
  detailsBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    paddingBottom: Platform.OS === "ios" ? 28 : SIZES.md,
  },
});
