import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { usePreferences, useFontSizes } from "../../context/PreferencesContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  REPAIR_ORDER_ENDPOINTS,
  INVOICE_ENDPOINTS,
} from "../../utils/constants";
import Badge from "../../components/ui/Badge";
import axiosClient from "../../api/axios";

const QUICK_ACTIONS = [
  {
    id: "repair",
    title: "Create Repair Order",
    subtitle: "Open a new job card in seconds",
    icon: "file-document-edit-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    gradColors: [COLORS.primaryDark, COLORS.primary],
    onPress: (nav) => nav.navigate("CustomerRepairOrder"),
  },
  {
    id: "invoice",
    title: "Create Invoice",
    subtitle: "Direct parts or service billing",
    icon: "cart-plus",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
    gradColors: ["#BA7517", "#D9940A"],
    onPress: (nav) => nav.navigate("CounterSale"),
  },
];

const STATUS_CARD_TEMPLATES = [
  {
    id: "open",
    title: "Open",
    subtitle: "Repair order created",
    icon: "inbox-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("Orders", { initialTab: "CREATED" }),
  },
  {
    id: "wip",
    title: "WIP",
    subtitle: "Work in progress",
    icon: "progress-clock",
    accent: "#BA7517",
    accentSoft: "#FFFBEB",
    onPress: (nav) => nav.navigate("Orders", { initialTab: "IN_PROGRESS" }),
  },
  {
    id: "ready",
    title: "Ready",
    subtitle: "Vehicle ready",
    icon: "clipboard-check-outline",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("Orders", { initialTab: "VEHICLE_READY" }),
  },
  {
    id: "due",
    title: "Payment Due",
    subtitle: "Unpaid & partial invoices",
    icon: "wallet-outline",
    accent: COLORS.error,
    accentSoft: COLORS.errorLight,
    onPress: (nav) => nav.navigate("PaymentDue"),
  },
];

