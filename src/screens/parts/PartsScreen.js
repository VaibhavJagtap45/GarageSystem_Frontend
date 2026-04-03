import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import axiosClient from "../../api/axios";
import {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getVehicleBrands,
  getVehicleModels,
} from "../../api/services";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  CATALOG_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import AppRadioGroup from "../../components/ui/AppRadioGroup";
import AppToggle from "../../components/ui/AppToggle";
import Badge from "../../components/ui/Badge";

// ─── Constants ────────────────────────────────────────────────────────────────

const PART_CATEGORIES = [
  "Engine",
  "Brakes",
  "Suspension",
  "Electrical",
  "Body",
  "Filters",
  "Tyres & Wheels",
  "Transmission",
  "Cooling",
  "Fuel",
  "AC",
  "Other",
].map((v) => ({ value: v, label: v }));

const UNIT_OPTIONS = [
  "pcs",
  "set",
  "litre",
  "ml",
  "kg",
  "g",
  "metre",
  "box",
  "pair",
  "roll",
].map((v) => ({ value: v, label: v }));

const TAX_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

const APPLICABILITY_OPTIONS = [
  { value: "generic", label: "Generic — applicable to all vehicles" },
  { value: "specific", label: "Specific — choose brand(s) / model(s)" },
];

const PART_INIT = {
  name: "",
  mrp: "",
  purchasePrice: "",
  no: "",
  category: null,
  manufacturer: "",
  unit: "pcs",
  description: "",
  taxPercent: "0",
  stock: "0",
  minimumStockLevel: "5",
  manageInventory: false,
  applicability: "generic",
  applicableBrands: [],
  applicableModels: [],
};

const ACTION_BUTTONS = [
  {
    id: "purchase",
    label: "Purchase Order",
    icon: "add-circle",
    bg: COLORS.primaryDark,
    onPress: (nav) => nav.navigate("PurchaseOrder"),
  },
  {
    id: "alerts",
    label: "View Alerts",
    icon: "search",
    bg: COLORS.error,
    onPress: (nav) => nav.navigate("InventoryAlerts"),
  },
  {
    id: "counter",
    label: "Counter Sale",
    icon: "trending-up",
    bg: COLORS.primaryDark,
    onPress: (nav) => nav.navigate("PartsCounterSale"),
  },
  {
    id: "stockin",
    label: "Stock In",
    icon: "bag",
    bg: COLORS.primaryDark,
    onPress: (nav) => nav.navigate("StockIn"),
  },
];

// ─── Helper layout components ──────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      {title && <Text style={styles.sectionCardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function RowFields({ children }) {
  return <View style={styles.rowFields}>{children}</View>;
}

function RowField({ children }) {
  return <View style={styles.rowField}>{children}</View>;
}

// ─── Multi-select modal (brands / models) ──────────────────────────────────────

