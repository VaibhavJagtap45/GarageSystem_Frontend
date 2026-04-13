import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetGarageInfo, customerGetOrders } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import useLogout from "../../hooks/useLogout";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <View style={[s.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statVal}>{value ?? 0}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ label, icon, color, bg, onPress }) {
  return (
    <TouchableOpacity style={s.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.quickIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CustomerHome({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const doLogout = useLogout();
  const tabBarH = useBottomTabBarHeight();

  const [garage, setGarage] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalSpent: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [g, o] = await Promise.all([
        customerGetGarageInfo().catch(() => null),
        customerGetOrders({ limit: 4 }),
      ]);
      if (g?.data?.data?.garage) setGarage(g.data.data.garage);
      if (o?.data?.data) {
        setSummary(o.data.data.summary || {});
        setRecent(o.data.data.orders || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const firstName = user?.fullName?.split(" ")[0] || "Customer";

  const STATS = [
    {
      label: "Total Orders",
      value: summary?.total,
      icon: "car-outline",
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      label: "Active",
      value: summary?.active,
      icon: "construct-outline",
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    {
      label: "Completed",
      value: summary?.completed,
      icon: "checkmark-circle-outline",
      color: "#22c55e",
      bg: "#dcfce7",
    },
  ];

  const ACTIONS = [
    {
      label: "Services",
      icon: "construct-outline",
      color: "#3b82f6",
      bg: "#dbeafe",
      nav: "Services",
    },
    {
      label: "My Orders",
      icon: "car-outline",
      color: "#f59e0b",
      bg: "#fef3c7",
      nav: "Orders",
    },
    {
      label: "Invoices",
      icon: "receipt-outline",
      color: "#22c55e",
      bg: "#dcfce7",
      nav: "Invoices",
    },
    {
      label: "Profile",
      icon: "person-outline",
      color: "#8b5cf6",
      bg: "#ede9fe",
      nav: "Profile",
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
      >
        {/* ── Hero gradient header ── */}
        <LinearGradient
          colors={["#1d4ed8", "#3b82f6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroRow}>
            <View>
              <Text style={s.heroGreet}>Hello, {firstName} 👋</Text>
              <Text style={s.heroSub}>Welcome to your garage portal</Text>
            </View>
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={doLogout}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>
          </View>

          {/* Spent pill inside hero */}
          <View style={s.spentPill}>
            <Ionicons name="wallet-outline" size={18} color="#3b82f6" />
            <View style={{ flex: 1 }}>
              <Text style={s.spentLbl}>Total Spent</Text>
              <Text style={s.spentAmt}>{inr(summary?.totalSpent || 0)}</Text>
            </View>
            {garage?.garageName ? (
              <View style={s.garagePill}>
                <Ionicons name="business-outline" size={11} color="#3b82f6" />
                <Text style={s.garagePillTxt} numberOfLines={1}>
                  {garage.garageName}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Overview</Text>
              <View style={s.statsGrid}>
                {STATS.map((st) => (
                  <StatCard key={st.label} {...st} />
                ))}
              </View>
            </View>

            {/* ── Quick Actions ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quick Actions</Text>
              <View style={s.quickGrid}>
                {ACTIONS.map((a) => (
                  <QuickAction
                    key={a.nav}
                    {...a}
                    onPress={() => navigation.navigate(a.nav)}
                  />
                ))}
              </View>
            </View>

            {/* ── Garage info ── */}
            {garage && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Your Garage</Text>
                <View style={s.garageCard}>
                  <View style={s.garageIconWrap}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#3b82f6"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.garageName}>{garage.garageName}</Text>
                    {garage.garageAddress ? (
                      <Text style={s.garageAddr}>{garage.garageAddress}</Text>
                    ) : null}
                    {garage.garageContactNumber ? (
                      <View style={s.garageRow}>
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color={COLORS.textMuted}
                        />
                        <Text style={s.garagePhone}>
                          {garage.garageContactNumber}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* ── Recent Orders ── */}
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recent Orders</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
                  <Text style={s.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {recent.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons
                    name="car-outline"
                    size={32}
                    color={COLORS.textMuted}
                  />
                  <Text style={s.emptyTxt}>No orders yet — book a service</Text>
                </View>
              ) : (
                recent.map((o) => {
                  const accent =
                    o.status === "completed"
                      ? "#22c55e"
                      : o.status === "in_progress"
                        ? "#6366f1"
                        : o.status === "vehicle_ready"
                          ? "#0ea5e9"
                          : "#f59e0b";
                  return (
                    <TouchableOpacity
                      key={o._id}
                      style={[s.orderCard, { borderLeftColor: accent }]}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "COrderDetail",
                          params: { orderId: o._id },
                        })
                      }
                    >
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={s.orderNo}>{o.orderNo || "Order"}</Text>
                        <View style={s.orderRow}>
                          <Ionicons
                            name="car-outline"
                            size={12}
                            color={COLORS.textMuted}
                          />
                          <Text style={s.orderVeh}>
                            {o.vehicleId?.vehicleBrand}{" "}
                            {o.vehicleId?.vehicleModel}
                            {o.vehicleId?.vehicleRegisterNo
                              ? `  ·  ${o.vehicleId.vehicleRegisterNo}`
                              : ""}
                          </Text>
                        </View>
                        <Text style={s.orderDate}>{fmtDate(o.createdAt)}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <Badge status={o.status} />
                        {o.totalAmount > 0 && (
                          <Text style={s.orderAmt}>{inr(o.totalAmount)}</Text>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={COLORS.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xxl + 8,
    gap: SIZES.lg,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroGreet: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXl,
    color: COLORS.white,
  },
  heroSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Spent pill (inside hero)
  spentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  spentLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  spentAmt: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: "#3b82f6",
  },
  garagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dbeafe",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 120,
  },
  garagePillTxt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "#3b82f6",
    flexShrink: 1,
  },

  // Sections
  section: { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.lg },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  seeAll: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: "#3b82f6",
  },

  // Stats
  statsGrid: { flexDirection: "row", gap: SIZES.sm },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statVal: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXl,
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  quickCard: {
    width: "47.5%",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: "center",
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  // Garage card
  garageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#dbeafe",
    ...SHADOWS.sm,
  },
  garageIconWrap: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  garageName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  garageAddr: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  garageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  garagePhone: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },

  // Recent orders
  emptyBox: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTxt: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  orderCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  orderVeh: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  orderDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  orderAmt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: "#3b82f6",
  },
});
