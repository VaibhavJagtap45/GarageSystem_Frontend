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

function ReminderCard({ reminder, onMarkDone }) {
  const customer = reminder.customerId;
  const vehicle  = reminder.vehicleId;
  const phone    = customer?.phoneNo ?? "";

  const handleWhatsApp = () => {
    const num = phone.replace(/\D/g, "");
    if (!num) { Alert.alert("No Phone", "No phone number for this customer."); return; }
    Linking.openURL(`https://wa.me/91${num}`).catch(() =>
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
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name="car-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCustomer} numberOfLines={1}>
            {customer?.fullName || "—"}
          </Text>
          <Text style={styles.cardVehicle}>
            {vehicleName} · {vehicle?.vehicleRegisterNo || "—"}
          </Text>
          <Text style={styles.cardDueDate}>Due: {formatDate(reminder.dueDate)}</Text>
          {reminder.notes ? (
            <Text style={styles.cardNotes} numberOfLines={1}>{reminder.notes}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        {reminder.status !== "done" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={() => onMarkDone(reminder._id)}
            accessibilityLabel="Mark as done"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#25D366" }]}
          onPress={handleWhatsApp}
          accessibilityLabel="Send WhatsApp reminder"
          accessibilityRole="button"
        >
          <Ionicons name="logo-whatsapp" size={14} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
          onPress={handleCall}
          accessibilityLabel="Call customer"
          accessibilityRole="button"
        >
          <Ionicons name="call" size={14} color={COLORS.white} />
        </TouchableOpacity>
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
  const [activeTab,  setActiveTab]  = useState("due");
  const [reminders,  setReminders]  = useState([]);
  const [counts,     setCounts]     = useState({ due: 0, overdue: 0, done: 0 });
  const [loading,    setLoading]    = useState(true);

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
            <ReminderCard reminder={item} onMarkDone={handleMarkDone} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
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
    marginTop: 2,
    fontStyle: "italic",
  },
  cardActions: { flexDirection: "row", gap: SIZES.xs },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
