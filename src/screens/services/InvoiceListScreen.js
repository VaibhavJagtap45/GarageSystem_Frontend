import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_TABS = [
  { label: "All",    value: ""       },
  { label: "Paid",   value: "paid"   },
  { label: "Unpaid", value: "unpaid" },
];

const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: COLORS.textMuted,  bg: COLORS.bgSection    },
  sent:      { label: "Sent",      color: COLORS.warning,    bg: COLORS.warningLight  },
  paid:      { label: "Paid",      color: COLORS.success,    bg: COLORS.successLight  },
  cancelled: { label: "Cancelled", color: COLORS.error,      bg: COLORS.errorLight    },
};

const PAYMENT_STATUS_CONFIG = {
  unpaid:  { label: "Unpaid",  color: COLORS.error   },
  partial: { label: "Partial", color: COLORS.warning },
  paid:    { label: "Paid",    color: COLORS.success },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "0.00";
  return Number(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ item, onPress, onDelete }) {
  const statusCfg  = STATUS_CONFIG[item.status]           ?? STATUS_CONFIG.draft;
  const paymentCfg = PAYMENT_STATUS_CONFIG[item.paymentStatus] ?? PAYMENT_STATUS_CONFIG.unpaid;
  const customer   = item.customerId;
  const vehicle    = item.vehicleId;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Card top: invoice no + date + status badge */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.invoiceNo}>{item.invoiceNo ?? "—"}</Text>
          <Text style={styles.invoiceDate}>{fmtDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Customer + vehicle */}
      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {(customer?.fullName ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer?.fullName ?? "Unknown Customer"}
          </Text>
          {customer?.phoneNo ? (
            <Text style={styles.customerPhone}>{customer.phoneNo}</Text>
          ) : null}
        </View>
      </View>

      {vehicle ? (
        <Text style={styles.vehicleText} numberOfLines={1}>
          🚗 {vehicle.vehicleBrand ?? ""} {vehicle.vehicleModel ?? ""}
          {vehicle.vehicleRegisterNo ? ` · ${vehicle.vehicleRegisterNo}` : ""}
        </Text>
      ) : null}

      {/* Financial summary row */}
      <View style={styles.financialRow}>
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel}>Services</Text>
          <Text style={styles.financialValue}>₹{fmt(item.servicesSubTotal)}</Text>
        </View>
        <View style={styles.financialDivider} />
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel}>Parts</Text>
          <Text style={styles.financialValue}>₹{fmt(item.partsSubTotal)}</Text>
        </View>
        <View style={styles.financialDivider} />
        <View style={[styles.financialItem, { alignItems: "flex-end" }]}>
          <Text style={styles.financialTotalLabel}>Total</Text>
          <Text style={styles.financialTotal}>₹{fmt(item.totalAmount)}</Text>
        </View>
      </View>

      {/* Footer: payment status + tags + delete */}
      <View style={styles.cardFooter}>
        <View style={styles.paymentChip}>
          <Ionicons name="card-outline" size={12} color={paymentCfg.color} />
          <Text style={[styles.paymentChipText, { color: paymentCfg.color }]}>
            {paymentCfg.label}
          </Text>
        </View>
        {item.paymentMode ? (
          <Text style={styles.paymentMode}>
            · {item.paymentMode.replace("_", " ")}
          </Text>
        ) : null}
        {item.tags?.length > 0 ? (
          <Text style={styles.tagsPreview} numberOfLines={1}>
            · {item.tags.join(", ")}
          </Text>
        ) : null}

        {/* spacer pushes right-side actions to edge */}
        <View style={{ flex: 1 }} />

        {/* Delete button */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onDelete(item); }}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
          style={styles.deleteBtn}
          activeOpacity={0.6}
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.error} />
        </TouchableOpacity>

        {/* Navigate-to-detail arrow */}
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ search, onCreatePress }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={72} color={COLORS.borderLight} />
      <Text style={styles.emptyTitle}>
        {search ? "No results found" : "No invoices yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {search
          ? `No invoices match "${search}".`
          : "Create your first invoice from Counter Sale."}
      </Text>
      {!search && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={onCreatePress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={17} color={COLORS.white} />
          <Text style={styles.emptyBtnText}>Create Invoice</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InvoiceListScreen() {
  const navigation = useNavigation();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const searchTimer = useRef(null);
  const currentParams = useRef({ tab: "", q: "", p: 1 });

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchInvoices = useCallback(
    async ({ tab = activeTab, q = search, p = 1, append = false } = {}) => {
      // Track latest params to prevent stale updates
      currentParams.current = { tab, q, p };

      if (p === 1 && !append) setLoading(true);
      else if (p > 1) setLoadingMore(true);

      try {
        const params = { page: p, limit: PAGE_SIZE };
        if (tab) params.paymentStatus = tab;
        if (q.trim()) params.search = q.trim();

        const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, { params });
        const data = res.data?.data ?? {};
        const list = data.invoices ?? [];

        // Guard against stale responses
        if (
          currentParams.current.tab !== tab ||
          currentParams.current.q !== q
        )
          return;

        setInvoices((prev) => (p === 1 ? list : [...prev, ...list]));
        setTotal(data.total ?? 0);
        setPage(p);
      } catch {
        // silent — network errors handled by axios interceptor
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [] // intentionally empty — we pass params explicitly
  );

  // Initial load
  useEffect(() => {
    fetchInvoices({ tab: activeTab, q: search, p: 1 });
  }, [activeTab]);

  // ── Handlers ───────────────────────────────────────────────────
  const onSearchChange = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchInvoices({ tab: activeTab, q: text, p: 1 });
    }, 400);
  };

  const clearSearch = () => {
    setSearch("");
    fetchInvoices({ tab: activeTab, q: "", p: 1 });
  };

  const onTabChange = (tabValue) => {
    setActiveTab(tabValue);
    setInvoices([]);
    setPage(1);
    // useEffect will trigger fetchInvoices via activeTab dependency
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices({ tab: activeTab, q: search, p: 1 });
  };

  const onEndReached = () => {
    if (!loadingMore && invoices.length < total) {
      fetchInvoices({ tab: activeTab, q: search, p: page + 1, append: true });
    }
  };

  const goToDetail = (item) =>
    navigation.navigate("InvoiceDetail", { invoiceId: item._id });

  const goToCreate = () => navigation.navigate("CounterSale");

  const handleDeleteInvoice = useCallback((item) => {
    Alert.alert(
      "Delete Invoice",
      `Delete ${item.invoiceNo ?? "this invoice"}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(INVOICE_ENDPOINTS.DETAIL(item._id));
              setInvoices((prev) => prev.filter((inv) => inv._id !== item._id));
              setTotal((prev) => Math.max(0, prev - 1));
            } catch (e) {
              Alert.alert("Error", e.displayMessage || "Could not delete invoice.");
            }
          },
        },
      ],
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Header */}
      <TopNav
        title="Invoices"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={goToCreate}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        }
      />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={17}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoice no. or customer…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => onTabChange(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Hairline separator anchors tabs above the list */}
        <View style={styles.tabsSeparator} />
      </View>

      {/* Loading state */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <InvoiceCard
              item={item}
              onPress={() => goToDetail(item)}
              onDelete={handleDeleteInvoice}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            invoices.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : invoices.length > 0 && invoices.length >= total ? (
              <Text style={styles.endOfListText}>All {total} invoices loaded</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState search={search} onCreatePress={goToCreate} />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header new button
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
  },
  newBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    marginBottom: SIZES.xs,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: Platform.OS === "ios" ? 11 : 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // Status tabs
  tabsWrapper: {
    // flex: 0 keeps this block from growing and pushing the list off-screen
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: COLORS.bg,
  },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabsContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.xs,
    gap: SIZES.xs,
    alignItems: "center",
  },
  tabsSeparator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.xs,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontFamily: FONTS.semibold,
  },

  // Loading
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: Platform.OS === "ios" ? 100 : 90,
  },
  listContentEmpty: { flex: 1 },
  loadMoreIndicator: { paddingVertical: SIZES.md, alignItems: "center" },
  endOfListText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SIZES.md,
  },

  // Invoice card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xs,
  },
  cardTopLeft: { gap: 2 },
  invoiceNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  invoiceDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusBadgeText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // Customer
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  customerInfo: { flex: 1 },
  customerName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  customerPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  vehicleText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xs,
  },

  // Financial row
  financialRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSection,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginVertical: SIZES.xs,
    overflow: "hidden",
  },
  financialItem: { flex: 1, paddingVertical: SIZES.sm, paddingHorizontal: SIZES.sm },
  financialDivider: { width: 1, backgroundColor: COLORS.borderLight },
  financialLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  financialValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  financialTotalLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  financialTotal: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  paymentChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  paymentChipText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  paymentMode: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "capitalize",
  },
  tagsPreview: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: SIZES.radiusSm,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.xxl,
    gap: SIZES.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SIZES.xl,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs,
    marginTop: SIZES.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 12,
    borderRadius: SIZES.radiusFull,
  },
  emptyBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
  },
});
