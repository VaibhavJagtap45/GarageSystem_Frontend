import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetGarageInfo, customerGetOrders } from "../../api/portal";
import { getMyBookings } from "../../api/booking";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import useLogout from "../../hooks/useLogout";

// ─── Helpers ────────────────────────────────────────────────────────────────
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function fmtScheduleChip(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "AM" : "PM";
  const h12 = hh % 12 || 12;
  const time = `${h12}:${mm} ${ampm}`;

  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${time}`;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, gradColors, index }) {
  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 4, delay: index * 70 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.statCard, { transform: [{ scale }], opacity }]}>
      <View style={[s.statAccent, { backgroundColor: color }]} />
      <View style={s.statBody}>
        <LinearGradient
          colors={gradColors || [color, color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.statIconGrad}
        >
          <Ionicons name={icon} size={16} color={COLORS.white} />
        </LinearGradient>
        <Text style={[s.statVal, { color }]}>{value ?? 0}</Text>
        <Text style={s.statLbl}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Quick Action tile ──────────────────────────────────────────────────────
function QuickAction({ label, sub, icon, color, bg, gradColors, onPress, index }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 70, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.quickCard, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={s.quickInner} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={gradColors || [color, color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.quickIconGrad}
        >
          <Ionicons name={icon} size={20} color={COLORS.white} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.quickLabel}>{label}</Text>
          {sub ? <Text style={s.quickSub}>{sub}</Text> : null}
        </View>
        <View style={[s.quickArrow, { backgroundColor: bg }]}>
          <Ionicons name="chevron-forward" size={12} color={color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function CustomerHome({ navigation }) {
  const { user } = useSelector((x) => x.auth);
  const doLogout = useLogout();
  const tabBarH  = useBottomTabBarHeight();

  const [garage, setGarage]     = useState(null);
  const [summary, setSummary]   = useState({ total: 0, active: 0, completed: 0, totalSpent: 0 });
  const [recent, setRecent]     = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const heroScale = useRef(new Animated.Value(0.97)).current;
  useEffect(() => {
    Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 3 }).start();
  }, []);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [g, o, b] = await Promise.allSettled([
        customerGetGarageInfo(),
        customerGetOrders({ limit: 4 }),
        getMyBookings(),
      ]);
      if (g.status === "fulfilled") setGarage(g.value?.data?.data?.garage ?? null);
      if (o.status === "fulfilled") {
        setSummary(o.value?.data?.data?.summary || {});
        setRecent(o.value?.data?.data?.orders || []);
      }
      if (b.status === "fulfilled") setBookings(b.value?.bookings || []);
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

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => ["pending", "confirmed"].includes(b.status))
      .filter((b) => !b.scheduledAt || new Date(b.scheduledAt).getTime() >= now - 24 * 3600 * 1000)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 3);
  }, [bookings]);

  const firstName = user?.fullName?.split(" ")[0] || "there";

  const STATS = [
    { label: "Total Orders", value: summary?.total,     icon: "car-outline",              color: "#3b82f6", gradColors: ["#2563eb", "#3b82f6"] },
    { label: "Active",       value: summary?.active,    icon: "construct-outline",        color: "#f59e0b", gradColors: ["#d97706", "#f59e0b"] },
    { label: "Completed",    value: summary?.completed, icon: "checkmark-circle-outline", color: "#22c55e", gradColors: ["#16a34a", "#22c55e"] },
  ];

  const ACTIONS = [
    { label: "Book service", sub: "Send a new request",    icon: "construct-outline",     color: "#3b82f6", bg: "#dbeafe", gradColors: ["#2563eb", "#3b82f6"], nav: () => navigation.navigate("Services") },
    { label: "Calendar",     sub: "See your schedule",     icon: "calendar-outline",      color: "#8b5cf6", bg: "#ede9fe", gradColors: ["#7c3aed", "#8b5cf6"], nav: () => navigation.navigate("CCalendar") },
    { label: "My bookings",  sub: "Manage appointments",   icon: "calendar-clear-outline",color: "#0ea5e9", bg: "#e0f2fe", gradColors: ["#0284c7", "#0ea5e9"], nav: () => navigation.navigate("CBookings") },
    { label: "My orders",    sub: "Track repair jobs",     icon: "car-sport-outline",     color: "#f59e0b", bg: "#fef3c7", gradColors: ["#d97706", "#f59e0b"], nav: () => navigation.navigate("Orders") },
    { label: "Invoices",     sub: "Billing & payments",    icon: "receipt-outline",       color: "#22c55e", bg: "#dcfce7", gradColors: ["#16a34a", "#22c55e"], nav: () => navigation.navigate("Invoices") },
    { label: "Profile",      sub: "Your garage portal",    icon: "person-circle-outline", color: "#ec4899", bg: "#fce7f3", gradColors: ["#db2777", "#ec4899"], nav: () => navigation.navigate("Profile") },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
      >
        {/* ── Hero gradient header ── */}
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={["#1d4ed8", "#3b82f6", "#60a5fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <View style={[s.heroDeco, { width: 170, height: 170, top: -50, right: -40 }]} />
            <View style={[s.heroDeco, { width: 90, height: 90, bottom: 20, left: -20 }]} />
            <View style={[s.heroDeco, { width: 38, height: 38, top: 40, right: 90, opacity: 0.15 }]} />

            <View style={s.heroRow}>
              <View style={s.heroLeft}>
                <View style={s.heroAvatarCircle}>
                  <Text style={s.heroAvatarInitial}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={s.heroEyebrow}>{greeting()}</Text>
                  <Text style={s.heroGreet} numberOfLines={1}>
                    {firstName}
                  </Text>
                </View>
              </View>
              <View style={s.heroActions}>
                <TouchableOpacity
                  style={s.heroIconBtn}
                  onPress={() => navigation.navigate("CCalendar")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.95)" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.heroIconBtn}
                  onPress={doLogout}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.95)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Spent pill */}
            <View style={s.spentPill}>
              <LinearGradient
                colors={["#2563eb", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.spentIconGrad}
              >
                <Ionicons name="wallet-outline" size={17} color={COLORS.white} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.spentLbl}>Total Spent</Text>
                <Text style={s.spentAmt}>{inr(summary?.totalSpent || 0)}</Text>
              </View>
              {garage?.garageName ? (
                <View style={s.garagePill}>
                  <Ionicons name="business-outline" size={11} color="#2563eb" />
                  <Text style={s.garagePillTxt} numberOfLines={1}>
                    {garage.garageName}
                  </Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionTitle}>Overview</Text>
                  <Text style={s.sectionSub}>Live status of your orders</Text>
                </View>
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveBadgeText}>Live</Text>
                </View>
              </View>
              <View style={s.statsGrid}>
                {STATS.map((st, i) => (
                  <StatCard key={st.label} {...st} index={i} />
                ))}
              </View>
            </View>

            {/* ── Upcoming bookings ── */}
            {upcomingBookings.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeaderRow}>
                  <View>
                    <Text style={s.sectionTitle}>Upcoming bookings</Text>
                    <Text style={s.sectionSub}>
                      {upcomingBookings.length} appointment{upcomingBookings.length === 1 ? "" : "s"} scheduled
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.seeAllBtn}
                    onPress={() => navigation.navigate("CBookings")}
                  >
                    <Text style={s.seeAll}>View all</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                  </TouchableOpacity>
                </View>

                {upcomingBookings.map((b) => {
                  const status = b.status;
                  const accent = status === "confirmed" ? "#0ea5e9" : "#f59e0b";
                  const label  = status === "confirmed" ? "Confirmed" : "Pending";
                  const bg     = status === "confirmed" ? "#e0f2fe" : "#fef3c7";
                  return (
                    <TouchableOpacity
                      key={b._id}
                      style={s.bookingCard}
                      onPress={() => navigation.navigate("CBookings")}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={[accent, accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.bookingIconWrap}
                      >
                        <Ionicons name="calendar" size={16} color={COLORS.white} />
                      </LinearGradient>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={s.bookingHeadRow}>
                          <Text style={s.bookingNo}>{b.bookingNo || "Booking"}</Text>
                          <View style={[s.bookingStatusPill, { backgroundColor: bg }]}>
                            <Text style={[s.bookingStatusTxt, { color: accent }]}>{label}</Text>
                          </View>
                        </View>
                        <Text style={s.bookingTime}>{fmtScheduleChip(b.scheduledAt)}</Text>
                        <View style={s.bookingServiceRow}>
                          <Ionicons name="construct-outline" size={11} color={COLORS.textMuted} />
                          <Text style={s.bookingService} numberOfLines={1}>
                            {b.serviceType || "General service"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── Quick Actions ── */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionTitle}>Quick actions</Text>
                  <Text style={s.sectionSub}>Jump to what you need</Text>
                </View>
              </View>
              <View style={s.quickGrid}>
                {ACTIONS.map((a, i) => (
                  <QuickAction
                    key={a.label}
                    {...a}
                    index={i}
                    onPress={a.nav}
                  />
                ))}
              </View>
            </View>

            {/* ── Garage info ── */}
            {garage && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Your garage</Text>
                <Text style={s.sectionSub}>Your service partner</Text>
                <View style={s.garageCard}>
                  <LinearGradient
                    colors={["#2563eb", "#3b82f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.garageIconGrad}
                  >
                    <Ionicons name="business" size={20} color={COLORS.white} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={s.garageNameText}>{garage.garageName}</Text>
                    {garage.garageAddress ? (
                      <Text style={s.garageAddr} numberOfLines={2}>{garage.garageAddress}</Text>
                    ) : null}
                    {garage.garageContactNumber ? (
                      <View style={s.garageRow}>
                        <View style={s.garagePhoneIcon}>
                          <Ionicons name="call" size={10} color="#3b82f6" />
                        </View>
                        <Text style={s.garagePhone}>{garage.garageContactNumber}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* ── Recent Orders ── */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionTitle}>Recent orders</Text>
                  <Text style={s.sectionSub}>Your latest service jobs</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Orders")}
                  style={s.seeAllBtn}
                >
                  <Text style={s.seeAll}>See all</Text>
                  <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              {recent.length === 0 ? (
                <View style={s.emptyBox}>
                  <View style={s.emptyIconWrap}>
                    <Ionicons name="car-outline" size={28} color={COLORS.textMuted} />
                  </View>
                  <Text style={s.emptyTxt}>No orders yet</Text>
                  <Text style={s.emptySub}>Start with a service booking.</Text>
                  <TouchableOpacity
                    style={s.emptyCta}
                    onPress={() => navigation.navigate("Services")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle-outline" size={14} color="#2563eb" />
                    <Text style={s.emptyCtaTxt}>Browse services</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                recent.map((o) => {
                  const accent =
                    o.status === "completed"     ? "#22c55e" :
                    o.status === "in_progress"   ? "#6366f1" :
                    o.status === "vehicle_ready" ? "#0ea5e9" :
                                                   "#f59e0b";
                  return (
                    <TouchableOpacity
                      key={o._id}
                      style={s.orderCard}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "COrderDetail",
                          params: { orderId: o._id },
                        })
                      }
                    >
                      <View style={[s.orderAccent, { backgroundColor: accent }]} />
                      <View style={s.orderBody}>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={s.orderNo}>{o.orderNo || "Order"}</Text>
                          <View style={s.orderRow}>
                            <View style={s.orderVehIcon}>
                              <Ionicons name="car" size={10} color={COLORS.textMuted} />
                            </View>
                            <Text style={s.orderVeh} numberOfLines={1}>
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
                          <View style={s.orderArrow}>
                            <Ionicons name="chevron-forward" size={12} color={COLORS.textMuted} />
                          </View>
                        </View>
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

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xxl + 8,
    gap: SIZES.lg,
    borderBottomLeftRadius: SIZES.radiusXl,
    borderBottomRightRadius: SIZES.radiusXl,
    position: "relative",
    overflow: "hidden",
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm + 2,
    flex: 1,
  },
  heroAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: {
    fontFamily: FONTS.extrabold,
    fontSize: 18,
    color: COLORS.white,
  },
  heroEyebrow: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroGreet: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Spent pill
  spentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.md,
  },
  spentIconGrad: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  spentLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  spentAmt: { fontFamily: FONTS.extrabold, fontSize: SIZES.textLg, color: "#1d4ed8", letterSpacing: -0.3 },
  garagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dbeafe",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 120,
  },
  garagePillTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: "#1d4ed8", flexShrink: 1 },

  // Sections
  section: { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.lg },
  sectionTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: SIZES.sm + 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  liveBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: "#16a34a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAll: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: "#3b82f6" },

  // Stats
  statsGrid: { flexDirection: "row", gap: SIZES.sm },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  statAccent: { height: 3 },
  statBody: {
    padding: SIZES.md,
    alignItems: "center",
    gap: 4,
  },
  statIconGrad: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  statVal: { fontFamily: FONTS.extrabold, fontSize: SIZES.textXl, letterSpacing: -0.3 },
  statLbl: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // Upcoming bookings card
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  bookingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  bookingHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  bookingStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  bookingStatusTxt: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bookingTime: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "#2563eb",
    marginTop: 2,
  },
  bookingServiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  bookingService: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  quickCard: {
    width: "48.5%",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  quickInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: SIZES.sm + 4,
  },
  quickIconGrad: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  quickLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  quickSub: {
    marginTop: 1,
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  quickArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Garage card
  garageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: SIZES.sm,
    ...SHADOWS.sm,
  },
  garageIconGrad: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  garageNameText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  garageAddr: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  garageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  garagePhoneIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  garagePhone: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: "#1d4ed8",
  },

  // Recent orders
  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm - 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTxt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  emptyCta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
  },
  emptyCtaTxt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: "#1d4ed8",
  },
  orderCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  orderAccent: { width: 4 },
  orderBody: {
    flex: 1,
    flexDirection: "row",
    padding: SIZES.md,
  },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderVehIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  orderNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
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
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: "#1d4ed8",
  },
  orderArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
});
