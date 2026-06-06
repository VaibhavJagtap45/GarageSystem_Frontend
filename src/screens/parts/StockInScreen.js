import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  COLORS, FONTS, SIZES, SHADOWS,
  STOCK_IN_ENDPOINTS,
  CATALOG_ENDPOINTS,
  USER_ENDPOINTS,
  PURCHASE_ORDER_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import axiosClient from "../../api/axios";

const PAYMENT_OPTIONS = ["CASH", "CARD", "UPI", "BANK"].map((v) => ({ value: v, label: v }));

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── Part picker modal ────────────────────────────────────────────────────────
function PartPickerModal({ visible, onClose, onAdd }) {
  const [items,   setItems]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
        params: { itemType: "part", search: search || undefined, limit: 100 },
      });
      setItems(res.data?.data?.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={s.pickerHeader}>
          <Text style={s.pickerTitle}>Select Part / Stock</Text>
          <TouchableOpacity onPress={onClose} style={s.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.pickerSearchWrap}>
          <AppInput icon="search-outline" placeholder="Search parts…" value={search} onChangeText={setSearch} />
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: SIZES.screenPadding, gap: SIZES.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.partRow}
                onPress={() => { onAdd(item); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.partName}>{item.name}</Text>
                  <Text style={s.partSub}>
                    {item.no ? `${item.no} · ` : ""}
                    {item.category}
                    {item.manufacturer ? ` · ${item.manufacturer}` : ""}
                  </Text>
                  <Text style={s.partStock}>In stock: {item.stock ?? 0}</Text>
                </View>
                <View style={s.partRight}>
                  <Text style={s.partPrice}>{item.purchasePrice > 0 ? `₹${item.purchasePrice}` : "—"}</Text>
                  <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.pickerEmpty}>No parts found.</Text>}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Stock item row ───────────────────────────────────────────────────────────
