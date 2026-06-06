import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_TABS = [
  { label: "All",     value: "",        icon: "grid-outline"            },
  { label: "Paid",    value: "paid",    icon: "checkmark-circle-outline" },
  { label: "Partial", value: "partial", icon: "ellipse-outline"          },
  { label: "Unpaid",  value: "unpaid",  icon: "alert-circle-outline"     },
];

const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: COLORS.textMuted, bg: COLORS.bgSection,    icon: "document-outline"          },
  sent:      { label: "Sent",      color: COLORS.warning,   bg: COLORS.warningLight, icon: "paper-plane-outline"       },
  paid:      { label: "Paid",      color: COLORS.success,   bg: COLORS.successLight, icon: "checkmark-circle-outline"  },
  cancelled: { label: "Cancelled", color: COLORS.error,     bg: COLORS.errorLight,   icon: "close-circle-outline"      },
};

const PAYMENT_STATUS_CONFIG = {
  unpaid:  { label: "Unpaid",  color: COLORS.error,   bg: COLORS.errorLight   },
  partial: { label: "Partial", color: COLORS.warning, bg: COLORS.warningLight },
  paid:    { label: "Paid",    color: COLORS.success, bg: COLORS.successLight },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtCompact(n) {
  const num = Number(n || 0);
  if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (Math.abs(num) >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
  if (Math.abs(num) >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function relativeDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diffDays = Math.floor((new Date() - d) / 86400000);
  if (diffDays === 0)  return "Today";
  if (diffDays === 1)  return "Yesterday";
  if (diffDays < 7)    return `${diffDays}d ago`;
  return fmtDate(dateStr);
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KpiStrip({ total, count, paidCount, unpaidCount }) {
  return (
    <View style={styles.kpiStrip}>
      <View style={styles.kpiCol}>
        <Text style={styles.kpiLabel}>TOTAL VALUE</Text>
        <Text style={styles.kpiValue}>{fmtCompact(total)}</Text>
        <Text style={styles.kpiHint}>{count} invoice{count !== 1 ? "s" : ""}</Text>
      </View>
      <View style={styles.kpiDivider} />
      <View style={styles.kpiColRow}>
        <View style={styles.kpiPill}>
          <View style={[styles.kpiDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.kpiPillLabel}>Paid</Text>
          <Text style={[styles.kpiPillValue, { color: COLORS.success }]}>{paidCount}</Text>
        </View>
        <View style={styles.kpiPill}>
          <View style={[styles.kpiDot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.kpiPillLabel}>Unpaid</Text>
          <Text style={[styles.kpiPillValue, { color: COLORS.error }]}>{unpaidCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ item, onPress, onDelete }) {
  const statusCfg  = STATUS_CONFIG[item.status]                ?? STATUS_CONFIG.draft;
  const paymentCfg = PAYMENT_STATUS_CONFIG[item.paymentStatus] ?? PAYMENT_STATUS_CONFIG.unpaid;
  const customer   = item.customerId;
  const vehicle    = item.vehicleId;

  const total = Number(item.totalAmount) || 0;
  const paid  = Number(item.paidAmount)  || 0;
  const due   = Math.max(0, total - paid);
  const paidPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Accent left bar — color reflects payment status */}
      <View style={[styles.cardAccent, { backgroundColor: paymentCfg.color }]} />

      <View style={styles.cardBody}>
        {/* Top row: invoice no + date + status */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.invoiceNoRow}>
              <Text style={styles.invoiceNo}>{item.invoiceNo ?? "—"}</Text>
            </View>
            <View style={styles.invoiceDateRow}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.invoiceDate}>{relativeDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={11} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Customer row */}
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(customer?.fullName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer?.fullName ?? "Counter Sale"}
            </Text>
            <View style={styles.customerMetaRow}>
              {customer?.phoneNo ? (
                <>
                  <Ionicons name="call-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.customerPhone}>{customer.phoneNo}</Text>
                </>
              ) : (
                <Text style={styles.customerPhone}>No customer linked</Text>
              )}
              {vehicle ? (
                <>
                  <View style={styles.metaSep} />
                  <Ionicons name="car-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.customerPhone} numberOfLines={1}>
                    {vehicle.vehicleRegisterNo
                      || `${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}`.trim()
                      || "Vehicle"}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Financial breakdown */}
        <View style={styles.financialRow}>
          <View style={styles.financialItem}>
            <View style={styles.financialLabelRow}>
              <Ionicons name="construct-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.financialLabel}>Services</Text>
            </View>
            <Text style={styles.financialValue}>₹{fmt(item.servicesSubTotal)}</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={styles.financialItem}>
            <View style={styles.financialLabelRow}>
              <Ionicons name="cube-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.financialLabel}>Parts</Text>
            </View>
            <Text style={styles.financialValue}>₹{fmt(item.partsSubTotal)}</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={[styles.financialItem, { alignItems: "flex-end" }]}>
            <Text style={styles.financialTotalLabel}>TOTAL</Text>
            <Text style={styles.financialTotal}>₹{fmt(item.totalAmount)}</Text>
          </View>
        </View>

        {/* Payment progress bar — only when partial/unpaid */}
        {item.paymentStatus !== "paid" && total > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${paidPct}%`, backgroundColor: paymentCfg.color }]} />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.progressMetaText}>
                  Paid <Text style={{ color: COLORS.success, fontFamily: FONTS.semibold }}>₹{fmt(paid)}</Text>
                </Text>
                <Text style={styles.progressMetaText}>
                  Due <Text style={{ color: COLORS.error, fontFamily: FONTS.semibold }}>₹{fmt(due)}</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={[styles.paymentChip, { backgroundColor: paymentCfg.bg }]}>
            <View style={[styles.paymentDot, { backgroundColor: paymentCfg.color }]} />
            <Text style={[styles.paymentChipText, { color: paymentCfg.color }]}>
              {paymentCfg.label.toUpperCase()}
            </Text>
          </View>

          {item.paymentMode ? (
            <View style={styles.modeChip}>
              <Ionicons name="card-outline" size={11} color={COLORS.textSecondary} />
              <Text style={styles.modeChipText}>
                {item.paymentMode.replace("_", " ")}
              </Text>
            </View>
          ) : null}

          {item.tags?.length > 0 ? (
            <View style={styles.modeChip}>
              <Ionicons name="pricetag-outline" size={10} color={COLORS.textSecondary} />
              <Text style={styles.modeChipText} numberOfLines={1}>
                {item.tags[0]}{item.tags.length > 1 ? ` +${item.tags.length - 1}` : ""}
              </Text>
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onDelete(item); }}
            hitSlop={10}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.error} />
          </TouchableOpacity>
          <View style={styles.cardChevron}>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ search, activeTab, onCreatePress }) {
  const isFiltered = search || activeTab;
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={search ? "search-outline" : "document-text-outline"}
          size={42}
          color={COLORS.textMuted}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {search ? "No matches found" : isFiltered ? "Nothing here" : "No invoices yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {search
          ? `Nothing matches "${search}"`
          : isFiltered
            ? "Try a different filter or create a new invoice"
            : "Create your first invoice from Counter Sale"}
      </Text>
      {!isFiltered && (
        <TouchableOpacity onPress={onCreatePress} activeOpacity={0.85} style={styles.emptyBtnWrap}>
          <LinearGradient
            colors={COLORS.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyBtn}
          >
            <Ionicons name="add" size={17} color={COLORS.white} />
            <Text style={styles.emptyBtnText}>Create Invoice</Text>
          </LinearGradient>
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const searchTimer = useRef(null);
  const currentParams = useRef({ tab: "", q: "", p: 1 });

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchInvoices = useCallback(
    async ({ tab = activeTab, q = search, p = 1, append = false } = {}) => {
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

        if (currentParams.current.tab !== tab || currentParams.current.q !== q) return;

        setInvoices((prev) => (p === 1 ? list : [...prev, ...list]));
        setTotal(data.total ?? 0);
        setPage(p);
      } catch {
        // silent — handled by axios interceptor
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

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

  const goToDetail = (item) => navigation.navigate("InvoiceDetail", { invoiceId: item._id });
  const goToCreate = () => navigation.navigate("CounterSale");

  const handleDeleteInvoice = useCallback((item) => {
    Alert.alert(
      "Delete Invoice",
      `Delete ${item.invoiceNo ?? "this invoice"}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
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

  // ── Derived stats from current page ──────────────────────────────
  const pageStats = useMemo(() => {
    const totalValue = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const paidCount   = invoices.filter((i) => i.paymentStatus === "paid").length;
    const unpaidCount = invoices.filter((i) => i.paymentStatus !== "paid").length;
    return { totalValue, paidCount, unpaidCount };
  }, [invoices]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Invoices"
        transparent={false}
        rightElement={
          <TouchableOpacity onPress={goToCreate} activeOpacity={0.85} style={styles.newBtn}>
            <LinearGradient
              colors={COLORS.gradPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newBtnInner}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.newBtnText}>New</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
      />

      {/* KPI Strip */}
      {!loading && invoices.length > 0 && (
        <KpiStrip
          total={pageStats.totalValue}
          count={total}
          paidCount={pageStats.paidCount}
          unpaidCount={pageStats.unpaidCount}
        />
      )}

      {/* Search bar */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons
          name="search-outline"
          size={18}
          color={searchFocused ? COLORS.primary : COLORS.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoice no. or customer…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={onSearchChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value || "all"}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => onTabChange(tab.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && total > 0 && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{total}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invoices…</Text>
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
          ItemSeparatorComponent={() => <View style={{ height: SIZES.sm + 2 }} />}
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
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadMoreText}>Loading more…</Text>
              </View>
            ) : invoices.length > 0 && invoices.length >= total ? (
              <View style={styles.endOfListWrap}>
                <View style={styles.endLine} />
                <Text style={styles.endOfListText}>All {total} invoices loaded</Text>
                <View style={styles.endLine} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState search={search} activeTab={activeTab} onCreatePress={goToCreate} />
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
  newBtn:      { borderRadius: SIZES.radiusFull, overflow: "hidden", ...SHADOWS.sm },
  newBtnInner: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText:  { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white, letterSpacing: 0.2 },

  // KPI strip
  kpiStrip:     { flexDirection: "row", alignItems: "center", marginHorizontal: SIZES.screenPadding, marginTop: SIZES.sm + 2, padding: SIZES.md, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, gap: SIZES.md, ...SHADOWS.sm },
  kpiCol:       { flex: 1, gap: 2 },
  kpiLabel:     { fontFamily: FONTS.medium, fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.6, textTransform: "uppercase" },
  kpiValue:     { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary, letterSpacing: -0.5 },
  kpiHint:      { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  kpiDivider:   { width: 1, height: 38, backgroundColor: COLORS.borderLight },
  kpiColRow:    { gap: 6 },
  kpiPill:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.bgSection, paddingHorizontal: SIZES.sm, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  kpiDot:       { width: 6, height: 6, borderRadius: 3 },
  kpiPillLabel: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textSecondary, letterSpacing: 0.3 },
  kpiPillValue: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, marginLeft: 2 },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm + 2,
    marginBottom: SIZES.xs,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  searchWrapFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textBase,
    color: COLORS.textPrimary, padding: 0,
  },

  // Status tabs
  tabsWrapper:  { flexGrow: 0, flexShrink: 0, backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tabsContent:  { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: 6, alignItems: "center" },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SIZES.md,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabLabel:        { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textSecondary, letterSpacing: 0.2 },
  tabLabelActive:  { color: COLORS.white },
  tabCount:        { backgroundColor: "rgba(255, 255, 255, 0.25)", paddingHorizontal: 6, paddingVertical: 1, borderRadius: SIZES.radiusFull, minWidth: 20, alignItems: "center" },
  tabCountText:    { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.white },

  // Loading
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.sm },
  loadingText:   { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm + 2,
    paddingBottom: Platform.OS === "ios" ? 100 : 90,
  },
  listContentEmpty: { flexGrow: 1 },
  loadMoreIndicator: { paddingVertical: SIZES.md, alignItems: "center", gap: 6 },
  loadMoreText:      { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  endOfListWrap:     { flexDirection: "row", alignItems: "center", gap: SIZES.sm, paddingVertical: SIZES.md + 4 },
  endLine:           { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  endOfListText:     { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, letterSpacing: 0.3 },

  // Invoice card
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1 },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xs,
    gap: SIZES.sm,
  },
  cardTopLeft:    { gap: 3, flex: 1 },
  invoiceNoRow:   { flexDirection: "row", alignItems: "center", gap: 4 },
  invoiceNo:      { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, letterSpacing: -0.2 },
  invoiceDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  invoiceDate:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusBadgeText: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.3 },

  // Customer
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
  },
  avatar: {
    width: 36, height: 36, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: COLORS.primary + "25",
  },
  avatarLetter:    { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.primaryDark },
  customerInfo:    { flex: 1, gap: 2 },
  customerName:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, letterSpacing: -0.1 },
  customerMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  customerPhone:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  metaSep:         { width: 2, height: 2, borderRadius: 1, backgroundColor: COLORS.textMuted, opacity: 0.6, marginHorizontal: 2 },

  // Financial row
  financialRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSection,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginVertical: SIZES.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  financialItem:        { flex: 1, paddingVertical: SIZES.sm, paddingHorizontal: SIZES.sm + 2, gap: 3 },
  financialDivider:     { width: 1, backgroundColor: COLORS.borderLight },
  financialLabelRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  financialLabel:       { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.3, textTransform: "uppercase" },
  financialValue:       { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  financialTotalLabel:  { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.primary, letterSpacing: 0.6 },
  financialTotal:       { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary, letterSpacing: -0.3 },

  // Progress bar
  progressRow:        { paddingHorizontal: SIZES.md, paddingTop: SIZES.xs, paddingBottom: SIZES.sm },
  progressBarWrap:    { gap: 5 },
  progressTrack:      { height: 5, borderRadius: 2.5, backgroundColor: COLORS.bgSection, overflow: "hidden" },
  progressFill:       { height: "100%", borderRadius: 2.5 },
  progressMeta:       { flexDirection: "row", justifyContent: "space-between" },
  progressMetaText:   { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.2 },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    gap: 6,
  },
  paymentChip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  paymentDot:      { width: 6, height: 6, borderRadius: 3 },
  paymentChipText: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.4 },

  modeChip:     { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection },
  modeChipText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textSecondary, textTransform: "capitalize", letterSpacing: 0.2 },

  iconBtn:     { width: 28, height: 28, borderRadius: SIZES.radiusFull, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.errorLight },
  cardChevron: { width: 20, alignItems: "center", justifyContent: "center" },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.xxl,
    gap: SIZES.xs,
  },
  emptyIconCircle: {
    width: 88, height: 88, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center", justifyContent: "center",
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SIZES.xl,
    lineHeight: 20,
  },
  emptyBtnWrap: { borderRadius: SIZES.radiusFull, overflow: "hidden", marginTop: SIZES.md, ...SHADOWS.md },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs + 2,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
});
