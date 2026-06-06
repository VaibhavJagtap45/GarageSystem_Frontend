import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { memberGetDashboard } from "../../api/portal";
import { inr } from "../../utils/portalHelpers";
import useLogout from "../../hooks/useLogout";

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg, index }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 4, delay: index * 70 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.statCard, { transform: [{ scale }], opacity }]}>
      {/* Top accent */}
      <View style={[s.statAccent, { backgroundColor: color }]} />
      <View style={s.statBody}>
        <View style={[s.statIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={s.statVal}>{value ?? 0}</Text>
        <Text style={s.statLbl}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ label, icon, color, bg, gradColors, onPress, index }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.quickCard, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={s.quickInner} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradColors || [color, color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.quickIconGrad}
        >
          <Ionicons name={icon} size={22} color={COLORS.white} />
        </LinearGradient>
        <Text style={s.quickLabel}>{label}</Text>
        <View style={[s.quickArrow, { backgroundColor: bg }]}>
          <Ionicons name="chevron-forward" size={12} color={color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function MemberHome({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const doLogout = useLogout();
  const tabBarH = useBottomTabBarHeight();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const heroScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 3 }).start();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await memberGetDashboard();
      setStats(r.data?.data);
    } catch {
      setStats({ assignedCount: 0, inProgressCount: 0, completedTotal: 0, completedToday: 0, totalEarnings: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const firstName = user?.fullName?.split(" ")[0] || "Mechanic";

  const STATS = [
    { label: "Pending",     value: stats?.assignedCount,    icon: "time-outline",            color: "#f59e0b", bg: "#fef3c7" },
    { label: "In Progress", value: stats?.inProgressCount,  icon: "construct-outline",       color: "#6366f1", bg: "#ede9fe" },
    { label: "Completed",   value: stats?.completedTotal,   icon: "checkmark-circle-outline",color: "#22c55e", bg: "#dcfce7" },
    { label: "Today",       value: stats?.completedToday,   icon: "today-outline",           color: "#0ea5e9", bg: "#e0f2fe" },
  ];

  const ACTIONS = [
    { label: "My Work",   icon: "hammer-outline",         color: COLORS.primary, bg: COLORS.primaryLight, gradColors: [COLORS.primaryDark, COLORS.primary], nav: "Work" },
    { label: "Inventory", icon: "cube-outline",           color: "#6366f1",      bg: "#ede9fe",            gradColors: ["#4f46e5", "#6366f1"],                nav: "Inventory" },
    { label: "History",   icon: "checkmark-done-outline", color: "#22c55e",      bg: "#dcfce7",            gradColors: ["#16a34a", "#22c55e"],                nav: "History" },
    { label: "Profile",   icon: "person-outline",         color: "#f59e0b",      bg: "#fef3c7",            gradColors: ["#d97706", "#f59e0b"],                nav: "Profile" },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a6b45" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
      >
        {/* ── Hero gradient header ── */}
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={["#1a6b45", "#22c55e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            {/* Decorative circles */}
            <View style={[s.heroDeco, { width: 150, height: 150, top: -40, right: -30 }]} />
            <View style={[s.heroDeco, { width: 80, height: 80, bottom: 10, left: -20 }]} />

            <View style={s.heroRow}>
              <View style={s.heroLeft}>
                <View style={s.heroAvatarCircle}>
                  <Ionicons name="person" size={18} color="rgba(255,255,255,0.8)" />
                </View>
                <View>
                  <Text style={s.heroGreet}>Hello, {firstName} 👋</Text>
                  <Text style={s.heroSub}>Here's your work summary</Text>
                </View>
              </View>
              <TouchableOpacity style={s.logoutBtn} onPress={doLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>

            {/* Earnings pill inside hero */}
            <View style={s.earningsPill}>
              <LinearGradient
                colors={["#16a34a", "#22c55e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.earningsIconGrad}
              >
                <Ionicons name="wallet-outline" size={16} color={COLORS.white} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.earningsLbl}>Total Earnings</Text>
                <Text style={s.earningsAmt}>{inr(stats?.totalEarnings || 0)}</Text>
              </View>
              <View style={s.todayPill}>
                <Ionicons name="flash" size={10} color="#16a34a" />
                <Text style={s.todayTxt}>{stats?.completedToday ?? 0} today</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* ── Stats grid ── */}
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Overview</Text>
                <View style={s.sectionBadge}>
                  <Text style={s.sectionBadgeText}>Live</Text>
                </View>
              </View>
              <View style={s.statsGrid}>
                {STATS.map((st, i) => (
                  <StatCard key={st.label} {...st} index={i} />
                ))}
              </View>
            </View>

            {/* ── Quick actions ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quick Actions</Text>
              <View style={s.quickGrid}>
                {ACTIONS.map((a, i) => (
                  <QuickAction
                    key={a.nav}
                    {...a}
                    index={i}
                    onPress={() => navigation.navigate(a.nav)}
                  />
                ))}
              </View>
            </View>

            {/* ── Order flow guide ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Order Flow</Text>
              <View style={s.flowCard}>
                {[
                  { label: "Assigned",    color: "#64748b", icon: "time-outline",          sub: "New job waiting",  gradColors: ["#475569", "#64748b"] },
                  { label: "In Progress", color: "#6366f1", icon: "construct-outline",     sub: "Working on it",    gradColors: ["#4f46e5", "#6366f1"] },
                  { label: "Ready",       color: "#f59e0b", icon: "car-outline",           sub: "Vehicle ready",    gradColors: ["#d97706", "#f59e0b"] },
                  { label: "Completed",   color: "#22c55e", icon: "checkmark-done-outline",sub: "Job done",         gradColors: ["#16a34a", "#22c55e"] },
                ].map((step, i, arr) => (
                  <View key={step.label} style={[s.flowRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <LinearGradient
                      colors={step.gradColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.flowDotGrad}
                    >
                      <Ionicons name={step.icon} size={14} color={COLORS.white} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.flowLabel}>{step.label}</Text>
                      <Text style={s.flowSub}>{step.sub}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={s.flowArrow}>
                        <Ionicons name="chevron-forward" size={12} color={COLORS.textMuted} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
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
  },
  heroAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroGreet: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  heroSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Earnings pill
  earningsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.md,
  },
  earningsIconGrad: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  earningsLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  earningsAmt: { fontFamily: FONTS.extrabold, fontSize: SIZES.textLg, color: "#16a34a", letterSpacing: -0.3 },
  todayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  todayTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: "#16a34a" },

  // Sections
  section: { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.lg },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
    letterSpacing: -0.1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.sm,
  },
  sectionBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  sectionBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: "#16a34a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Stats grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  statCard: {
    width: "47.5%",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  statAccent: {
    height: 3,
  },
  statBody: {
    padding: SIZES.md,
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statVal: { fontFamily: FONTS.extrabold, fontSize: SIZES.textXl, color: COLORS.textPrimary, letterSpacing: -0.3 },
  statLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  quickCard: {
    width: "47.5%",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  quickInner: {
    padding: SIZES.md,
    alignItems: "center",
    gap: SIZES.sm,
  },
  quickIconGrad: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  quickLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  quickArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Order flow
  flowCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.md,
    gap: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  flowDotGrad: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  flowLabel: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  flowSub: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  flowArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
});