function StockItemRow({ item, index, onRemove, onQtyChange, onPriceChange }) {
  return (
    <View style={s.itemRow}>
      <View style={{ flex: 2 }}>
        <Text style={s.itemName} numberOfLines={1}>{item.partName}</Text>
        {item.partCode ? <Text style={s.itemCode}>{item.partCode}</Text> : null}
      </View>
      <Text style={s.itemCurrent}>{item.currentStock ?? "—"}</Text>
      <View style={s.qtyWrap}>
        <TouchableOpacity style={s.qtyBtn} onPress={() => onQtyChange(index, Math.max(1, item.quantityAdded - 1))}>
          <Ionicons name="remove" size={12} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.qtyVal}>{item.quantityAdded}</Text>
        <TouchableOpacity style={s.qtyBtn} onPress={() => onQtyChange(index, item.quantityAdded + 1)}>
          <Ionicons name="add" size={12} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <AppInput
        value={String(item.purchasePrice)}
        onChangeText={(v) => onPriceChange(index, v)}
        keyboardType="numeric"
        style={s.priceInput}
      />
      <TouchableOpacity onPress={() => onRemove(index)} style={s.removeBtn}>
        <Ionicons name="trash-outline" size={15} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StockInScreen() {
  const [date,            setDate]            = useState(todayISO());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [invoiceNo,       setInvoiceNo]       = useState("");
  const [linkPO,          setLinkPO]          = useState(false);
  const [vendorId,        setVendorId]        = useState(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState(null);
  const [paymentChannel,  setPaymentChannel]  = useState("CASH");
  const [paidAmount,      setPaidAmount]      = useState("0");
  const [items,           setItems]           = useState([]);
  const [showPicker,      setShowPicker]      = useState(false);
  const [saving,          setSaving]          = useState(false);

  // dropdown data
  const [vendorOptions, setVendorOptions]       = useState([]);
  const [poOptions,     setPOOptions]           = useState([]);
  const [loadingDrops,  setLoadingDrops]        = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingDrops(true);
      try {
        const [vRes, poRes] = await Promise.all([
          axiosClient.get(USER_ENDPOINTS.VENDORS_LIST),
          axiosClient.get(PURCHASE_ORDER_ENDPOINTS.LIST, { params: { status: "sent", limit: 100 } }),
        ]);
        setVendorOptions((vRes.data?.data?.users ?? []).map((v) => ({ value: v._id, label: v.fullName })));
        setPOOptions((poRes.data?.data?.orders ?? []).map((p) => ({ value: p._id, label: `${p.orderNo}${p.vendorId?.fullName ? ` — ${p.vendorId.fullName}` : ""}` })));
      } catch {
        // silently ignore
      } finally {
        setLoadingDrops(false);
      }
    };
    load();
  }, []);

  const handleAddPart = (catalogItem) => {
    setItems((prev) => [
      ...prev,
      {
        inventoryId:   catalogItem._id,
        partCode:      catalogItem.no || null,
        partName:      catalogItem.name,
        currentStock:  catalogItem.stock ?? 0,
        quantityAdded: 1,
        purchasePrice: catalogItem.purchasePrice || catalogItem.mrp || 0,
        sellingPrice:  catalogItem.mrp || 0,
        lineTotal:     catalogItem.purchasePrice || catalogItem.mrp || 0,
      },
    ]);
  };

  const handleQtyChange = (index, qty) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, quantityAdded: qty, lineTotal: +(it.purchasePrice * qty).toFixed(2) }
          : it,
      ),
    );
  };

  const handlePriceChange = (index, val) => {
    const price = parseFloat(val) || 0;
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, purchasePrice: price, lineTotal: +(price * it.quantityAdded).toFixed(2) }
          : it,
      ),
    );
  };

  const handleRemove = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((s, it) => s + (it.lineTotal || 0), 0);

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

  const handleSave = async () => {
    if (!items.length) {
      Alert.alert("No Items", "Add at least one part/stock item.");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post(STOCK_IN_ENDPOINTS.CREATE, {
        vendorId:        vendorId        || undefined,
        purchaseOrderId: linkPO && purchaseOrderId ? purchaseOrderId : undefined,
        invoiceNo:       invoiceNo.trim() || undefined,
        date,
        paymentChannel,
        paidAmount:  parseFloat(paidAmount) || 0,
        totalAmount,
        items,
      });
      Alert.alert("Success", "Stock-in saved. Inventory updated.", [
        {
          text: "OK",
          onPress: () => {
            setItems([]);
            setInvoiceNo("");
            setVendorId(null);
            setPurchaseOrderId(null);
            setPaidAmount("0");
            setDate(todayISO());
          },
        },
      ]);
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Could not save stock-in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Stock In" transparent={false} showBack />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Row 1: Date + Invoice No */}
        <View style={s.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
            style={{ flex: 1.2 }}
          >
            <AppInput
              label="Date"
              icon="calendar-outline"
              value={date}
              placeholder="YYYY-MM-DD"
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
          <AppInput
            label="Invoice No."
            icon="document-outline"
            value={invoiceNo}
            onChangeText={setInvoiceNo}
            placeholder="Optional"
            style={{ flex: 1 }}
          />
        </View>

        {/* Link PO toggle */}
        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setLinkPO((p) => !p)}
          activeOpacity={0.8}
        >
          <View style={[s.checkbox, linkPO && s.checkboxChecked]}>
            {linkPO && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
          </View>
          <Text style={s.checkLabel}>Link existing purchase order</Text>
        </TouchableOpacity>

        {/* Vendor */}
        <AppSelect
          label="Vendor"
          icon="storefront-outline"
          placeholder={loadingDrops ? "Loading…" : "Select vendor"}
          options={vendorOptions}
          value={vendorId}
          onChange={setVendorId}
        />

        {/* Purchase Order (only when toggled) */}
        {linkPO && (
          <AppSelect
            label="Purchase Order"
            icon="document-text-outline"
            placeholder={loadingDrops ? "Loading…" : "Select PO"}
            options={poOptions}
            value={purchaseOrderId}
            onChange={setPurchaseOrderId}
          />
        )}

        {/* Payment Channel */}
        <AppSelect
          label="Payment Channel"
          icon="card-outline"
          options={PAYMENT_OPTIONS}
          value={paymentChannel}
          onChange={setPaymentChannel}
        />

        {/* Add Part/Stock button */}
        <TouchableOpacity style={s.addPartBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={s.addPartBtnText}>Add Part / Stock</Text>
        </TouchableOpacity>

        {/* Column headers */}
        {items.length > 0 && (
          <View style={s.colHeader}>
            <Text style={[s.colText, { flex: 2 }]}>(P.No.) Name</Text>
            <Text style={[s.colText, { width: 44, textAlign: "center" }]}>Curr.</Text>
            <Text style={[s.colText, { width: 76, textAlign: "center" }]}>New Qty</Text>
            <Text style={[s.colText, { width: 72, textAlign: "center" }]}>P.Price</Text>
            <View style={{ width: 28 }} />
          </View>
        )}

        {items.length === 0 ? (
          <View style={s.emptyArea}>
            <Ionicons name="cube-outline" size={32} color={COLORS.borderLight} />
            <Text style={s.emptyText}>No items added yet</Text>
          </View>
        ) : (
          items.map((it, i) => (
            <StockItemRow
              key={i}
              item={it}
              index={i}
              onRemove={handleRemove}
              onQtyChange={handleQtyChange}
              onPriceChange={handlePriceChange}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerContent}>
          <View style={s.footerLeft}>
            <Text style={s.footerLabel}>Paid Amount:</Text>
            <AppInput
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
              style={s.paidInput}
            />
          </View>
          <View style={s.footerCenter}>
            <Text style={s.footerLabel}>Total:</Text>
            <Text style={s.totalText}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <AppButton
            title={saving ? "Saving…" : "Save"}
            onPress={handleSave}
            variant="gradient"
            size="sm"
            disabled={saving || !items.length}
            fullWidth={false}
          />
        </View>
      </View>

      <PartPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onAdd={handleAddPart}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.screenPadding, paddingBottom: 140, gap: SIZES.md },

  row: { flexDirection: "row", gap: SIZES.sm },

  checkRow:       { flexDirection: "row", alignItems: "center", gap: SIZES.sm, marginVertical: SIZES.xs },
  checkbox:       { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.borderDark, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgCard },
  checkboxChecked:{ borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkLabel:     { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },

  addPartBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SIZES.sm, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, paddingVertical: SIZES.sm + 2 },
  addPartBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },

  colHeader:  { flexDirection: "row", alignItems: "center", paddingVertical: SIZES.sm, borderBottomWidth: 1, borderTopWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSection },
  colText:    { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },

  emptyArea:  { alignItems: "center", paddingVertical: SIZES.xl, gap: SIZES.sm },
  emptyText:  { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },

  itemRow:    { flexDirection: "row", alignItems: "center", paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: SIZES.xs },
  itemName:   { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  itemCode:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  itemCurrent:{ width: 44, textAlign: "center", fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
  qtyWrap:    { width: 76, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: SIZES.radiusFull, overflow: "hidden" },
  qtyBtn:     { width: 24, height: 24, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgSection },
  qtyVal:     { flex: 1, textAlign: "center", fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  priceInput: { width: 72, marginBottom: 0 },
  removeBtn:  { width: 28, alignItems: "center" },

  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 90 : 70,
    left: 0, right: 0,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    ...SHADOWS.md,
  },
  footerContent: { flexDirection: "row", alignItems: "center", gap: SIZES.md },
  footerLeft:    { flex: 1.2 },
  footerCenter:  { flex: 1 },
  footerLabel:   { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 4 },
  paidInput:     { marginBottom: 0 },
  totalText:     { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },

  // Picker
  pickerHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  pickerTitle:     { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  pickerClose:     { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  pickerSearchWrap:{ paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  pickerEmpty:     { textAlign: "center", fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted, marginTop: SIZES.xl },
  partRow:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, ...SHADOWS.sm },
  partName:        { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  partSub:         { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  partStock:       { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.success, marginTop: 2 },
  partRight:       { alignItems: "flex-end", gap: SIZES.xs },
  partPrice:       { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary },
});
