import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  EXPENSE_ENDPOINTS,
  STOCK_IN_ENDPOINTS,
  INVOICE_ENDPOINTS,
  PURCHASE_ORDER_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import AppSelect from "../../components/ui/AppSelect";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "EXPENSE", label: "Expense", icon: "trending-down-outline" },
  { id: "PART_PURCHASE", label: "Purchase", icon: "cube-outline" },
  { id: "INCOME", label: "Income", icon: "trending-up-outline" },
];

const PERIOD_OPTIONS = [
  { value: "THIS_MONTH", label: "This Month", short: "MTD" },
  { value: "LAST_MONTH", label: "Last Month", short: "LM" },
  { value: "THIS_YEAR", label: "This Year", short: "YTD" },
];

const EXPENSE_CATEGORIES = [
  "rent",
  "salary",
  "utilities",
  "repairs",
  "fuel",
  "food",
  "misc",
  "other",
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const PAYMENT_METHODS = ["CASH", "CARD", "UPI", "BANK", "OTHER"].map((v) => ({
  value: v,
  label: v,
}));

const CATEGORY_ICONS = {
  rent: "home-outline",
  salary: "people-outline",
  utilities: "flash-outline",
  repairs: "construct-outline",
  fuel: "car-outline",
  food: "restaurant-outline",
  misc: "ellipsis-horizontal",
  other: "pricetag-outline",
};

function getDateRange(period) {
  const now = new Date();
  if (period === "THIS_MONTH") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      dateTo: now.toISOString(),
    };
  }
  if (period === "LAST_MONTH") {
    return {
      dateFrom: new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      ).toISOString(),
      dateTo: new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      ).toISOString(),
    };
  }
  if (period === "THIS_YEAR") {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
      dateTo: now.toISOString(),
    };
  }
  return {};
}

