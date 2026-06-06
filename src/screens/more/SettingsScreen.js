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
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import { useNavigation } from "@react-navigation/native";
import { useFontSizes } from "../../context/PreferencesContext";

// ─── Data ─────────────────────────────────────────────────────────────────────
const GARAGE_SETTINGS = [
  {
    id: "garage_profile",
    title: "My Garage Profile",
    subtitle: "Manage your garage details",
    icon: "storefront-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("MyGarageProfile"),
  },
  {
    id: "garage_users",
    title: "Garage Users",
    subtitle: "Manage staff and roles",
    icon: "account-group-outline",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
    onPress: (nav) => nav.navigate("GarageUsers"),
  },
  {
    id: "parts_master",
    title: "Service & Parts Master",
    subtitle: "Manage catalog and pricing",
    icon: "tools",
    accent: COLORS.success,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("ServiceParts"),
  },
  {
    id: "service_packages",
    title: "My Service Packages",
    subtitle: "Configure custom service bundles",
    icon: "layers-outline",
    accent: "#BA7517",
    accentSoft: "#FFFBEB",
    onPress: (nav) => nav.navigate("GaragePackages"),
  },
  {
    id: "tags",
    title: "Tags Management",
    subtitle: "Organize vehicles and orders",
    icon: "tag-multiple-outline",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("TagsManagement"),
  },
  {
    id: "customisation",
    title: "Jobcard Customisation",
    subtitle: "Configure checklists and formats",
    icon: "clipboard-text-outline",
    accent: COLORS.secondary,
    accentSoft: "#FFFBEB",
    onPress: (nav) => nav.navigate("JobCardChecklist"),
  },
];

const PREFERENCES = [
  {
    id: "preferences",
    title: "General Preferences",
    subtitle: "Font size, notifications, WhatsApp automation",
    icon: "cog-outline",
    accent: COLORS.textPrimary,
    accentSoft: COLORS.borderLight,
    onPress: (nav) => nav.navigate("GeneralPreferences"),
  },
];

const ACCOUNT_SETTINGS = [
  {
    id: "change_password",
    title: "Change Password",
    subtitle: "Update your account password",
    icon: "lock-reset",
    accent: COLORS.primary,
    accentSoft: COLORS.primaryLight,
    onPress: (nav) => nav.navigate("ChangePassword"),
  },
];

// const ADDON_MODULES = [
//   {
//     id: "booking_portal",
//     title: "Customer Booking Portal",
//     subtitle: "Enable online appointments",
//     icon: "web",
//     accent: COLORS.primary,
//     accentSoft: COLORS.primaryLight,
//     onPress: (nav) => nav.navigate("Bookings"),
//   },

//   {
//     id: "invoice_pdf",
//     title: "Customise Estimate/Invoice PDF",
//     subtitle: "Format options for printing",
//     icon: "file-pdf-box",
//     accent: COLORS.error,
//     accentSoft: COLORS.errorLight,
//     onPress: () => Alert.alert("Invoice PDF Format", "Coming soon"),
//   },
// ];

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeader({ title, actionLabel, onAction }) {
  const fs = useFontSizes();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: fs.textMd }]}>
        {title}
      </Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button">
          <Text style={[styles.sectionAction, { fontSize: fs.textSm }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActionRow({ item, navigation, isLast }) {
  const fs = useFontSizes();
  return (
    <TouchableOpacity
      style={[styles.actionRow, isLast && styles.actionRowLast]}
      activeOpacity={0.8}
      onPress={() => item.onPress(navigation)}
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
        <Text style={[styles.actionTitle, { fontSize: fs.textBase }]}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={[styles.actionSub, { fontSize: fs.textSm }]}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Settings" transparent={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "ios" ? 120 : 140 },
        ]}
      >
        {/* Garage Settings */}
        <SectionHeader title="Garage Settings" />
        <View style={styles.section}>
          {GARAGE_SETTINGS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === GARAGE_SETTINGS.length - 1}
            />
          ))}
        </View>

        {/* Preferences */}
        <SectionHeader title="General Preferences" />
        <View style={styles.section}>
          {PREFERENCES.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === PREFERENCES.length - 1}
            />
          ))}
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          {ACCOUNT_SETTINGS.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === ACCOUNT_SETTINGS.length - 1}
            />
          ))}
        </View>

        {/* Add-On Modules */}
        {/* <SectionHeader title="Add-On Modules (Optional)" />
        <View style={styles.section}>
          {ADDON_MODULES.map((item, index) => (
            <ActionRow
              key={item.id}
              item={item}
              navigation={navigation}
              isLast={index === ADDON_MODULES.length - 1}
            />
          ))}
        </View> */}
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
