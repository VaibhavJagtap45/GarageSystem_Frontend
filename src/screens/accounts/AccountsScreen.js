import { useState, useCallback, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import {
  COLORS, FONTS, SIZES, SHADOWS,
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
  { id: "EXPENSE",       label: "EXPENSE" },
  { id: "PART_PURCHASE", label: "PART PURCHASE" },
  { id: "INCOME",        label: "INCOME" },
];

const PERIOD_OPTIONS = [
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_MONTH", label: "Last Month" },
  { value: "THIS_YEAR",  label: "This Year" },
];

const EXPENSE_CATEGORIES = [
  "rent","salary","utilities","repairs","fuel","food","misc","other",
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const PAYMENT_METHODS = ["CASH","CARD","UPI","BANK","OTHER"].map((v) => ({ value: v, label: v }));

function getDateRange(period) {
  const now = new Date();
  if (period === "THIS_MONTH") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      dateTo:   now.toISOString(),
    };
  }
  if (period === "LAST_MONTH") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      dateTo:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
    };
  }
  if (period === "THIS_YEAR") {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
      dateTo:   now.toISOString(),
    };
  }
  return {};
}

function fmt(n) { return `₹${Number(n || 0).toFixed(2)}`; }

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── UI sub-components ───────────────────────────────────────────────────────
function SummaryCard({ total = 0, paid = 0, credit = 0 }) {
  return (
    <View style={s.summaryCard}>
      <View style={s.legendRow}>
        <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.success }]} /><Text style={s.legendText}>Paid</Text></View>
        <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.error }]} /><Text style={s.legendText}>Credit / Unpaid</Text></View>
      </View>
      <View style={s.statsRow}>
        <View style={s.statCol}>
          <Text style={s.statHeading}>TOTAL</Text>
          <Text style={s.statAmount}>{fmt(total)}</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statHeading, { color: COLORS.success }]}>PAID</Text>
          <Text style={[s.statAmount, { color: COLORS.success }]}>{fmt(paid)}</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statHeading, { color: COLORS.error }]}>CREDIT</Text>
          <Text style={[s.statAmount, { color: COLORS.error }]}>{fmt(credit)}</Text>
        </View>
      </View>
    </View>
  );
}

