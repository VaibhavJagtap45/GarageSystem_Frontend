import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  CUSTOMER_ENDPOINTS,
  CATALOG_ENDPOINTS,
  INVOICE_ENDPOINTS,
  TAG_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppToggle from "../../components/ui/AppToggle";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import axiosClient from "../../api/axios";

const LABOUR_PERCENT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rupee = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;

function computeTotals(services, parts, discountAmount = 0) {
  const servicesSubTotal = services.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const partsSubTotal = parts.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const labourCharge = parseFloat(
    (servicesSubTotal * (LABOUR_PERCENT / 100)).toFixed(2),
  );
  const totalAmount = parseFloat(
    (servicesSubTotal + partsSubTotal + labourCharge - discountAmount).toFixed(
      2,
    ),
  );
  return { servicesSubTotal, partsSubTotal, labourCharge, totalAmount };
}

// ─── Section block ────────────────────────────────────────────────────────────
function SectionBlock({ label, onAdd, children, isEmpty }) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.addChip}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={15} color={COLORS.white} />
          <Text style={styles.addChipText}>Add</Text>
        </TouchableOpacity>
      </View>
      {isEmpty ? (
        <View style={styles.sectionEmpty}>
          <Text style={styles.sectionEmptyText}>None added yet</Text>
        </View>
      ) : (
        children
      )}
    </View>
  );
}