function MultiSelectModal({ visible, title, options, selected, onConfirm, onClose, loading }) {
  const [local, setLocal] = useState([]);

  useEffect(() => {
    if (visible) setLocal(selected);
  }, [visible, selected]);

  const toggle = (item) =>
    setLocal((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            contentContainerStyle={{ padding: SIZES.screenPadding }}
            ListEmptyComponent={
              <Text style={styles.emptyNote}>No options available.</Text>
            }
            renderItem={({ item }) => {
              const sel = local.includes(item);
              return (
                <TouchableOpacity
                  style={[styles.msRow, sel && styles.msRowActive]}
                  onPress={() => toggle(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.msText, sel && styles.msTextActive]}>
                    {item}
                  </Text>
                  {sel && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={styles.msFooter}>
          <AppButton
            title={`Confirm (${local.length} selected)`}
            variant="gradient"
            size="lg"
            onPress={() => {
              onConfirm(local);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Applicability section ─────────────────────────────────────────────────────

function ApplicabilitySection({ form, setField }) {
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [allBrands, setAllBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (form.applicability === "specific" && allBrands.length === 0) {
      setBrandsLoading(true);
      getVehicleBrands()
        .then((r) => setAllBrands(r.data?.brands || []))
        .catch(() => setAllBrands([]))
        .finally(() => setBrandsLoading(false));
    }
  }, [form.applicability]);

  const openModels = async () => {
    if (!form.applicableBrands.length) {
      Alert.alert("Select brands first", "Choose at least one brand before picking models.");
      return;
    }
    setModelsLoading(true);
    setShowModels(true);
    try {
      const results = await Promise.all(
        form.applicableBrands.map((b) =>
          getVehicleModels(b).then((r) => r.data?.models || []),
        ),
      );
      setAllModels([...new Set(results.flat())].sort());
    } catch {
      setAllModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  return (
    <>
      <AppRadioGroup
        options={APPLICABILITY_OPTIONS}
        value={form.applicability}
        onChange={setField("applicability")}
        direction="column"
      />

      {form.applicability === "specific" && (
        <View style={styles.applicableBox}>
          <TouchableOpacity
            style={styles.applicableRow}
            onPress={() => setShowBrands(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.applicableLabel}>Applicable Brands</Text>
            <View style={styles.applicableRight}>
              {form.applicableBrands.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {form.applicableBrands.length}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.applicableRow}
            onPress={openModels}
            activeOpacity={0.7}
          >
            <Text style={styles.applicableLabel}>Applicable Models</Text>
            <View style={styles.applicableRight}>
              {form.applicableModels.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {form.applicableModels.length}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <MultiSelectModal
        visible={showBrands}
        title="Select Brands"
        options={allBrands}
        selected={form.applicableBrands}
        onConfirm={setField("applicableBrands")}
        onClose={() => setShowBrands(false)}
        loading={brandsLoading}
      />
      <MultiSelectModal
        visible={showModels}
        title="Select Models"
        options={allModels}
        selected={form.applicableModels}
        onConfirm={setField("applicableModels")}
        onClose={() => setShowModels(false)}
        loading={modelsLoading}
      />
    </>
  );
}

// ─── Part form (fields only) ───────────────────────────────────────────────────

function PartFormFields({ form, setField, errors }) {
  return (
    <>
      <SectionCard title="Part Details">
        <AppInput
          label="Part Name *"
          icon="cube-outline"
          placeholder="e.g. Engine Oil 10W30 — 1L"
          value={form.name}
          onChangeText={setField("name")}
          error={errors.name}
        />
        <RowFields>
          <RowField>
            <AppInput
              label="MRP / Selling Price (₹)"
              icon="pricetag-outline"
              placeholder="0.00"
              value={form.mrp}
              onChangeText={setField("mrp")}
              keyboardType="numeric"
            />
          </RowField>
          <RowField>
            <AppInput
              label="Purchase Price (₹)"
              icon="receipt-outline"
              placeholder="0.00"
              value={form.purchasePrice}
              onChangeText={setField("purchasePrice")}
              keyboardType="numeric"
            />
          </RowField>
        </RowFields>
        <RowFields>
          <RowField>
            <AppInput
              label="Part Code"
              icon="barcode-outline"
              placeholder="Optional"
              value={form.no}
              onChangeText={setField("no")}
            />
          </RowField>
          <RowField>
            <AppSelect
              label="Tax %"
              icon="calculator-outline"
              options={TAX_OPTIONS}
              value={form.taxPercent}
              onChange={setField("taxPercent")}
            />
          </RowField>
        </RowFields>
        <RowFields>
          <RowField>
            <AppSelect
              label="Category"
              icon="grid-outline"
              placeholder="Select"
              options={PART_CATEGORIES}
              value={form.category}
              onChange={setField("category")}
            />
          </RowField>
          <RowField>
            <AppSelect
              label="Unit"
              icon="cube-outline"
              options={UNIT_OPTIONS}
              value={form.unit}
              onChange={setField("unit")}
            />
          </RowField>
        </RowFields>
        <AppInput
          label="Manufacturer / Brand"
          icon="business-outline"
          placeholder="e.g. Castrol, Bosch"
          value={form.manufacturer}
          onChangeText={setField("manufacturer")}
        />
        <AppInput
          label="Description"
          icon="document-text-outline"
          placeholder="Optional notes"
          value={form.description}
          onChangeText={setField("description")}
        />
      </SectionCard>

      <SectionCard title="Inventory">
        <AppToggle
          label="Manage Inventory"
          sublabel="Track stock levels and low-stock alerts"
          icon="archive-outline"
          value={form.manageInventory}
          onChange={setField("manageInventory")}
        />
        {form.manageInventory && (
          <RowFields>
            <RowField>
              <AppInput
                label="Stock on Hand"
                icon="layers-outline"
                placeholder="0"
                value={form.stock}
                onChangeText={setField("stock")}
                keyboardType="numeric"
              />
            </RowField>
            <RowField>
              <AppInput
                label="Min Stock Level"
                icon="alert-circle-outline"
                placeholder="5"
                value={form.minimumStockLevel}
                onChangeText={setField("minimumStockLevel")}
                keyboardType="numeric"
              />
            </RowField>
          </RowFields>
        )}
      </SectionCard>

      <SectionCard title="Vehicle Applicability">
        <ApplicabilitySection form={form} setField={setField} />
      </SectionCard>
    </>
  );
}

// ─── Full-page part form modal ─────────────────────────────────────────────────

function PartFormModal({ visible, onClose, onSave, saving, editItem }) {
  const isEdit = !!editItem;
  const [form, setForm] = useState(PART_INIT);
  const [errors, setErrors] = useState({});

  // Populate form when opening for edit
  useEffect(() => {
    if (!visible) return;
    if (isEdit) {
      setForm({
        name: editItem.name || "",
        mrp: editItem.mrp != null ? String(editItem.mrp) : "",
        purchasePrice: editItem.purchasePrice != null ? String(editItem.purchasePrice) : "",
        no: editItem.no || "",
        category: editItem.category || null,
        manufacturer: editItem.manufacturer || "",
        unit: editItem.unit || "pcs",
        description: editItem.description || "",
        taxPercent: editItem.taxPercent != null ? String(editItem.taxPercent) : "0",
        stock: editItem.stock != null ? String(editItem.stock) : "0",
        minimumStockLevel: editItem.minimumStockLevel != null ? String(editItem.minimumStockLevel) : "5",
        manageInventory: editItem.manageInventory ?? false,
        applicability: editItem.applicability || "generic",
        applicableBrands: editItem.applicableBrands || [],
        applicableModels: editItem.applicableModels || [],
      });
    } else {
      setForm(PART_INIT);
    }
    setErrors({});
  }, [visible, editItem]);

  const setField = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Part name is required";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const payload = {
      itemType: "part",
      name: form.name.trim(),
      mrp: parseFloat(form.mrp) || 0,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      no: form.no.trim() || undefined,
      category: form.category || "Other",
      manufacturer: form.manufacturer.trim(),
      unit: form.unit || "pcs",
      description: form.description.trim(),
      taxPercent: parseFloat(form.taxPercent) || 0,
      stock: parseInt(form.stock, 10) || 0,
      minimumStockLevel: parseInt(form.minimumStockLevel, 10) || 5,
      manageInventory: form.manageInventory,
      applicability: form.applicability,
      applicableBrands: form.applicability === "specific" ? form.applicableBrands : [],
      applicableModels: form.applicability === "specific" ? form.applicableModels : [],
    };

    onSave(payload);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEdit ? "Edit Part" : "Add New Part"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* Scrollable form */}
        <ScrollView
          contentContainerStyle={styles.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PartFormFields form={form} setField={setField} errors={errors} />

          <AppButton
            title={saving ? "Saving…" : isEdit ? "Save Changes" : "Add Part"}
            variant="gradient"
            size="lg"
            onPress={handleSave}
            disabled={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Part row ──────────────────────────────────────────────────────────────────

function PartRow({ item, onEdit, onDelete }) {
  const lowStock = item.manageInventory && item.stock <= (item.minimumStockLevel ?? 5);

  return (
    <TouchableOpacity
      style={styles.tableRow}
      activeOpacity={0.75}
      onPress={() => onEdit(item)}
      onLongPress={() => onDelete(item)}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowNo}>{item.no || "—"}</Text>
        <Text style={styles.rowName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.badgeRow}>
          {!!item.category && (
            <Badge label={item.category} variant="info" size="sm" />
          )}
          {item.applicability === "specific" && (
            <Badge label="Specific" variant="warning" size="sm" />
          )}
          {!!item.manufacturer && (
            <Badge label={item.manufacturer} variant="default" size="sm" />
          )}
        </View>
      </View>

      <View style={styles.partRight}>
        <Text style={styles.rowMrp}>{item.mrp > 0 ? `₹${item.mrp}` : "—"}</Text>
        {item.manageInventory && (
          <Badge
            label={`Qty ${item.stock}`}
            variant={lowStock ? "error" : "success"}
            size="sm"
          />
        )}
      </View>

      <TouchableOpacity
        onPress={() => onEdit(item)}
        style={styles.editBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="create-outline" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PartsScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [stats, setStats] = useState({ totalParts: 0, totalStock: 0, totalStockValue: 0 });

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // CSV upload
  const [uploading, setUploading] = useState(false);

  const searchTimer = useRef(null);

  // ── Load parts ────────────────────────────────────────────────────
  const loadParts = useCallback(async (q = "") => {
    setLoadingParts(true);
    try {
      const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
        params: { itemType: "part", search: q, limit: 200 },
      });
      setParts(res.data?.data?.items ?? []);
    } catch {
      // keep previous list on error
    } finally {
      setLoadingParts(false);
    }
  }, []);

  // ── Load stats ────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await axiosClient.get(CATALOG_ENDPOINTS.INVENTORY_STATS);
      const d = res.data?.data ?? {};
      setStats({
        totalParts: d.totalParts ?? 0,
        totalStock: d.totalStock ?? 0,
        totalStockValue: d.totalStockValue ?? 0,
      });
    } catch {
      // keep zeroes
    }
  }, []);

  // Reload whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadParts("");
      loadStats();
    }, [loadParts, loadStats]),
  );

  // Debounced search
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadParts(text.trim()), 350);
  };

  // ── Upload CSV ────────────────────────────────────────────────────
  const handleUploadCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/plain",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "text/csv" });
      formData.append("itemType", "part");

      const res = await axiosClient.post(
        `${CATALOG_ENDPOINTS.BULK_UPLOAD}?itemType=part`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const d = res.data?.data ?? {};
      Alert.alert(
        "Upload Complete",
        `Inserted: ${d.inserted ?? d.insertedCount ?? 0}   Skipped: ${d.skipped ?? d.failedCount ?? 0}`,
      );
      setSearch("");
      loadParts("");
      loadStats();
    } catch (err) {
      Alert.alert("Upload Failed", err.displayMessage || "Could not upload file.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save (create / update) ────────────────────────────────────────
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editItem) {
        await updateCatalogItem(editItem._id, "part", payload);
      } else {
        await createCatalogItem(payload);
      }
      setShowForm(false);
      setEditItem(null);
      loadParts(search.trim());
      loadStats();
    } catch (err) {
      Alert.alert(
        editItem ? "Update Failed" : "Add Failed",
        err.displayMessage || "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert(
      "Delete Part",
      `"${item.name}" will be removed from inventory.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCatalogItem(item._id, "part");
              loadParts(search.trim());
              loadStats();
            } catch (err) {
              Alert.alert("Error", err.displayMessage || "Could not delete.");
            }
          },
        },
      ],
    );
  };

  const rightElement = (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.8}
        onPress={() => { loadParts(search.trim()); loadStats(); }}
      >
        <Ionicons name="refresh" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <TopNav
        title="Parts (Inventory)"
        showBack={true}
        transparent={false}
        rightElement={rightElement}
      />

      {/* 2×2 Action Buttons Grid */}
      <View style={styles.actionsGrid}>
        {ACTION_BUTTONS.map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[styles.actionBtn, { backgroundColor: btn.bg }]}
            activeOpacity={0.85}
            onPress={() => btn.onPress(navigation)}
          >
            <Ionicons name={btn.icon} size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <AppInput
        icon="search"
        placeholder="Search parts…"
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchInput}
      />

      {/* Upload CSV + Add Part */}
      <View style={styles.toolRow}>
        <TouchableOpacity
          style={styles.uploadBtn}
          activeOpacity={0.8}
          onPress={handleUploadCSV}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="cloud-upload" size={16} color={COLORS.primary} />
          )}
          <Text style={styles.uploadText}>
            {uploading ? "Uploading…" : "Upload CSV"}
          </Text>
        </TouchableOpacity>

        <AppButton
          title="+ Part"
          variant="gradient"
          size="sm"
          fullWidth={false}
          onPress={() => {
            setEditItem(null);
            setShowForm(true);
          }}
        />
      </View>

      {/* Column Headers */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHead, { flex: 3 }]}>(No.) Name</Text>
        <Text style={[styles.colHead, { width: 80, textAlign: "right" }]}>MRP</Text>
        <Text style={[styles.colHead, { width: 44, textAlign: "right" }]}>Edit</Text>
      </View>

      {/* Parts List */}
      {loadingParts ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <PartRow
              item={item}
              isLast={index === parts.length - 1}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="package-variant" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>
                {search ? "No parts match your search" : "No parts in inventory"}
              </Text>
              <Text style={styles.emptyHint}>
                {search ? "Try a different keyword" : 'Tap "+ Part" or upload a CSV to get started'}
              </Text>
            </View>
          }
          contentContainerStyle={parts.length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <StatItem label="Total Parts" value={stats.totalParts} />
        <View style={styles.statDivider} />
        <StatItem label="Total Stock" value={stats.totalStock} />
        <View style={styles.statDivider} />
        <StatItem
          label="Stock Value"
          value={`₹${Number(stats.totalStockValue).toLocaleString("en-IN")}`}
        />
      </View>

      {/* Add / Edit Part modal */}
      <PartFormModal
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        saving={saving}
        editItem={editItem}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  headerRight: {
    flex: 1,
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: { padding: 6 },

  // Action grid
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.sm,
  },
  actionBtn: {
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: SIZES.radiusSm,
    ...SHADOWS.sm,
  },
  actionBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
  },

  searchInput: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
  },

  // Tool row
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 6,
    paddingHorizontal: SIZES.sm + 4,
    backgroundColor: COLORS.primaryLight,
  },
  uploadText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSection,
  },
  colHead: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  listContent: { paddingBottom: 8 },
  emptyList: { flex: 1 },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  rowMain: { flex: 3, paddingRight: SIZES.sm, gap: 3 },
  rowNo: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  rowName: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  badgeRow: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 2 },
  rowMrp: {
    width: 60,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  partRight: { width: 80, alignItems: "flex-end", gap: 4 },
  editBtn: { width: 44, alignItems: "flex-end", paddingRight: 2 },

  // Empty / loader
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 52,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SIZES.screenPadding,
  },
  emptyNote: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 40,
  },

  // Stats card
  statsCard: {
    marginHorizontal: SIZES.screenPadding,
    marginVertical: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.md,
    ...SHADOWS.sm,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
  },

  // ── Modal ──────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  modalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: COLORS.borderLight },
  modalBody: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 60 },

  // Section card (inside modal)
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.xs,
    ...SHADOWS.sm,
  },
  sectionCardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowFields: { flexDirection: "row", gap: SIZES.sm },
  rowField: { flex: 1 },

  // Applicability picker
  applicableBox: {
    backgroundColor: COLORS.bg,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    marginTop: SIZES.xs,
  },
  applicableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  applicableLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textSecondary,
    flex: 1,
  },
  applicableRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.primary,
  },

  // Multi-select modal list
  msRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.xs,
    backgroundColor: COLORS.bgSection,
  },
  msRowActive: { backgroundColor: COLORS.primaryLight },
  msText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  msTextActive: { fontFamily: FONTS.semibold, color: COLORS.primary },
  msFooter: {
    padding: SIZES.screenPadding,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
