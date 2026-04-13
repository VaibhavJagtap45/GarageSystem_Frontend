import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPORTS_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_TABS = [
  { key: "today",      label: "Today" },
  { key: "this_week",  label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
];

const STATUS_COLORS = {
  created:       { bg: COLORS.bgSection,     color: COLORS.textMuted },
  in_progress:   { bg: COLORS.primaryLight,  color: COLORS.primary },
  vehicle_ready: { bg: "#FFFBEB",            color: "#BA7517" },
  completed:     { bg: COLORS.successLight,  color: COLORS.success },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRange(key) {
  const n = new Date();
  if (key === "today") return {
    dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
  if (key === "this_week") {
    const diff = n.getDay() === 0 ? -6 : 1 - n.getDay();
    return {
      dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate() + diff).toISOString(),
      dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
    };
  }
  if (key === "this_month") return {
    dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
  return {
    dateFrom: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59).toISOString(),
  };
}

const fmt  = (n) => n ? Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00";
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
const statusLabel = (st) => (st ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Repair Order row (expandable parts) ─────────────────────────────────────

function OrderRow({ order, isLast }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.created;
  const partsTotal = (order.parts ?? []).reduce((s, p) => s + (p.lineTotal ?? 0), 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[s.orderCard, isLast && s.orderCardLast]}>
      <TouchableOpacity style={s.orderHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.orderHeaderLeft}>
          <Text style={s.orderNo}>{order.orderNo || "—"}</Text>
          <Text style={s.orderCustomer} numberOfLines={1}>
            {order.customerId?.fullName ?? "Customer"} · {order.customerId?.phoneNo ?? ""}
          </Text>
          <Text style={s.orderDate}>{fmtD(order.createdAt)} · {order.parts?.length ?? 0} part{order.parts?.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={s.orderHeaderRight}>
          <Text style={s.orderTotal}>₹{fmt(partsTotal)}</Text>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeTxt, { color: sc.color }]}>{statusLabel(order.status)}</Text>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textMuted} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>

      {open && order.parts?.length > 0 && (
        <View style={s.itemsBox}>
          <View style={s.itemsHeader}>
            <Text style={[s.thTxt, { flex: 3 }]}>Part</Text>
            <Text style={[s.thTxt, s.thRight]}>Qty</Text>
            <Text style={[s.thTxt, s.thRight]}>Unit ₹</Text>
            <Text style={[s.thTxt, s.thRight]}>Total ₹</Text>
          </View>
          {order.parts.map((p, i) => (
            <View key={i} style={[s.partRow, i === order.parts.length - 1 && s.partRowLast]}>
              <View style={{ flex: 3 }}>
                <Text style={s.partName} numberOfLines={1}>{p.name ?? "Unknown"}</Text>
                {p.partCode ? <Text style={s.partCode}>{p.partCode}</Text> : null}
              </View>
              <Text style={[s.tdCell, s.tdRight]}>{p.quantity}</Text>
              <Text style={[s.tdCell, s.tdRight]}>₹{fmt(p.unitPrice)}</Text>
              <Text style={[s.tdCell, s.tdRight, s.tdBold]}>₹{fmt(p.lineTotal)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const EMPTY_SUMMARY = { totalValue: 0, totalQty: 0, uniqueParts: 0 };

export default function StockOutReportScreen() {
  const [tab,     setTab]     = useState("this_month");
  const [records, setRecords] = useState([]);
  const [byOrder, setByOrder] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("parts"); // "parts" | "orders"

  const load = useCallback(async (t = tab, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { dateFrom, dateTo } = getRange(t);
      const res = await axiosClient.get(REPORTS_ENDPOINTS.STOCK_OUT, {
        params: { dateFrom, dateTo, limit: 100 },
      });
      const d = res.data?.data ?? {};
      setRecords(d.records  ?? []);
      setByOrder(d.byOrder  ?? []);
      setSummary({
        totalValue:  d.totalValue  ?? 0,
        totalQty:    d.totalQty    ?? 0,
        uniqueParts: d.uniqueParts ?? 0,
      });
    } catch {
      setRecords([]);
      setByOrder([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(tab); }, [tab]));

  const onTab = (k) => { setTab(k); load(k); };

  const maxValue = records.reduce((m, r) => Math.max(m, r.totalValue || 0), 1);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Inventory Stock Out" showBack transparent={false} />

      {/* Date tabs */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
          {DATE_TABS.map((t) => (
            <TouchableOpacity key={t.key}
              style={[s.tab, tab === t.key && s.tabActive]}
              onPress={() => onTab(t.key)} activeOpacity={0.7}>
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={s.tabsSep} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(tab, true)}
              tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary cards ─────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.errorLight }]}>
                  <MaterialCommunityIcons name="arrow-up-circle" size={20} color={COLORS.error} />
                </View>
                <Text style={s.metricVal}>₹{fmt(summary.totalValue)}</Text>
                <Text style={s.metricLbl}>Total Parts Value Used</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <MaterialCommunityIcons name="counter" size={20} color={COLORS.primary} />
                </View>
                <Text style={s.metricVal}>{summary.totalQty}</Text>
                <Text style={s.metricLbl}>Units Consumed</Text>
              </View>
            </View>
            <View style={[s.metricCard]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: SIZES.sm }}>
                <View style={[s.metricIcon, { backgroundColor: "#FFFBEB" }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={20} color="#BA7517" />
                </View>
                <View>
                  <Text style={s.metricVal}>{summary.uniqueParts} SKUs · {byOrder.length} orders</Text>
                  <Text style={s.metricLbl}>Unique parts moved</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── View toggle ───────────────────────────────────────────── */}
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, view === "parts" && s.toggleBtnActive]}
              onPress={() => setView("parts")} activeOpacity={0.7}>
              <MaterialCommunityIcons name="package-variant" size={14}
                color={view === "parts" ? COLORS.white : COLORS.textMuted} />
              <Text style={[s.toggleTxt, view === "parts" && s.toggleTxtActive]}>By Part</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, view === "orders" && s.toggleBtnActive]}
              onPress={() => setView("orders")} activeOpacity={0.7}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={14}
                color={view === "orders" ? COLORS.white : COLORS.textMuted} />
              <Text style={[s.toggleTxt, view === "orders" && s.toggleTxtActive]}>By Order</Text>
            </TouchableOpacity>
          </View>

          {/* ── By Part (aggregated parts table) ─────────────────────── */}
          {view === "parts" && (
            <View style={s.section}>
              <Text style={s.secTitle}>Parts Consumed ({records.length} SKUs)</Text>
              {records.length === 0 ? (
                <View style={s.emptyWrap}>
                  <MaterialCommunityIcons name="package-variant" size={48} color={COLORS.borderLight} />
                  <Text style={s.emptyText}>No stock-out movements for this period</Text>
                </View>
              ) : (
                <View style={s.card}>
                  {/* Table header */}
                  <View style={s.tableHeader}>
                    <Text style={[s.thCell, { flex: 3 }]}>Part Name</Text>
                    <Text style={[s.thCell, s.thRight]}>Qty</Text>
                    <Text style={[s.thCell, s.thRight]}>Unit ₹</Text>
                    <Text style={[s.thCell, s.thRight]}>Total ₹</Text>
                  </View>
                  {records.map((rec, i) => {
                    const pct = ((rec.totalValue / maxValue) * 100).toFixed(1);
                    return (
                      <View key={rec.inventoryId ?? i} style={[s.tableRow, i === records.length - 1 && s.tableRowLast]}>
                        <View style={{ flex: 3 }}>
                          <Text style={s.tdName} numberOfLines={1}>{rec.partName ?? "Unknown"}</Text>
                          {rec.partCode ? <Text style={s.tdCode}>{rec.partCode}</Text> : null}
                          {rec.category ? <Text style={s.tdCategory}>{rec.category}</Text> : null}
                          <View style={s.barTrack}>
                            <View style={[s.barFill, { width: `${pct}%` }]} />
                          </View>
                          <View style={s.stockRow}>
                            <MaterialCommunityIcons name="warehouse" size={10} color={COLORS.textMuted} />
                            <Text style={s.stockTxt}>In stock: {rec.quantityInHand ?? 0}</Text>
                            <Text style={s.orderCountTxt}>{rec.orderCount} order{rec.orderCount !== 1 ? "s" : ""}</Text>
                          </View>
                        </View>
                        <Text style={[s.tdCell, s.tdRight]}>{rec.totalQty}</Text>
                        <Text style={[s.tdCell, s.tdRight]}>₹{fmt(rec.unitPrice)}</Text>
                        <Text style={[s.tdCell, s.tdRight, s.tdBold]}>₹{fmt(rec.totalValue)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── By Order (expandable RO list) ─────────────────────────── */}
          {view === "orders" && (
            <View style={s.section}>
              <Text style={s.secTitle}>Repair Orders with Parts ({byOrder.length})</Text>
              {byOrder.length === 0 ? (
                <View style={s.emptyWrap}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={48} color={COLORS.borderLight} />
                  <Text style={s.emptyText}>No repair orders with parts for this period</Text>
                </View>
              ) : (
                <View style={s.card}>
                  {byOrder.map((order, i) => (
                    <OrderRow
                      key={order._id}
                      order={order}
                      isLast={i === byOrder.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  tabsWrapper: { flexGrow: 0, flexShrink: 0, backgroundColor: COLORS.bg },
  tabsScroll:  { flexGrow: 0, flexShrink: 0 },
  tabsContent: { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.xs, alignItems: "center" },
  tabsSep:     { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.xs },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tabActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel:       { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  scroll:   { paddingBottom: 80 },
  section:  { marginTop: SIZES.lg, paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },
  secTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },

  metricsRow: { flexDirection: "row", gap: SIZES.sm, marginBottom: SIZES.sm },
  half: { flex: 1 },
  metricCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, gap: 4, ...SHADOWS.sm,
  },
  metricIcon: {
    width: 36, height: 36, borderRadius: SIZES.radiusMd,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  metricVal: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  metricLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: "row", gap: SIZES.sm,
    marginHorizontal: SIZES.screenPadding, marginTop: SIZES.sm,
  },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleTxt:       { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textMuted },
  toggleTxtActive: { color: COLORS.white },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm,
  },

  // ── Parts table ───────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row", paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    backgroundColor: COLORS.bgSection, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  thCell:  { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, textTransform: "uppercase" },
  thRight: { flex: 1.2, textAlign: "right" },
  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tdName:       { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  tdCode:       { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  tdCategory:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.primary, marginTop: 1 },
  tdCell:       { flex: 1.2, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tdRight:      { textAlign: "right" },
  tdBold:       { fontFamily: FONTS.bold, color: COLORS.error },

  barTrack: { height: 4, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.borderLight, marginTop: 5, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: SIZES.radiusFull, backgroundColor: COLORS.error, minWidth: 4 },

  stockRow:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  stockTxt:     { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  orderCountTxt:{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginLeft: "auto" },

  // ── Order rows ────────────────────────────────────────────────────────────
  orderCard:     { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  orderCardLast: { borderBottomWidth: 0 },
  orderHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 2, gap: SIZES.sm,
  },
  orderHeaderLeft:  { flex: 1, gap: 2 },
  orderHeaderRight: { alignItems: "flex-end", gap: 4, minWidth: 90 },
  orderNo:       { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  orderCustomer: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  orderDate:     { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  orderTotal:    { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.error },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  badgeTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Expanded parts inside order ───────────────────────────────────────────
  itemsBox: {
    backgroundColor: COLORS.bgSection, marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm, overflow: "hidden",
  },
  itemsHeader: {
    flexDirection: "row", paddingHorizontal: SIZES.sm, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  thTxt:  { flex: 1.2, fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, textTransform: "uppercase" },
  thRight:{ textAlign: "right" },
  partRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  partRowLast: { borderBottomWidth: 0 },
  partName: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  partCode: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
