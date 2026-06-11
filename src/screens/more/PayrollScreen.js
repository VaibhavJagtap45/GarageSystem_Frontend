import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  PAYROLL_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import EmptyState from "../../components/ui/EmptyState";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import axiosClient from "../../api/axios";

// ─── Helpers ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const rupee = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

function formatPaidDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function monthParamOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Mechanic payout card ─────────────────────────────────────────────────────
function MechanicCard({ row, onEditSalary, onPay, paying }) {
  const progress = Math.min(row.servicesCompleted / (row.threshold || 1), 1);
  const isPaid = row.salaryStatus === "paid";

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Avatar name={row.fullName} size={44} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {row.fullName || "Mechanic"}
            </Text>
            <Badge
              label={isPaid ? "Paid" : "Pending"}
              variant="custom"
              color={isPaid ? COLORS.success : COLORS.warning}
            />
          </View>
          {row.bonusEligible ? (
            <View style={styles.bonusRow}>
              <Ionicons name="trophy" size={11} color={COLORS.success} />
              <Text style={styles.bonusText}>
                +{row.bonusPercent}% bonus unlocked
              </Text>
            </View>
          ) : null}
          {row.phoneNo ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{row.phoneNo}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Services completed → bonus progress */}
      <View style={styles.progressBlock}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {row.servicesCompleted} services this month
          </Text>
          <Text style={styles.progressTarget}>
            {row.bonusEligible
              ? "Bonus unlocked 🎉"
              : `${Math.max(row.threshold - row.servicesCompleted, 0)} to bonus`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: row.bonusEligible
                  ? COLORS.success
                  : COLORS.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.amountRows}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Base salary</Text>
          <Text style={styles.amountValue}>{rupee(row.baseSalary)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>
            Bonus {row.bonusEligible ? `(${row.bonusPercent}%)` : ""}
          </Text>
          <Text
            style={[
              styles.amountValue,
              row.bonusAmount > 0 && { color: COLORS.success },
            ]}
          >
            {rupee(row.bonusAmount)}
          </Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountRow}>
          <Text style={styles.totalLabel}>Total payable</Text>
          <Text style={styles.totalValue}>{rupee(row.totalPayable)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEditSalary(row)}
          activeOpacity={0.75}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit Salary</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        {isPaid ? (
          <View style={styles.actionBtn}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>
              Paid{row.paidAt ? ` · ${formatPaidDate(row.paidAt)}` : ""}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onPay(row)}
            activeOpacity={0.75}
            disabled={paying}
          >
            <Ionicons name="cash-outline" size={16} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>
              {paying ? "Recording…" : "Record Pay"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Edit-salary modal ────────────────────────────────────────────────────────
function SalaryModal({ visible, mechanic, onClose, onSaved }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && mechanic) {
      setValue(mechanic.baseSalary ? String(mechanic.baseSalary) : "");
    }
  }, [visible, mechanic]);

  const handleSave = async () => {
    const baseSalary = Number(value);
    if (Number.isNaN(baseSalary) || baseSalary < 0) {
      Alert.alert("Invalid amount", "Enter a salary of 0 or more.");
      return;
    }
    try {
      setSaving(true);
      await axiosClient.patch(PAYROLL_ENDPOINTS.SALARY(mechanic.mechanicId), {
        baseSalary,
      });
      Toast.show({
        type: "success",
        text1: "Salary updated",
        text2: `${mechanic.fullName || "Mechanic"} · ${rupee(baseSalary)} / month`,
      });
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Could not update salary.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Monthly Base Salary</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>{mechanic?.fullName || "Mechanic"}</Text>

          <AppInput
            label="Base salary (₹ / month)"
            icon="cash-outline"
            placeholder="e.g. 15000"
            value={value}
            onChangeText={(t) => setValue(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
          />

          <AppButton
            title={saving ? "Saving…" : "Save Salary"}
            variant="gradient"
            size="lg"
            onPress={handleSave}
            disabled={saving}
            style={{ marginTop: SIZES.sm }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <SkeletonListItem key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PayrollScreen() {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [salaryModal, setSalaryModal] = useState({ visible: false, mechanic: null });
  const [payingId, setPayingId] = useState(null);

  const monthParam = monthParamOf(monthDate);
  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  // Don't let the owner page into future months.
  const isCurrentMonth =
    monthDate.getFullYear() === today.getFullYear() &&
    monthDate.getMonth() === today.getMonth();

  const fetchPayroll = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        const res = await axiosClient.get(PAYROLL_ENDPOINTS.LIST, {
          params: { month: monthParam },
        });
        setData(res.data?.data ?? null);
      } catch (err) {
        setError(err.displayMessage || "Failed to load payroll.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [monthParam],
  );

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const shiftMonth = (delta) => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const handlePay = (row) => {
    if (row.totalPayable <= 0) {
      Alert.alert("Nothing to pay", "Set a base salary for this mechanic first.");
      return;
    }
    Alert.alert(
      "Record salary payment",
      `Record ${rupee(row.totalPayable)} for ${row.fullName || "this mechanic"} (${monthLabel})?\n\nThis adds a salary expense to your accounts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Record",
          onPress: async () => {
            try {
              setPayingId(row.mechanicId);
              await axiosClient.post(PAYROLL_ENDPOINTS.PAY(row.mechanicId), {
                month: monthParam,
              });
              Toast.show({
                type: "success",
                text1: "Salary recorded",
                text2: `${rupee(row.totalPayable)} · ${row.fullName || "Mechanic"} · ${monthLabel}`,
              });
              fetchPayroll();
            } catch (err) {
              Alert.alert("Error", err.displayMessage || "Could not record payment.");
            } finally {
              setPayingId(null);
            }
          },
        },
      ],
    );
  };

  const mechanics = data?.mechanics ?? [];
  const totals = data?.totals ?? {
    totalPayable: 0,
    bonusAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  };

  const renderBody = () => {
    if (loading) return <SkeletonCards />;
    if (error)
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchPayroll()}
        />
      );

    return (
      <FlatList
        data={mechanics}
        keyExtractor={(item) => item.mechanicId}
        renderItem={({ item }) => (
          <MechanicCard
            row={item}
            onEditSalary={(m) => setSalaryModal({ visible: true, mechanic: m })}
            onPay={handlePay}
            paying={payingId === item.mechanicId}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchPayroll(true)}
        refreshing={refreshing}
        ListHeaderComponent={
          data ? (
            <>
              {/* Policy hint */}
              <View style={styles.policyBanner}>
                <Ionicons name="trophy-outline" size={15} color={COLORS.primary} />
                <Text style={styles.policyText}>
                  Mechanics who complete {data.threshold}+ services in a month
                  earn a {data.bonusPercent}% bonus on base salary.
                </Text>
              </View>

              {/* Summary strip */}
              <View style={styles.summaryStrip}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                    {rupee(totals.totalPayable)}
                  </Text>
                  <Text style={styles.summaryLabel}>Payable</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    {rupee(totals.paidAmount)}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    Paid{totals.paidCount ? ` · ${totals.paidCount}` : ""}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                    {rupee(totals.pendingAmount)}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    Pending{totals.pendingCount ? ` · ${totals.pendingCount}` : ""}
                  </Text>
                </View>
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔧"
            title="No mechanics yet"
            description="Add members from Garage Users, then set their salary here."
          />
        }
      />
    );
  };

  return (
    <View style={styles.safe}>
      <TopNav title="Mechanic Payroll" transparent={false} />

      {/* Month selector */}
      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.monthBtn}
          onPress={() => shiftMonth(-1)}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.monthLabelWrap}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <TouchableOpacity
          style={[styles.monthBtn, isCurrentMonth && styles.monthBtnDisabled]}
          onPress={() => !isCurrentMonth && shiftMonth(1)}
          disabled={isCurrentMonth}
          accessibilityLabel="Next month"
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isCurrentMonth ? COLORS.textMuted : COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {renderBody()}

      <SalaryModal
        visible={salaryModal.visible}
        mechanic={salaryModal.mechanic}
        onClose={() => setSalaryModal({ visible: false, mechanic: null })}
        onSaved={() => fetchPayroll()}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Month bar
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  monthBtn: {
    width: 38,
    height: 38,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnDisabled: { opacity: 0.4 },
  monthLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  monthLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  // Policy banner
  policyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    padding: SIZES.sm + 4,
    marginBottom: SIZES.sm,
  },
  policyText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.primaryDark,
    lineHeight: 17,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 130,
  },
  skeletonWrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    gap: SIZES.sm,
  },
  skeletonCard: {
    height: 170,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.bgSection,
  },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  headerInfo: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
  },
  name: {
    flex: 1,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bonusText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.success,
  },

  // Progress
  progressBlock: { marginTop: SIZES.md, gap: 5 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  progressTarget: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bgSection,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  // Amounts
  amountRows: { marginTop: SIZES.md, gap: 6 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  amountDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  totalLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textMd,
    color: COLORS.primary,
  },

  // Card actions
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  actionDivider: { width: 1, height: 20, backgroundColor: COLORS.borderLight },

  // Salary modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : SIZES.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
});
