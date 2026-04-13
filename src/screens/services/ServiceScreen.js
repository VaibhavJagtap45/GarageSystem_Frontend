import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { usePreferences, useFontSizes } from "../../context/PreferencesContext";
import { SafeAreaView } from "react-native-safe-area-context";
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
    onPress: (nav) => nav.navigate("CustomerRepairOrder"),
  },
  {
    id: "invoice",
    title: "Create Invoice",
    subtitle: "Direct parts or service billing",
    icon: "cart-plus",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
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

function SectionHeader({ title, actionLabel, onAction, fs }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionTitle, { fontSize: fs.textMd }]}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button">
          <Text style={[s.sectionAction, { fontSize: fs.textSm }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActionRow({ item, navigation, fs }) {
  return (
    <TouchableOpacity
      style={s.actionRow}
      activeOpacity={0.8}
      onPress={() => item.onPress(navigation)}
      accessibilityLabel={item.title}
      accessibilityRole="button"
    >
      <View style={[s.actionIcon, { backgroundColor: item.accentSoft }]}>
        <MaterialCommunityIcons
          name={item.icon}
          size={22}
          color={item.accent}
        />
      </View>
      <View style={s.actionContent}>
        <Text style={[s.actionTitle, { fontSize: fs.textBase }]}>
          {item.title}
        </Text>
        <Text style={[s.actionSub, { fontSize: fs.textSm }]}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function StatCard({ card, navigation, fs }) {
  return (
    <View style={s.statCard}>
      <TouchableOpacity
        style={s.statInner}
        activeOpacity={0.8}
        onPress={() => card.onPress(navigation)}
        accessibilityLabel={card.title}
        accessibilityRole="button"
      >
        <View style={s.statTop}>
          <View style={[s.statIcon, { backgroundColor: card.accentSoft }]}>
            <MaterialCommunityIcons
              name={card.icon}
              size={20}
              color={card.accent}
            />
          </View>
          <View
            style={[
              s.statBadge,
              {
                borderColor: `${card.accent}40`,
                backgroundColor: card.accentSoft,
              },
            ]}
          >
            <Text
              style={[
                s.statCount,
                { color: card.accent, fontSize: fs.textBase },
              ]}
            >
              {card.count}
            </Text>
          </View>
        </View>
        <Text style={[s.statTitle, { fontSize: fs.textBase }]}>
          {card.title}
        </Text>
        <Text style={[s.statSub, { fontSize: fs.textXs }]}>
          {card.subtitle}
        </Text>
        {card.helper ? (
          <Text
            style={[s.statHelper, { color: card.accent, fontSize: fs.textXs }]}
          >
            {card.helper}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const INITIAL_STATS = { open: 0, wip: 0, ready: 0, due: 0, dueAmount: 0 };

export default function ServiceScreen() {
  const navigation = useNavigation();
  const { notify } = usePreferences();
  const fs = useFontSizes();
  const [stats, setStats] = useState(INITIAL_STATS);

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
      // silently degrade — zeros remain on failure
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: Platform.OS === "ios" ? 120 : 140 },
        ]}
      >
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { fontSize: fs.textSm }]}>Hello 👋</Text>
            <Text style={[s.garageName, { fontSize: fs.textXl }]}>
              Aapno Garage Workshop
            </Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.notifBtn}
              onPress={() => navigation.navigate("Calendar")}
              accessibilityLabel="Calendar"
              accessibilityRole="button"
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="Quick Actions" fs={fs} />
        <View style={s.section}>
          {QUICK_ACTIONS.map((item) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              fs={fs}
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
          {statusCards.map((card) => (
            <StatCard
              key={card.id}
              card={card}
              navigation={navigation}
              fs={fs}
            />
          ))}
        </View>

        <View style={s.section}>
          <TouchableOpacity
            style={s.actionRow}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("Orders", { initialTab: "COMPLETED" })
            }
            accessibilityRole="button"
          >
            <View
              style={[s.actionIcon, { backgroundColor: COLORS.primaryLight }]}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <View style={s.actionContent}>
              <Text style={[s.actionTitle, { fontSize: fs.textBase }]}>
                Completed Orders
              </Text>
              <Text style={[s.actionSub, { fontSize: fs.textSm }]}>
                View full order history
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  garageName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXl,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  trialBanner: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.errorLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
  },
  trialLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  trialText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.error,
  },
  buyBtn: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.error,
  },
  buyText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    marginTop: SIZES.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  sectionAction: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  actionSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
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
  statInner: { padding: SIZES.md },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  statBadge: {
    minWidth: 32,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignItems: "center",
  },
  statCount: { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  statTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  statSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statHelper: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    marginTop: SIZES.xs,
  },
});
