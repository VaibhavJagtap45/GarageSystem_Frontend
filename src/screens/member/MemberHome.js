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
import { memberGetDashboard } from "../../api/portal";
import { inr } from "../../utils/portalHelpers";
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
export default function MemberHome({ navigation }) {
  const { user }   = useSelector((s) => s.auth);
  const doLogout   = useLogout();
  const tabBarH    = useBottomTabBarHeight();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

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
    { label: "Pending",     value: stats?.assignedCount,   icon: "time-outline",           color: "#f59e0b", bg: "#fef3c7" },
    { label: "In Progress", value: stats?.inProgressCount, icon: "construct-outline",      color: "#6366f1", bg: "#ede9fe" },
    { label: "Completed",   value: stats?.completedTotal,  icon: "checkmark-circle-outline",color: "#22c55e", bg: "#dcfce7" },
    { label: "Today",       value: stats?.completedToday,  icon: "today-outline",          color: "#0ea5e9", bg: "#e0f2fe" },
  ];

  const ACTIONS = [
    { label: "My Work",   icon: "hammer-outline",         color: COLORS.primary,  bg: COLORS.primaryLight, nav: "Work"      },
    { label: "Inventory", icon: "cube-outline",           color: "#6366f1",       bg: "#ede9fe",            nav: "Inventory" },
    { label: "History",   icon: "checkmark-done-outline", color: "#22c55e",       bg: "#dcfce7",            nav: "History"   },
    { label: "Profile",   icon: "person-outline",         color: "#f59e0b",       bg: "#fef3c7",            nav: "Profile"   },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
      >
        {/* ── Hero gradient header ── */}
        <LinearGradient
          colors={["#1a6b45", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroRow}>
            <View>
              <Text style={s.heroGreet}>Hello, {firstName} 👋</Text>
              <Text style={s.heroSub}>Here's your work summary</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={doLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Earnings pill inside hero */}
          <View style={s.earningsPill}>
            <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.earningsLbl}>Total Earnings</Text>
              <Text style={s.earningsAmt}>{inr(stats?.totalEarnings || 0)}</Text>
            </View>
            <View style={s.todayPill}>
              <Text style={s.todayTxt}>{stats?.completedToday ?? 0} today</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* ── Stats grid ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Overview</Text>
              <View style={s.statsGrid}>
                {STATS.map((st) => (
                  <StatCard key={st.label} {...st} />
                ))}
              </View>
            </View>

            {/* ── Quick actions ── */}
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

            {/* ── Order flow guide ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Order Flow</Text>
              <View style={s.flowCard}>
                {[
                  { label: "Assigned",   color: "#64748b", icon: "time-outline",             sub: "New job waiting" },
                  { label: "In Progress",color: "#6366f1", icon: "construct-outline",         sub: "Working on it" },
                  { label: "Ready",      color: "#f59e0b", icon: "car-outline",               sub: "Vehicle ready" },
                  { label: "Completed",  color: "#22c55e", icon: "checkmark-done-outline",    sub: "Job done" },
                ].map((step, i, arr) => (
                  <View key={step.label} style={[s.flowRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[s.flowDot, { backgroundColor: step.color + "22", borderColor: step.color + "44" }]}>
                      <Ionicons name={step.icon} size={14} color={step.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.flowLabel}>{step.label}</Text>
                      <Text style={s.flowSub}>{step.sub}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
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
  },
  heroRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroGreet: { fontFamily: FONTS.extrabold, fontSize: SIZES.textXl, color: COLORS.white },
  heroSub:   { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  // Earnings pill (inside hero)
  earningsPill: {
    flexDirection: "row", alignItems: "center", gap: SIZES.sm,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  earningsLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  earningsAmt: { fontFamily: FONTS.extrabold, fontSize: SIZES.textLg, color: COLORS.primary },
  todayPill:   {
    backgroundColor: COLORS.primaryLight, borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  todayTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.primary },

  // Sections
  section:      { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: SIZES.sm },

  // Stats grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  statCard: {
    width: "47.5%",
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
    width: 34, height: 34, borderRadius: SIZES.radiusSm,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  statVal: { fontFamily: FONTS.extrabold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  statLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

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
    width: 52, height: 52, borderRadius: SIZES.radiusMd,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },

  // Order flow
  flowCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.borderLight,
    overflow: "hidden", ...SHADOWS.sm,
  },
  flowRow: {
    flexDirection: "row", alignItems: "center",
    padding: SIZES.md, gap: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  flowDot: {
    width: 34, height: 34, borderRadius: SIZES.radiusSm,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  flowLabel: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  flowSub:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
});
