import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import { usePreferences, useFontSizes, FONT_SCALE } from "../../context/PreferencesContext";

// ─── Font options ─────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { key: "small",  label: "Small",  preview: 13 },
  { key: "medium", label: "Medium", preview: 15 },
  { key: "large",  label: "Large",  preview: 18 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, fs }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionTitle, { fontSize: fs.textMd }]}>{title}</Text>
      {subtitle ? <Text style={[s.sectionSub, { fontSize: fs.textXs }]}>{subtitle}</Text> : null}
    </View>
  );
}

function ToggleRow({ icon, iconColor, iconBg, title, subtitle, value, onValueChange, isLast, fs }) {
  return (
    <View style={[s.row, isLast && s.rowLast]}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={s.rowContent}>
        <Text style={[s.rowTitle, { fontSize: fs.textBase }]}>{title}</Text>
        {subtitle ? <Text style={[s.rowSub, { fontSize: fs.textSm }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.borderLight, true: `${COLORS.primary}80` }}
        thumbColor={value ? COLORS.primary : "#ccc"}
        ios_backgroundColor={COLORS.borderLight}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GeneralPreferencesScreen() {
  const { prefs, updatePref, loaded } = usePreferences();
  const fs = useFontSizes();

  const set = useCallback((key) => (val) => updatePref(key, val), [updatePref]);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="General Preferences" showBack transparent={false} />

      {!loaded ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === "ios" ? 120 : 100 }]}
        >
          {/* ── Font Size ──────────────────────────────────────────── */}
          <SectionHeader
            title="Font Size"
            subtitle="Adjusts text across the entire app instantly"
            fs={fs}
          />
          <View style={s.card}>
            <View style={s.fontRow}>
              {FONT_OPTIONS.map((opt) => {
                const active = prefs.fontSize === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.fontOption, active && s.fontOptionActive]}
                    onPress={() => updatePref("fontSize", opt.key)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${opt.label} font size`}
                    accessibilityState={{ selected: active }}
                  >
                    {active && (
                      <View style={s.fontCheck}>
                        <MaterialCommunityIcons name="check" size={11} color={COLORS.white} />
                      </View>
                    )}
                    {/* Preview uses the ACTUAL computed scale for this option */}
                    <Text style={[s.fontPreview, { fontSize: opt.preview * FONT_SCALE[opt.key] }, active && s.fontPreviewActive]}>
                      Aa
                    </Text>
                    <Text style={[s.fontLabel, active && s.fontLabelActive, { fontSize: fs.textXs }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live preview strip */}
            <View style={s.previewStrip}>
              <MaterialCommunityIcons name="eye-outline" size={13} color={COLORS.textMuted} />
              <Text style={[s.previewLbl, { fontSize: fs.textXs }]}>Live preview · </Text>
              <Text style={[s.previewText, { fontSize: fs.textBase }]}>
                Repair Order · Invoice · ₹12,500
              </Text>
            </View>
          </View>

          {/* ── Notifications ──────────────────────────────────────── */}
          <SectionHeader
            title="Notifications"
            subtitle="Control in-app alerts and background refresh"
            fs={fs}
          />
          <View style={s.card}>
            <ToggleRow
              icon="bell-ring-outline"
              iconColor={COLORS.primary}
              iconBg={COLORS.primaryLight}
              title="In-App Notifications"
              subtitle="Show alerts, reminders and status updates"
              value={prefs.notificationsEnabled}
              onValueChange={set("notificationsEnabled")}
              fs={fs}
            />
            <ToggleRow
              icon="refresh-auto"
              iconColor={COLORS.success}
              iconBg={COLORS.successLight}
              title="Auto Updates"
              subtitle="Refresh orders and data in the background"
              value={prefs.autoUpdates}
              onValueChange={set("autoUpdates")}
              isLast
              fs={fs}
            />
          </View>

          {/* Notification-off warning */}
          {!prefs.notificationsEnabled && (
            <View style={[s.infoBanner, { borderColor: `${COLORS.secondary}40`, backgroundColor: "#FFFBEB" }]}>
              <MaterialCommunityIcons name="bell-off-outline" size={15} color={COLORS.secondary} />
              <Text style={[s.infoBannerTxt, { fontSize: fs.textXs, color: "#BA7517" }]}>
                Notifications are off. Important alerts (confirmations, errors) will still appear.
              </Text>
            </View>
          )}

          {/* ── WhatsApp Automation ────────────────────────────────── */}
          <SectionHeader
            title="WhatsApp Automation"
            subtitle="Auto-notify customers without any manual action"
            fs={fs}
          />
          <View style={s.card}>
            <ToggleRow
              icon="whatsapp"
              iconColor="#25D366"
              iconBg="#E8FBF0"
              title="Vehicle Ready Alert"
              subtitle="Customer receives a WhatsApp message the moment the repair order is marked Vehicle Ready"
              value={prefs.autoWaNotification}
              onValueChange={set("autoWaNotification")}
              isLast
              fs={fs}
            />
          </View>

          {prefs.autoWaNotification ? (
            <View style={[s.infoBanner, { borderColor: `${"#25D366"}40`, backgroundColor: "#E8FBF0" }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color="#25D366" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[s.infoBannerTxt, { fontSize: fs.textXs, color: "#1a7a45", fontFamily: FONTS.semibold }]}>
                  Active — Message sent automatically
                </Text>
                <Text style={[s.infoBannerTxt, { fontSize: fs.textXs, color: "#1a7a45" }]}>
                  Requires <Text style={{ fontFamily: FONTS.semibold }}>WA_ACCESS_TOKEN</Text> + <Text style={{ fontFamily: FONTS.semibold }}>WA_PHONE_NUMBER_ID</Text> in your server environment (WhatsApp Cloud API by Meta).
                </Text>
              </View>
            </View>
          ) : (
            <View style={[s.infoBanner, { borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSection }]}>
              <MaterialCommunityIcons name="information-outline" size={15} color={COLORS.textMuted} />
              <Text style={[s.infoBannerTxt, { fontSize: fs.textXs }]}>
                When enabled, the system sends a WhatsApp message to the customer's registered number automatically — no manual step required.
              </Text>
            </View>
          )}

          {/* ── About ──────────────────────────────────────────────── */}
          <SectionHeader title="About" fs={fs} />
          <View style={s.card}>
            <View style={[s.row, s.rowLast]}>
              <View style={[s.rowIcon, { backgroundColor: COLORS.bgSection }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.textMuted} />
              </View>
              <View style={s.rowContent}>
                <Text style={[s.rowTitle, { fontSize: fs.textBase }]}>App Version</Text>
                <Text style={[s.rowSub, { fontSize: fs.textSm }]}>1.0.0 · Aapno Garage</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {},

  sectionHeader: {
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
    gap: 3,
  },
  sectionTitle: { fontFamily: FONTS.semibold, color: COLORS.textPrimary, letterSpacing: -0.1 },
  sectionSub:   { fontFamily: FONTS.regular,  color: COLORS.textMuted },

  card: {
    marginHorizontal: SIZES.screenPadding,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },

  // ── Font picker ───────────────────────────────────────────────────────────
  fontRow: {
    flexDirection: "row",
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  fontOption: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgSection,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    position: "relative",
    gap: 4,
  },
  fontOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  fontPreview:      { fontFamily: FONTS.bold, color: COLORS.textMuted },
  fontPreviewActive:{ color: COLORS.primary },
  fontLabel:        { fontFamily: FONTS.medium, color: COLORS.textMuted },
  fontLabelActive:  { color: COLORS.primary },
  fontCheck: {
    position: "absolute", top: 5, right: 5,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },

  // ── Live preview strip ────────────────────────────────────────────────────
  previewStrip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSection, gap: 4,
  },
  previewLbl:  { fontFamily: FONTS.regular, color: COLORS.textMuted },
  previewText: { fontFamily: FONTS.semibold, color: COLORS.textPrimary },

  // ── Toggle rows ───────────────────────────────────────────────────────────
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.md,
    gap: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  rowLast:    { borderBottomWidth: 0 },
  rowIcon:    { width: 44, height: 44, borderRadius: SIZES.radiusMd, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1, gap: 2 },
  rowTitle:   { fontFamily: FONTS.semibold, color: COLORS.textPrimary },
  rowSub:     { fontFamily: FONTS.regular,  color: COLORS.textMuted },

  // ── Info banners ──────────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: SIZES.sm,
    marginHorizontal: SIZES.screenPadding, marginTop: SIZES.sm,
    borderRadius: SIZES.radiusMd, borderWidth: 1, padding: SIZES.sm + 2,
  },
  infoBannerTxt: { flex: 1, fontFamily: FONTS.regular, color: COLORS.textMuted, lineHeight: 18 },
});
