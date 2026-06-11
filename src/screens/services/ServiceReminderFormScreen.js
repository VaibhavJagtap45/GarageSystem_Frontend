import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppButton from "../../components/ui/AppButton";

// Common service intervals (km) staff pick from — most two-wheelers run a
// 3,000–5,000 km service cycle. They can also type a custom distance.
const INTERVAL_CHIPS = [3000, 3500, 5000];

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_KM = 40; // fallback used to predict the due date

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ServiceReminderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const prefill = route.params?.prefill ?? {};

  const vehicle = prefill.vehicle ?? null;
  const customer = prefill.customer ?? null;
  const services = prefill.services ?? [];

  const vehicleLabel =
    [vehicle?.vehicleBrand, vehicle?.vehicleModel].filter(Boolean).join(" ") ||
    vehicle?.vehicleRegisterNo ||
    "Vehicle";

  // ── Manual fields ───────────────────────────────────────────────
  const [serviceLabel, setServiceLabel] = useState(services[0]?.name ?? "");
  const [odometer, setOdometer] = useState(
    prefill.odometerReading != null
      ? String(prefill.odometerReading)
      : vehicle?.vehicleKmDriven != null
        ? String(vehicle.vehicleKmDriven)
        : "",
  );
  const [dailyRunningKm, setDailyRunningKm] = useState(
    vehicle?.dailyRunningKm ? String(vehicle.dailyRunningKm) : "",
  );
  const [interval, setInterval] = useState("3000");

  const onKmChange = (setter) => (raw) => setter(raw.replace(/[^0-9]/g, ""));

  // ── Derived prediction ──────────────────────────────────────────
  const odoNum = Number(odometer) || 0;
  const intervalNum = Number(interval) || 0;
  const dailyNum = Number(dailyRunningKm) || 0;

  const nextServiceKm = odoNum > 0 && intervalNum > 0 ? odoNum + intervalNum : null;
  const predictedDays =
    intervalNum > 0
      ? Math.ceil(intervalNum / (dailyNum > 0 ? dailyNum : DEFAULT_DAILY_KM))
      : null;
  const predictedDate = predictedDays
    ? new Date(Date.now() + predictedDays * DAY_MS)
    : null;

  // ── Continue with / without a reminder ──────────────────────────
  const goToInvoice = (withReminder) => {
    const basePrefill = {
      ...prefill,
      // Make sure the invoice screen bills against the same odometer the
      // reminder was computed from.
      odometerReading: odometer ? Number(odometer) : prefill.odometerReading,
    };

    if (!withReminder) {
      navigation.replace("CounterSale", { prefill: basePrefill });
      return;
    }

    navigation.replace("CounterSale", {
      prefill: {
        ...basePrefill,
        reminder: {
          enabled: true,
          serviceLabel: serviceLabel.trim() || services[0]?.name || "Service",
          nextServiceKm: nextServiceKm || undefined,
          dailyRunningKm: dailyNum || undefined,
        },
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <TopNav title="Next Service Reminder" transparent={false} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introRow}>
          <View style={styles.introIcon}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.introText}>
            Service done! Set a reminder for the next service before billing —
            we&apos;ll auto-message the customer when it&apos;s near.
          </Text>
        </View>

        {/* ── Vehicle info (auto-filled) ─────────────────────────── */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleIcon}>
            <Ionicons name="car-sport-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicleLabel}
            </Text>
            <Text style={styles.vehicleMeta} numberOfLines={1}>
              {vehicle?.vehicleRegisterNo || "No reg. no"}
              {customer?.fullName ? ` · ${customer.fullName}` : ""}
            </Text>
          </View>
          <View style={styles.autoBadge}>
            <Ionicons name="sparkles-outline" size={11} color={COLORS.primary} />
            <Text style={styles.autoBadgeText}>Auto</Text>
          </View>
        </View>

        {/* ── Manual details ─────────────────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Service details</Text>

          <Text style={styles.fieldLabel}>Service provided</Text>
          <TextInput
            value={serviceLabel}
            onChangeText={setServiceLabel}
            placeholder="e.g. Engine Oil Change"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Current odometer (km)</Text>
              <TextInput
                value={odometer}
                onChangeText={onKmChange(setOdometer)}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Daily running (km/day)</Text>
              <TextInput
                value={dailyRunningKm}
                onChangeText={onKmChange(setDailyRunningKm)}
                placeholder="e.g. 40"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* Next service distance */}
          <Text style={styles.fieldLabel}>Next service after (distance)</Text>
          <View style={styles.chipsRow}>
            {INTERVAL_CHIPS.map((km) => {
              const active = interval === String(km);
              return (
                <TouchableOpacity
                  key={km}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setInterval(String(km))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {km.toLocaleString("en-IN")} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            value={interval}
            onChangeText={onKmChange(setInterval)}
            placeholder="Custom distance (km)"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            style={[styles.input, { marginTop: SIZES.xs }]}
          />

          {/* Prediction preview */}
          {(nextServiceKm || predictedDate) && (
            <View style={styles.previewBox}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
              <Text style={styles.previewText}>
                Next service
                {nextServiceKm ? ` at ~${nextServiceKm.toLocaleString("en-IN")} km` : ""}
                {predictedDate ? ` · around ${formatDate(predictedDate)}` : ""}
              </Text>
            </View>
          )}

          <View style={styles.channelHint}>
            <Ionicons name="logo-whatsapp" size={13} color={COLORS.success} />
            <Text style={styles.channelHintText}>
              Reminder goes out on WhatsApp + app notification near the due date.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer — lifted above the floating bottom tab bar */}
      <View style={[styles.footer, { marginBottom: tabBarHeight }]}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => goToInvoice(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <AppButton
          title="Save & Continue"
          variant="gradient"
          size="lg"
          onPress={() => goToInvoice(true)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 40 },

  // Intro
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  introText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  // Vehicle card
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  vehicleIcon: {
    width: 46,
    height: 46,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  vehicleMeta: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
  },
  autoBadgeText: {
    fontFamily: FONTS.semibold,
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // Form card
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
    marginBottom: SIZES.sm,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    marginBottom: 5,
    marginTop: SIZES.sm,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: Platform.OS === "ios" ? 11 : 9,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  row: { flexDirection: "row", gap: SIZES.sm },
  half: { flex: 1 },

  chipsRow: { flexDirection: "row", gap: SIZES.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  chipTextActive: { color: COLORS.primary },

  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: SIZES.sm,
    marginTop: SIZES.md,
  },
  previewText: {
    flex: 1,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textPrimary,
  },

  channelHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.sm,
  },
  channelHintText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  skipBtn: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSection,
  },
  skipBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textSecondary,
  },
});