function fmtINR(n) {
  const num = Number(n || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function fmt(n) {
  return `₹${fmtINR(n)}`;
}
function fmtCompact(n) {
  const num = Number(n || 0);
  if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, bg, trend }) {
  return (
    <View style={[s.kpiCard, { backgroundColor: bg }]}>
      <View style={s.kpiTop}>
        <View style={[s.kpiIcon, { backgroundColor: COLORS.white }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        {trend && (
          <View style={s.kpiTrend}>
            <Ionicons
              name={trend > 0 ? "caret-up" : "caret-down"}
              size={9}
              color={trend > 0 ? COLORS.success : COLORS.error}
            />
          </View>
        )}
      </View>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({
  total = 0,
  paid = 0,
  credit = 0,
  gradient = COLORS.gradPrimary,
  label = "TOTAL",
  icon = "wallet-outline",
}) {
  const safeTotal = Math.max(total, paid + credit);
  const paidPct = safeTotal > 0 ? Math.min(100, (paid / safeTotal) * 100) : 0;
  const creditPct =
    safeTotal > 0 ? Math.min(100, (credit / safeTotal) * 100) : 0;
  const paidRatio = safeTotal > 0 ? Math.round((paid / safeTotal) * 100) : 0;

  return (
    <View style={s.summaryCard}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.summaryHeader}
      >
        <View style={s.summaryHeaderTop}>
          <View style={s.summaryHeaderBadge}>
            <Ionicons name={icon} size={11} color={COLORS.white} />
            <Text style={s.summaryHeaderBadgeText}>{label}</Text>
          </View>
          {safeTotal > 0 && (
            <View style={s.summaryRatio}>
              <Text style={s.summaryRatioText}>{paidRatio}% Collected</Text>
            </View>
          )}
        </View>
        <Text style={s.summaryHeaderAmt}>{fmt(total)}</Text>
        <View style={s.summaryHeaderBottom}>
          <View style={s.summaryProgress}>
            {paidPct > 0 && (
              <View style={[s.summaryProgressPaid, { width: `${paidPct}%` }]} />
            )}
            {creditPct > 0 && (
              <View
                style={[s.summaryProgressCredit, { width: `${creditPct}%` }]}
              />
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={s.summaryFooter}>
        <View style={s.summaryFooterCol}>
          <View style={s.summaryFooterLabel}>
            <View style={[s.dot, { backgroundColor: COLORS.success }]} />
            <Text style={s.summaryFooterLabelText}>PAID</Text>
          </View>
          <Text style={[s.summaryFooterAmt, { color: COLORS.success }]}>
            {fmt(paid)}
          </Text>
        </View>
        <View style={s.summaryFooterDivider} />
        <View style={s.summaryFooterCol}>
          <View style={s.summaryFooterLabel}>
            <View style={[s.dot, { backgroundColor: COLORS.error }]} />
            <Text style={s.summaryFooterLabelText}>CREDIT</Text>
          </View>
          <Text style={[s.summaryFooterAmt, { color: COLORS.error }]}>
            {fmt(credit)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, action }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionHeaderLeft}>
        <Text style={s.sectionHeaderTitle}>{title}</Text>
        {typeof count === "number" && count > 0 && (
          <View style={s.sectionCountPill}>
            <Text style={s.sectionCountText}>{count}</Text>
          </View>
        )}
      </View>
      {action}
    </View>
  );
}

// ─── List Items ───────────────────────────────────────────────────────────────
function ExpenseItem({ item, onDelete, showBranch }) {
  const isCredit = item.paidStatus === "credit";
  const iconName = CATEGORY_ICONS[item.category] || "pricetag-outline";
  const branchName = item.garageId?.garageName;
  return (
    <View style={s.cardRow}>
      <View style={[s.iconLeft, isCredit ? s.iconLeftCredit : s.iconLeftMuted]}>
        <Ionicons
          name={iconName}
          size={17}
          color={isCredit ? COLORS.error : COLORS.textSecondary}
        />
      </View>
      <View style={s.listInfo}>
        <View style={s.listNameRow}>
          <Text style={s.listName} numberOfLines={1}>
            {item.description ||
              item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
          </Text>
          {isCredit && (
            <View style={s.creditTag}>
              <Text style={s.creditTagText}>UNPAID</Text>
            </View>
          )}
        </View>
        <View style={s.metaRow}>
          {showBranch && branchName ? (
            <>
              <Ionicons name="business-outline" size={10} color={COLORS.primary} />
              <Text style={[s.listDate, { color: COLORS.primary }]}>{branchName}</Text>
              <View style={s.metaSep} />
            </>
          ) : null}
          <Text style={s.metaCategory}>{item.category?.toUpperCase()}</Text>
          <View style={s.metaSep} />
          <Text style={s.listDate}>{relativeDate(item.date)}</Text>
          <View style={s.metaSep} />
          <Ionicons name="card-outline" size={10} color={COLORS.textMuted} />
          <Text style={s.listDate}>{item.paymentMethod}</Text>
        </View>
      </View>
      <View style={s.listRight}>
        <Text style={[s.listAmount, isCredit && { color: COLORS.error }]}>
          {fmt(item.amount)}
        </Text>
        <TouchableOpacity
          onPress={() => onDelete(item._id)}
          hitSlop={10}
          style={s.deleteBtn}
        >
          <Ionicons name="trash-outline" size={13} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StockInItem({ item, showBranch }) {
  const total = Number(item.totalAmount) || 0;
  const paid = Number(item.paidAmount) || 0;
  const due = total - paid;
  const fullyPaid = due <= 0;
  const branchName = item.garageId?.garageName;
  return (
    <View style={s.cardRow}>
      <View style={[s.iconLeft, s.iconLeftBrand]}>
        <Ionicons name="cube-outline" size={17} color={COLORS.primary} />
      </View>
      <View style={s.listInfo}>
        <View style={s.listNameRow}>
          <Text style={s.listName} numberOfLines={1}>
            {item.vendorId?.fullName || "Direct Purchase"}
          </Text>
        </View>
        <View style={s.metaRow}>
          {showBranch && branchName ? (
            <>
              <Ionicons name="business-outline" size={10} color={COLORS.primary} />
              <Text style={[s.listDate, { color: COLORS.primary }]}>{branchName}</Text>
              <View style={s.metaSep} />
            </>
          ) : null}
          <Text style={s.metaInvoice}>#{item.invoiceNo || "—"}</Text>
          <View style={s.metaSep} />
          <Text style={s.listDate}>{relativeDate(item.date)}</Text>
          <View style={s.metaSep} />
          <Text style={s.listDate}>{item.paymentChannel}</Text>
        </View>
      </View>
      <View style={s.listRight}>
        <Text style={s.listAmount}>{fmt(total)}</Text>
        {fullyPaid ? (
          <View style={s.paidPill}>
            <Ionicons
              name="checkmark-circle"
              size={10}
              color={COLORS.success}
            />
            <Text style={s.paidPillText}>Paid</Text>
          </View>
        ) : (
          <View style={s.duePill}>
            <Text style={s.duePillText}>Due {fmtCompact(due)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function InvoiceItem({ item, showBranch }) {
  const name = item.customerId?.fullName || "Counter Sale";
  const initial = name.charAt(0).toUpperCase();
  const status = item.paymentStatus;
  const branchName = item.garageId?.garageName;
  const statusColor =
    status === "paid"
      ? COLORS.success
      : status === "partial"
        ? COLORS.warning
        : COLORS.error;
  const statusBg =
    status === "paid"
      ? COLORS.successLight
      : status === "partial"
        ? COLORS.warningLight
        : COLORS.errorLight;
  return (
    <View style={s.cardRow}>
      <LinearGradient
        colors={COLORS.gradPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.incomeAvatar}
      >
        <Text style={s.incomeAvatarText}>{initial}</Text>
      </LinearGradient>
      <View style={s.listInfo}>
        <View style={s.listNameRow}>
          <Text style={s.listName} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={s.metaRow}>
          {showBranch && branchName ? (
            <>
              <Ionicons name="business-outline" size={10} color={COLORS.primary} />
              <Text style={[s.listDate, { color: COLORS.primary }]}>{branchName}</Text>
              <View style={s.metaSep} />
            </>
          ) : null}
          <Text style={s.metaInvoice}>#{item.invoiceNo || "—"}</Text>
          <View style={s.metaSep} />
          <Text style={s.listDate}>{relativeDate(item.createdAt)}</Text>
        </View>
      </View>
      <View style={s.listRight}>
        <Text style={[s.listAmount, { color: COLORS.success }]}>
          {fmt(item.totalAmount)}
        </Text>
        <View style={[s.statusPill, { backgroundColor: statusBg }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusPillText, { color: statusColor }]}>
            {status?.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Vendors Due Modal ────────────────────────────────────────────────────────
function VendorsDueModal({ visible, onClose, vendors, loading }) {
  const totalDue = vendors.reduce(
    (sum, v) => sum + (Number(v.totalDue) || 0),
    0,
  );
  const totalOrders = vendors.reduce(
    (sum, v) => sum + (Number(v.orderCount) || 0),
    0,
  );
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={s.modalHeader}>
          <View>
            <Text style={s.modalTitle}>Vendors Due</Text>
            <Text style={s.modalSubtitle}>Outstanding payments to vendors</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.modalClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={s.loadingText}>Loading vendor dues…</Text>
          </View>
        ) : vendors.length === 0 ? (
          <View style={s.emptyWrap}>
            <View
              style={[
                s.emptyIconCircle,
                { backgroundColor: COLORS.successLight },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={COLORS.success}
              />
            </View>
            <Text style={s.emptyTitle}>All Cleared!</Text>
            <Text style={s.emptyText}>No pending vendor dues</Text>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={["#FEF2F2", "#FFFFFF"]}
              style={s.dueSummaryStrip}
            >
              <View style={s.dueSummaryLeft}>
                <Text style={s.dueSummaryLabel}>Total Outstanding</Text>
                <Text style={s.dueSummaryAmt}>{fmt(totalDue)}</Text>
              </View>
              <View style={s.dueSummaryRight}>
                <Text style={s.dueSummaryMetaValue}>{vendors.length}</Text>
                <Text style={s.dueSummaryMetaLabel}>Vendors</Text>
              </View>
              <View style={s.dueDivider} />
              <View style={s.dueSummaryRight}>
                <Text style={s.dueSummaryMetaValue}>{totalOrders}</Text>
                <Text style={s.dueSummaryMetaLabel}>Orders</Text>
              </View>
            </LinearGradient>
            <FlatList
              data={vendors}
              keyExtractor={(item) => String(item.vendor?._id)}
              contentContainerStyle={{
                padding: SIZES.screenPadding,
                gap: SIZES.sm,
              }}
              renderItem={({ item }) => (
                <View style={s.vendorDueRow}>
                  <View style={s.vendorDueAvatar}>
                    <Text style={s.vendorDueAvatarText}>
                      {(item.vendor?.fullName || "—").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.vendorDueLeft}>
                    <Text style={s.vendorDueName} numberOfLines={1}>
                      {item.vendor?.fullName || "—"}
                    </Text>
                    <View style={s.vendorDueMetaRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={11}
                        color={COLORS.textMuted}
                      />
                      <Text style={s.vendorDueMeta}>
                        {item.orderCount} order
                        {item.orderCount !== 1 ? "s" : ""} pending
                      </Text>
                    </View>
                  </View>
                  <View style={s.vendorDueAmtBox}>
                    <Text style={s.vendorDueAmt}>{fmt(item.totalDue)}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.textMuted}
                    />
                  </View>
                </View>
              )}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function AddExpenseModal({ visible, onClose, onSaved }) {
  const [category, setCategory] = useState("misc");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidStatus, setPaidStatus] = useState("paid");
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateValue = useMemo(() => {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [date]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString().split("T")[0]);
    }
  };

  const reset = () => {
    setCategory("misc");
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("CASH");
    setPaidStatus("paid");
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }
    if (!category) {
      Alert.alert("Missing category", "Please select an expense category.");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post(EXPENSE_ENDPOINTS.CREATE, {
        category,
        description: description.trim() || undefined,
        amount: amt,
        date,
        paymentMethod,
        paidStatus,
      });
      reset();
      onSaved?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Could not save expense. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={s.modalHeader}>
          <View>
            <Text style={s.modalTitle}>New Expense</Text>
            <Text style={s.modalSubtitle}>Log a business expense</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.modalClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.modalScroll}>
          <AppSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORIES}
          />
          <AppInput
            label="Description"
            placeholder="Optional note"
            value={description}
            onChangeText={setDescription}
          />
          <AppInput
            label="Amount (₹)"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <AppInput
              label="Date"
              value={formatDate(date)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <AppSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={PAYMENT_METHODS}
          />
          <AppSelect
            label="Status"
            value={paidStatus}
            onChange={setPaidStatus}
            options={[
              { value: "paid", label: "Paid" },
              { value: "credit", label: "Credit (unpaid)" },
            ]}
          />

          <AppButton
            title={saving ? "Saving…" : "Save Expense"}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Period Picker ────────────────────────────────────────────────────────────
function PeriodSwitcher({ value, onChange }) {
  return (
    <View style={s.periodSwitcher}>
      {PERIOD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[s.periodSeg, active && s.periodSegActive]}
          >
            <Text style={[s.periodSegText, active && s.periodSegTextActive]}>
              {opt.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AccountsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("EXPENSE");
  const [period, setPeriod] = useState("THIS_MONTH");

  // Franchise branch picker
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isFranchiseView, setIsFranchiseView] = useState(false);

  // Stats
  const [expStats, setExpStats] = useState({ total: 0, paid: 0, credit: 0 });
  const [poStats, setPOStats] = useState({ total: 0, paid: 0, credit: 0 });
  const [incStats, setIncStats] = useState({ total: 0, paid: 0, credit: 0 });

  // Lists
  const [expenses, setExpenses] = useState([]);
  const [stockIns, setStockIns] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Vendors due
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Modals
  const [showAddExp, setShowAddExp] = useState(false);
  const [showVendorDue, setShowVendorDue] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const branchParam = selectedBranch || undefined;

  // Animated tab indicator
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  const loadAll = useCallback(async () => {
    const range = getDateRange(period);
    const bp = branchParam ? { branch: branchParam } : {};
    try {
      const [
        expStatsRes,
        poStatsRes,
        incStatsRes,
        expListRes,
        poListRes,
        incListRes,
      ] = await Promise.allSettled([
        axiosClient.get(EXPENSE_ENDPOINTS.STATS, { params: { ...range, ...bp } }),
        axiosClient.get(STOCK_IN_ENDPOINTS.STATS, { params: { ...range, ...bp } }),
        axiosClient.get(INVOICE_ENDPOINTS.STATS, { params: { ...range, ...bp } }),
        axiosClient.get(EXPENSE_ENDPOINTS.LIST, {
          params: { ...range, ...bp, limit: 50 },
        }),
        axiosClient.get(STOCK_IN_ENDPOINTS.LIST, { params: { ...bp, limit: 50 } }),
        axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { ...bp, limit: 50 } }),
      ]);

      if (expStatsRes.status === "fulfilled") {
        setExpStats(
          expStatsRes.value.data?.data ?? { total: 0, paid: 0, credit: 0 },
        );
      }
      if (poStatsRes.status === "fulfilled")
        setPOStats(
          poStatsRes.value.data?.data ?? { total: 0, paid: 0, credit: 0 },
        );
      if (incStatsRes.status === "fulfilled")
        setIncStats(
          incStatsRes.value.data?.data ?? { total: 0, paid: 0, credit: 0 },
        );
      if (expListRes.status === "fulfilled") {
        const d = expListRes.value.data?.data;
        setExpenses(d?.expenses ?? []);
        if (d?.isPrimaryBranch && d?.branches?.length) {
          setBranches(d.branches);
          setIsFranchiseView(true);
        }
      }
      if (poListRes.status === "fulfilled")
        setStockIns(poListRes.value.data?.data?.records ?? []);
      if (incListRes.status === "fulfilled")
        setInvoices(incListRes.value.data?.data?.invoices ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, branchParam]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAll();
    }, [loadAll]),
  );

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [period, branchParam]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const loadVendorsDue = async () => {
    setVendorsLoading(true);
    try {
      const res = await axiosClient.get(PURCHASE_ORDER_ENDPOINTS.VENDORS_DUE);
      setVendors(res.data?.data?.vendors ?? []);
    } catch {
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    Alert.alert("Delete Expense", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axiosClient.delete(EXPENSE_ENDPOINTS.DELETE(id));
            loadAll();
          } catch {
            Alert.alert("Error", "Could not delete expense.");
          }
        },
      },
    ]);
  };

  const net = incStats.total - expStats.total - poStats.credit;
  const netPositive = net >= 0;

  const periodLabel = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.value === period)?.label || "",
    [period],
  );

  // Indicator interpolation
  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["0%", "100%", "200%"],
  });

  return (
    <SafeAreaView style={s.safeArea} edges={["bottom"]}>
      <TopNav
        title={isFranchiseView ? "Franchise Accounts" : "Accounts"}
        showBack
        transparent={false}
        rightElement={
          <TouchableOpacity style={s.filterBtn} activeOpacity={0.7}>
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      {/* Sub-header: Branch picker + Period switcher + KPI overview */}
      <View style={s.subHeader}>
        {isFranchiseView && branches.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.branchPickerRow} contentContainerStyle={s.branchPickerContent}>
            <TouchableOpacity
              style={[s.branchChip, !selectedBranch && s.branchChipActive]}
              onPress={() => setSelectedBranch(null)}
            >
              <Ionicons name="home-outline" size={12} color={!selectedBranch ? COLORS.white : COLORS.textSecondary} />
              <Text style={[s.branchChipText, !selectedBranch && s.branchChipTextActive]}>My Branch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.branchChip, selectedBranch === "all" && s.branchChipActive]}
              onPress={() => setSelectedBranch("all")}
            >
              <Ionicons name="business-outline" size={12} color={selectedBranch === "all" ? COLORS.white : COLORS.textSecondary} />
              <Text style={[s.branchChipText, selectedBranch === "all" && s.branchChipTextActive]}>All Branches</Text>
            </TouchableOpacity>
            {branches.map((b) => (
              <TouchableOpacity
                key={b._id}
                style={[s.branchChip, selectedBranch === b._id && s.branchChipActive]}
                onPress={() => setSelectedBranch(b._id)}
              >
                <Text style={[s.branchChipText, selectedBranch === b._id && s.branchChipTextActive]} numberOfLines={1}>
                  {b.garageName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View style={s.subHeaderTop}>
          <View>
            <Text style={s.subHeaderEyebrow}>Showing data for</Text>
            <Text style={s.subHeaderTitle}>{periodLabel}</Text>
          </View>
          <PeriodSwitcher value={period} onChange={setPeriod} />
        </View>

        <View style={s.kpiRow}>
          <KpiCard
            label="Income"
            value={fmtCompact(incStats.total)}
            icon="trending-up"
            color={COLORS.success}
            bg={COLORS.successLight}
          />
          <KpiCard
            label="Expense"
            value={fmtCompact(expStats.total)}
            icon="trending-down"
            color={COLORS.error}
            bg={COLORS.errorLight}
          />
          <KpiCard
            label="Payable"
            value={fmtCompact(poStats.credit)}
            icon="time-outline"
            color={COLORS.warning}
            bg={COLORS.warningLight}
          />
        </View>
      </View>

      {/* Tabs with animated indicator */}
      <View style={s.tabsWrap}>
        <View style={s.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={s.tab}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[s.tabText, isActive && s.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={s.tabIndicatorTrack}>
          <Animated.View
            style={[
              s.tabIndicator,
              { transform: [{ translateX: indicatorTranslate }] },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Loading accounts…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* EXPENSE tab */}
          {activeTab === "EXPENSE" && (
            <>
              <SummaryCard
                {...expStats}
                gradient={[COLORS.error, "#C73534"]}
                label="TOTAL EXPENSE"
                icon="trending-down-outline"
              />
              <SectionHeader
                title="Recent Expenses"
                count={expenses.length}
                action={
                  <TouchableOpacity
                    style={s.headerAddBtn}
                    onPress={() => setShowAddExp(true)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={COLORS.gradPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.headerAddInner}
                    >
                      <Ionicons name="add" size={15} color={COLORS.white} />
                      <Text style={s.headerAddText}>New</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                }
              />
              {expenses.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIconCircle}>
                    <Ionicons
                      name="receipt-outline"
                      size={36}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <Text style={s.emptyTitle}>No expenses yet</Text>
                  <Text style={s.emptyText}>
                    Tap "New" to log your first expense
                  </Text>
                </View>
              ) : (
                <View style={s.listCard}>
                  {expenses.map((item, idx) => (
                    <View key={item._id}>
                      <ExpenseItem item={item} onDelete={handleDeleteExpense} showBranch={!!selectedBranch} />
                      {idx < expenses.length - 1 && (
                        <View style={s.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* PART PURCHASE tab */}
          {activeTab === "PART_PURCHASE" && (
            <>
              <SummaryCard
                {...poStats}
                gradient={[COLORS.warning, "#D9940A"]}
                label="TOTAL PURCHASE"
                icon="cube-outline"
              />
              <View style={s.actionBtnRow}>
                <TouchableOpacity
                  style={s.actionBtnPrimary}
                  onPress={() =>
                    navigation.navigate("Parts", { screen: "StockIn" })
                  }
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={COLORS.gradPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.actionBtnInner}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={COLORS.white}
                    />
                    <Text style={s.actionBtnText}>Add Purchase</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.actionBtnSecondary}
                  onPress={() => {
                    loadVendorsDue();
                    setShowVendorDue(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={COLORS.error}
                  />
                  <Text style={s.actionBtnSecondaryText}>Vendors Due</Text>
                  {poStats.credit > 0 && (
                    <View style={s.actionBtnBadge}>
                      <Text style={s.actionBtnBadgeText}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <SectionHeader title="Recent Purchases" count={stockIns.length} />
              {stockIns.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIconCircle}>
                    <Ionicons
                      name="cube-outline"
                      size={36}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <Text style={s.emptyTitle}>No purchases yet</Text>
                  <Text style={s.emptyText}>
                    Record your first part purchase
                  </Text>
                </View>
              ) : (
                <View style={s.listCard}>
                  {stockIns.map((item, idx) => (
                    <View key={item._id}>
                      <StockInItem item={item} showBranch={!!selectedBranch} />
                      {idx < stockIns.length - 1 && (
                        <View style={s.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* INCOME tab */}
          {activeTab === "INCOME" && (
            <>
              <SummaryCard
                {...incStats}
                gradient={COLORS.gradPrimary}
                label="TOTAL INCOME"
                icon="trending-up-outline"
              />
              <SectionHeader title="Recent Invoices" count={invoices.length} />
              {invoices.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIconCircle}>
                    <Ionicons
                      name="document-text-outline"
                      size={36}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <Text style={s.emptyTitle}>No invoices yet</Text>
                  <Text style={s.emptyText}>
                    Income will appear here once recorded
                  </Text>
                </View>
              ) : (
                <View style={s.listCard}>
                  {invoices.map((item, idx) => (
                    <View key={item._id}>
                      <InvoiceItem item={item} showBranch={!!selectedBranch} />
                      {idx < invoices.length - 1 && (
                        <View style={s.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* NET Footer */}
      <View style={s.netFooter}>
        <View style={s.netLeft}>
          <Text style={s.netLabel}>NET BALANCE</Text>
          <View style={s.netAmountRow}>
            <View
              style={[
                s.netAmountChip,
                {
                  backgroundColor: netPositive
                    ? COLORS.successLight
                    : COLORS.errorLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={netPositive ? "trending-up" : "trending-down"}
                size={16}
                color={netPositive ? COLORS.success : COLORS.error}
              />
            </View>
            <Text
              style={[
                s.netAmount,
                { color: netPositive ? COLORS.textPrimary : COLORS.error },
              ]}
            >
              {netPositive ? "" : "− "}₹{fmtINR(Math.abs(net))}
            </Text>
          </View>
          <Text style={s.netCaption}>Income − Expense − Payable</Text>
        </View>
        <View style={s.netRightCol}>
          <View style={s.netMiniRow}>
            <View style={[s.netMiniDot, { backgroundColor: COLORS.success }]} />
            <Text style={s.netMiniLabel}>Inc</Text>
            <Text style={s.netMiniValue}>{fmtCompact(incStats.total)}</Text>
          </View>
          <View style={s.netMiniRow}>
            <View style={[s.netMiniDot, { backgroundColor: COLORS.error }]} />
            <Text style={s.netMiniLabel}>Exp</Text>
            <Text style={s.netMiniValue}>{fmtCompact(expStats.total)}</Text>
          </View>
          <View style={s.netMiniRow}>
            <View style={[s.netMiniDot, { backgroundColor: COLORS.warning }]} />
            <Text style={s.netMiniLabel}>Pay</Text>
            <Text style={s.netMiniValue}>{fmtCompact(poStats.credit)}</Text>
          </View>
        </View>
      </View>

      <AddExpenseModal
        visible={showAddExp}
        onClose={() => setShowAddExp(false)}
        onSaved={loadAll}
      />
      <VendorsDueModal
        visible={showVendorDue}
        onClose={() => setShowVendorDue(false)}
        vendors={vendors}
        loading={vendorsLoading}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  filterBtn: { padding: 6, borderRadius: SIZES.radiusSm },

  branchPickerRow: { marginBottom: 8, maxHeight: 36 },
  branchPickerContent: { gap: 6, paddingRight: 4 },
  branchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  branchChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  branchChipText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    maxWidth: 120,
  },
  branchChipTextActive: { color: COLORS.white },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.sm,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },

  // Sub-header
  subHeader: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm + 4,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.md,
  },
  subHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subHeaderEyebrow: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subHeaderTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginTop: 2,
    letterSpacing: -0.2,
  },

  // Period switcher
  periodSwitcher: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    padding: 3,
  },
  periodSeg: {
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
    minWidth: 38,
    alignItems: "center",
  },
  periodSegActive: { backgroundColor: COLORS.bgCard, ...SHADOWS.sm },
  periodSegText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  periodSegTextActive: { color: COLORS.primary },

  // KPI strip
  kpiRow: { flexDirection: "row", gap: SIZES.sm },
  kpiCard: {
    flex: 1,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 2,
    gap: 4,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiIcon: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  kpiTrend: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: SIZES.xs,
  },
  kpiValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    letterSpacing: -0.3,
  },

  // Tabs
  tabsWrap: {
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabsRow: { flexDirection: "row" },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SIZES.sm + 4,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  activeTabText: { fontFamily: FONTS.semibold, color: COLORS.primary },
  tabIndicatorTrack: { height: 3, flexDirection: "row" },
  tabIndicator: {
    width: `${100 / 3}%`,
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  scrollContent: {
    padding: SIZES.screenPadding,
    paddingBottom: Platform.OS === "ios" ? 240 : 220,
    gap: SIZES.md,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SIZES.xs,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs + 2,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sectionCountPill: {
    backgroundColor: COLORS.bgSection,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    minWidth: 24,
    alignItems: "center",
  },
  sectionCountText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  headerAddBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  headerAddInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: 6,
  },
  headerAddText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Action button row
  actionBtnRow: { flexDirection: "row", gap: SIZES.sm },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: SIZES.radiusMd,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  actionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  actionBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: "rgba(226, 75, 74, 0.2)",
    position: "relative",
  },
  actionBtnSecondaryText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.error,
    letterSpacing: 0.2,
  },
  actionBtnBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  actionBtnBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.white,
  },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  summaryHeader: {
    padding: SIZES.md,
    paddingBottom: SIZES.md - 2,
    gap: SIZES.sm,
  },
  summaryHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  summaryHeaderBadgeText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 0.6,
  },
  summaryRatio: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  summaryRatioText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  summaryHeaderAmt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXl + 2,
    color: COLORS.white,
    letterSpacing: -0.6,
  },
  summaryHeaderBottom: { marginTop: 2 },
  summaryProgress: {
    height: 6,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryProgressPaid: { backgroundColor: "rgba(255, 255, 255, 0.95)" },
  summaryProgressCredit: { backgroundColor: "rgba(0, 0, 0, 0.18)" },

  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.bgCard,
  },
  summaryFooterCol: { flex: 1, gap: 6 },
  summaryFooterDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.sm,
  },
  summaryFooterLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  summaryFooterLabelText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  summaryFooterAmt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    letterSpacing: -0.2,
  },
  dot: { width: 8, height: 8, borderRadius: SIZES.radiusFull },

  // List card
  listCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SIZES.md + 36 + SIZES.sm,
  },

  // List rows
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
  },
  iconLeft: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeftMuted: { backgroundColor: COLORS.bgSection },
  iconLeftCredit: { backgroundColor: COLORS.errorLight },
  iconLeftBrand: { backgroundColor: COLORS.primaryLight },

  listInfo: { flex: 1 },
  listNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  listName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    flexWrap: "wrap",
  },
  metaSep: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  listDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  metaCategory: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  metaInvoice: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },

  creditTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: COLORS.errorLight,
    borderRadius: 3,
  },
  creditTagText: {
    fontFamily: FONTS.bold,
    fontSize: 8,
    color: COLORS.error,
    letterSpacing: 0.4,
  },

  listRight: { alignItems: "flex-end", gap: 5 },
  listAmount: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  deleteBtn: { padding: 2 },

  duePill: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  duePillText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.error,
    letterSpacing: 0.2,
  },
  paidPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  paidPillText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.success,
    letterSpacing: 0.2,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  statusDot: { width: 5, height: 5, borderRadius: SIZES.radiusFull },
  statusPillText: { fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 0.5 },

  incomeAvatar: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  incomeAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingVertical: SIZES.xl + SIZES.sm,
    gap: SIZES.xs,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: SIZES.xs,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.xs,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SIZES.md,
  },

  // NET footer
  netFooter: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 100,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 4,
    gap: SIZES.md,
    ...SHADOWS.lg,
  },
  netLeft: { flex: 1, gap: 2 },
  netLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  netAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs + 2,
    marginTop: 2,
  },
  netAmountChip: {
    width: 28,
    height: 28,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  netAmount: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    letterSpacing: -0.5,
  },
  netCaption: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  netRightCol: {
    gap: 4,
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderLight,
    paddingLeft: SIZES.md,
  },
  netMiniRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  netMiniDot: { width: 6, height: 6, borderRadius: SIZES.radiusFull },
  netMiniLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    minWidth: 22,
  },
  netMiniValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    minWidth: 50,
    textAlign: "right",
  },

  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  modalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
  },
  modalScroll: {
    padding: SIZES.screenPadding,
    gap: SIZES.md,
    paddingBottom: 80,
  },

  // Vendor due
  dueSummaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(226, 75, 74, 0.15)",
    gap: SIZES.md,
  },
  dueSummaryLeft: { flex: 1 },
  dueSummaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.error,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  dueSummaryAmt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.error,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  dueSummaryRight: { alignItems: "center", minWidth: 50 },
  dueSummaryMetaValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  dueSummaryMetaLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 2,
  },
  dueDivider: { width: 1, height: 32, backgroundColor: COLORS.borderLight },

  vendorDueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  vendorDueAvatar: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorDueAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primaryDark,
  },
  vendorDueLeft: { flex: 1 },
  vendorDueName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  vendorDueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  vendorDueMeta: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  vendorDueAmtBox: { flexDirection: "row", alignItems: "center", gap: 2 },
  vendorDueAmt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.error,
    letterSpacing: -0.2,
  },
});
