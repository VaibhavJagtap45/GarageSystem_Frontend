import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import Badge from "../../components/ui/Badge";

// ─── Reminder card ────────────────────────────────────────────────────────────
function ReminderCard({ reminder }) {
  const daysLeft = reminder.daysLeft;
  const variant =
    daysLeft <= 7 ? "danger" : daysLeft <= 30 ? "warning" : "success";

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCustomer} numberOfLines={1}>
            {reminder.customer}
          </Text>
          <Text style={styles.cardVehicle}>
            {reminder.vehicle} · {reminder.regNo}
          </Text>
          <Text style={styles.cardDate}>Expiry: {reminder.expiryDate}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Badge
          label={daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
          variant={variant}
        />
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Send Reminder",
              `Send insurance reminder to ${reminder.customer}?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Send", onPress: () => {} },
              ],
            )
          }
          style={styles.sendBtn}
          accessibilityLabel="Send reminder"
          accessibilityRole="button"
        >
          <Ionicons name="send-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function ReminderEmpty() {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="shield-outline" size={64} color={COLORS.borderLight} />
      <Text style={styles.emptyText}>No Reminders found</Text>
      <Text style={styles.emptySubText}>
        Insurance reminders will appear here when vehicles are due
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function InsuranceDueScreen() {
  const [reminders] = useState([]);

  const rightElement = (
    <TouchableOpacity
      onPress={() => Alert.alert("Filter", "Filter options coming soon")}
      style={styles.filterBtn}
      accessibilityLabel="Filter reminders"
      accessibilityRole="button"
    >
      <Ionicons name="filter-outline" size={20} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Insurance Due"
        transparent={false}
        rightElement={rightElement}
      />

      {reminders.length === 0 ? (
        <ReminderEmpty />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReminderCard reminder={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
    textAlign: "center",
  },
  emptySubText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
    textAlign: "center",
    lineHeight: 20,
  },

  listContent: { padding: SIZES.screenPadding, paddingBottom: 120 },
  separator: { height: SIZES.sm },

  // Card
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
  cardDate: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardRight: { alignItems: "flex-end", gap: SIZES.sm },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
