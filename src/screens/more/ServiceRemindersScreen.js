import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { COLORS, FONTS, SIZES, SHADOWS, SERVICE_REMINDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const TAB_IDS = ["due", "overdue", "done"];
const TAB_LABELS = { due: "DUE", overdue: "OVERDUE", done: "DONE" };

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Whole calendar days from today until the due date (negative ⇒ overdue).
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.round((startOfDay(dateStr) - startOfDay(new Date())) / DAY_MS);
}

// Drives the countdown pill + "time to remind" banner on each card.
// `sendReady` is true once we're inside the reminder's notify window
// (dueDate − notifyDaysBefore) — i.e. it's time to message the customer.
function countdownInfo(reminder) {
  if (reminder.status === "done") {
    return { big: "✓", unit: "DONE", color: COLORS.success, bg: COLORS.successLight, banner: null, sendReady: false };
  }

  const days = daysUntil(reminder.dueDate);
  if (days == null) {
    return { big: "—", unit: "NO DATE", color: COLORS.textMuted, bg: COLORS.bgSection, banner: null, sendReady: false };
  }

  if (days < 0) {
    const n = Math.abs(days);
    return {
      big: String(n),
      unit: n === 1 ? "DAY OVERDUE" : "DAYS OVERDUE",
      color: COLORS.error,
      bg: COLORS.errorLight,
      banner: "Overdue — message the customer now",
      sendReady: true,
    };
  }
  if (days === 0) {
    return {
      big: "0",
      unit: "DUE TODAY",
      color: COLORS.error,
      bg: COLORS.errorLight,
      banner: "Due today — message the customer now",
      sendReady: true,
    };
  }

  const lead = Number(reminder.notifyDaysBefore) || 0;
  const sendReady = days <= lead;
  return {
    big: String(days),
    unit: days === 1 ? "DAY LEFT" : "DAYS LEFT",
    color: sendReady ? COLORS.warning : COLORS.primary,
    bg: sendReady ? COLORS.warningLight : COLORS.primaryLight,
    banner: sendReady ? "Reminder window open — message the customer now" : null,
    sendReady,
  };
}

// Pre-filled WhatsApp reminder text so staff only have to hit "send".
// Mirrors the server-side buildReminderWhatsApp() copy for consistency.
function buildReminderMessage(reminder, garageName) {
  const customer = reminder.customerId;
  const vehicle = reminder.vehicleId;
  const vehicleLabel = vehicle
    ? [vehicle.vehicleBrand, vehicle.vehicleModel].filter(Boolean).join(" ") ||
      vehicle.vehicleRegisterNo
    : null;
  const dueDateLabel = reminder.dueDate ? formatDate(reminder.dueDate) : null;
  const service = reminder.serviceLabel || "your next service";

  const lines = [
    `Hi ${customer?.fullName || "there"}! 🔔`,
    "",
    `This is a friendly reminder that *${service}*` +
      (vehicleLabel ? ` for ${vehicleLabel}` : "") +
      ` is due${reminder.nextServiceKm ? ` around ${reminder.nextServiceKm} km` : ""}` +
      (dueDateLabel ? ` (${dueDateLabel})` : " soon") +
      ".",
    "",
    `Reply or call us to book a slot at *${garageName || "our garage"}*. See you soon! 🛵`,
  ];
  return lines.join("\n");
}

function CardAction({ icon, label, color, bg, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.actBtn, { backgroundColor: bg }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={16} color={color} />
      )}
      <Text style={[styles.actBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReminderCard({ reminder, garageName, onMarkDone, onNotify, sending }) {
  const customer = reminder.customerId;
  const vehicle  = reminder.vehicleId;
  const phone    = customer?.phoneNo ?? "";
  const cd       = countdownInfo(reminder);
  const isDone   = reminder.status === "done";

  const handleWhatsApp = () => {
    const num = phone.replace(/\D/g, "");
    if (!num) { Alert.alert("No Phone", "No phone number for this customer."); return; }
    const text = encodeURIComponent(buildReminderMessage(reminder, garageName));
    Linking.openURL(`https://wa.me/91${num}?text=${text}`).catch(() =>
      Alert.alert("WhatsApp", "Could not open WhatsApp.")
    );
  };

  const handleCall = () => {
    if (!phone) { Alert.alert("No Phone", "No phone number for this customer."); return; }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Call Failed", "Could not place the call.")
    );
  };

  const vehicleName = [vehicle?.vehicleBrand, vehicle?.vehicleModel]
    .filter(Boolean).join(" ") || "—";

  return (
    <View style={[styles.card, cd.sendReady && !isDone && styles.cardUrgent]}>
      {/* Top: customer info + days-remaining pill */}
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons name="car-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCustomer} numberOfLines={1}>
            {customer?.fullName || "—"}
          </Text>
          <Text style={styles.cardVehicle} numberOfLines={1}>
            {vehicleName} · {vehicle?.vehicleRegisterNo || "—"}
          </Text>
          {reminder.serviceLabel ? (
            <Text style={styles.cardService} numberOfLines={1}>
              {reminder.serviceLabel}
              {reminder.nextServiceKm ? ` · ${reminder.nextServiceKm} km` : ""}
            </Text>
          ) : null}
          <Text style={styles.cardDueDate}>Next service: {formatDate(reminder.dueDate)}</Text>
        </View>

        <View style={[styles.countdownPill, { backgroundColor: cd.bg }]}>
          <Text style={[styles.countdownBig, { color: cd.color }]}>{cd.big}</Text>
          <Text style={[styles.countdownUnit, { color: cd.color }]}>{cd.unit}</Text>
        </View>
      </View>

      {/* "Time to remind" banner */}
      {cd.banner ? (
        <View style={[styles.banner, { backgroundColor: cd.bg }]}>
          <Ionicons name="notifications" size={13} color={cd.color} />
          <Text style={[styles.bannerText, { color: cd.color }]} numberOfLines={1}>
            {cd.banner}
          </Text>
        </View>
      ) : null}

      {reminder.notes ? (
        <Text style={styles.cardNotes} numberOfLines={2}>{reminder.notes}</Text>
      ) : null}

      {/* Actions: message (WhatsApp) + notification (push) + call + done */}
      <View style={styles.cardActions}>
        <CardAction
          icon="logo-whatsapp"
          label="Message"
          color={COLORS.white}
          bg="#25D366"
          onPress={handleWhatsApp}
        />
        <CardAction
          icon="notifications-outline"
          label="Notify"
          color={COLORS.white}
          bg={COLORS.primary}
          onPress={() => onNotify(reminder)}
          loading={sending}
        />
        <CardAction
          icon="call-outline"
          label="Call"
          color={COLORS.textSecondary}
          bg={COLORS.bgSection}
          onPress={handleCall}
        />
        {!isDone ? (
          <CardAction
            icon="checkmark-done-outline"
            label="Done"
            color={COLORS.success}
            bg={COLORS.successLight}
            onPress={() => onMarkDone(reminder._id)}
          />
        ) : null}
      </View>
    </View>
  );
}

function RemindersEmpty() {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="notifications-off-outline" size={64} color={COLORS.borderLight} />
      <Text style={styles.emptyText}>No reminders found</Text>
    </View>
  );
}

