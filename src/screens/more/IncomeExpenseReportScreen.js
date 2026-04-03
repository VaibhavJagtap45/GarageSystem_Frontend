import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  INVOICE_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const DATE_TABS = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
];

const PAY_CFG = {
  paid: { label: "Paid", color: COLORS.success, bg: COLORS.successLight },
  unpaid: { label: "Unpaid", color: COLORS.error, bg: COLORS.errorLight },
  partial: { label: "Partial", color: COLORS.warning, bg: COLORS.warningLight },
};

function getRange(key) {
  const n = new Date();
  if (key === "today") {
    return {
      dateFrom: new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate(),
      ).toISOString(),
      dateTo: new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate(),
        23,
        59,
        59,
      ).toISOString(),
    };
  }
  if (key === "this_week") {
    const d = n.getDay();
    const diff = d === 0 ? -6 : 1 - d;
    return {
      dateFrom: new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate() + diff,
      ).toISOString(),
      dateTo: new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate(),
        23,
        59,
        59,
      ).toISOString(),
    };
  }
  if (key === "this_month") {
    return {
      dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(),
      dateTo: new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate(),
        23,
        59,
        59,
      ).toISOString(),
    };
  }
  // last_month
  return {
    dateFrom: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString(),
    dateTo: new Date(
      n.getFullYear(),
      n.getMonth(),
      0,
      23,
      59,
      59,
    ).toISOString(),
  };
}

function fmt(n) {
  if (!n) return "0.00";
  return Number(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function compute(invoices) {
  let revenue = 0,
    pending = 0,
    services = 0,
    parts = 0;
  for (const inv of invoices) {
    const amt = Number(inv.totalAmount) || 0;
    const svc = Number(inv.servicesSubTotal) || 0;
    const prt = Number(inv.partsSubTotal) || 0;
    if (inv.paymentStatus === "paid") {
      revenue += amt;
      services += svc;
      parts += prt;
    } else if (inv.paymentStatus === "unpaid") {
      pending += amt;
    } else if (inv.paymentStatus === "partial") {
      const p = Number(inv.paidAmount) || 0;
      revenue += p;
      pending += amt - p;
      services += svc * (p / (amt || 1));
      parts += prt * (p / (amt || 1));
    }
  }
  return { revenue, pending, services, parts };
}

export default function IncomeExpenseReportScreen() {
  const [tab, setTab] = useState("this_month");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (t = tab, refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const { dateFrom, dateTo } = getRange(t);
        const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, {
          params: { page: 1, limit: 500, dateFrom, dateTo },
        });
        setInvoices(res.data?.data?.invoices ?? []);
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab],
  );

  useFocusEffect(
    useCallback(() => {
      load(tab);
    }, [tab]),
  );

  const onTab = (k) => {
    setTab(k);
    load(k);
  };
  const sum = compute(invoices);
  const total = sum.services + sum.parts || 1;
  const sorted = [...invoices].sort(
    (a, b) => (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0),
  );

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Income & Expense" showBack transparent={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabsContent}
      >
        {DATE_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => onTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(tab, true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Metrics */}
          <View style={s.section}>
            <View style={s.metricsRow}>
              <View style={[s.metricCard, s.half]}>
                <View
                  style={[
                    s.metricIcon,
                    { backgroundColor: COLORS.successLight },
                  ]}
                >
                  <Ionicons
                    name="trending-up"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
                <Text style={s.metricVal}>₹{fmt(sum.revenue)}</Text>
                <Text style={s.metricLbl}>Revenue Collected</Text>
              </View>
              <View style={[s.metricCard, s.half]}>
                <View
                  style={[s.metricIcon, { backgroundColor: COLORS.errorLight }]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </View>
                <Text style={s.metricVal}>₹{fmt(sum.pending)}</Text>
                <Text style={s.metricLbl}>Pending Dues</Text>
              </View>
            </View>
            <View style={s.metricCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SIZES.sm,
                }}
              >
                <View
                  style={[
                    s.metricIcon,
                    { backgroundColor: COLORS.primaryLight },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={s.metricVal}>
                    ₹{fmt(sum.revenue + sum.pending)}
                  </Text>
                  <Text style={s.metricLbl}>
                    Total Billed · {invoices.length} invoices
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Revenue breakdown bars */}
          <View style={s.section}>
            <Text style={s.secTitle}>Revenue Breakdown</Text>
            <View style={s.card}>
              {[
                {
                  label: "Services",
                  value: sum.services,
                  color: COLORS.primary,
                },
                { label: "Parts", value: sum.parts, color: COLORS.secondary },
              ].map((b) => {
                const pct = ((b.value / total) * 100).toFixed(1);
                return (
                  <View key={b.label} style={s.barWrap}>
                    <View style={s.barHead}>
                      <Text style={s.barLabel}>{b.label}</Text>
                      <Text style={[s.barAmt, { color: b.color }]}>
                        ₹{fmt(b.value)}
                      </Text>
                    </View>
                    <View style={s.barTrack}>
                      <View
                        style={[
                          s.barFill,
                          { width: `${pct}%`, backgroundColor: b.color },
                        ]}
                      />
                    </View>
                    <Text style={s.barPct}>{pct}% of revenue</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Invoice list */}
          <View style={s.section}>
            <Text style={s.secTitle}>Invoices ({sorted.length})</Text>
            {sorted.length === 0 ? (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons
                  name="finance"
                  size={48}
                  color={COLORS.borderLight}
                />
                <Text style={s.emptyText}>No invoices for this period</Text>
              </View>
            ) : (
              <View style={s.card}>
                {sorted.map((inv, i) => {
                  const pc = PAY_CFG[inv.paymentStatus] ?? PAY_CFG.unpaid;
                  return (
                    <View
                      key={inv._id}
                      style={[
                        s.invRow,
                        i === sorted.length - 1 && s.invRowLast,
                      ]}
                    >
                      <View style={s.invLeft}>
                        <Text style={s.invNo}>{inv.invoiceNo ?? "—"}</Text>
                        <Text style={s.invCust} numberOfLines={1}>
                          {inv.customerId?.fullName ?? "—"}
                        </Text>
                        <Text style={s.invDate}>{fmtDate(inv.createdAt)}</Text>
                      </View>
                      <View style={s.invRight}>
                        <Text style={s.invAmt}>₹{fmt(inv.totalAmount)}</Text>
                        <View style={[s.badge, { backgroundColor: pc.bg }]}>
                          <Text style={[s.badgeText, { color: pc.color }]}>
                            {pc.label}
                          </Text>
                        </View>
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
  tabsContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    // marginBottom: 5,
    gap: SIZES.xs,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },
  scroll: { paddingBottom: 80 },
  section: {
    marginTop: 20,
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },
  secTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  metricsRow: { flexDirection: "row", gap: SIZES.sm, marginBottom: SIZES.sm },
  half: { flex: 1 },
  metricCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: 4,
    ...SHADOWS.sm,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricVal: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  metricLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  barWrap: { padding: SIZES.md },
  barHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  barLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  barAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  barTrack: {
    height: 10,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: SIZES.radiusFull, minWidth: 4 },
  barPct: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  invRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  invRowLast: { borderBottomWidth: 0 },
  invLeft: { flex: 1, gap: 2 },
  invNo: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  invCust: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  invDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  invRight: { alignItems: "flex-end", gap: 4 },
  invAmt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  badgeText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: SIZES.xxl,
    gap: SIZES.sm,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
  },
});