function formatTodayLabel() {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function SectionHeader({ title, actionLabel, onAction, fs }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionTitle, { fontSize: fs.textMd }]}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          style={s.sectionActionBtn}
          activeOpacity={0.7}
        >
          <Text style={[s.sectionAction, { fontSize: fs.textSm }]}>
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActionRow({ item, navigation, fs, index }) {
  const translateX = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();

  const handlePressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

  return (
    <Animated.View
      style={{ transform: [{ translateX }, { scale: pressScale }], opacity }}
    >
      <TouchableOpacity
        style={s.actionRow}
        activeOpacity={0.85}
        onPress={() => item.onPress(navigation)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={item.title}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={item.gradColors || [item.accent, item.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.actionIconGrad}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={COLORS.white}
          />
        </LinearGradient>
        <View style={s.actionContent}>
          <Text style={[s.actionTitle, { fontSize: fs.textBase }]}>
            {item.title}
          </Text>
          <Text style={[s.actionSub, { fontSize: fs.textSm }]}>
            {item.subtitle}
          </Text>
        </View>
        <View style={[s.actionArrow, { backgroundColor: item.accentSoft }]}>
          <Ionicons name="chevron-forward" size={16} color={item.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({ card, navigation, fs, index }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
        delay: index * 60,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();

  const handlePressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

  return (
    <Animated.View
      style={[
        s.statCard,
        {
          transform: [{ scale: Animated.multiply(scale, pressScale) }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={s.statInner}
        activeOpacity={0.85}
        onPress={() => card.onPress(navigation)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={card.title}
        accessibilityRole="button"
      >
        <View style={s.statTop}>
          <View style={[s.statIcon, { backgroundColor: card.accentSoft }]}>
            <MaterialCommunityIcons
              name={card.icon}
              size={22}
              color={card.accent}
            />
          </View>
          <Text
            style={[s.statCount, { color: card.accent, fontSize: fs.textXl }]}
            numberOfLines={1}
          >
            {card.count}
          </Text>
        </View>
        <Text style={[s.statTitle, { fontSize: fs.textBase }]}>
          {card.title}
        </Text>
        <Text style={[s.statSub, { fontSize: fs.textXs }]} numberOfLines={1}>
          {card.subtitle}
        </Text>
        {card.helper ? (
          <View
            style={[s.statHelperWrap, { backgroundColor: card.accentSoft }]}
          >
            <Ionicons name="cash-outline" size={11} color={card.accent} />
            <Text
              style={[
                s.statHelper,
                { color: card.accent, fontSize: fs.textXs },
              ]}
              numberOfLines={1}
            >
              {card.helper}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const INITIAL_STATS = { open: 0, wip: 0, ready: 0, due: 0, dueAmount: 0 };

export default function ServiceScreen() {
  const navigation = useNavigation();
  const { notify } = usePreferences();
  const fs = useFontSizes();
  const [stats, setStats] = useState(INITIAL_STATS);

  const heroScale = useRef(new Animated.Value(0.95)).current;
  const livePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(heroScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 10,
      bounciness: 3,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const todayLabel = formatTodayLabel();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const [createdRes, wipRes, readyRes, dueRes, invoiceStatsRes] =
        await Promise.allSettled([
          axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, {
            params: { status: "created", limit: 1 },
          }),
          axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, {
            params: { status: "in_progress", limit: 1 },
          }),
          axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, {
            params: { status: "vehicle_ready", limit: 1 },
          }),
          axiosClient.get(INVOICE_ENDPOINTS.LIST, {
            params: { paymentStatus: "unpaid", limit: 1 },
          }),
          axiosClient.get(INVOICE_ENDPOINTS.STATS),
        ]);

      setStats({
        open:
          createdRes.status === "fulfilled"
            ? (createdRes.value.data?.data?.total ?? 0)
            : 0,
        wip:
          wipRes.status === "fulfilled"
            ? (wipRes.value.data?.data?.total ?? 0)
            : 0,
        ready:
          readyRes.status === "fulfilled"
            ? (readyRes.value.data?.data?.total ?? 0)
            : 0,
        due:
          dueRes.status === "fulfilled"
            ? (dueRes.value.data?.data?.total ?? 0)
            : 0,
        dueAmount:
          invoiceStatsRes.status === "fulfilled"
            ? (invoiceStatsRes.value.data?.data?.credit ?? 0)
            : 0,
      });
    } catch {
      // silently degrade
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [fetchDashboardStats]),
  );

  const statusCards = [
    { ...STATUS_CARD_TEMPLATES[0], count: stats.open },
    { ...STATUS_CARD_TEMPLATES[1], count: stats.wip },
    { ...STATUS_CARD_TEMPLATES[2], count: stats.ready },
    {
      ...STATUS_CARD_TEMPLATES[3],
      count: stats.due,
      helper: `₹${Number(stats.dueAmount).toLocaleString("en-IN")} pending`,
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: Platform.OS === "ios" ? 120 : 140 },
        ]}
      >
        {/* ── Hero Header ──────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary, "#34D399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            {/* Decorative circles */}
            <View
              style={[
                s.heroDeco,
                { width: 160, height: 160, top: -50, right: -40 },
              ]}
            />
            <View
              style={[
                s.heroDecoRing,
                { width: 90, height: 90, top: 28, right: 40 },
              ]}
            />
            <View
              style={[
                s.heroDeco,
                { width: 80, height: 80, bottom: -10, left: -20 },
              ]}
            />

            <View style={s.heroContent}>
              <View style={s.heroLeft}>
                <Text style={[s.greeting, { fontSize: fs.textSm }]}>
                  Hello 👋
                </Text>
                <Text style={[s.garageName, { fontSize: fs.textXl }]}>
                  Aapno Garage
                </Text>
                <Text style={s.heroTagline}>Smart Workshop Management</Text>

                <View style={s.heroMetaRow}>
                  <View style={s.heroPill}>
                    <Ionicons
                      name="calendar-clear-outline"
                      size={11}
                      color={COLORS.white}
                    />
                    <Text style={s.heroPillText}>{todayLabel}</Text>
                  </View>
                  <View style={s.heroPill}>
                    <Animated.View
                      style={[s.liveDot, { opacity: livePulse }]}
                    />
                    <Text style={s.heroPillText}>Live</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={s.calendarBtn}
                onPress={() => navigation.navigate("Calendar")}
                accessibilityLabel="Calendar"
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <View style={s.calendarBtnInner}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.white}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <SectionHeader title="Quick Actions" fs={fs} />
        <View style={s.section}>
          {QUICK_ACTIONS.map((item, i) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              fs={fs}
              index={i}
            />
          ))}
        </View>

        <SectionHeader
          title="Order Status"
          actionLabel="See all"
          onAction={() => navigation.navigate("Orders")}
          fs={fs}
        />
        <View style={s.statsGrid}>
          {statusCards.map((card, i) => (
            <StatCard
              key={card.id}
              card={card}
              navigation={navigation}
              fs={fs}
              index={i}
            />
          ))}
        </View>

        <View style={s.section}>
          <TouchableOpacity
            style={s.completedRow}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("Orders", { initialTab: "COMPLETED" })
            }
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[COLORS.primary, "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.completedIconGrad}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={20}
                color={COLORS.white}
              />
            </LinearGradient>
            <View style={s.actionContent}>
              <Text style={[s.actionTitle, { fontSize: fs.textBase }]}>
                Completed Orders
              </Text>
              <Text style={[s.actionSub, { fontSize: fs.textSm }]}>
                View full order history
              </Text>
            </View>
            <View
              style={[s.actionArrow, { backgroundColor: COLORS.primaryLight }]}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { gap: 0 },

  // ── Hero ───────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xl,
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: SIZES.radiusXl,
    borderBottomRightRadius: SIZES.radiusXl,
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroDecoRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: { flex: 1 },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.8)",
  },
  garageName: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXl,
    color: COLORS.white,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroTagline: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: SIZES.sm + 2,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroPillText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  calendarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  calendarBtnInner: {
    flex: 1,
    width: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // ── Section Header ─────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    marginTop: SIZES.md,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sectionActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
  },
  sectionAction: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // ── Section Card ───────────────────────────────────────────────
  section: {
    marginHorizontal: SIZES.screenPadding,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.bgCard,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },

  // ── Action Row ─────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  actionIconGrad: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  actionSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Completed row ──────────────────────────────────────────────
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  completedIconGrad: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
  },

  // ── Stats Grid ─────────────────────────────────────────────────
  statsGrid: {
    marginHorizontal: SIZES.screenPadding,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  statCard: {
    flexBasis: "48%",
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  statInner: { padding: SIZES.md, minHeight: 130 },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  statCount: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXl,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  statSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statHelperWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    maxWidth: "100%",
  },
  statHelper: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },
});
