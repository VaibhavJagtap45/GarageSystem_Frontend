import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const TABS = [
  { key: "today",      label: "Today"      },
  { key: "this_week",  label: "This Week"  },
  { key: "this_month", label: "This Month" },
];

const MODE_CONFIG = {
  cash:          { label: "Cash",          icon: "cash-outline",          color: COLORS.success   },
  upi:           { label: "UPI",           icon: "qr-code-outline",       color: COLORS.primary   },
  card:          { label: "Card",          icon: "card-outline",          color: COLORS.secondary },
  bank_transfer: { label: "Bank Transfer", icon: "business-outline",      color: "#7B61FF"        },
  other:         { label: "Other",         icon: "ellipsis-horizontal-outline", color: COLORS.textMuted },
};

function getRange(key) {
  const n = new Date();
  if (key === "today")
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  if (key === "this_week") {
    const d = n.getDay(); const diff = d === 0 ? -6 : 1 - d;
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate() + diff).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  }
  return { dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
}

function fmt(n) { return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }

export default function PaymentReportScreen() {
  const [tab, setTab]               = useState("this_month");
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (t = tab, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { dateFrom, dateTo } = getRange(t);
      const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { page: 1, limit: 500, paymentStatus: "paid", dateFrom, dateTo } });
      setInvoices(res.data?.data?.invoices ?? []);
    } catch { setInvoices([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(tab); }, [tab]));

  const onTab = (k) => { setTab(k); load(k); };

  // Compute breakdown per mode
  const modeMap = {};
  for (const inv of invoices) {
    const mode = inv.paymentMode ?? "other";
    if (!modeMap[mode]) modeMap[mode] = { count: 0, total: 0 };
    modeMap[mode].count++;
    modeMap[mode].total += Number(inv.totalAmount) || 0;
  }
  const grandTotal = Object.values(modeMap).reduce((s, m) => s + m.total, 0);
  const modes = Object.entries(modeMap).sort((a, b) => b[1].total - a[1].total);
  const sorted = [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Payment Reports" showBack transparent={false} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => onTab(t.key)} activeOpacity={0.7}>
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(tab, true)} tintColor={COLORS.primary} colors={[COLORS.primary]} />} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Total collected */}
          <View style={s.section}>
            <View style={s.totalCard}>
              <View style={[s.totalIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="checkmark-circle-outline" size={26} color={COLORS.success} />
              </View>
              <View>
                <Text style={s.totalAmt}>₹{fmt(grandTotal)}</Text>
                <Text style={s.totalLbl}>Total Collected · {invoices.length} payments</Text>
              </View>
            </View>
          </View>

          {/* Mode breakdown */}
          <View style={s.section}>
            <Text style={s.secTitle}>By Payment Mode</Text>
            <View style={s.card}>
              {modes.length === 0 ? (
                <Text style={s.emptyText}>No paid invoices for this period.</Text>
              ) : modes.map(([mode, data]) => {
                const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.other;
                const pct = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
                return (
                  <View key={mode} style={s.modeRow}>
                    <View style={[s.modeIcon, { backgroundColor: `${cfg.color}20` }]}>
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View style={s.modeInfo}>
                      <View style={s.modeHeader}>
                        <Text style={s.modeName}>{cfg.label}</Text>
                        <Text style={[s.modeAmt, { color: cfg.color }]}>₹{fmt(data.total)}</Text>
                      </View>
                      <View style={s.modeBarTrack}>
                        <View style={[s.modeBarFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                      </View>
                      <Text style={s.modePct}>{data.count} payment{data.count !== 1 ? "s" : ""} · {pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Paid invoices list */}
          <View style={s.section}>
            <Text style={s.secTitle}>Paid Invoices</Text>
            {sorted.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="card-outline" size={48} color={COLORS.borderLight} />
                <Text style={s.emptyText}>No paid invoices for this period.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {sorted.map((inv, i) => {
                  const cfg = MODE_CONFIG[inv.paymentMode ?? "other"] ?? MODE_CONFIG.other;
                  return (
                    <View key={inv._id} style={[s.invRow, i === sorted.length - 1 && s.invRowLast]}>
                      <View style={[s.modeIconSm, { backgroundColor: `${cfg.color}20` }]}>
                        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                      </View>
                      <View style={s.invInfo}>
                        <Text style={s.invNo}>{inv.invoiceNo ?? "—"}</Text>
                        <Text style={s.invCust} numberOfLines={1}>{inv.customerId?.fullName ?? "—"}</Text>
                      </View>
                      <View style={s.invRight}>
                        <Text style={s.invAmt}>₹{fmt(inv.totalAmount)}</Text>
                        <Text style={s.invDate}>{fmtDate(inv.createdAt)}</Text>
                      </View>
                    </View>
                  );
                })}
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
  tabsScroll: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.xs },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },
  scroll: { paddingBottom: 80 },
  section: { paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },
  secTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  card: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm },
  totalCard: { flexDirection: "row", alignItems: "center", gap: SIZES.md, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, ...SHADOWS.sm },
  totalIcon: { width: 52, height: 52, borderRadius: SIZES.radiusMd, alignItems: "center", justifyContent: "center" },
  totalAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  totalLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, marginTop: 2 },
  modeRow: { flexDirection: "row", alignItems: "center", gap: SIZES.sm, padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modeIcon: { width: 40, height: 40, borderRadius: SIZES.radiusMd, alignItems: "center", justifyContent: "center" },
  modeInfo: { flex: 1 },
  modeHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  modeName: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  modeAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  modeBarTrack: { height: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgSection, overflow: "hidden" },
  modeBarFill: { height: "100%", borderRadius: SIZES.radiusFull, minWidth: 4 },
  modePct: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },
  invRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.sm },
  invRowLast: { borderBottomWidth: 0 },
  modeIconSm: { width: 32, height: 32, borderRadius: SIZES.radiusSm, alignItems: "center", justifyContent: "center" },
  invInfo: { flex: 1 },
  invNo: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  invCust: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  invRight: { alignItems: "flex-end" },
  invAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  invDate: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted, textAlign: "center", padding: SIZES.md },
});
