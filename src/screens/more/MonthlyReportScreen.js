import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n) { return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtK(n) { const v = Number(n || 0); return v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v.toFixed(0)}`; }

function getWeekNo(date, monthStart) {
  const day = Math.floor((new Date(date) - monthStart) / 86400000);
  return Math.min(Math.floor(day / 7), 3); // 0-3
}

function computeWeeks(invoices, year, month) {
  const start = new Date(year, month, 1);
  const weeks = [
    { label: "Week 1", revenue: 0, count: 0 },
    { label: "Week 2", revenue: 0, count: 0 },
    { label: "Week 3", revenue: 0, count: 0 },
    { label: "Week 4", revenue: 0, count: 0 },
  ];
  for (const inv of invoices) {
    const w = getWeekNo(inv.createdAt, start);
    if (w >= 0 && w <= 3) {
      weeks[w].revenue += Number(inv.totalAmount) || 0;
      weeks[w].count++;
    }
  }
  return weeks;
}

function computeTopServices(invoices) {
  const map = {};
  for (const inv of invoices) {
    for (const svc of inv.services ?? []) {
      if (!svc.name) continue;
      if (!map[svc.name]) map[svc.name] = 0;
      map[svc.name] += Number(svc.lineTotal) || 0;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function computeTopCustomers(invoices) {
  const map = {};
  for (const inv of invoices) {
    const id   = inv.customerId?._id ?? inv.customerId;
    const name = inv.customerId?.fullName ?? "Unknown";
    if (!id) continue;
    if (!map[id]) map[id] = { name, total: 0, count: 0 };
    map[id].total += Number(inv.totalAmount) || 0;
    map[id].count++;
  }
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
}

export default function MonthlyReportScreen() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (y = year, m = month, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    const dateFrom = new Date(y, m, 1).toISOString();
    const dateTo   = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    try {
      const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { page: 1, limit: 500, dateFrom, dateTo } });
      setInvoices(res.data?.data?.invoices ?? []);
    } catch { setInvoices([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(year, month); }, [year, month]));

  const prev = () => { const m = month === 0 ? 11 : month - 1; const y = month === 0 ? year - 1 : year; setMonth(m); setYear(y); load(y, m); };
  const next = () => { const m = month === 11 ? 0 : month + 1; const y = month === 11 ? year + 1 : year; setMonth(m); setYear(y); load(y, m); };

  const revenue     = invoices.filter(i => i.paymentStatus === "paid").reduce((s, i) => s + (Number(i.totalAmount)||0), 0);
  const pending     = invoices.filter(i => i.paymentStatus !== "paid").reduce((s, i) => s + (Number(i.totalAmount)||0), 0);
  const avgValue    = invoices.length > 0 ? (revenue + pending) / invoices.length : 0;
  const paidCount   = invoices.filter(i => i.paymentStatus === "paid").length;

  const weeks       = computeWeeks(invoices, year, month);
  const maxWeekRev  = Math.max(...weeks.map(w => w.revenue), 1);
  const topServices = computeTopServices(invoices);
  const topCustomers = computeTopCustomers(invoices);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Monthly Report" showBack transparent={false} />

      {/* Month picker */}
      <View style={s.monthPicker}>
        <TouchableOpacity style={s.monthBtn} onPress={prev} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity style={s.monthBtn} onPress={next} activeOpacity={0.7} disabled={year === now.getFullYear() && month >= now.getMonth()}>
          <Ionicons name="chevron-forward" size={20} color={year === now.getFullYear() && month >= now.getMonth() ? COLORS.borderLight : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(year, month, true)} tintColor={COLORS.primary} colors={[COLORS.primary]} />} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary cards */}
          <View style={s.section}>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.successLight }]}><Ionicons name="trending-up" size={18} color={COLORS.success} /></View>
                <Text style={s.metricVal}>₹{fmt(revenue)}</Text>
                <Text style={s.metricLbl}>Revenue</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.primaryLight }]}><Ionicons name="document-text-outline" size={18} color={COLORS.primary} /></View>
                <Text style={s.metricVal}>{invoices.length}</Text>
                <Text style={s.metricLbl}>Total Jobs</Text>
              </View>
            </View>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.warningLight }]}><MaterialCommunityIcons name="cash-multiple" size={18} color={COLORS.warning} /></View>
                <Text style={s.metricVal}>₹{fmt(avgValue)}</Text>
                <Text style={s.metricLbl}>Avg Job Value</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View style={[s.metricIcon, { backgroundColor: COLORS.errorLight }]}><Ionicons name="alert-circle-outline" size={18} color={COLORS.error} /></View>
                <Text style={s.metricVal}>{paidCount}/{invoices.length}</Text>
                <Text style={s.metricLbl}>Paid</Text>
              </View>
            </View>
          </View>

          {/* Week breakdown */}
          <View style={s.section}>
            <Text style={s.secTitle}>Week-by-Week Breakdown</Text>
            <View style={s.card}>
              {weeks.map((w, i) => (
                <View key={i} style={[s.weekRow, i === weeks.length - 1 && s.weekRowLast]}>
                  <Text style={s.weekLabel}>{w.label}</Text>
                  <View style={s.weekBarWrap}>
                    <View style={s.weekBarTrack}>
                      <View style={[s.weekBarFill, { width: `${(w.revenue / maxWeekRev) * 100}%` }]} />
                    </View>
                    <Text style={s.weekCount}>{w.count} job{w.count !== 1 ? "s" : ""}</Text>
                  </View>
                  <Text style={s.weekAmt}>{fmtK(w.revenue)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top services */}
          <View style={s.section}>
            <Text style={s.secTitle}>Top Services by Revenue</Text>
            {topServices.length === 0 ? (
              <Text style={s.emptyText}>No service data this month.</Text>
            ) : (
              <View style={s.card}>
                {topServices.map(([name, total], i) => (
                  <View key={name} style={[s.rankRow, i === topServices.length - 1 && s.rankRowLast]}>
                    <View style={s.rankBadge}><Text style={s.rankNo}>{i + 1}</Text></View>
                    <Text style={s.rankName} numberOfLines={1}>{name}</Text>
                    <Text style={s.rankAmt}>₹{fmt(total)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Top customers */}
          <View style={s.section}>
            <Text style={s.secTitle}>Top Customers by Spend</Text>
            {topCustomers.length === 0 ? (
              <Text style={s.emptyText}>No customer data this month.</Text>
            ) : (
              <View style={s.card}>
                {topCustomers.map((c, i) => (
                  <View key={i} style={[s.rankRow, i === topCustomers.length - 1 && s.rankRowLast]}>
                    <View style={s.rankBadge}><Text style={s.rankNo}>{i + 1}</Text></View>
                    <View style={s.rankInfo}>
                      <Text style={s.rankName} numberOfLines={1}>{c.name}</Text>
                      <Text style={s.rankSub}>{c.count} invoice{c.count !== 1 ? "s" : ""}</Text>
                    </View>
                    <Text style={s.rankAmt}>₹{fmt(c.total)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  monthPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  monthBtn: { padding: 8 },
  monthLabel: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  scroll: { paddingBottom: 80 },
  section: { paddingHorizontal: SIZES.screenPadding, marginTop: SIZES.md, marginBottom: SIZES.xs },
  secTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  card: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm },
  metricsRow: { flexDirection: "row", gap: SIZES.sm, marginBottom: SIZES.sm },
  half: { flex: 1 },
  metricCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, gap: 3, ...SHADOWS.sm },
  metricIcon: { width: 36, height: 36, borderRadius: SIZES.radiusMd, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  metricVal: { fontFamily: FONTS.bold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  metricLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  weekRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.sm },
  weekRowLast: { borderBottomWidth: 0 },
  weekLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, width: 55 },
  weekBarWrap: { flex: 1, gap: 3 },
  weekBarTrack: { height: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, overflow: "hidden" },
  weekBarFill: { height: "100%", borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary, minWidth: 4 },
  weekCount: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  weekAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary, width: 60, textAlign: "right" },
  rankRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.sm },
  rankRowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  rankNo: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.primary },
  rankInfo: { flex: 1 },
  rankName: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary, flex: 1 },
  rankSub: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  rankAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted, padding: SIZES.md },
});
