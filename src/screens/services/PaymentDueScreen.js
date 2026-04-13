import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_MODES = [
  { key: "cash",   label: "Cash",    icon: "cash" },
  { key: "card",   label: "Card",    icon: "credit-card-outline" },
  { key: "upi",    label: "UPI",     icon: "cellphone-nfc" },
  { key: "bank",   label: "Bank",    icon: "bank-outline" },
];

const STATUS_COLORS = {
  unpaid:  { bg: COLORS.errorLight,   color: COLORS.error },
  partial: { bg: "#FFFBEB",           color: "#BA7517" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n ? Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00";

const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function balanceDue(inv) {
  if (inv.paymentStatus === "unpaid") return inv.totalAmount ?? 0;
  return Math.max((inv.totalAmount ?? 0) - (inv.paidAmount ?? 0), 0);
}

// ─── Collect-Payment Modal ────────────────────────────────────────────────────

function CollectModal({ visible, invoice, onClose, onSuccess }) {
  const [amount, setAmount]   = useState("");
  const [mode, setMode]       = useState("cash");
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef(null);

  // Reset when invoice changes
  const open = useCallback(() => {
    if (invoice) {
      setAmount(String(balanceDue(invoice).toFixed(2)));
      setMode("cash");
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [invoice]);

  const handleSubmit = async () => {
    const paid  = parseFloat(amount) || 0;
    const total = invoice.totalAmount ?? 0;
    const prev  = invoice.paidAmount  ?? 0;
    const newPaid = prev + paid;

    if (paid <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }
    if (paid > balanceDue(invoice) + 0.01) {
      Alert.alert("Overpayment", `Maximum collectible is ₹${fmt(balanceDue(invoice))}`);
      return;
    }

    const newStatus = newPaid >= total - 0.01 ? "paid" : "partial";

    setSaving(true);
    try {
      await axiosClient.put(INVOICE_ENDPOINTS.DETAIL(invoice._id), {
        paymentStatus: newStatus,
        paidAmount:    parseFloat(newPaid.toFixed(2)),
        paymentMode:   mode,
      });
      onSuccess();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return null;
  const due = balanceDue(invoice);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={open}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={m.sheetWrap}
      >
        <View style={m.sheet}>
          {/* Handle */}
          <View style={m.handle} />

          {/* Title */}
          <Text style={m.title}>Collect Payment</Text>

          {/* Invoice summary */}
          <View style={m.invRow}>
            <View style={{ flex: 1 }}>
              <Text style={m.invNo}>{invoice.invoiceNo}</Text>
              <Text style={m.invCustomer} numberOfLines={1}>
                {invoice.customerId?.fullName ?? "Customer"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={m.dueLabel}>Balance Due</Text>
              <Text style={m.dueAmt}>₹{fmt(due)}</Text>
            </View>
          </View>

          {/* Amount input */}
          <Text style={m.fieldLabel}>Amount Received (₹)</Text>
          <TextInput
            ref={inputRef}
            style={m.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            selectTextOnFocus
          />

          {/* Payment mode */}
          <Text style={m.fieldLabel}>Payment Mode</Text>
          <View style={m.modeRow}>
            {PAYMENT_MODES.map((pm) => (
              <TouchableOpacity
                key={pm.key}
                style={[m.modeBtn, mode === pm.key && m.modeBtnActive]}
                onPress={() => setMode(pm.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={pm.icon}
                  size={18}
                  color={mode === pm.key ? COLORS.white : COLORS.textMuted}
                />
                <Text style={[m.modeTxt, mode === pm.key && m.modeTxtActive]}>
                  {pm.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={m.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={m.confirmTxt}>Record Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, onCollect }) {
  const sc  = STATUS_COLORS[invoice.paymentStatus] ?? STATUS_COLORS.unpaid;
  const due = balanceDue(invoice);

  return (
    <View style={s.card}>
      {/* Row 1: invoice no + status badge */}
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.invNo}>{invoice.invoiceNo}</Text>
          <Text style={s.customer} numberOfLines={1}>
            {invoice.customerId?.fullName ?? "Customer"}
            {invoice.customerId?.phoneNo ? ` · ${invoice.customerId.phoneNo}` : ""}
          </Text>
          {invoice.vehicleId?.vehicleRegisterNo ? (
            <Text style={s.vehicle} numberOfLines={1}>
              {invoice.vehicleId.vehicleBrand} {invoice.vehicleId.vehicleModel} · {invoice.vehicleId.vehicleRegisterNo}
            </Text>
          ) : null}
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusTxt, { color: sc.color }]}>
            {invoice.paymentStatus === "partial" ? "Partial" : "Unpaid"}
          </Text>
        </View>
      </View>

      {/* Row 2: amounts */}
      <View style={s.amtRow}>
        <View style={s.amtItem}>
          <Text style={s.amtLabel}>Invoice Total</Text>
          <Text style={s.amtValue}>₹{fmt(invoice.totalAmount)}</Text>
        </View>
        {invoice.paymentStatus === "partial" && (
          <View style={s.amtItem}>
            <Text style={s.amtLabel}>Paid</Text>
            <Text style={[s.amtValue, { color: COLORS.success }]}>₹{fmt(invoice.paidAmount)}</Text>
          </View>
        )}
        <View style={s.amtItem}>
          <Text style={s.amtLabel}>Balance Due</Text>
          <Text style={[s.amtValue, { color: COLORS.error }]}>₹{fmt(due)}</Text>
        </View>
      </View>

      {/* Row 3: date + collect button */}
      <View style={s.cardBottom}>
        <Text style={s.dateText}>{fmtD(invoice.createdAt)}</Text>
        <TouchableOpacity style={s.collectBtn} onPress={() => onCollect(invoice)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="cash-plus" size={15} color={COLORS.white} />
          <Text style={s.collectTxt}>Collect Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentDueScreen() {
  const [invoices,   setInvoices]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalDue,   setTotalDue]   = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null); // invoice for modal

  const load = useCallback(async (q = search, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const params = { paymentStatus: "unpaid,partial", limit: 200 };
      if (q.trim()) params.search = q.trim();

      // Fetch both unpaid and partial in two calls (backend filters by single value)
      const [unpaidRes, partialRes] = await Promise.allSettled([
        axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { paymentStatus: "unpaid", limit: 200, ...(q.trim() ? { search: q.trim() } : {}) } }),
        axiosClient.get(INVOICE_ENDPOINTS.LIST, { params: { paymentStatus: "partial", limit: 200, ...(q.trim() ? { search: q.trim() } : {}) } }),
      ]);

      const unpaid  = unpaidRes.status  === "fulfilled" ? (unpaidRes.value.data?.data?.invoices  ?? []) : [];
      const partial = partialRes.status === "fulfilled" ? (partialRes.value.data?.data?.invoices ?? []) : [];

      // Merge + sort by createdAt desc
      const merged = [...unpaid, ...partial].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const due = merged.reduce((s, inv) => s + balanceDue(inv), 0);
      setInvoices(merged);
      setTotal(merged.length);
      setTotalDue(due);
    } catch {
      setInvoices([]);
      setTotal(0);
      setTotalDue(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSearch = (v) => {
    setSearch(v);
    if (v.length === 0 || v.length >= 2) load(v);
  };

  const handleCollect = (invoice) => setSelected(invoice);

  const handlePaymentSuccess = () => {
    setSelected(null);
    load("", true);
  };

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Payment Due" showBack transparent={false} />

      {/* Summary banner */}
      <View style={s.banner}>
        <View style={s.bannerItem}>
          <Text style={s.bannerVal}>{total}</Text>
          <Text style={s.bannerLbl}>Invoices Pending</Text>
        </View>
        <View style={s.bannerDivider} />
        <View style={s.bannerItem}>
          <Text style={[s.bannerVal, { color: COLORS.error }]}>₹{fmt(totalDue)}</Text>
          <Text style={s.bannerLbl}>Total Outstanding</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by name, phone or invoice no…"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => load(search)}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <InvoiceCard invoice={item} onCollect={handleCollect} />
          )}
          contentContainerStyle={invoices.length === 0 ? s.emptyContainer : s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(search, true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="cash-check" size={64} color={COLORS.borderLight} />
              <Text style={s.emptyTitle}>All Payments Clear!</Text>
              <Text style={s.emptyText}>No unpaid or partial invoices found.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        />
      )}

      <CollectModal
        visible={!!selected}
        invoice={selected}
        onClose={() => setSelected(null)}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  banner: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  bannerItem: {
    flex: 1, alignItems: "center", paddingVertical: SIZES.md, gap: 2,
  },
  bannerDivider: { width: 1, backgroundColor: COLORS.borderLight },
  bannerVal: {
    fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary,
  },
  bannerLbl: {
    fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted,
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.sm,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SIZES.md,
    height: 44, ...SHADOWS.sm,
  },
  searchIcon:  { marginRight: SIZES.xs },
  searchInput: {
    flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  listContent: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },

  cardTop:    { flexDirection: "row", alignItems: "flex-start", gap: SIZES.sm },
  invNo:      { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  customer:   { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginTop: 1 },
  vehicle:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  statusBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  statusTxt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  amtRow: {
    flexDirection: "row", backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusMd, paddingVertical: SIZES.sm, overflow: "hidden",
  },
  amtItem:  { flex: 1, alignItems: "center", gap: 2 },
  amtLabel: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  amtValue: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },

  cardBottom: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  dateText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  collectBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.success, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
  },
  collectTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },

  empty: { alignItems: "center", gap: SIZES.sm, paddingTop: 80 },
  emptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  emptyText:  { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
});

// ─── Collect Modal Styles ─────────────────────────────────────────────────────

const m = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.lg, paddingBottom: Platform.OS === "ios" ? 40 : SIZES.xl,
    gap: SIZES.md,
  },
  handle: {
    alignSelf: "center", width: 40, height: 4,
    borderRadius: 2, backgroundColor: COLORS.borderLight,
    marginBottom: SIZES.xs,
  },
  title: {
    fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary,
    textAlign: "center",
  },

  invRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgSection, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, gap: SIZES.sm,
  },
  invNo:       { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  invCustomer: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginTop: 2 },
  dueLabel:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  dueAmt:      { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.error },

  fieldLabel: {
    fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textSecondary,
    marginBottom: -SIZES.xs,
  },
  input: {
    backgroundColor: COLORS.bgSection, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 2,
    fontFamily: FONTS.semibold, fontSize: SIZES.textXl, color: COLORS.textPrimary,
    textAlign: "center",
  },

  modeRow: { flexDirection: "row", gap: SIZES.sm },
  modeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgSection, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  modeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeTxt:       { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted },
  modeTxtActive: { color: COLORS.white },

  actions: { flexDirection: "row", gap: SIZES.sm, marginTop: SIZES.xs },
  cancelBtn: {
    flex: 1, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgSection, borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: "center",
  },
  cancelTxt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary },
  confirmBtn: {
    flex: 2, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center",
    ...SHADOWS.sm,
  },
  confirmTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },
});
