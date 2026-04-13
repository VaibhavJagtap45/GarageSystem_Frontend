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

const DATE_TABS = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3",     label: "Last 3 Months" },
  { key: "this_year",  label: "This Year" },
];

const PERIOD_TABS = [
  { key: "day",   label: "Daily" },
  { key: "month", label: "Monthly" },
];

function getRange(key) {
  const n = new Date();
  if (key === "this_month") {
    return {
      dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(),
      dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
    };
  }
  if (key === "last_month") {
    return {
      dateFrom: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString(),
      dateTo:   new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59).toISOString(),
    };
  }
  if (key === "last_3") {
    return {
      dateFrom: new Date(n.getFullYear(), n.getMonth() - 2, 1).toISOString(),
      dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
    };
  }
  // this_year
  return {
    dateFrom: new Date(n.getFullYear(), 0, 1).toISOString(),
    dateTo:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString(),
  };
}

function fmt(n) {
  if (!n) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function periodLabel(p, isMonth) {
  if (!p) return "—";
  if (isMonth) return `${MONTH_NAMES[(p.month ?? 1) - 1]} ${p.year}`;
  return `${String(p.day ?? 1).padStart(2, "0")} ${MONTH_NAMES[(p.month ?? 1) - 1]}`;
}

export default function PartsSalesReportScreen() {
  const [dateTab, setDateTab] = useState("this_month");
  const [periodTab, setPeriodTab] = useState("day");
  const [data, setData] = useState({ timeSeries: [], topParts: [], totalRevenue: 0, totalQty: 0, uniqueParts: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (dTab = dateTab, pTab = periodTab, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { dateFrom, dateTo } = getRange(dTab);
      const res = await axiosClient.get(REPORTS_ENDPOINTS.PARTS_SALES, {
        params: { period: pTab, dateFrom, dateTo },
      });
      const d = res.data?.data ?? {};
      setData({
        timeSeries:   d.timeSeries   ?? [],
        topParts:     d.topParts     ?? [],
        totalRevenue: d.totalRevenue ?? 0,
        totalQty:     d.totalQty     ?? 0,
        uniqueParts:  d.uniqueParts  ?? 0,
      });
    } catch {
      setData({ timeSeries: [], topParts: [], totalRevenue: 0, totalQty: 0, uniqueParts: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateTab, periodTab]);

  useFocusEffect(useCallback(() => { load(dateTab, periodTab); }, [dateTab, periodTab]));

  const onDateTab   = (k) => { setDateTab(k);   load(k, periodTab); };
  const onPeriodTab = (k) => { setPeriodTab(k); load(dateTab, k); };

  const isMonth    = periodTab === "month";
  const maxRevenue = data.timeSeries.reduce((m, r) => Math.max(m, r.revenue || 0), 1);
  const maxParts   = data.topParts.reduce((m, r) => Math.max(m, r.revenue || 0), 1);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Parts Sales" showBack transparent={false} />

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

        {/* Period toggle */}
        <View style={s.periodRow}>
          {PERIOD_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.periodTab, periodTab === t.key && s.periodTabActive]}
              onPress={() => onPeriodTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.periodLabel, periodTab === t.key && s.periodLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.tabsSep} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(dateTab, periodTab, true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <View style={s.section}>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>
                <Text style={s.metricVal}>₹{fmt(data.totalRevenue)}</Text>
                <Text style={s.metricLbl}>Parts Revenue</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: "#FFFBEB" }]}>
                  <MaterialCommunityIcons name="package-variant" size={20} color="#BA7517" />
                </View>
                <Text style={s.metricVal}>{data.totalQty}</Text>
                <Text style={s.metricLbl}>Units Sold · {data.uniqueParts} SKUs</Text>
              </View>
            </View>
          </View>

          {/* Time-series bars */}
          <View style={s.section}>
            <Text style={s.secTitle}>{isMonth ? "Monthly" : "Daily"} Trend</Text>
            {data.timeSeries.length === 0 ? (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons name="chart-bar" size={48} color={COLORS.borderLight} />
                <Text style={s.emptyText}>No parts sales for this period</Text>
              </View>
            ) : (
              <View style={s.card}>
                {data.timeSeries.map((row, i) => {
                  const pct = ((row.revenue / maxRevenue) * 100).toFixed(1);
                  return (
                    <View key={i} style={s.barWrap}>
                      <View style={s.barHead}>
                        <Text style={s.barLabel}>{periodLabel(row.period, isMonth)}</Text>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={[s.barAmt, { color: COLORS.primary }]}>₹{fmt(row.revenue)}</Text>
                          <Text style={s.barMeta}>{row.qty} units · {row.txnCount} inv</Text>
                        </View>
                      </View>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: COLORS.primary }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Top 10 parts */}
          {data.topParts.length > 0 && (
            <View style={s.section}>
              <Text style={s.secTitle}>Top Parts by Revenue</Text>
              <View style={s.card}>
                {data.topParts.map((part, i) => {
                  const pct = ((part.revenue / maxParts) * 100).toFixed(1);
                  return (
                    <View key={part.inventoryId ?? i} style={s.barWrap}>
                      <View style={s.barHead}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.barLabel} numberOfLines={1}>{part.partName ?? "Unknown"}</Text>
                          <Text style={s.barMeta}>{part.qty} units sold</Text>
                        </View>
                        <Text style={[s.barAmt, { color: COLORS.secondary }]}>₹{fmt(part.revenue)}</Text>
                      </View>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: COLORS.secondary }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  tabsWrapper: { flexGrow: 0, flexShrink: 0, backgroundColor: COLORS.bg },
  tabsScroll:  { flexGrow: 0, flexShrink: 0 },
  tabsContent: { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.xs, alignItems: "center" },
  tabsSep: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.xs },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  periodRow: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.xs,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    padding: 3,
  },
  periodTab: {
    flex: 1, alignItems: "center", paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  periodTabActive: { backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  periodLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted },
  periodLabelActive: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },

  scroll: { paddingBottom: 80 },
  section: { marginTop: 20, paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },
  secTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },

  metricsRow: { flexDirection: "row", gap: SIZES.sm },
  half: { flex: 1 },
  metricCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight,
    padding: SIZES.md, gap: 4, ...SHADOWS.sm,
  },
  metricIcon: {
    width: 36, height: 36, borderRadius: SIZES.radiusMd,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  metricVal: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  metricLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight,
    overflow: "hidden", ...SHADOWS.sm,
  },
  barWrap: { padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  barHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: SIZES.sm },
  barLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  barAmt:   { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  barMeta:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  barTrack: { height: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: SIZES.radiusFull, minWidth: 4 },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