// ─── Service line row ─────────────────────────────────────────────────────────
function ServiceLineRow({ item, onRemove }) {
  return (
    <View style={styles.lineRow}>
      <View style={styles.lineInfo}>
        <Text style={styles.lineName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category ? (
          <Text style={styles.lineSub}>{item.category}</Text>
        ) : null}
      </View>
      <Text style={styles.linePrice}>{rupee(item.price)}</Text>
      <TouchableOpacity
        onPress={onRemove}
        style={styles.lineRemove}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Part line row ────────────────────────────────────────────────────────────
function PartLineRow({ item, onRemove, onQtyChange }) {
  return (
    <View style={styles.lineRow}>
      <View style={styles.lineInfo}>
        <Text style={styles.lineName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.lineSub}>
          ₹{item.unitPrice} × {item.quantity}
        </Text>
      </View>
      {/* Qty stepper */}
      <View style={styles.qtyStepper}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(Math.max(1, item.quantity - 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={12} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyVal}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(item.quantity + 1)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={12} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.linePrice}>{rupee(item.lineTotal)}</Text>
      <TouchableOpacity
        onPress={onRemove}
        style={styles.lineRemove}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function TagChip({ label, color, onRemove }) {
  const bg = color ? color + "20" : COLORS.primaryLight;
  const border = color ? color + "60" : COLORS.primary + "40";
  const txtCol = color || COLORS.primary;
  return (
    <View
      style={[styles.tagChip, { backgroundColor: bg, borderColor: border }]}
    >
      <View
        style={[styles.tagDot, { backgroundColor: color || COLORS.primary }]}
      />
      <Text style={[styles.tagLabel, { color: txtCol }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} activeOpacity={0.7}>
        <Ionicons name="close" size={13} color={txtCol} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Summary row ─────────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight, sub }) {
  return (
    <View style={[styles.summaryRow, highlight && styles.summaryRowHL]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.summaryLabel, highlight && styles.summaryLabelHL]}>
          {label}
        </Text>
        {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
      </View>
      <View style={[styles.summaryValBox, highlight && styles.summaryValBoxHL]}>
        <Text style={[styles.summaryRupee, highlight && styles.summaryValHL]}>
          ₹
        </Text>
        <Text style={[styles.summaryVal, highlight && styles.summaryValHL]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Catalog picker modal ─────────────────────────────────────────────────────
function CatalogPickerModal({ visible, itemType, onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const load = useCallback(
    async (q = "") => {
      setLoading(true);
      try {
        const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
          params: { itemType, search: q || undefined, limit: 100 },
        });
        setItems(res.data?.data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [itemType],
  );

  useEffect(() => {
    if (visible) {
      setSearch("");
      load("");
    }
  }, [visible, load]);

  const handleSearch = (t) => {
    setSearch(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(t), 350);
  };

  const isPart = itemType === "part";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>
            {isPart ? "Add Part" : "Add Service"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View
          style={{
            paddingHorizontal: SIZES.screenPadding,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.borderLight,
            paddingBottom: SIZES.sm,
          }}
        >
          <AppInput
            icon="search-outline"
            placeholder={`Search ${isPart ? "parts" : "services"}…`}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              padding: SIZES.screenPadding,
              gap: SIZES.sm,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  <Text style={styles.pickerItemSub}>
                    {item.category ?? ""}
                    {isPart && item.no ? `  ·  ${item.no}` : ""}
                    {isPart && item.stock !== undefined
                      ? `  ·  Stock: ${item.stock}`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.pickerItemPrice}>
                  {item.mrp > 0 ? rupee(item.mrp) : "Free"}
                </Text>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.pickerEmpty}>
                No {isPart ? "parts" : "services"} found.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Tag picker modal ─────────────────────────────────────────────────────────
function TagPickerModal({ visible, onClose, selectedTags, onConfirm }) {
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (visible) {
      setSelected(selectedTags ?? []);
      setLoading(true);
      axiosClient
        .get(TAG_ENDPOINTS.LIST)
        .then((res) => {
          const raw = res.data?.data?.tags ?? res.data?.data ?? [];
          setAllTags(
            raw.filter((t) => t.tagType === "invoice" || t.tagType === "both"),
          );
        })
        .catch(() => setAllTags([]))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const toggle = (tag) => {
    setSelected((prev) =>
      prev.find((s) => s.name === tag.name)
        ? prev.filter((s) => s.name !== tag.name)
        : [...prev, { name: tag.name, color: tag.color ?? null }],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Tags</Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: SIZES.screenPadding,
              gap: SIZES.sm,
            }}
            showsVerticalScrollIndicator={false}
          >
            {allTags.length === 0 ? (
              <Text style={styles.pickerEmpty}>
                No invoice tags found. Create them in Tag Management.
              </Text>
            ) : (
              allTags.map((tag) => {
                const isSel = selected.some((s) => s.name === tag.name);
                return (
                  <TouchableOpacity
                    key={tag._id}
                    style={[
                      styles.tagPickerRow,
                      isSel && styles.tagPickerRowSel,
                    ]}
                    onPress={() => toggle(tag)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.tagPickerDot,
                        { backgroundColor: tag.color || COLORS.primary },
                      ]}
                    />
                    <Text style={styles.tagPickerLabel}>{tag.name}</Text>
                    {isSel && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        <View style={{ padding: SIZES.screenPadding }}>
          <AppButton
            title={`Done  ·  ${selected.length} selected`}
            variant="gradient"
            size="lg"
            onPress={() => {
              onConfirm(selected);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Customer search + select ─────────────────────────────────────────────────
function CustomerSearchBar({ selected, onSelect, onClear }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.get(CUSTOMER_ENDPOINTS.LIST, {
        params: { search: q },
      });
      setResults(res.data?.data?.users ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (t) => {
    setQuery(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(t), 350);
  };

  if (selected) {
    return (
      <View style={styles.selectedCustomer}>
        <Avatar name={selected.fullName} size={38} />
        <View style={styles.selectedCustomerInfo}>
          <Text style={styles.selectedCustomerName}>{selected.fullName}</Text>
          <Text style={styles.selectedCustomerPhone}>{selected.phoneNo}</Text>
        </View>
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearCustomer}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <AppInput
        icon="search-outline"
        placeholder="Search customer name or phone…"
        value={query}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {(focused || results.length > 0) && query.trim().length > 0 && (
        <View style={styles.customerDropdown}>
          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ padding: SIZES.md }}
            />
          ) : results.length === 0 ? (
            <Text style={styles.dropdownEmpty}>No customers found</Text>
          ) : (
            results.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.dropdownRow}
                onPress={() => {
                  onSelect(c);
                  setQuery("");
                  setResults([]);
                }}
                activeOpacity={0.7}
              >
                <Avatar name={c.fullName} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownName}>{c.fullName}</Text>
                  <Text style={styles.dropdownPhone}>{c.phoneNo}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CounterSaleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();

  // Prefill data passed from OrdersScreen when coming from a completed repair order
  const prefill = route.params?.prefill ?? null;

  const [customer, setCustomer] = useState(prefill?.customer ?? null);
  const [services, setServices] = useState(prefill?.services ?? []);
  const [parts, setParts] = useState(prefill?.parts ?? []);
  const [tags, setTags] = useState(
    (prefill?.tags ?? []).map((t) =>
      typeof t === "string" ? { name: t, color: null } : t,
    ),
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  // Repair order link (for prefill tracking)
  const repairOrderId = prefill?.repairOrderId ?? null;

  // ── Add / remove ────────────────────────────────────────────────
  const addService = (item) => {
    setServices((prev) => [
      ...prev,
      {
        catalogId: item._id,
        name: item.name,
        price: item.mrp || 0,
        discount: 0,
        taxPercent: 0,
        lineTotal: item.mrp || 0,
        category: item.category,
      },
    ]);
  };

  const removeService = (i) =>
    setServices((prev) => prev.filter((_, idx) => idx !== i));

  const addPart = (item) => {
    setParts((prev) => [
      ...prev,
      {
        inventoryId: item._id,
        partCode: item.no || null,
        name: item.name,
        quantity: 1,
        unitPrice: item.mrp || 0,
        discount: 0,
        taxPercent: item.taxPercent || 0,
        lineTotal: item.mrp || 0,
      },
    ]);
  };

  const removePart = (i) =>
    setParts((prev) => prev.filter((_, idx) => idx !== i));

  const updatePartQty = (i, qty) => {
    setParts((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? { ...p, quantity: qty, lineTotal: +(p.unitPrice * qty).toFixed(2) }
          : p,
      ),
    );
  };

  const removeTag = (i) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  // ── Totals ───────────────────────────────────────────────────────
  const { servicesSubTotal, partsSubTotal, labourCharge, totalAmount } =
    computeTotals(services, parts, discountAmount);

  // ── Submit ───────────────────────────────────────────────────────
  const handlePrepareInvoice = async () => {
    if (!customer) {
      Alert.alert("Select Customer", "Please select a customer first.");
      return;
    }
    if (!services.length && !parts.length) {
      Alert.alert("Add Items", "Add at least one service or part.");
      return;
    }
    setSaving(true);
    try {
      const res = await axiosClient.post(INVOICE_ENDPOINTS.LIST, {
        repairOrderId: repairOrderId || undefined,
        customerId: customer._id,
        services,
        parts,
        tags: tags.map((t) => t.name),
        labourPercent: LABOUR_PERCENT,
        discountAmount,
        notifyCustomer,
      });
      const invoice = res.data?.data?.invoice;
      // Navigate to invoice detail so user can share immediately
      navigation.replace("InvoiceDetail", { invoice });
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Could not create invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title={prefill ? "Create Invoice" : "Counter Sale"}
        transparent={false}
        rightElement={
          prefill ? (
            <View style={styles.prefillBadge}>
              <Ionicons name="link-outline" size={13} color={COLORS.primary} />
              <Text style={styles.prefillBadgeText}>From RO</Text>
            </View>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer search / selected */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <CustomerSearchBar
            selected={customer}
            onSelect={setCustomer}
            onClear={() => setCustomer(null)}
          />
        </View>

        {/* SERVICES */}
        <SectionBlock
          label="SERVICES"
          onAdd={() => setShowServicePicker(true)}
          isEmpty={!services.length}
        >
          {services.map((s, i) => (
            <ServiceLineRow
              key={i}
              item={s}
              onRemove={() => removeService(i)}
            />
          ))}
        </SectionBlock>

        {/* PARTS */}
        <SectionBlock
          label="PARTS / STOCKS"
          onAdd={() => setShowPartPicker(true)}
          isEmpty={!parts.length}
        >
          {parts.map((p, i) => (
            <PartLineRow
              key={i}
              item={p}
              onRemove={() => removePart(i)}
              onQtyChange={(qty) => updatePartQty(i, qty)}
            />
          ))}
        </SectionBlock>

        {/* TAGS */}
        <SectionBlock
          label="TAGS"
          onAdd={() => setShowTagModal(true)}
          isEmpty={!tags.length}
        >
          <View style={styles.tagsWrap}>
            {tags.map((t, i) => (
              <TagChip
                key={i}
                label={t.name}
                color={t.color}
                onRemove={() => removeTag(i)}
              />
            ))}
          </View>
        </SectionBlock>

        {/* SUMMARY */}
        <View style={styles.summaryBlock}>
          <SummaryRow
            label="Services Sub Total"
            value={servicesSubTotal.toFixed(2)}
          />
          <View style={styles.summaryDivider} />
          <SummaryRow
            label="Parts Sub Total"
            value={partsSubTotal.toFixed(2)}
          />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Labour Charges" value={labourCharge.toFixed(2)} />
          <View style={styles.summaryDivider} />
          <SummaryRow
            label="Discount"
            value={parseFloat(discountAmount).toFixed(2)}
          />
          <View style={styles.summaryDivider} />
          <SummaryRow label="TOTAL" value={totalAmount.toFixed(2)} highlight />
        </View>

        {/* Notify toggle */}
        <View style={styles.toggleWrap}>
          <AppToggle
            label="Notify Customer (SMS & e-mail)?"
            icon="notifications-outline"
            value={notifyCustomer}
            onChange={setNotifyCustomer}
          />
        </View>
      </ScrollView>

      {/* Floating footer */}
      <View style={[styles.footer, { bottom: tabBarHeight }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>{rupee(totalAmount)}</Text>
        </View>
        <AppButton
          title={saving ? "Creating Invoice…" : "Prepare Invoice"}
          variant="gradient"
          size="lg"
          onPress={handlePrepareInvoice}
          disabled={saving}
          style={{ flex: 1 }}
        />
      </View>

      {/* Pickers */}
      <CatalogPickerModal
        visible={showServicePicker}
        itemType="service"
        onClose={() => setShowServicePicker(false)}
        onSelect={addService}
      />
      <CatalogPickerModal
        visible={showPartPicker}
        itemType="part"
        onClose={() => setShowPartPicker(false)}
        onSelect={addPart}
      />
      <TagPickerModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        selectedTags={tags}
        onConfirm={(selected) => setTags(selected)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 140 },

  // Prefill badge
  prefillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
  },
  prefillBadgeText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },

  // Customer section
  customerSection: { gap: SIZES.sm },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  selectedCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.primary + "50",
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  selectedCustomerInfo: { flex: 1 },
  selectedCustomerName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  selectedCustomerPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  clearCustomer: { padding: 4 },

  // Customer dropdown
  customerDropdown: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: SIZES.xs,
    ...SHADOWS.md,
    overflow: "hidden",
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  dropdownPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  dropdownEmpty: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    padding: SIZES.md,
  },

  // Section block
  sectionBlock: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 4,
  },
  addChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },
  sectionEmpty: { padding: SIZES.md, alignItems: "center" },
  sectionEmptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },

  // Line rows
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  lineInfo: { flex: 1 },
  lineName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  lineSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  linePrice: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    width: 64,
    textAlign: "right",
  },
  lineRemove: { width: 26, alignItems: "center" },

  // Qty stepper
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    width: 72,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgSection,
  },
  qtyVal: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  // Tags — display chips
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
    padding: SIZES.md,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
  },

  // Tags — picker rows
  tagPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tagPickerRowSel: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  tagPickerDot: { width: 12, height: 12, borderRadius: 6 },
  tagPickerLabel: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  // Summary
  summaryBlock: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  summaryDivider: { height: 1, backgroundColor: COLORS.borderLight },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
  },
  summaryRowHL: { backgroundColor: COLORS.primaryLight },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textSecondary,
  },
  summaryLabelHL: { fontFamily: FONTS.semibold, color: COLORS.textPrimary },
  summarySub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  summaryValBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    width: 120,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: "flex-end",
  },
  summaryValBoxHL: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  summaryRupee: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginRight: 2,
  },
  summaryVal: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  summaryValHL: { color: COLORS.primary },

  // Toggle
  toggleWrap: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.sm,
    ...SHADOWS.sm,
  },

  // Footer
  footer: {
    marginBottom: 50,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  footerTotal: { alignItems: "flex-start", minWidth: 80 },
  footerTotalLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  footerTotalValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },

  // Catalog picker
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  pickerTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  pickerClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pickerItemName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  pickerItemSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  pickerItemPrice: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    marginRight: 4,
  },
  pickerEmpty: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: 40,
  },
});
