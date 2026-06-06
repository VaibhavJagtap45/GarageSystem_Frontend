import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import { logout } from "../../store/slices/authSlice";
import { clearStorage } from "../../utils/storage";

const MENU_GROUPS = [
  {
    groupId: "workshop",
    label: "Workshop",
    items: [
      {
        id: "customers",
        label: "My Customers",
        icon: "people-outline",
        onPress: (nav) => nav.navigate("MyCustomers"),
      },
      {
        id: "vendors",
        label: "My Vendors",
        icon: "storefront-outline",
        onPress: (nav) => nav.navigate("MyVendors"),
      },
      {
        id: "order_search",
        label: "Order Search",
        icon: "search-outline",
        onPress: (nav) => nav.navigate("OrderSearch"),
      },
      {
        id: "vehicle_search",
        label: "Vehicle Search",
        icon: "car-outline",
        onPress: (nav) => nav.navigate("VehicleSearch"),
      },
      {
        id: "inventory_transfers",
        label: "Inventory Transfers",
        icon: "swap-horizontal-outline",
        onPress: (nav) => nav.navigate("InventoryTransfers"),
      },
      {
        id: "tags_management",
        label: "Tag Management",
        icon: "pricetag-outline",
        onPress: (nav) => nav.navigate("TagsManagement"),
      },
    ],
  },
  // {
  //   groupId: "reminders",
  //   label: "Reminders & Feedback",
  //   items: [
  //     {
  //       id: "service_reminders",
  //       label: "Service Reminders",
  //       icon: "notifications-outline",
  //       onPress: (nav) => nav.navigate("ServiceReminders"),
  //     },
  //     {
  //       id: "service_feedbacks",
  //       label: "Service Feedbacks",
  //       icon: "star-outline",
  //       onPress: (nav) => nav.navigate("ServiceFeedbacks"),
  //     },
  //     {
  //       id: "insurance_due",
  //       label: "Insurance Due",
  //       icon: "alarm-outline",
  //       onPress: (nav) => nav.navigate("InsuranceDue"),
  //     },
  //   ],
  // },
  {
    groupId: "reports",
    label: "Reports & Export",
    items: [
      {
        id: "reports",
        label: "Reports",
        icon: "bar-chart-outline",
        onPress: (nav) => nav.navigate("Reports"),
      },
      {
        id: "invoices",
        label: "Invoices",
        icon: "receipt-outline",
        onPress: (nav) => nav.navigate("InvoiceList"),
      },
      {
        id: "tally_export",
        label: "Tally Export",
        icon: "document-text-outline",
        onPress: (nav) => nav.navigate("TallyExport"),
      },
      {
        id: "cancelled_orders",
        label: "Cancelled Orders",
        icon: "close-circle-outline",
        onPress: (nav) => nav.navigate("CancelledOrders"),
      },
    ],
  },
  {
    groupId: "account",
    label: "Account",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: "settings-outline",
        onPress: (nav) => nav.navigate("Settings"),
      },
      // {
      //   id: "refer",
      //   label: "Refer a Friend",
      //   icon: "share-social-outline",
      //   onPress: () => {
      //     const { Share } = require("react-native");
      //     Share.share({ message: "Check out ApnoGarage — the best garage management app! Download now." });
      //   },
      // },
    ],
  },
  {
    groupId: "danger",
    label: "",
    items: [
      {
        id: "logout",
        label: "Logout",
        icon: "log-out-outline",
        danger: true,
        // onPress is handled at the screen level via handleLogout
        onPress: () => {},
      },
    ],
  },
];

function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ item, navigation, onLogout }) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      activeOpacity={0.7}
      onPress={onLogout ?? (() => item.onPress?.(navigation))}
      accessibilityLabel={item.label}
      accessibilityRole="button"
    >
      <View
        style={[styles.menuIconWrap, item.danger && styles.menuIconWrapDanger]}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={item.danger ? COLORS.error : COLORS.primary}
        />
      </View>
      <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
        {item.label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={item.danger ? COLORS.error : COLORS.textMuted}
      />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearStorage();
          dispatch(logout());
          // AppNavigator auto-switches to Auth stack — no manual navigation needed
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <TopNav title="More" transparent={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {MENU_GROUPS.map((group) => (
          <View key={group.groupId}>
            {group.label ? (
              <Text style={styles.groupLabel}>{group.label}</Text>
            ) : (
              <View style={styles.dangerSpacer} />
            )}
            <View style={styles.menuCard}>
              {group.items.map((item, iIdx) => (
                <View key={item.id}>
                  <MenuItem
                    item={item}
                    navigation={navigation}
                    onLogout={item.id === "logout" ? handleLogout : undefined}
                  />
                  {iIdx < group.items.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.lg,
    alignItems: "center",
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  profileSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: COLORS.bg,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: COLORS.borderLight,
  },
  groupLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
    marginTop: SIZES.lg,
    marginLeft: 4,
  },
  dangerSpacer: { height: SIZES.xl },
  menuCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md - 2,
    gap: SIZES.md,
    minHeight: 52,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapDanger: { backgroundColor: COLORS.errorLight },
  menuLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  menuLabelDanger: { color: COLORS.error, fontFamily: FONTS.medium },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SIZES.md + 36 + SIZES.md,
  },
});