export default function ServiceRemindersScreen() {
  const garageName = useSelector((s) => s.auth.garage?.garageName) || "our garage";
  const [activeTab,  setActiveTab]  = useState("due");
  const [reminders,  setReminders]  = useState([]);
  const [counts,     setCounts]     = useState({ due: 0, overdue: 0, done: 0 });
  const [loading,    setLoading]    = useState(true);
  const [sendingId,  setSendingId]  = useState(null);

  const fetchReminders = useCallback(async (tab) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(SERVICE_REMINDER_ENDPOINTS.LIST, {
        params: { tab, limit: 100 },
      });
      setReminders(res.data?.data?.reminders ?? []);
      if (res.data?.data?.counts) setCounts(res.data.data.counts);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchReminders(activeTab); }, [activeTab, fetchReminders]),
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchReminders(tab);
  };

  const handleMarkDone = async (id) => {
    try {
      await axiosClient.put(SERVICE_REMINDER_ENDPOINTS.MARK_DONE(id));
      fetchReminders(activeTab);
    } catch {
      Alert.alert("Error", "Could not mark reminder as done.");
    }
  };

  // Server-side dispatch: fires the customer's app notification (and a
  // WhatsApp message too when the garage has the WhatsApp API configured).
  const handleNotify = async (reminder) => {
    setSendingId(reminder._id);
    try {
      await axiosClient.post(SERVICE_REMINDER_ENDPOINTS.SEND(reminder._id));
      Alert.alert(
        "Reminder Sent",
        `${reminder.customerId?.fullName || "The customer"} has been notified about their next service.`,
      );
      fetchReminders(activeTab);
    } catch (e) {
      Alert.alert(
        "Couldn't Notify",
        e?.displayMessage || "Could not send the notification. Please try again.",
      );
    } finally {
      setSendingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Service Reminders" transparent={false} showBack />

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TAB_IDS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
              <View style={[styles.tabBadge, tab === "overdue" && styles.tabBadgeRed]}>
                <Text style={styles.tabBadgeText}>{counts[tab] ?? 0}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : reminders.length === 0 ? (
        <RemindersEmpty />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              garageName={garageName}
              onMarkDone={handleMarkDone}
              onNotify={handleNotify}
              sending={sendingId === item._id}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  tabsBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.md,
    gap: SIZES.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: "#F97316",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    minWidth: 22,
    alignItems: "center",
  },
  tabBadgeRed: { backgroundColor: COLORS.error },
  tabBadgeText: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.white },

  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
  },

  listContent: { padding: SIZES.screenPadding, paddingBottom: 120 },
  separator:   { height: SIZES.sm },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  // Subtle accent when it's time to message the customer.
  cardUrgent: {
    borderColor: COLORS.warning,
    borderLeftWidth: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardCustomer: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  cardVehicle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardService: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    marginTop: 2,
  },
  cardDueDate: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardNotes: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },

  // ── Days-remaining countdown pill ─────────────────────────────
  countdownPill: {
    minWidth: 66,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownBig: {
    fontFamily: FONTS.extrabold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  countdownUnit: {
    fontFamily: FONTS.bold,
    fontSize: 8.5,
    letterSpacing: 0.4,
    marginTop: 1,
  },

  // ── "Time to remind" banner ───────────────────────────────────
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  bannerText: {
    flex: 1,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },

  // ── Action buttons row ────────────────────────────────────────
  cardActions: {
    flexDirection: "row",
    gap: SIZES.xs,
    marginTop: 2,
  },
  actBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: SIZES.radiusSm,
  },
  actBtnLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },
});
