import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  TextInput,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import Avatar from "../../components/ui/Avatar";
import { getCustomers, deleteCustomer } from "../../api/user";

// ─── Sort Options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "name",   label: "A–Z",     icon: "text-outline" },
  { value: "recent", label: "Recent",  icon: "time-outline" },
  { value: "email",  label: "Email",   icon: "mail-outline" },
];

// ─── Letter Group Header ──────────────────────────────────────────────────────
function GroupHeader({ letter }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{letter}</Text>
      <View style={styles.groupHeaderLine} />
    </View>
  );
}

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onKebab, onPress }) {
  const handleWhatsApp = (e) => {
    e.stopPropagation?.();
    Linking.openURL(`whatsapp://send?phone=91${customer.phoneNo}`).catch(() =>
      Alert.alert("WhatsApp not installed", "Please install WhatsApp to use this feature."),
    );
  };
  const handleCall = (e) => {
    e.stopPropagation?.();
    Linking.openURL(`tel:${customer.phoneNo}`);
  };
  const handleKebab = (e) => {
    e.stopPropagation?.();
    onKebab(customer);
  };

  const hasEmail = !!customer.emailId;
  const hasAddress = !!customer.address;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && Platform.OS === "ios" && { opacity: 0.85 },
      ]}
      onPress={onPress}
      android_ripple={{ color: COLORS.bgSection }}
      accessibilityLabel={`Open profile of ${customer.fullName}`}
      accessibilityRole="button"
    >
      <View style={styles.cardLeft}>
        <Avatar name={customer.fullName} size="md" />
        <View style={styles.activeIndicator} />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {customer.fullName || "—"}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="call-outline" size={11} color={COLORS.textMuted} />
          <Text style={styles.cardMetaText}>{customer.phoneNo || "—"}</Text>
        </View>
        {hasEmail && (
          <View style={styles.cardMeta}>
            <Ionicons name="mail-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {customer.emailId}
            </Text>
          </View>
        )}
        {hasAddress && (
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {customer.address}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionWhatsApp]}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
          accessibilityLabel={`WhatsApp ${customer.fullName}`}
        >
          <Ionicons name="logo-whatsapp" size={15} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionCall]}
          onPress={handleCall}
          activeOpacity={0.8}
          accessibilityLabel={`Call ${customer.fullName}`}
        >
          <Ionicons name="call" size={15} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleKebab}
          hitSlop={10}
          style={styles.kebab}
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