function ExpenseItem({ item, onDelete }) {
  return (
    <View style={s.listRow}>
      <View style={[s.categoryBadge, item.paidStatus === "credit" && s.categoryBadgeCredit]}>
        <Text style={s.categoryBadgeText}>{item.category?.toUpperCase()}</Text>
      </View>
      <View style={s.listInfo}>
        <Text style={s.listName} numberOfLines={1}>{item.description || item.category}</Text>
        <Text style={s.listDate}>{formatDate(item.date)} · {item.paymentMethod}</Text>
      </View>
      <View style={s.listRight}>
        <Text style={[s.listAmount, item.paidStatus === "credit" && { color: COLORS.error }]}>
          {fmt(item.amount)}
        </Text>
        <TouchableOpacity onPress={() => onDelete(item._id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={14} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StockInItem({ item }) {
  return (
    <View style={s.listRow}>
      <View style={s.listAvatarWrap}>
        <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
      </View>
      <View style={s.listInfo}>
        <Text style={s.listName} numberOfLines={1}>
          {item.vendorId?.fullName || "Direct Purchase"} · {item.invoiceNo || "—"}
        </Text>
        <Text style={s.listDate}>{formatDate(item.date)} · {item.paymentChannel}</Text>
      </View>
      <View style={s.listRight}>
        <Text style={s.listAmount}>{fmt(item.totalAmount)}</Text>
        <Text style={[s.listSubAmt, { color: COLORS.success }]}>Paid: {fmt(item.paidAmount)}</Text>
      </View>
    </View>
  );
}

function InvoiceItem({ item }) {
  const name = item.customerId?.fullName || "Counter Sale";
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={s.listRow}>
      <View style={s.incomeAvatar}><Text style={s.incomeAvatarText}>{initial}</Text></View>
      <View style={s.listInfo}>
        <Text style={s.listName} numberOfLines={1}>{name}</Text>
        <Text style={s.listDate}>{formatDate(item.createdAt)} · {item.invoiceNo || "—"}</Text>
      </View>
      <View style={s.listRight}>
        <Text style={[s.listAmount, { color: COLORS.success }]}>{fmt(item.totalAmount)}</Text>
        <Text style={[s.listSubAmt, {
          color: item.paymentStatus === "paid" ? COLORS.success
               : item.paymentStatus === "partial" ? COLORS.warning
               : COLORS.error,
        }]}>
          {item.paymentStatus?.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function VendorsDueModal({ visible, onClose, vendors, loading }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Vendors Due</Text>
          <TouchableOpacity onPress={onClose} style={s.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : vendors.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={52} color={COLORS.success} />
            <Text style={s.emptyText}>No pending vendor dues!</Text>
          </View>
        ) : (
          <FlatList
            data={vendors}
            keyExtractor={(item) => String(item.vendor?._id)}
            contentContainerStyle={{ padding: SIZES.screenPadding, gap: SIZES.sm }}
            renderItem={({ item }) => (
              <View style={s.vendorDueRow}>
                <View style={s.vendorDueLeft}>
                  <Text style={s.vendorDueName}>{item.vendor?.fullName || "—"}</Text>
                  <Text style={s.vendorDueMeta}>{item.orderCount} order{item.orderCount !== 1 ? "s" : ""} pending</Text>
                </View>
                <Text style={s.vendorDueAmt}>{fmt(item.totalDue)}</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function AddExpenseModal({ visible, onClose, onSaved }) {
  const [category,      setCategory]      = useState("misc");
  const [description,   setDescription]   = useState("");
  const [amount,        setAmount]        = useState("");
  const [date,          setDate]          = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidStatus,    setPaidStatus]    = useState("paid");
  const [saving,        setSaving]        = useState(false);

  const reset = () => {
    setCategory("misc"); setDescription(""); setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("CASH"); setPaidStatus("paid");
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post(EXPENSE_ENDPOINTS.CREATE, {
        category, description: description.trim(), amount: Number(amount),
        date, paymentMethod, paidStatus,
      });
      reset();
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Add Expense</Text>
          <TouchableOpacity onPress={onClose} style={s.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
          <AppSelect label="Category" icon="layers-outline" options={EXPENSE_CATEGORIES} value={category} onChange={setCategory} />
          <AppInput label="Description" icon="text-outline" value={description} onChangeText={setDescription} placeholder="What is this expense for?" />
          <AppInput label="Amount (₹)" icon="cash-outline" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />
          <AppInput label="Date" icon="calendar-outline" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <AppSelect label="Payment Method" icon="card-outline" options={PAYMENT_METHODS} value={paymentMethod} onChange={setPaymentMethod} />
          <AppSelect
            label="Status"
            icon="checkmark-circle-outline"
            options={[{ value: "paid", label: "Paid" }, { value: "credit", label: "Credit / Pending" }]}
            value={paidStatus}
            onChange={setPaidStatus}
          />
          <AppButton title={saving ? "Saving…" : "Save Expense"} variant="gradient" size="lg" onPress={handleSave} disabled={saving} style={{ marginTop: SIZES.md }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AccountsScreen() {
  const navigation = useNavigation();
  const [activeTab,    setActiveTab]    = useState("EXPENSE");
  const [period,       setPeriod]       = useState("THIS_MONTH");
  const [periodIdx,    setPeriodIdx]    = useState(0);

  // Stats
  const [expStats,  setExpStats]  = useState({ total: 0, paid: 0, credit: 0 });
  const [poStats,   setPOStats]   = useState({ total: 0, paid: 0, credit: 0 });
  const [incStats,  setIncStats]  = useState({ total: 0, paid: 0, credit: 0 });

  // Lists
  const [expenses,  setExpenses]  = useState([]);
  const [stockIns,  setStockIns]  = useState([]);
  const [invoices,  setInvoices]  = useState([]);

  // Vendors due
  const [vendors,      setVendors]      = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Modals
  const [showAddExp,    setShowAddExp]    = useState(false);
  const [showVendorDue, setShowVendorDue] = useState(false);

  const [loading, setLoading] = useState(true);

  const cyclePeriod = () => {
    const next = (periodIdx + 1) % PERIOD_OPTIONS.length;
    setPeriodIdx(next);
    setPeriod(PERIOD_OPTIONS[next].value);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const range = getDateRange(period);
    try {
      const [expStatsRes, poStatsRes, incStatsRes, expListRes, poListRes, incListRes] = await Promise.allSettled([
        axiosClient.get(EXPENSE_ENDPOINTS.STATS,  { params: range }),
        axiosClient.get(STOCK_IN_ENDPOINTS.STATS,  { params: range }),
        axiosClient.get(INVOICE_ENDPOINTS.STATS,   { params: range }),
        axiosClient.get(EXPENSE_ENDPOINTS.LIST,    { params: { ...range, limit: 50 } }),
        axiosClient.get(STOCK_IN_ENDPOINTS.LIST,   { params: { limit: 50 } }),
        axiosClient.get(INVOICE_ENDPOINTS.LIST,    { params: { limit: 50 } }),
      ]);

      if (expStatsRes.status === "fulfilled") setExpStats(expStatsRes.value.data?.data ?? { total: 0, paid: 0, credit: 0 });
      if (poStatsRes.status  === "fulfilled") setPOStats(poStatsRes.value.data?.data  ?? { total: 0, paid: 0, credit: 0 });
      if (incStatsRes.status === "fulfilled") setIncStats(incStatsRes.value.data?.data ?? { total: 0, paid: 0, credit: 0 });
      if (expListRes.status  === "fulfilled") setExpenses(expListRes.value.data?.data?.expenses ?? []);
      if (poListRes.status   === "fulfilled") setStockIns(poListRes.value.data?.data?.records  ?? []);
      if (incListRes.status  === "fulfilled") setInvoices(incListRes.value.data?.data?.invoices ?? []);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));
  useEffect(() => { loadAll(); }, [period]);

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
        text: "Delete", style: "destructive",
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

  return (
    <SafeAreaView style={s.safeArea} edges={["bottom"]}>
      <TopNav
        title="Accounts"
        showBack
        transparent={false}
        rightElement={
          <TouchableOpacity style={s.filterBtn} activeOpacity={0.8}>
            <Ionicons name="filter" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Period Pill */}
      <View style={s.periodRow}>
        <TouchableOpacity style={s.periodPill} onPress={cyclePeriod} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={s.periodText}>{PERIOD_OPTIONS[periodIdx].label}</Text>
          <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={[s.tab, isActive && s.activeTab]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.8}>
              <Text style={[s.tabText, isActive && s.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* EXPENSE tab */}
          {activeTab === "EXPENSE" && (
            <>
              <AppButton title="+ Add Expense" variant="gradient" size="sm" fullWidth={false} style={s.tabActionBtn} onPress={() => setShowAddExp(true)} />
              <SummaryCard {...expStats} />
              {expenses.length === 0 ? (
                <View style={s.emptyWrap}><Text style={s.emptyText}>No expenses this period</Text></View>
              ) : (
                expenses.map((item) => <ExpenseItem key={item._id} item={item} onDelete={handleDeleteExpense} />)
              )}
            </>
          )}

          {/* PART PURCHASE tab */}
          {activeTab === "PART_PURCHASE" && (
            <>
              <View style={s.actionRow}>
                <AppButton
                  title="Add Part Purchase"
                  variant="gradient"
                  size="sm"
                  fullWidth={false}
                  onPress={() => navigation.navigate("Parts", { screen: "StockIn" })}
                />
                <AppButton
                  title="Vendors Due"
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  onPress={() => { loadVendorsDue(); setShowVendorDue(true); }}
                />
              </View>
              <SummaryCard {...poStats} />
              {stockIns.length === 0 ? (
                <View style={s.emptyWrap}><Text style={s.emptyText}>No part purchases yet</Text></View>
              ) : (
                stockIns.map((item) => <StockInItem key={item._id} item={item} />)
              )}
            </>
          )}

          {/* INCOME tab */}
          {activeTab === "INCOME" && (
            <>
              <SummaryCard {...incStats} />
              {invoices.length === 0 ? (
                <View style={s.emptyWrap}><Text style={s.emptyText}>No income records found</Text></View>
              ) : (
                invoices.map((item) => <InvoiceItem key={item._id} item={item} />)
              )}
            </>
          )}

        </ScrollView>
      )}

      {/* NET Footer */}
      <View style={s.netFooter}>
        <View style={s.netLeft}>
          <Text style={s.netMetaText}>Income ₹{incStats.total.toFixed(2)}</Text>
          <Text style={s.netMetaText}>Expense ₹{expStats.total.toFixed(2)}</Text>
          <Text style={s.netMetaText}>Payable ₹{poStats.credit.toFixed(2)} (Credit)</Text>
        </View>
        <View style={s.netRight}>
          <Text style={s.netLabel}>NET</Text>
          <View style={s.netAmountRow}>
            <MaterialCommunityIcons name={net >= 0 ? "arrow-up-bold" : "arrow-down-bold"} size={20} color={net >= 0 ? COLORS.success : COLORS.error} />
            <Text style={[s.netAmount, { color: net >= 0 ? COLORS.textPrimary : COLORS.error }]}>₹{Math.abs(net).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <AddExpenseModal visible={showAddExp} onClose={() => setShowAddExp(false)} onSaved={loadAll} />
      <VendorsDueModal visible={showVendorDue} onClose={() => setShowVendorDue(false)} vendors={vendors} loading={vendorsLoading} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: COLORS.bg },
  filterBtn:  { padding: 4 },
  centered:   { flex: 1, alignItems: "center", justifyContent: "center" },

  periodRow: { alignItems: "center", paddingVertical: SIZES.sm, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  periodPill:{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.bgSection, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: 5 },
  periodText:{ fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary, letterSpacing: 0.5 },

  tabsRow:    { flexDirection: "row", backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tab:        { flex: 1, alignItems: "center", paddingVertical: SIZES.sm + 4, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab:  { borderBottomColor: COLORS.primary },
  tabText:    { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, letterSpacing: 0.4 },
  activeTabText: { fontFamily: FONTS.semibold, color: COLORS.primary },

  scrollContent:{ padding: SIZES.screenPadding, paddingBottom: Platform.OS === "ios" ? 220 : 200, gap: SIZES.sm },

  tabActionBtn: { alignSelf: "flex-start", marginBottom: SIZES.xs },
  actionRow:    { flexDirection: "row", gap: SIZES.sm, flexWrap: "wrap" },

  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, ...SHADOWS.sm },
  legendRow:   { flexDirection: "row", gap: SIZES.md, justifyContent: "center", marginBottom: SIZES.md },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  dot:         { width: 10, height: 10, borderRadius: SIZES.radiusFull },
  legendText:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  statsRow:    { flexDirection: "row", justifyContent: "space-between" },
  statCol:     { flex: 1, alignItems: "center" },
  statHeading: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary, marginBottom: 4, letterSpacing: 0.3 },
  statAmount:  { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary },

  listRow:         { flexDirection: "row", alignItems: "center", paddingVertical: SIZES.sm + 2, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.sm },
  listAvatarWrap:  { width: 36, height: 36, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  categoryBadge:   { backgroundColor: COLORS.bgSection, borderRadius: SIZES.radiusSm, paddingHorizontal: 7, paddingVertical: 3, minWidth: 52, alignItems: "center" },
  categoryBadgeCredit: { backgroundColor: "#FEF2F2" },
  categoryBadgeText:   { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5 },
  listInfo:    { flex: 1 },
  listName:    { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  listDate:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  listRight:   { alignItems: "flex-end", gap: 3 },
  listAmount:  { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  listSubAmt:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs },
  incomeAvatar:    { width: 34, height: 34, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primaryDark, alignItems: "center", justifyContent: "center" },
  incomeAvatarText:{ fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.white },

  emptyWrap:  { alignItems: "center", paddingVertical: SIZES.xl },
  emptyText:  { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },

  // NET footer
  netFooter:  { position: "absolute", bottom: Platform.OS === "ios" ? 100 : 100, left: 0, right: 0, backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderColor: COLORS.borderLight, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md },
  netLeft:    { flex: 1, gap: 2 },
  netMetaText:{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  netRight:   { flexDirection: "row", alignItems: "center", gap: SIZES.xs },
  netLabel:   { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginRight: SIZES.xs },
  netAmountRow:{ flexDirection: "row", alignItems: "center", gap: 2 },
  netAmount:  { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },

  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalTitle:  { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  modalClose:  { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  modalScroll: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 80 },

  // Vendor due
  vendorDueRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, ...SHADOWS.sm },
  vendorDueLeft: { flex: 1 },
  vendorDueName: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  vendorDueMeta: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  vendorDueAmt:  { fontFamily: FONTS.bold, fontSize: SIZES.textMd, color: COLORS.error },
});
