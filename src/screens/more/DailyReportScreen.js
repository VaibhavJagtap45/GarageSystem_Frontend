import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, INVOICE_ENDPOINTS, REPAIR_ORDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const STATUS_CFG = {
  created:       { label: "Created",   color: COLORS.primary,   bg: COLORS.primaryLight  },
  in_progress:   { label: "WIP",       color: "#BA7517",        bg: "#FFFBEB"             },
  vehicle_ready: { label: "Ready",     color: COLORS.success,   bg: COLORS.successLight  },
  completed:     { label: "Completed", color: COLORS.success,   bg: COLORS.successLight  },
  cancelled:     { label: "Cancelled", color: COLORS.error,     bg: COLORS.errorLight    },
};

function fmt(n) { return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtTime(d) { if (!d) return "—"; return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }); }

function StatCard({ icon, iconLib, iconColor, bgColor, value, label }) {
  const Icon = iconLib === "mci" ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

export default function DailyReportScreen() {
  const [orders, setOrders]     = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    const today = new Date();
    const dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const dateTo   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    try {
      const [ordRes, invRes] = await Promise.all([
        axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, { params: { page: 1, limit: 100, dateFrom, dateTo } }).catch(() => null),
        axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { page: 1, limit: 100, dateFrom, dateTo } }).catch(() => null),
      ]);
      setOrders(ordRes?.data?.data?.orders ?? []);
      setInvoices(invRes?.data?.data?.invoices ?? []);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const completedToday = orders.filter((o) => o.status === "completed" || o.status === "vehicle_ready").length;
  const revenue = invoices.filter((i) => i.paymentStatus === "paid").reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const outstanding = invoices.filter((i) => i.paymentStatus !== "paid").reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav
        title="Daily Report"
        showBack
        transparent={false}
        rightElement={
          <TouchableOpacity onPress={() => load(true)} style={{ padding: 4 }}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Date banner */}
          <View style={s.dateBanner}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={s.dateText}>{todayLabel}</Text>
          </View>

          {/* Stats grid */}
          <View style={s.section}>
            <View style={s.statsGrid}>
              <StatCard icon="document-text-outline" iconLib="ion" iconColor={COLORS.primary} bgColor={COLORS.primaryLight} value={orders.length} label="Jobs Created" />
              <StatCard icon="checkmark-circle-outline" iconLib="ion" iconColor={COLORS.success} bgColor={COLORS.successLight} value={completedToday} label="Completed" />
              <StatCard icon="cash-outline" iconLib="ion" iconColor={COLORS.success} bgColor={COLORS.successLight} value={`₹${fmt(revenue)}`} label="Revenue" />
              <StatCard icon="alert-circle-outline" iconLib="ion" iconColor={COLORS.error} bgColor={COLORS.errorLight} value={`₹${fmt(outstanding)}`} label="Outstanding" />
            </View>
          </View>

          {/* Today's Repair Orders */}
          <View style={s.section}>
            <Text style={s.secTitle}>Today's Repair Orders ({orders.length})</Text>
            {orders.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="document-outline" size={40} color={COLORS.borderLight} />
                <Text style={s.emptyText}>No repair orders today</Text>
              </View>
            ) : (
              <View style={s.card}>
                {orders.map((o, i) => {
                  const cfg = STATUS_CFG[o.status] ?? STATUS_CFG.created;
                  return (
                    <View key={o._id} style={[s.row, i === orders.length - 1 && s.rowLast]}>
                      <View style={s.rowLeft}>
                        <Text style={s.rowPrimary}>{o.orderNo ?? "—"}</Text>
                        <Text style={s.rowSub} numberOfLines={1}>{o.customerId?.fullName ?? "—"} · {o.vehicleId?.vehicleRegisterNo ?? ""}</Text>
                        <Text style={s.rowTime}>{fmtTime(o.createdAt)}</Text>
                      </View>
                      <View style={s.rowRight}>
                        <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                          <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={s.rowAmt}>₹{fmt(o.totalAmount)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Today's Invoices */}
          <View style={s.section}>
            <Text style={s.secTitle}>Today's Invoices ({invoices.length})</Text>
            {invoices.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="receipt-outline" size={40} color={COLORS.borderLight} />
                <Text style={s.emptyText}>No invoices today</Text>
              </View>
            ) : (
              <View style={s.card}>
                {invoices.map((inv, i) => {
                  const isPaid = inv.paymentStatus === "paid";
                  return (
                    <View key={inv._id} style={[s.row, i === invoices.length - 1 && s.rowLast]}>
                      <View style={s.rowLeft}>
                        <Text style={s.rowPrimary}>{inv.invoiceNo ?? "—"}</Text>
                        <Text style={s.rowSub} numberOfLines={1}>{inv.customerId?.fullName ?? "—"}</Text>
                        <Text style={s.rowTime}>{fmtTime(inv.createdAt)}</Text>
                      </View>
                      <View style={s.rowRight}>
                        <View style={[s.badge, { backgroundColor: isPaid ? COLORS.successLight : COLORS.errorLight }]}>
                          <Text style={[s.badgeText, { color: isPaid ? COLORS.success : COLORS.error }]}>{isPaid ? "Paid" : "Unpaid"}</Text>
                        </View>
                        <Text style={s.rowAmt}>₹{fmt(inv.totalAmount)}</Text>
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
  scroll: { paddingBottom: 80 },
  section: { paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },
  secTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  card: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm },
  dateBanner: { flexDirection: "row", alignItems: "center", gap: SIZES.xs, paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, backgroundColor: COLORS.primaryLight, marginBottom: SIZES.md },
  dateText: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.primary },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, alignItems: "flex-start", gap: 3, ...SHADOWS.sm },
  statIcon: { width: 38, height: 38, borderRadius: SIZES.radiusMd, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statVal: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  statLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.sm },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flex: 1, gap: 2 },
  rowPrimary: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  rowSub: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  rowTime: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  rowRight: { alignItems: "flex-end", gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  badgeText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  rowAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
