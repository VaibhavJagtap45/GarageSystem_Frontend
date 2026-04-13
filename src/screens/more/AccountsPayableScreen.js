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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPORTS_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const TABS = [
  { key: "vendors",   label: "Vendors" },
  { key: "customers", label: "Customers" },
];

function fmt(n) {
  if (!n) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function SummaryBar({ vendorTotal, customerTotal, grandTotal }) {
  return (
    <View style={s.summaryBar}>
      <View style={s.summaryItem}>
        <Text style={s.summaryLbl}>Vendor Dues</Text>
        <Text style={[s.summaryVal, { color: COLORS.error }]}>₹{fmt(vendorTotal)}</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryLbl}>Customer Dues</Text>
        <Text style={[s.summaryVal, { color: COLORS.warning }]}>₹{fmt(customerTotal)}</Text>
      </View>
      <View style={s.summaryDivider} />
      <View style={s.summaryItem}>
        <Text style={s.summaryLbl}>Grand Total</Text>
        <Text style={[s.summaryVal, { color: COLORS.textPrimary }]}>₹{fmt(grandTotal)}</Text>
      </View>
    </View>
  );
}

function VendorRow({ item, isLast }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[s.row, isLast && s.rowLast]}>
      <TouchableOpacity
        style={s.rowMain}
        activeOpacity={0.7}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={[s.rowIcon, { backgroundColor: COLORS.errorLight }]}>
          <MaterialCommunityIcons name="store-outline" size={18} color={COLORS.error} />
        </View>
        <View style={s.rowContent}>
          <Text style={s.rowName}>{item.vendorName}</Text>
          {item.phoneNo ? (
            <Text style={s.rowSub}>{item.phoneNo}</Text>
          ) : null}
          <Text style={s.rowMeta}>{item.orderCount} order{item.orderCount !== 1 ? "s" : ""} pending</Text>
        </View>
        <View style={s.rowRight}>
          <Text style={[s.rowAmt, { color: COLORS.error }]}>₹{fmt(item.totalDue)}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={s.subList}>
          {item.orders.map((o, i) => (
            <View key={o._id ?? i} style={s.subRow}>
              <Text style={s.subNo}>{o.orderNo ?? "—"}</Text>
              <View style={[s.statusChip, { backgroundColor: o.status === "sent" ? "#FFFBEB" : COLORS.bgSection }]}>
                <Text style={[s.statusChipText, { color: o.status === "sent" ? "#BA7517" : COLORS.textMuted }]}>
                  {o.status}
                </Text>
              </View>
              <Text style={s.subAmt}>₹{fmt(o.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CustomerRow({ item, isLast }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[s.row, isLast && s.rowLast]}>
      <TouchableOpacity
        style={s.rowMain}
        activeOpacity={0.7}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={[s.rowIcon, { backgroundColor: "#FFFBEB" }]}>
          <MaterialCommunityIcons name="account-outline" size={18} color="#BA7517" />
        </View>
        <View style={s.rowContent}>
          <Text style={s.rowName}>{item.customerName}</Text>
          {item.phoneNo ? (
            <Text style={s.rowSub}>{item.phoneNo}</Text>
          ) : null}
          <Text style={s.rowMeta}>{item.invoiceCount} invoice{item.invoiceCount !== 1 ? "s" : ""} pending</Text>
        </View>
        <View style={s.rowRight}>
          <Text style={[s.rowAmt, { color: "#BA7517" }]}>₹{fmt(item.totalDue)}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={s.subList}>
          {item.invoices.map((inv, i) => (
            <View key={inv._id ?? i} style={s.subRow}>
              <Text style={s.subNo}>{inv.invoiceNo ?? "—"}</Text>
              <View style={[
                s.statusChip,
                { backgroundColor: inv.paymentStatus === "partial" ? "#FFFBEB" : COLORS.errorLight },
              ]}>
                <Text style={[
                  s.statusChipText,
                  { color: inv.paymentStatus === "partial" ? "#BA7517" : COLORS.error },
                ]}>
                  {inv.paymentStatus}
                </Text>
              </View>
              <Text style={s.subAmt}>₹{fmt(inv.balanceDue)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AccountsPayableScreen() {
  const [tab, setTab] = useState("vendors");
  const [data, setData] = useState({ vendors: [], customers: [], vendorTotal: 0, customerTotal: 0, grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axiosClient.get(REPORTS_ENDPOINTS.ACCOUNTS_PAYABLE);
      const d = res.data?.data ?? {};
      setData({
        vendors:       d.vendors       ?? [],
        customers:     d.customers     ?? [],
        vendorTotal:   d.vendorTotal   ?? 0,
        customerTotal: d.customerTotal ?? 0,
        grandTotal:    d.grandTotal    ?? 0,
      });
    } catch {
      setData({ vendors: [], customers: [], vendorTotal: 0, customerTotal: 0, grandTotal: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = tab === "vendors" ? data.vendors : data.customers;
  const empty = tab === "vendors" ? "No vendor dues outstanding" : "No customer dues outstanding";

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Accounts Payable" showBack transparent={false} />

      {/* Summary */}
      {!loading && (
        <SummaryBar
          vendorTotal={data.vendorTotal}
          customerTotal={data.customerTotal}
          grandTotal={data.grandTotal}
        />
      )}

      {/* Tabs */}
      <View style={s.tabsWrapper}>
        <View style={s.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, tab === t.key && s.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.tabsSep} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.section}>
            {list.length === 0 ? (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={COLORS.success} />
                <Text style={s.emptyText}>{empty}</Text>
              </View>
            ) : (
              <View style={s.card}>
                {list.map((item, i) =>
                  tab === "vendors" ? (
                    <VendorRow key={item.vendorId ?? i} item={item} isLast={i === list.length - 1} />
                  ) : (
                    <CustomerRow key={item.customerId ?? i} item={item} isLast={i === list.length - 1} />
                  )
                )}
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

  summaryBar: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginVertical: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: SIZES.md },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight, marginVertical: SIZES.sm },
  summaryLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  summaryVal: { fontFamily: FONTS.bold, fontSize: SIZES.textMd },

  tabsWrapper: { flexGrow: 0, flexShrink: 0, backgroundColor: COLORS.bg },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  tabsSep: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.xs },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  scroll: { paddingBottom: 80 },
  section: { marginTop: SIZES.md, paddingHorizontal: SIZES.screenPadding },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },

  row: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowLast: { borderBottomWidth: 0 },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    gap: SIZES.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowName: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  rowSub:  { fontFamily: FONTS.regular,  fontSize: SIZES.textSm,   color: COLORS.textSecondary },
  rowMeta: { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowAmt:  { fontFamily: FONTS.bold,     fontSize: SIZES.textBase },

  subList: {
    backgroundColor: COLORS.bgSection,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: SIZES.xs,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingVertical: 3,
  },
  subNo: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1 },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  statusChipText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  subAmt: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});
