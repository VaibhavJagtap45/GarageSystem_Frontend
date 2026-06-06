import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetInvoices } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";

const PAYMENT_THEME = {
  paid:           { color: "#22c55e", bg: "#dcfce7", label: "Paid" },
  unpaid:         { color: "#ef4444", bg: "#fee2e2", label: "Unpaid" },
  partially_paid: { color: "#f59e0b", bg: "#fef3c7", label: "Partial" },
};

const FILTERS = [
  { key: "all",            label: "All",     icon: "layers-outline" },
  { key: "paid",           label: "Paid",    icon: "checkmark-circle-outline" },
  { key: "unpaid",         label: "Unpaid",  icon: "alert-circle-outline" },
  { key: "partially_paid", label: "Partial", icon: "time-outline" },
];

export default function CustomerInvoices({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const r = await customerGetInvoices();
      setInvoices(r.data?.data?.invoices || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.paymentStatus === "paid");
    const unpaid = invoices.filter((i) => i.paymentStatus === "unpaid");
    const partial = invoices.filter((i) => i.paymentStatus === "partially_paid");

    const totalBilled = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalDue =
      unpaid.reduce((s, i) => s + (i.totalAmount || 0), 0) +
      partial.reduce((s, i) => s + ((i.totalAmount || 0) - (i.paidAmount || 0)), 0);

    return {
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      partialCount: partial.length,
      totalBilled,
      totalDue,
    };
  }, [invoices]);

  const visible = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.paymentStatus === filter);
  }, [invoices, filter]);

  const renderItem = ({ item: inv }) => {
    const theme = PAYMENT_THEME[inv.paymentStatus] ?? {
      color: "#3b82f6",
      bg: "#dbeafe",
      label: inv.paymentStatus,
    };
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() =>
          navigation.navigate("CInvoiceDetail", { invoiceId: inv._id })
        }
        activeOpacity={0.85}
      >
        <View style={[s.cardAccent, { backgroundColor: theme.color }]} />

        <View style={s.cardBody}>
          <View style={s.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardNo}>{inv.invoiceNo || "Invoice"}</Text>
              <Text style={s.cardDate}>{fmtDate(inv.createdAt)}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: theme.bg }]}>
              <View style={[s.statusDot, { backgroundColor: theme.color }]} />
              <Text style={[s.statusTxt, { color: theme.color }]}>
                {theme.label}
              </Text>
            </View>
          </View>

          <View style={s.cardInfoRow}>
            <View style={s.iconPill}>
              <Ionicons name="car-outline" size={11} color="#2563eb" />
            </View>
            <Text style={s.cardInfoTxt} numberOfLines={1}>
              {inv.vehicleId?.vehicleBrand} {inv.vehicleId?.vehicleModel}
              {inv.vehicleId?.vehicleRegisterNo
                ? `  ·  ${inv.vehicleId.vehicleRegisterNo}`
                : ""}
            </Text>
          </View>

          {inv.repairOrderId?.orderNo ? (
            <View style={s.cardInfoRow}>
              <View style={[s.iconPill, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="document-text-outline" size={11} color="#d97706" />
              </View>
              <Text style={s.cardInfoTxt} numberOfLines={1}>
                Order {inv.repairOrderId.orderNo}
              </Text>
            </View>
          ) : null}

          <View style={s.cardFoot}>
            <Text style={s.amountLbl}>Total</Text>
            <Text style={s.amountVal}>{inr(inv.totalAmount)}</Text>
            <View style={s.viewPill}>
              <Text style={s.viewPillTxt}>View</Text>
              <Ionicons name="chevron-forward" size={12} color="#1d4ed8" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <NavBar title="My Invoices" subtitle={`${invoices.length} total`} />

      <FlatList
        data={visible}
        keyExtractor={(inv) => inv._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: tabBarH + 24,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <LinearGradient
              colors={["#1d4ed8", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              <View style={[s.heroDeco, { width: 160, height: 160, top: -40, right: -30 }]} />
              <View style={[s.heroDeco, { width: 80, height: 80, bottom: -20, left: -10 }]} />

              <View style={s.heroRow}>
                <View style={s.heroIconWrap}>
                  <Ionicons name="receipt" size={20} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroEyebrow}>Billing overview</Text>
                  <Text style={s.heroTitle}>All your invoices</Text>
                </View>
              </View>

              <View style={s.heroStatsRow}>
                <View style={s.heroStatCard}>
                  <Text style={s.heroStatVal}>{inr(stats.totalBilled)}</Text>
                  <Text style={s.heroStatLbl}>Total billed</Text>
                </View>
                <View style={s.heroStatCard}>
                  <Text style={[s.heroStatVal, { color: "#fde68a" }]}>
                    {inr(stats.totalDue)}
                  </Text>
                  <Text style={s.heroStatLbl}>Amount due</Text>
                </View>
              </View>

              <View style={s.heroCountRow}>
                <View style={s.heroCountItem}>
                  <View style={[s.heroCountDot, { backgroundColor: "#22c55e" }]} />
                  <Text style={s.heroCountLbl}>
                    {stats.paidCount} paid
                  </Text>
                </View>
                <View style={s.heroCountItem}>
                  <View style={[s.heroCountDot, { backgroundColor: "#f59e0b" }]} />
                  <Text style={s.heroCountLbl}>
                    {stats.partialCount} partial
                  </Text>
                </View>
                <View style={s.heroCountItem}>
                  <View style={[s.heroCountDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={s.heroCountLbl}>
                    {stats.unpaidCount} unpaid
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Filters */}
            <View style={s.filtersWrap}>
              <Text style={s.sectionTitle}>Filter by status</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: SIZES.screenPadding }}
                style={{ marginHorizontal: -SIZES.screenPadding, paddingLeft: SIZES.screenPadding, marginTop: 8 }}
              >
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[s.chip, active && s.chipOn]}
                      onPress={() => setFilter(f.key)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={f.icon}
                        size={13}
                        color={active ? COLORS.white : COLORS.textMuted}
                      />
                      <Text style={[s.chipTxt, active && s.chipTxtOn]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Section header */}
            <View style={s.listHeadRow}>
              <Text style={s.sectionTitle}>Invoices</Text>
              <Text style={s.sectionSub}>
                {visible.length} result{visible.length === 1 ? "" : "s"}
              </Text>
            </View>
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
          ) : (
            <View style={{ paddingHorizontal: SIZES.screenPadding, marginTop: 24 }}>
              <Empty
                icon="receipt-outline"
                title={filter === "all" ? "No invoices yet" : "No matching invoices"}
                sub={
                  filter === "all"
                    ? "Invoices appear after service completion."
                    : "Try a different filter."
                }
                actionLabel={filter === "all" ? "View orders" : "Show all"}
                onAction={() =>
                  filter === "all" ? navigation.navigate("Orders") : setFilter("all")
                }
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEyebrow: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: "rgba(255,255,255,0.76)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 2,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: SIZES.md,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 12,
  },
  heroStatVal: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  heroStatLbl: {
    marginTop: 3,
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.78)",
  },
  heroCountRow: {
    flexDirection: "row",
    gap: SIZES.sm + 4,
    marginTop: SIZES.sm + 2,
  },
  heroCountItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroCountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroCountLbl: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.88)",
  },

  // Filter chips
  filtersWrap: {
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  sectionSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },
  chipOn: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  chipTxt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  chipTxtOn: {
    color: COLORS.white,
  },

  listHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },

  // Card
  card: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: SIZES.md,
    gap: 7,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardNo: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  cardDate: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfoTxt: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amountLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  amountVal: {
    flex: 1,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: "#1d4ed8",
  },
  viewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#dbeafe",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  viewPillTxt: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    color: "#1d4ed8",
  },
});
