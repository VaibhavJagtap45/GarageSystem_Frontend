import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, INVOICE_ENDPOINTS, REPAIR_ORDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const TABS = [
  { key: "orders",   label: "Repair Orders", icon: "construct-outline" },
  { key: "invoices", label: "Invoices",       icon: "document-text-outline" },
];

const DATE_FILTERS = [
  { key: "all",        label: "All Time"   },
  { key: "today",      label: "Today"      },
  { key: "this_week",  label: "This Week"  },
  { key: "this_month", label: "This Month" },
];

const STATUS_CFG = {
  created:       { label: "Created",   color: COLORS.primary, bg: COLORS.primaryLight },
  in_progress:   { label: "WIP",       color: "#BA7517",      bg: "#FFFBEB"           },
  vehicle_ready: { label: "Ready",     color: COLORS.success, bg: COLORS.successLight },
  completed:     { label: "Completed", color: COLORS.success, bg: COLORS.successLight },
  cancelled:     { label: "Cancelled", color: COLORS.error,   bg: COLORS.errorLight   },
};

// Maps each status to its next step — drives the action footer in OrderRow
const STATUS_FLOW = {
  created:       { nextStatus: "in_progress",   nextLabel: "WIP",      actionLabel: "Move to WIP",    color: "#BA7517",      bg: "#FEF3C7", icon: "play-circle-outline"        },
  in_progress:   { nextStatus: "vehicle_ready", nextLabel: "Ready",    actionLabel: "Mark as Ready",  color: COLORS.success, bg: COLORS.successLight, icon: "checkbox-outline" },
  vehicle_ready: { nextStatus: "completed",     nextLabel: "Complete", actionLabel: "Mark Complete",  color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-circle-outline" },
};

function getDateRange(key) {
  const n = new Date();
  if (key === "today")
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  if (key === "this_week") {
    const d = n.getDay(); const diff = d === 0 ? -6 : 1 - d;
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate() + diff).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  }
  if (key === "this_month")
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  return {};
}