// ─── Sort Pill ────────────────────────────────────────────────────────────────
function SortChip({ option, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.sortChip, active && styles.sortChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={option.icon}
        size={12}
        color={active ? COLORS.white : COLORS.textSecondary}
      />
      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function StatsStrip({ total, withEmail, withAddress }) {
  return (
    <View style={styles.statsStrip}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={[styles.statValue, { color: COLORS.primary }]}>{withEmail}</Text>
        <Text style={styles.statLabel}>With Email</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={[styles.statValue, { color: COLORS.warning }]}>{withAddress}</Text>
        <Text style={styles.statLabel}>With Address</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MyCustomersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy,      setSortBy]      = useState("name");
  const [customers,   setCustomers]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getCustomers();
      setCustomers(res.data?.users ?? []);
    } catch (err) {
      setError(err.displayMessage || "Failed to load customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchCustomers());
    return unsub;
  }, [navigation, fetchCustomers]);

  // Stats
  const stats = useMemo(() => ({
    total:        customers.length,
    withEmail:    customers.filter((c) => !!c.emailId).length,
    withAddress:  customers.filter((c) => !!c.address).length,
  }), [customers]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = !q
      ? customers
      : customers.filter(
          (c) =>
            (c.fullName || "").toLowerCase().includes(q) ||
            (c.phoneNo || "").includes(q) ||
            (c.emailId || "").toLowerCase().includes(q),
        );

    if (sortBy === "name") {
      list = [...list].sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || ""));
    } else if (sortBy === "recent") {
      list = [...list].sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "email") {
      list = [...list].sort((a, b) => {
        if (!!b.emailId === !!a.emailId) return (a.fullName || "").localeCompare(b.fullName || "");
        return b.emailId ? 1 : -1;
      });
    }
    return list;
  }, [customers, searchQuery, sortBy]);

  // Group by first letter when sorted by name
  const sectioned = useMemo(() => {
    if (sortBy !== "name") return null;
    const groups = {};
    for (const c of filtered) {
      const letter = (c.fullName || "#").charAt(0).toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : "#";
      (groups[key] ||= []).push(c);
    }
    const flat = [];
    Object.keys(groups).sort().forEach((letter) => {
      flat.push({ type: "header", letter });
      groups[letter].forEach((c) => flat.push({ type: "item", customer: c }));
    });
    return flat;
  }, [filtered, sortBy]);

  const handleDelete = useCallback((customer) => {
    Alert.alert(
      "Delete Customer",
      `Remove ${customer.fullName || "this customer"} and all their vehicles? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setCustomers((prev) => prev.filter((c) => c._id !== customer._id));
            try {
              await deleteCustomer(customer._id);
            } catch (err) {
              setCustomers((prev) => [customer, ...prev]);
              Alert.alert("Error", err.displayMessage || "Failed to delete customer.");
            }
          },
        },
      ],
    );
  }, []);

  const handleKebab = useCallback((customer) => {
    Alert.alert(customer.fullName || "Customer", "What would you like to do?", [
      {
        text: "View Profile",
        onPress: () => navigation.navigate("CustomerProfile", { customer }),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(customer),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [navigation, handleDelete]);

  const rightElement = (
    <TouchableOpacity
      style={styles.headerAddBtn}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("AddCustomer")}
      accessibilityLabel="Add customer"
    >
      <LinearGradient
        colors={COLORS.gradPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerAddInner}
      >
        <Ionicons name="add" size={18} color={COLORS.white} />
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCard = (customer) => (
    <CustomerCard
      customer={customer}
      onKebab={handleKebab}
      onPress={() => navigation.navigate("CustomerProfile", { customer })}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ paddingTop: SIZES.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonListItem key={i} style={styles.skeleton} />
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
          onCtaPress={() => fetchCustomers()}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={searchQuery ? "search-outline" : "people-outline"}
              size={40}
              color={COLORS.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No matches found" : "No customers yet"}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `Nothing matches "${searchQuery}"`
              : "Add your first customer to get started"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyCta}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddCustomer")}
            >
              <LinearGradient
                colors={COLORS.gradPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyCtaInner}
              >
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.emptyCtaText}>Add Customer</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (sectioned) {
      return (
        <FlatList
          data={sectioned}
          keyExtractor={(item, idx) =>
            item.type === "header" ? `h-${item.letter}` : item.customer._id
          }
          renderItem={({ item }) =>
            item.type === "header"
              ? <GroupHeader letter={item.letter} />
              : renderCard(item.customer)
          }
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.type === "header" ? null : <View style={styles.separator} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onRefresh={() => fetchCustomers(true)}
          refreshing={refreshing}
        />
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => renderCard(item)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchCustomers(true)}
        refreshing={refreshing}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="My Customers"
        transparent={false}
        rightElement={rightElement}
      />

      <View style={styles.content}>
        {/* Stats Strip */}
        {!loading && !error && customers.length > 0 && (
          <StatsStrip {...stats} />
        )}

        {/* Search */}
        <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={searchFocused ? COLORS.primary : COLORS.textMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile or email"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            accessibilityLabel="Search customers"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort + Result count */}
        {!loading && !error && customers.length > 0 && (
          <View style={styles.toolbar}>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <SortChip
                  key={opt.value}
                  option={opt}
                  active={sortBy === opt.value}
                  onPress={() => setSortBy(opt.value)}
                />
              ))}
            </View>
            <Text style={styles.resultCount}>
              {filtered.length} of {customers.length}
            </Text>
          </View>
        )}

        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.md, gap: SIZES.sm + 4 },

  // Header add btn
  headerAddBtn:   { borderRadius: SIZES.radiusFull, overflow: "hidden", ...SHADOWS.sm },
  headerAddInner: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Stats strip
  statsStrip:   { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, paddingVertical: SIZES.sm + 2, paddingHorizontal: SIZES.sm, ...SHADOWS.sm },
  statBox:      { flex: 1, alignItems: "center", gap: 2 },
  statValue:    { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary, letterSpacing: -0.4 },
  statLabel:    { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.4, textTransform: "uppercase" },
  statDivider:  { width: 1, height: 28, backgroundColor: COLORS.borderLight },

  // Search
  searchWrap:        { flexDirection: "row", alignItems: "center", gap: SIZES.sm, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SIZES.md, height: 44 },
  searchWrapFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  searchInput:       { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary, paddingVertical: 0 },

  // Toolbar
  toolbar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SIZES.sm },
  sortRow:     { flexDirection: "row", gap: 6, flex: 1 },
  resultCount: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // Sort chip
  sortChip:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: SIZES.sm + 2, paddingVertical: 5, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight },
  sortChipActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortChipText:     { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textSecondary, letterSpacing: 0.2 },
  sortChipTextActive:{ color: COLORS.white },

  // Group header
  groupHeader:     { flexDirection: "row", alignItems: "center", gap: SIZES.sm, paddingTop: SIZES.md, paddingBottom: SIZES.sm },
  groupHeaderText: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.primary, letterSpacing: 0.5, minWidth: 18 },
  groupHeaderLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },

  // List
  listContent: { paddingTop: SIZES.xs, paddingBottom: 120 },
  separator:   { height: SIZES.sm },
  skeleton:    { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm, borderWidth: 1, borderColor: COLORS.borderLight },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardLeft:        { position: "relative" },
  activeIndicator: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bgCard },
  cardInfo:        { flex: 1, gap: 3 },
  cardName:        { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, letterSpacing: -0.2, marginBottom: 2 },
  cardMeta:        { flexDirection: "row", alignItems: "center", gap: 5 },
  cardMetaText:    { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  cardActions:     { flexDirection: "row", alignItems: "center", gap: SIZES.xs + 2 },
  actionBtn:       { width: 34, height: 34, borderRadius: SIZES.radiusFull, alignItems: "center", justifyContent: "center", ...SHADOWS.sm },
  actionWhatsApp:  { backgroundColor: "#25D366" },
  actionCall:      { backgroundColor: COLORS.primary },
  kebab:           { padding: 4, marginLeft: 2 },

  // Empty
  emptyWrap:       { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.xs, marginTop: SIZES.lg },
  emptyIconCircle: { width: 80, height: 80, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center", marginBottom: SIZES.sm },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, letterSpacing: -0.2 },
  emptyText:       { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: SIZES.lg, marginBottom: SIZES.md },
  emptyCta:        { borderRadius: SIZES.radiusFull, overflow: "hidden", ...SHADOWS.md, marginTop: SIZES.xs },
  emptyCtaInner:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm + 4 },
  emptyCtaText:    { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white, letterSpacing: 0.2 },
});
