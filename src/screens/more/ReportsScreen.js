import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import { useNavigation } from "@react-navigation/native";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FINANCIAL_REPORTS = [
  {
    id: "income_expense",
    title: "Income & Expense",
    subtitle: "Track cash flow and profitability",
    icon: "finance",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "order_income",
    title: "Order Based Income",
    subtitle: "Revenue breakdown per job card",
    icon: "receipt-text-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "payment",
    title: "Payment Reports",
    subtitle: "Transactions and payment modes",
    icon: "credit-card-outline",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
  },
  {
    id: "accounts_payable",
    title: "Accounts Payable",
    subtitle: "Pending vendor dues and payments",
    icon: "wallet-outline",
    accent: COLORS.error,
    accentSoft: COLORS.errorLight,
  },
  {
    id: "gst",
    title: "GST Reports",
    subtitle: "Tax computation and summaries",
    icon: "calculator-variant-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "invoice_export",
    title: "Invoice Export",
    subtitle: "Download and share billing data",
    icon: "file-export-outline",
    accent: COLORS.textPrimary,
    accentSoft: COLORS.borderLight,
  },
];

const INVENTORY_REPORTS = [
  {
    id: "stock_in",
    title: "Inventory Stock In",
    subtitle: "Purchases and inward movements",
    icon: "arrow-down-circle-outline",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "stock_out",
    title: "Inventory Stock Out",
    subtitle: "Consumption and outward sales",
    icon: "arrow-up-circle-outline",
    accent: COLORS.error,
    accentSoft: COLORS.errorLight,
  },
  {
    id: "parts_sales",
    title: "Parts Sales Reports",
    subtitle: "Sales patterns day/month wise",
    icon: "package-variant-closed",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "inventory_ageing",
    title: "Inventory Ageing",
    subtitle: "Identify slow-moving stock",
    icon: "history",
    accent: "#BA7517",
    accentSoft: "#FFFBEB",
  },
];

const PERFORMANCE_REPORTS = [
  {
    id: "service_sales",
    title: "Service Sales Reports",
    subtitle: "Service revenue day/month wise",
    icon: "chart-bar",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "service_reports",
    title: "Service Overview",
    subtitle: "General service center metrics",
    icon: "tools",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
  },
  {
    id: "tag_mechanic",
    title: "TAG / Mechanic Based",
    subtitle: "Performance by staff and tags",
    icon: "account-hard-hat",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
  },
];

const OPERATIONAL_REPORTS = [
  {
    id: "open_order",
    title: "Open Order Report",
    subtitle: "Currently active job cards",
    icon: "folder-open-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
  {
    id: "service_reminder",
    title: "Service Reminder",
    subtitle: "Upcoming scheduled maintenance",
    icon: "bell-outline",
    accent: "#BA7517",
    accentSoft: "#FFFBEB",
  },
  {
    id: "daily",
    title: "Daily Report",
    subtitle: "End of day summary",
    icon: "calendar-today",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
  },
  {
    id: "monthly",
    title: "Monthly Report",
    subtitle: "Month to date summary",
    icon: "calendar-month-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button">
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Maps report id → screen name (undefined = coming soon)
const REPORT_SCREEN_MAP = {
  income_expense:   "IncomeExpenseReport",
  order_income:     "IncomeExpenseReport",
  payment:          "PaymentReport",
  invoice_export:   "TallyExport",
  open_order:       "Orders",
  service_reminder: "ServiceReminders",
  daily:            "DailyReport",
  monthly:          "MonthlyReport",
};

function ActionRow({ item, navigation, isLast }) {
  const screenName = REPORT_SCREEN_MAP[item.id];
  const handlePress = () => {
    if (screenName) {
      navigation.navigate(screenName);
    } else {
      Alert.alert(item.title, "This report is coming soon.");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.actionRow, isLast && styles.actionRowLast]}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityLabel={item.title}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: item.accentSoft }]}>
        <MaterialCommunityIcons
          name={item.icon}
          size={22}
          color={item.accent}
        />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.actionSub}>{item.subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Reports" transparent={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "ios" ? 120 : 140 },
        ]}
      >
        {/* Financial & Tax */}
        <SectionHeader title="Financial & Tax" />
        <View style={styles.section}>
          {FINANCIAL_REPORTS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === FINANCIAL_REPORTS.length - 1}
            />
          ))}
        </View>

        {/* Inventory */}
        <SectionHeader title="Inventory" />
        <View style={styles.section}>
          {INVENTORY_REPORTS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === INVENTORY_REPORTS.length - 1}
            />
          ))}
        </View>

        {/* Staff & Performance */}
        <SectionHeader title="Staff & Performance" />
        <View style={styles.section}>
          {PERFORMANCE_REPORTS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === PERFORMANCE_REPORTS.length - 1}
            />
          ))}
        </View>

        {/* Operational */}
        <SectionHeader title="Operational & Summaries" />
        <View style={styles.section}>
          {OPERATIONAL_REPORTS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === OPERATIONAL_REPORTS.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { gap: 0, paddingTop: 0 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    marginTop: SIZES.lg,
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
    marginBottom: SIZES.sm,
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
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
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
});