function fmt(n) { return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

// ─── Order Row ────────────────────────────────────────────────────────────────
function OrderRow({ item, isLast, onPress, onStatusPress }) {
  const cfg      = STATUS_CFG[item.status] ?? STATUS_CFG.created;
  const flowCfg  = STATUS_FLOW[item.status] ?? null;
  const isCompleted = item.status === "completed";

  return (
    <View style={[s.row, isLast && s.rowLast]}>
      {/* ── Main info ─────────────────────────────────────────────── */}
      <View style={s.rowMain}>
        <View style={s.rowLeft}>
          <View style={s.rowTopLine}>
            <Text style={s.rowPrimary}>{item.orderNo ?? "—"}</Text>
            <View style={[s.badge, { backgroundColor: cfg.bg }]}>
              <View style={[s.badgeDot, { backgroundColor: cfg.color }]} />
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={s.rowSub} numberOfLines={1}>
            {item.customerId?.fullName ?? "—"}
            {item.vehicleId?.vehicleRegisterNo ? ` · ${item.vehicleId.vehicleRegisterNo}` : ""}
          </Text>
          <View style={s.rowBottomLine}>
            <Text style={s.rowDate}>{fmtDate(item.createdAt)}</Text>
            <Text style={s.rowAmt}>₹{fmt(item.totalAmount)}</Text>
          </View>
        </View>
      </View>

      {/* ── Status action footer ───────────────────────────────────── */}
      {flowCfg && (
        <TouchableOpacity
          style={[s.actionStrip, { backgroundColor: flowCfg.bg }]}
          onPress={() => onStatusPress(item)}
          activeOpacity={0.75}
        >
          {/* Current status pill */}
          <View style={[s.flowPill, { borderColor: cfg.color }]}>
            <Text style={[s.flowPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* Arrow */}
          <Ionicons name="arrow-forward" size={14} color={flowCfg.color} />

          {/* Next status pill */}
          <View style={[s.flowPill, s.flowPillNext, { borderColor: flowCfg.color, backgroundColor: flowCfg.color }]}>
            <Text style={[s.flowPillText, { color: COLORS.white }]}>{flowCfg.nextLabel}</Text>
          </View>

          <View style={s.actionStripSpacer} />

          <Text style={[s.actionStripHint, { color: flowCfg.color }]}>{flowCfg.actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={flowCfg.color} />
        </TouchableOpacity>
      )}

      {/* ── View Invoice footer (completed orders) ─────────────────── */}
      {isCompleted && (
        <TouchableOpacity
          style={s.invoiceStrip}
          onPress={onPress}
          activeOpacity={0.75}
        >
          <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
          <Text style={s.invoiceStripText}>View Invoice</Text>
          <View style={s.actionStripSpacer} />
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────
function InvoiceRow({ item, isLast, onPress }) {
  const isPaid = item.paymentStatus === "paid";
  const isPartial = item.paymentStatus === "partial";
  const payColor = isPaid ? COLORS.success : isPartial ? "#BA7517" : COLORS.error;
  const payBg    = isPaid ? COLORS.successLight : isPartial ? "#FFFBEB" : COLORS.errorLight;
  const payLabel = isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid";

  return (
    <TouchableOpacity style={[s.row, isLast && s.rowLast]} onPress={onPress} activeOpacity={0.7}>
      <View style={s.rowMain}>
        <View style={s.rowLeft}>
          <View style={s.rowTopLine}>
            <Text style={s.rowPrimary}>{item.invoiceNo ?? "—"}</Text>
            <View style={[s.badge, { backgroundColor: payBg }]}>
              <View style={[s.badgeDot, { backgroundColor: payColor }]} />
              <Text style={[s.badgeText, { color: payColor }]}>{payLabel}</Text>
            </View>
          </View>
          <Text style={s.rowSub} numberOfLines={1}>{item.customerId?.fullName ?? "—"}</Text>
          <View style={s.rowBottomLine}>
            <Text style={s.rowDate}>{fmtDate(item.createdAt)}</Text>
            <Text style={s.rowAmt}>₹{fmt(item.totalAmount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OrderSearchScreen() {
  const navigation = useNavigation();
  const [tab,        setTab]        = useState("orders");
  const [dateFilter, setDateFilter] = useState("all");
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q, t, df) => {
    setLoading(true);
    setSearched(true);
    const dateRange = getDateRange(df);
    const params = { page: 1, limit: 100, search: q || undefined, ...dateRange };
    try {
      if (t === "orders") {
        const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, { params });
        setResults(res.data?.data?.orders ?? []);
      } else {
        const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, { params });
        setResults(res.data?.data?.invoices ?? []);
      }
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const onSearch = () => {
    Keyboard.dismiss();
    doSearch(query, tab, dateFilter);
  };

  const onTabChange = (t) => {
    setTab(t);
    setResults([]);
    setSearched(false);
  };

  const onDateFilter = (df) => {
    setDateFilter(df);
    if (searched) doSearch(query, tab, df);
  };

  const onQueryChange = (v) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(v, tab, dateFilter), 500);
    }
  };

  const handleOrderPress = useCallback(async (order) => {
    if (order.status !== "completed" && order.status !== "vehicle_ready") return;
    try {
      const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, {
        params: { repairOrderId: order._id, limit: 1 },
      });
      const invoice = (res.data?.data?.invoices ?? [])[0];
      if (invoice) {
        navigation.navigate("InvoiceDetail", { invoice });
      } else {
        Alert.alert("No Invoice", "No invoice found for this repair order.");
      }
    } catch {
      Alert.alert("Error", "Could not load invoice.");
    }
  }, [navigation]);

  const handleStatusUpdate = useCallback((order) => {
    const flowCfg = STATUS_FLOW[order.status];
    if (!flowCfg) return;
    const customerName = order.customerId?.fullName ?? "this order";
    Alert.alert(
      flowCfg.actionLabel,
      `Move "${customerName}" from ${STATUS_CFG[order.status]?.label} → ${flowCfg.nextLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, move it",
          onPress: async () => {
            try {
              await axiosClient.put(REPAIR_ORDER_ENDPOINTS.DETAIL(order._id), {
                status: flowCfg.nextStatus,
              });
              // Refresh current results in-place
              doSearch(query, tab, dateFilter);
            } catch (e) {
              Alert.alert("Error", e.displayMessage || "Could not update status.");
            }
          },
        },
      ],
    );
  }, [doSearch, query, tab, dateFilter]);

  const handleInvoicePress = useCallback((invoice) => {
    navigation.navigate("InvoiceDetail", { invoice });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Order Search" showBack transparent={false} />

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => onTabChange(t.key)}
            activeOpacity={0.7}
          >
            <Ionicons name={t.icon} size={15} color={tab === t.key ? COLORS.primary : COLORS.textMuted} />
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder={tab === "orders" ? "Order no, customer, reg number…" : "Invoice no, customer…"}
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={onQueryChange}
            returnKeyType="search"
            onSubmitEditing={onSearch}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={onSearch} activeOpacity={0.8}>
          <Text style={s.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Date filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
        {DATE_FILTERS.map((df) => (
          <TouchableOpacity
            key={df.key}
            style={[s.chip, dateFilter === df.key && s.chipActive]}
            onPress={() => onDateFilter(df.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, dateFilter === df.key && s.chipTextActive]}>{df.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : !searched ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="text-search" size={56} color={COLORS.borderLight} />
          <Text style={s.hintTitle}>Search Orders</Text>
          <Text style={s.hintSub}>Enter a keyword or select a date filter{"\n"}then tap Search</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="document-outline" size={52} color={COLORS.borderLight} />
          <Text style={s.hintTitle}>No results found</Text>
          <Text style={s.hintSub}>Try a different keyword or date range</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={s.resultCount}>{results.length} result{results.length !== 1 ? "s" : ""}</Text>
          }
          renderItem={({ item, index }) =>
            tab === "orders"
              ? <OrderRow item={item} isLast={index === results.length - 1} onPress={() => handleOrderPress(item)} onStatusPress={handleStatusUpdate} />
              : <InvoiceRow item={item} isLast={index === results.length - 1} onPress={() => handleInvoicePress(item)} />
          }
          ItemSeparatorComponent={null}
          style={s.list}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.sm, paddingHorizontal: SIZES.screenPadding },
  hintTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary, marginTop: SIZES.sm },
  hintSub:   { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },

  tabsRow: { flexDirection: "row", paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.sm, gap: SIZES.sm },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabActive:      { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  tabLabel:       { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.primary, fontFamily: FONTS.semibold },

  searchWrap: { flexDirection: "row", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.sm },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 10,
  },
  searchInput:   { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textPrimary, padding: 0 },
  searchBtn:     { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: 12, justifyContent: "center" },
  searchBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },

  chipsScroll:   { flexGrow: 0 },
  chipsContent:  { paddingHorizontal: SIZES.screenPadding, paddingBottom: SIZES.sm, gap: SIZES.xs },
  chip:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight },
  chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:      { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  list:        { flex: 1 },
  listContent: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 80 },
  resultCount: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted, paddingVertical: SIZES.sm },

  row: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.sm,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  rowLast: {},
  rowMain: { padding: SIZES.md },
  rowLeft: { flex: 1, gap: 4 },

  rowTopLine:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SIZES.sm },
  rowBottomLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },

  rowPrimary: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  rowSub:     { fontFamily: FONTS.regular,  fontSize: SIZES.textSm,   color: COLORS.textSecondary },
  rowDate:    { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  rowAmt:     { fontFamily: FONTS.bold,     fontSize: SIZES.textSm,   color: COLORS.textPrimary },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Status action strip ───────────────────────────────────────────
  actionStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  actionStripSpacer: { flex: 1 },
  actionStripHint: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },

  flowPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  flowPillNext: { borderWidth: 0 },
  flowPillText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Invoice strip (completed) ─────────────────────────────────────
  invoiceStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  invoiceStripText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
});
