import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import Badge from "../../components/ui/Badge";

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

const STATUS_CARDS = [
  {
    id: "open",
    title: "Open",
    subtitle: "Repair order created",
    count: 0,
    icon: "inbox-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("Orders", { initialTab: "CREATED" }),
  },
  {
    id: "wip",
    title: "WIP",
    subtitle: "Work in progress",
    count: 0,
    icon: "progress-clock",
    accent: "#BA7517",
    accentSoft: "#FFFBEB",
    onPress: (nav) => nav.navigate("Orders", { initialTab: "IN_PROGRESS" }),
  },
  {
    id: "ready",
    title: "Ready",
    subtitle: "Vehicle ready",
    count: 0,
    icon: "clipboard-check-outline",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("Orders", { initialTab: "VEHICLE_READY" }),
  },
  {
    id: "due",
    title: "Payment Due",
    subtitle: "Invoice prepared",
    count: 0,
    icon: "wallet-outline",
    accent: COLORS.error,
    accentSoft: COLORS.errorLight,
    helper: "₹0 pending",
    onPress: (nav) => nav.navigate("Orders", { initialTab: "CREATED" }),
  },
];

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button">
          <Text style={s.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActionRow({ item, navigation }) {
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
        <Text style={s.actionTitle}>{item.title}</Text>
        <Text style={s.actionSub}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function StatCard({ card, navigation }) {
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
            <Text style={[s.statCount, { color: card.accent }]}>
              {card.count}
            </Text>
          </View>
        </View>
        <Text style={s.statTitle}>{card.title}</Text>
        <Text style={s.statSub}>{card.subtitle}</Text>
        {card.helper ? (
          <Text style={[s.statHelper, { color: card.accent }]}>
            {card.helper}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

export default function ServiceScreen() {
  const navigation = useNavigation();
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
            <Text style={s.greeting}>Good morning 👋</Text>
            <Text style={s.garageName}>Apno Garage Workshop</Text>
          </View>
          <TouchableOpacity
            style={s.notifBtn}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* <View style={s.trialBanner}>
          <View style={s.trialLeft}>
            <Ionicons name="time-outline" size={16} color={COLORS.error} />
            <Text style={s.trialText}>Trial ends in 7 days</Text>
          </View>
          <TouchableOpacity style={s.buyBtn} accessibilityRole="button">
            <Text style={s.buyText}>Upgrade</Text>
          </TouchableOpacity>
        </View> */}

        <SectionHeader title="Quick Actions" />
        <View style={s.section}>
          {QUICK_ACTIONS.map((item) => (
            <ActionRow key={item.id} item={item} navigation={navigation} />
          ))}
        </View>

        <SectionHeader
          title="Order Status"
          actionLabel="See all"
          onAction={() => navigation.navigate("Orders")}
        />
        <View style={s.statsGrid}>
          {STATUS_CARDS.map((card) => (
            <StatCard key={card.id} card={card} navigation={navigation} />
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
              <Text style={s.actionTitle}>Completed Orders</Text>
              <Text style={s.actionSub}>View full order history</Text>
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
