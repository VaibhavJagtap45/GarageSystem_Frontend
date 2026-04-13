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

const PAY_COLORS = {
  CASH: { bg: COLORS.successLight,  color: COLORS.success },
  CARD: { bg: COLORS.primaryLight,  color: COLORS.primary },
  UPI:  { bg: "#FFFBEB",            color: "#BA7517" },
  BANK: { bg: COLORS.bgSection,     color: COLORS.textMuted },
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
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Item line inside an expanded entry ───────────────────────────────────────

function PartLineRow({ item, isLast }) {
  return (
    <View style={[s.partLine, isLast && s.partLineLast]}>
      <View style={s.partLineDot} />
      <View style={s.partLineBody}>
        <Text style={s.partLineName} numberOfLines={1}>{item.partName}</Text>
        {item.partCode ? <Text style={s.partLineMeta}>Code: {item.partCode}</Text> : null}
      </View>
      <View style={s.partLineRight}>
        <Text style={s.partLineQty}>{item.quantityAdded} {item.unit ?? "pcs"}</Text>
        <Text style={s.partLinePrice}>₹{fmt(item.purchasePrice)} / unit</Text>
        <Text style={s.partLineTotal}>₹{fmt(item.lineTotal)}</Text>
      </View>
    </View>
  );
}

// ─── Purchase entry row (expandable) ─────────────────────────────────────────

function EntryRow({ rec, index, isLast }) {
  const [open, setOpen] = useState(false);
  const pc = PAY_COLORS[rec.paymentChannel] ?? PAY_COLORS.BANK;
  const pending = (rec.totalAmount || 0) - (rec.paidAmount || 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[s.entryCard, isLast && s.entryCardLast]}>
      {/* Header row */}
      <TouchableOpacity style={s.entryHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.entryHeaderLeft}>
          <Text style={s.entryNo} numberOfLines={1}>
            {rec.invoiceNo || rec.purchaseOrderId?.orderNo || `Entry #${index + 1}`}
          </Text>
          <Text style={s.entryVendor} numberOfLines={1}>
            {rec.vendorId?.fullName ?? "Unknown Vendor"}
          </Text>
          <View style={s.entryMeta}>
            <Text style={s.entryDate}>{fmtD(rec.date)}</Text>
            <Text style={s.entryItemCount}> · {rec.items?.length ?? 0} part{rec.items?.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>
        <View style={s.entryHeaderRight}>
          <Text style={s.entryAmt}>₹{fmt(rec.totalAmount)}</Text>
          <View style={[s.badge, { backgroundColor: pc.bg }]}>
            <Text style={[s.badgeTxt, { color: pc.color }]}>{rec.paymentChannel}</Text>
          </View>
          {pending > 0.01 && (
            <Text style={s.entryPending}>₹{fmt(pending)} due</Text>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.textMuted}
            style={{ marginTop: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded parts list */}
      {open && rec.items?.length > 0 && (
        <View style={s.itemsBox}>
          <View style={s.itemsHeader}>
            <Text style={s.itemsHeaderTxt}>Part Name</Text>
            <Text style={s.itemsHeaderTxt}>Qty · Unit Price · Total</Text>
          </View>
          {rec.items.map((item, i) => (
            <PartLineRow key={i} item={item} isLast={i === rec.items.length - 1} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const EMPTY_STATS = { totalAmount: 0, totalPaid: 0, totalPending: 0, itemsCount: 0 };

export default function StockInReportScreen() {
  const [tab,    setTab]    = useState("this_month");
  const [records, setRecords]         = useState([]);
  const [partsBreakdown, setPartsBreakdown] = useState([]);
  const [stats,  setStats]  = useState(EMPTY_STATS);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (t = tab, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { dateFrom, dateTo } = getRange(t);
      const res = await axiosClient.get(REPORTS_ENDPOINTS.STOCK_IN, {
        params: { dateFrom, dateTo, limit: 200 },
      });
      const d = res.data?.data ?? {};
      setRecords(d.records ?? []);
      setPartsBreakdown(d.partsBreakdown ?? []);
      setStats({
        totalAmount:  d.totalAmount  ?? 0,
        totalPaid:    d.totalPaid    ?? 0,
        totalPending: d.totalPending ?? 0,
        itemsCount:   d.itemsCount   ?? 0,
      });
    } catch {
      setRecords([]);
      setPartsBreakdown([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(tab); }, [tab]));

  const onTab = (k) => { setTab(k); load(k); };

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Inventory Stock In" showBack transparent={false} />

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
                <View style={[s.metricIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <MaterialCommunityIcons name="arrow-down-circle" size={20} color={COLORS.primary} />
                </View>
                <Text style={s.metricVal}>₹{fmt(stats.totalAmount)}</Text>
                <Text style={s.metricLbl}>Total Purchased</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.successLight }]}>
                  <MaterialCommunityIcons name="cash-check" size={20} color={COLORS.success} />
                </View>
                <Text style={s.metricVal}>₹{fmt(stats.totalPaid)}</Text>
                <Text style={s.metricLbl}>Amount Paid</Text>
              </View>
            </View>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.errorLight }]}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.error} />
                </View>
                <Text style={s.metricVal}>₹{fmt(stats.totalPending)}</Text>
                <Text style={s.metricLbl}>Amount Pending</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: "#FFFBEB" }]}>
                  <MaterialCommunityIcons name="package-variant" size={20} color="#BA7517" />
                </View>
                <Text style={s.metricVal}>{stats.itemsCount}</Text>
                <Text style={s.metricLbl}>Items · {records.length} entries</Text>
              </View>
            </View>
          </View>

          {/* ── Purchase entries (expandable) ─────────────────────────── */}
          <View style={s.section}>
            <Text style={s.secTitle}>Purchase Entries ({records.length})</Text>
            {records.length === 0 ? (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.borderLight} />
                <Text style={s.emptyText}>No stock-in entries for this period</Text>
              </View>
            ) : (
              <View style={s.card}>
                {records.map((rec, i) => (
                  <EntryRow
                    key={rec._id}
                    rec={rec}
                    index={i}
                    isLast={i === records.length - 1}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Parts Received Breakdown ──────────────────────────────── */}
          {partsBreakdown.length > 0 && (
            <View style={s.section}>
              <Text style={s.secTitle}>Parts Received — Total Breakdown</Text>
              <View style={s.card}>
                {/* Table header */}
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, { flex: 3 }]}>Part Name</Text>
                  <Text style={[s.thCell, s.thRight]}>Qty</Text>
                  <Text style={[s.thCell, s.thRight]}>Unit ₹</Text>
                  <Text style={[s.thCell, s.thRight]}>Total ₹</Text>
                </View>
                {partsBreakdown.map((p, i) => (
                  <View key={i} style={[s.tableRow, i === partsBreakdown.length - 1 && s.tableRowLast]}>
                    <View style={{ flex: 3 }}>
                      <Text style={s.tdName} numberOfLines={1}>{p.partName}</Text>
                      {p.partCode ? <Text style={s.tdCode}>{p.partCode}</Text> : null}
                    </View>
                    <Text style={[s.tdCell, s.tdRight]}>{p.totalQty}</Text>
                    <Text style={[s.tdCell, s.tdRight]}>₹{fmt(p.unitPrice)}</Text>
                    <Text style={[s.tdCell, s.tdRight, s.tdBold]}>₹{fmt(p.totalValue)}</Text>
                  </View>
                ))}
              </View>
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
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tabActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel:       { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  scroll:   { paddingBottom: 80 },
  section:  { marginTop: 20, paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },
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

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm,
  },

  // ── Expandable entry card ─────────────────────────────────────────────────
  entryCard:     { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  entryCardLast: { borderBottomWidth: 0 },
  entryHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 2, gap: SIZES.sm,
  },
  entryHeaderLeft:  { flex: 1, gap: 2 },
  entryHeaderRight: { alignItems: "flex-end", gap: 4, minWidth: 90 },
  entryNo:      { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  entryVendor:  { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  entryMeta:    { flexDirection: "row" },
  entryDate:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  entryItemCount:{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  entryAmt:     { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  entryPending: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.error },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  badgeTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Expanded items box ────────────────────────────────────────────────────
  itemsBox: { backgroundColor: COLORS.bgSection, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm, overflow: "hidden" },
  itemsHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: SIZES.sm, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  itemsHeaderTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },

  partLine: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  partLineLast: { borderBottomWidth: 0 },
  partLineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 7 },
  partLineBody: { flex: 1 },
  partLineName: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  partLineMeta: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  partLineRight:{ alignItems: "flex-end", gap: 1 },
  partLineQty:  { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  partLinePrice:{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  partLineTotal:{ fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.primary },

  // ── Parts breakdown table ─────────────────────────────────────────────────
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
  tdName:  { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  tdCode:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  tdCell:  { flex: 1.2, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tdRight: { textAlign: "right" },
  tdBold:  { fontFamily: FONTS.bold, color: COLORS.textPrimary },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
