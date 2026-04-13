import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPORTS_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_TABS = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3",     label: "Last 3 Months" },
  { key: "this_year",  label: "This Year" },
];

const TREND_TABS = [
  { key: "monthly", label: "Monthly" },
  { key: "weekly",  label: "Weekly" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRange(key) {
  const n = new Date();
  if (key === "this_month") return {
    dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
  if (key === "last_month") return {
    dateFrom: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59).toISOString(),
  };
  if (key === "last_3") return {
    dateFrom: new Date(n.getFullYear(), n.getMonth() - 2, 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
  return {
    dateFrom: new Date(n.getFullYear(), 0, 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
}

function fmt(n) {
  if (!n) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function monthLabel(year, month) {
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${year}`;
}

function weekLabel(year, week) {
  return `W${String(week).padStart(2, "0")} '${String(year).slice(-2)}`;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ text }) {
  return (
    <View style={s.emptyWrap}>
      <MaterialCommunityIcons name="calculator-variant-outline" size={48} color={COLORS.borderLight} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Bar row ─────────────────────────────────────────────────────────────────

function BarRow({ label, gst, taxable, pct, barColor }) {
  return (
    <View style={s.barWrap}>
      <View style={s.barHead}>
        <Text style={s.barLabel} numberOfLines={1}>{label}</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.barAmt, { color: barColor }]}>₹{fmt(gst)} GST</Text>
          <Text style={s.barMeta}>Taxable ₹{fmt(taxable)}</Text>
        </View>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${Math.max(pct, 1)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const EMPTY = {
  summary:  { totalGst: 0, totalTaxable: 0, totalOrders: 0 },
  bySlabs:  [],
  monthly:  [],
  weekly:   [],
  topParts: [],
};

export default function GstReportScreen() {
  const [dateTab,  setDateTab]  = useState("this_month");
  const [trendTab, setTrendTab] = useState("monthly");
  const [data,     setData]     = useState(EMPTY);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (dTab = dateTab, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { dateFrom, dateTo } = getRange(dTab);
      const res = await axiosClient.get(REPORTS_ENDPOINTS.GST, { params: { dateFrom, dateTo } });
      const d = res.data?.data ?? {};
      setData({
        summary:  d.summary  ?? EMPTY.summary,
        bySlabs:  d.bySlabs  ?? [],
        monthly:  d.monthly  ?? [],
        weekly:   d.weekly   ?? [],
        topParts: d.topParts ?? [],
      });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateTab]);

  useFocusEffect(useCallback(() => { load(dateTab); }, [dateTab]));

  const onDateTab  = (k) => { setDateTab(k); load(k); };

  const trendData = trendTab === "monthly" ? data.monthly : data.weekly;
  const maxGst    = trendData.reduce((m, r) => Math.max(m, r.gstAmount || 0), 1);
  const maxPart   = data.topParts.reduce((m, r) => Math.max(m, r.gstAmount || 0), 1);
  const maxSlab   = data.bySlabs.reduce((m, r) => Math.max(m, r.gstAmount || 0), 1);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="GST Report" showBack transparent={false} />

      {/* Date range tabs */}
      <View style={s.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsScroll}
          contentContainerStyle={s.tabsContent}
        >
          {DATE_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, dateTab === t.key && s.tabActive]}
              onPress={() => onDateTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabLabel, dateTab === t.key && s.tabLabelActive]}>{t.label}</Text>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(dateTab, true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary cards ────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.third]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <MaterialCommunityIcons name="receipt" size={18} color={COLORS.primary} />
                </View>
                <Text style={s.metricVal}>₹{fmt(data.summary.totalGst)}</Text>
                <Text style={s.metricLbl}>Total GST</Text>
              </View>

              <View style={[s.metricCard, s.third]}>
                <View style={[s.metricIcon, { backgroundColor: "#FFFBEB" }]}>
                  <MaterialCommunityIcons name="currency-inr" size={18} color={COLORS.secondary} />
                </View>
                <Text style={s.metricVal}>₹{fmt(data.summary.totalTaxable)}</Text>
                <Text style={s.metricLbl}>Taxable Value</Text>
              </View>

              <View style={[s.metricCard, s.third]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.errorLight }]}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={18} color={COLORS.error} />
                </View>
                <Text style={s.metricVal}>{data.summary.totalOrders}</Text>
                <Text style={s.metricLbl}>Orders w/ GST</Text>
              </View>
            </View>
          </View>

          {/* ── GST by tax slab ──────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.secTitle}>Breakdown by Tax Slab</Text>
            {data.bySlabs.length === 0 ? (
              <EmptyState text="No GST entries for this period" />
            ) : (
              <View style={s.card}>
                {data.bySlabs.map((slab, i) => (
                  <BarRow
                    key={slab.taxPercent}
                    label={`${slab.taxPercent}% GST · ${slab.lineCount} line${slab.lineCount !== 1 ? "s" : ""}`}
                    gst={slab.gstAmount}
                    taxable={slab.taxableAmount}
                    pct={((slab.gstAmount / maxSlab) * 100).toFixed(1)}
                    barColor={COLORS.primary}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Monthly / Weekly trend ──────────────────────────────── */}
          <View style={s.section}>
            {/* Trend toggle */}
            <View style={s.trendHeaderRow}>
              <Text style={s.secTitle}>GST Trend</Text>
              <View style={s.periodRow}>
                {TREND_TABS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.periodTab, trendTab === t.key && s.periodTabActive]}
                    onPress={() => setTrendTab(t.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.periodLabel, trendTab === t.key && s.periodLabelActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {trendData.length === 0 ? (
              <EmptyState text={`No ${trendTab} GST data for this period`} />
            ) : (
              <View style={s.card}>
                {trendData.map((row, i) => {
                  const label = trendTab === "monthly"
                    ? monthLabel(row.year, row.month)
                    : weekLabel(row.year, row.week);
                  return (
                    <BarRow
                      key={i}
                      label={label}
                      gst={row.gstAmount}
                      taxable={row.taxableAmount}
                      pct={((row.gstAmount / maxGst) * 100).toFixed(1)}
                      barColor={COLORS.primary}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Top 10 parts by GST ──────────────────────────────────── */}
          {data.topParts.length > 0 && (
            <View style={s.section}>
              <Text style={s.secTitle}>Top Parts by GST Collected</Text>
              <View style={s.card}>
                {data.topParts.map((part, i) => (
                  <View key={part.inventoryId ?? i} style={s.partRow}>
                    <View style={s.partRowLeft}>
                      <View style={s.slabBadge}>
                        <Text style={s.slabBadgeText}>{part.taxPercent}%</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.partName} numberOfLines={1}>{part.partName ?? "Unknown"}</Text>
                        <Text style={s.partMeta}>{part.totalQty} units · Taxable ₹{fmt(part.taxableAmount)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.partGst}>₹{fmt(part.gstAmount)}</Text>
                      <Text style={s.partGstLbl}>GST</Text>
                    </View>
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

  tabsWrapper:  { flexGrow: 0, flexShrink: 0, backgroundColor: COLORS.bg },
  tabsScroll:   { flexGrow: 0, flexShrink: 0 },
  tabsContent:  { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.xs, alignItems: "center" },
  tabsSep:      { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.xs },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tabActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel:       { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  scroll:  { paddingBottom: 80 },
  section: { marginTop: SIZES.lg, paddingHorizontal: SIZES.screenPadding },

  metricsRow: { flexDirection: "row", gap: SIZES.sm },
  third: { flex: 1 },
  metricCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight,
    padding: SIZES.sm, gap: 4, alignItems: "flex-start", ...SHADOWS.sm,
  },
  metricIcon: {
    width: 34, height: 34, borderRadius: SIZES.radiusMd,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  metricVal: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  metricLbl: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted },

  secTitle:       { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  trendHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.sm },

  periodRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    padding: 3,
  },
  periodTab:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: SIZES.radiusFull },
  periodTabActive:  { backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  periodLabel:      { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted },
  periodLabelActive:{ color: COLORS.textPrimary, fontFamily: FONTS.semibold },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight,
    overflow: "hidden", ...SHADOWS.sm,
  },

  // bar row
  barWrap:  { padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  barHead:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: SIZES.sm },
  barLabel: { flex: 1, fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  barAmt:   { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  barMeta:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  barTrack: { height: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: SIZES.radiusFull },

  // parts table
  partRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.md,
  },
  partRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  slabBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: SIZES.radiusSm,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 42, alignItems: "center",
  },
  slabBadgeText: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.primary },
  partName:      { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  partMeta:      { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  partGst:       { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary },
  partGstLbl:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
