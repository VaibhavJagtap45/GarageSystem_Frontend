import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppRadioGroup from "../../components/ui/AppRadioGroup";
import AppSelect from "../../components/ui/AppSelect";
import AppToggle from "../../components/ui/AppToggle";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import {
  getCatalogItems,
  getCatalogCategories,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  bulkUploadCatalog,
  getVehicleBrands,
  getVehicleModels,
} from "../../api/services";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "service", label: "Services", icon: "construct-outline" },
  { id: "part", label: "Parts", icon: "cube-outline" },
];

const DEFAULT_SERVICE_CATEGORIES = [
  "Cleaning",
  "Inspection",
  "Tuning",
  "Electrical",
  "Brakes",
  "Engine",
  "Suspension",
  "Tyres",
  "AC",
  "Other",
].map((v) => ({ value: v, label: v }));

const DEFAULT_PART_CATEGORIES = [
  "Engine",
  "Brakes",
  "Suspension",
  "Electrical",
  "Body",
  "Filters",
  "Tyres & Wheels",
  "Transmission",
  "AC",
  "Other",
].map((v) => ({ value: v, label: v }));

const APPLICABILITY_OPTIONS = [
  { value: "generic", label: "Generic — applicable to all vehicles" },
  { value: "specific", label: "Specific — choose brand(s) / model(s)" },
];

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

// ─── Small reusables ──────────────────────────────────────────────────────────

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

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function ModalShell({ visible, title, onClose, children }) {
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
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <ScrollView
          contentContainerStyle={styles.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Multi-Select Modal (brand / model picker) ────────────────────────────────
function MultiSelectModal({
  visible,
  title,
  options,
  selected,
  onConfirm,
  onClose,
  loading,
}) {
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
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyNote}>No options available.</Text>
            }
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

// ─── Applicability Picker Section ─────────────────────────────────────────────
function ApplicabilitySection({ form, setField, itemType }) {
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [allBrands, setAllBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load brands once when "specific" selected
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
      Alert.alert(
        "Select brands first",
        "Choose at least one brand before picking models.",
      );
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
        onChange={(v) => setField("applicability")(v)}
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
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.textMuted}
              />
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
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.textMuted}
              />
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

// ─── Service Form ─────────────────────────────────────────────────────────────
const SVC_INIT = {
  name: "",
  mrp: "",
  no: "",
  category: null,
  applicability: "generic",
  applicableBrands: [],
  applicableModels: [],
};

function ServiceForm({ form, setField, errors, categories }) {
  return (
    <>
      <SectionCard title="Service Details">
        <AppInput
          label="Service Name *"
          icon="construct-outline"
          placeholder="e.g. Engine Oil Change"
          value={form.name}
          onChangeText={setField("name")}
          error={errors.name}
        />
        <RowFields>
          <RowField>
            <AppInput
              label="MRP (₹)"
              icon="pricetag-outline"
              placeholder="0.00"
              value={form.mrp}
              onChangeText={setField("mrp")}
              keyboardType="numeric"
            />
          </RowField>
          <RowField>
            <AppInput
              label="Service No."
              icon="barcode-outline"
              placeholder="Auto"
              value={form.no}
              onChangeText={setField("no")}
            />
          </RowField>
        </RowFields>
        <AppSelect
          label="Category"
          icon="grid-outline"
          placeholder="Select category"
          options={categories}
          value={form.category}
          onChange={setField("category")}
        />
      </SectionCard>

      <SectionCard title="Vehicle Applicability">
        <ApplicabilitySection
          form={form}
          setField={setField}
          itemType="service"
        />
      </SectionCard>
    </>
  );
}

// ─── Part Form ────────────────────────────────────────────────────────────────
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

function PartForm({ form, setField, errors, categories }) {
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
              options={categories}
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
          sublabel="Track and alert on low stock"
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
        <ApplicabilitySection form={form} setField={setField} itemType="part" />
      </SectionCard>
    </>
  );
}

// ─── Item Form Modal (Add / Edit) ─────────────────────────────────────────────
function ItemFormModal({
  visible,
  onClose,
  onSave,
  saving,
  editItem,
  itemType,
  categories,
}) {
  const isEdit = !!editItem;
  const isPart = itemType === "part";
  const initForm = isPart ? PART_INIT : SVC_INIT;

  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) return;
    if (isEdit) {
      if (isPart) {
        setForm({
          name: editItem.name || "",
          mrp: editItem.mrp != null ? String(editItem.mrp) : "",
          purchasePrice:
            editItem.purchasePrice != null
              ? String(editItem.purchasePrice)
              : "",
          no: editItem.no || "",
          category: editItem.category || null,
          manufacturer: editItem.manufacturer || "",
          unit: editItem.unit || "pcs",
          description: editItem.description || "",
          taxPercent:
            editItem.taxPercent != null ? String(editItem.taxPercent) : "0",
          stock: editItem.stock != null ? String(editItem.stock) : "0",
          minimumStockLevel:
            editItem.minimumStockLevel != null
              ? String(editItem.minimumStockLevel)
              : "5",
          manageInventory: editItem.manageInventory ?? false,
          applicability: editItem.applicability || "generic",
          applicableBrands: editItem.applicableBrands || [],
          applicableModels: editItem.applicableModels || [],
        });
      } else {
        setForm({
          name: editItem.name || "",
          mrp: editItem.mrp != null ? String(editItem.mrp) : "",
          no: editItem.serviceNo || editItem.no || "",
          category: editItem.category || null,
          applicability: editItem.applicability || "generic",
          applicableBrands: editItem.applicableBrands || [],
          applicableModels: editItem.applicableModels || [],
        });
      }
    } else {
      setForm(initForm);
    }
    setErrors({});
  }, [visible, editItem]);

  const setField = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = isPart
      ? {
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
          applicableBrands:
            form.applicability === "specific" ? form.applicableBrands : [],
          applicableModels:
            form.applicability === "specific" ? form.applicableModels : [],
        }
      : {
          itemType: "service",
          name: form.name.trim(),
          mrp: parseFloat(form.mrp) || 0,
          no: form.no.trim() || undefined,
          category: form.category || "Other",
          applicability: form.applicability,
          applicableBrands:
            form.applicability === "specific" ? form.applicableBrands : [],
          applicableModels:
            form.applicability === "specific" ? form.applicableModels : [],
        };
    onSave(payload);
  };

  const title = isEdit
    ? `Edit ${isPart ? "Part" : "Service"}`
    : `Add ${isPart ? "Part" : "Service"}`;

  return (
    <ModalShell visible={visible} title={title} onClose={onClose}>
      {isPart ? (
        <PartForm
          form={form}
          setField={setField}
          errors={errors}
          categories={categories}
        />
      ) : (
        <ServiceForm
          form={form}
          setField={setField}
          errors={errors}
          categories={categories}
        />
      )}
      <AppButton
        title={
          saving
            ? "Saving…"
            : isEdit
              ? "Save Changes"
              : `Add ${isPart ? "Part" : "Service"}`
        }
        variant="gradient"
        size="lg"
        onPress={handleSave}
        disabled={saving}
      />
    </ModalShell>
  );
}

// ─── CSV / Excel Upload Modal ─────────────────────────────────────────────────
function BulkUploadModal({ visible, onClose, onImport, importing, itemType }) {
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const isPart = itemType === "part";

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/plain",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setFileUri(res.assets[0].uri);
        setFileName(res.assets[0].name);
        setResult(null);
      }
    } catch {
      Alert.alert("Error", "Could not open file picker.");
    }
  };

  const handleImport = async () => {
    if (!fileUri) return;
    const r = await onImport(fileUri, fileName);
    if (r) setResult(r);
  };

  const handleClose = () => {
    setFileUri(null);
    setFileName(null);
    setResult(null);
    onClose();
  };

  const serviceColumns =
    "name*, no/service_no, category, mrp, applicability, applicableBrands, applicableModels";
  const partColumns =
    "name*, no/partCode, category, mrp, purchasePrice, stock, manufacturer, unit, taxPercent, minimumStockLevel, manageInventory, applicability, applicableBrands, applicableModels";

  return (
    <ModalShell
      visible={visible}
      title={`Import ${isPart ? "Parts" : "Services"} — CSV / Excel`}
      onClose={handleClose}
    >
      <SectionCard title="Required Format">
        <Text style={styles.csvHint}>
          <Text style={styles.csvCode}>*</Text> = required column{"\n"}
          {isPart ? partColumns : serviceColumns}
        </Text>
        <Text style={[styles.csvHint, { marginTop: 6 }]}>
          For multiple brands/models use comma-separated values:{" "}
          <Text style={styles.csvCode}>Honda,TVS</Text>
        </Text>
      </SectionCard>

      <TouchableOpacity
        style={styles.filePicker}
        onPress={pickFile}
        activeOpacity={0.7}
      >
        <Ionicons
          name="document-attach-outline"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.filePickerText}>
          {fileName ?? "Tap to choose a CSV or Excel file"}
        </Text>
        {fileName && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        )}
      </TouchableOpacity>

      {fileUri && (
        <AppButton
          title={
            importing ? "Importing…" : `Import ${isPart ? "Parts" : "Services"}`
          }
          variant="gradient"
          size="lg"
          onPress={handleImport}
          disabled={importing}
        />
      )}

      {result && (
        <SectionCard title="Import Result">
          <Text style={styles.resultRow}>
            ✅ Inserted:{" "}
            <Text style={styles.resultBold}>
              {result.inserted ?? result.insertedCount}
            </Text>
          </Text>
          <Text style={styles.resultRow}>
            ⏭ Skipped:{" "}
            <Text style={styles.resultBold}>
              {result.skipped ?? result.failedCount}
            </Text>
          </Text>
          {result.failedRows?.length > 0 && (
            <>
              <Text style={[styles.resultRow, { color: COLORS.error }]}>
                ❌ Errors: {result.failedRows.length}
              </Text>
              {result.failedRows.map((e, i) => (
                <Text key={i} style={styles.errorRow}>
                  Row {e.row}: {e.reason}
                </Text>
              ))}
            </>
          )}
          <AppButton
            title="Done"
            variant="outline"
            size="md"
            onPress={handleClose}
          />
        </SectionCard>
      )}
    </ModalShell>
  );
}

// ─── Service Row ──────────────────────────────────────────────────────────────
function ServiceRow({ item, isLast, onEdit, onDelete }) {
  return (
    <TouchableOpacity
      style={[styles.tableRow, isLast && styles.tableRowLast]}
      activeOpacity={0.9}
      onLongPress={() => onDelete(item)}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowNo}>{item.serviceNo || item.no || "—"}</Text>
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
        </View>
      </View>
      <Text style={styles.rowMrp}>{item.mrp > 0 ? `₹${item.mrp}` : "—"}</Text>
      <TouchableOpacity
        onPress={() => onEdit(item)}
        style={styles.editBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Part Row ─────────────────────────────────────────────────────────────────
function PartRow({ item, isLast, onEdit, onDelete }) {
  const lowStock =
    item.manageInventory && item.stock <= (item.minimumStockLevel ?? 5);
  return (
    <TouchableOpacity
      style={[styles.tableRow, isLast && styles.tableRowLast]}
      activeOpacity={0.9}
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
      >
        <Ionicons name="create-outline" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({
  brand,
  model,
  brands,
  models,
  onBrandChange,
  onModelChange,
  onClear,
}) {
  return (
    <View style={styles.filterBar}>
      <AppSelect
        placeholder="All Brands"
        options={[
          { value: "", label: "All Brands" },
          ...brands.map((b) => ({ value: b, label: b })),
        ]}
        value={brand || ""}
        onChange={(v) => onBrandChange(v || null)}
        icon="car-outline"
      />
      <AppSelect
        placeholder="All Models"
        options={[
          { value: "", label: "All Models" },
          ...models.map((m) => ({ value: m, label: m })),
        ]}
        value={model || ""}
        onChange={(v) => onModelChange(v || null)}
        icon="git-branch-outline"
      />
      {(brand || model) && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ServicePartsScreen() {
  const [activeTab, setActiveTab] = useState("service");

  // data
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [svcCats, setSvcCats] = useState(DEFAULT_SERVICE_CATEGORIES);
  const [partCats, setPartCats] = useState(DEFAULT_PART_CATEGORIES);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // filter
  const [filterBrand, setFilterBrand] = useState(null);
  const [filterModel, setFilterModel] = useState(null);
  const [allBrands, setAllBrands] = useState([]);
  const [filterModels, setFilterModels] = useState([]);

  const searchTimer = useRef(null);
  const isPart = activeTab === "part";

  // ── fetch helpers ────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides = {}) => {
      const p = {};
      if (search.trim()) p.search = search.trim();
      if (filterBrand) p.brand = filterBrand;
      if (filterModel) p.model = filterModel;
      return { ...p, ...overrides };
    },
    [search, filterBrand, filterModel],
  );

  const fetchItems = useCallback(async (tab, params = {}) => {
    setLoading(true);
    try {
      const res = await getCatalogItems(tab, params);
      const data = res.data?.items || [];
      if (tab === "service") setServices(data);
      else setParts(data);
    } catch {
      // silently show empty list — error surfaced on save/delete instead
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (tab) => {
    try {
      const res = await getCatalogCategories(tab);
      const cats = (res.data?.categories || []).map((v) => ({
        value: v,
        label: v,
      }));
      if (!cats.length) return;
      const merged = [
        ...new Set([
          ...(tab === "service"
            ? DEFAULT_SERVICE_CATEGORIES
            : DEFAULT_PART_CATEGORIES
          ).map((c) => c.value),
          ...cats.map((c) => c.value),
        ]),
      ].map((v) => ({ value: v, label: v }));
      if (tab === "service") setSvcCats(merged);
      else setPartCats(merged);
    } catch {
      /* silently fail */
    }
  }, []);

  // ── Initial load + reload on screen focus ─────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchItems("service");
      fetchItems("part");
      fetchCategories("service");
      fetchCategories("part");
      getVehicleBrands()
        .then((r) => setAllBrands(r.data?.brands || []))
        .catch(() => {});
    }, [fetchItems, fetchCategories]),
  );

  // ── Re-fetch when tab / filter changes (skip on initial mount) ───
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    fetchItems(activeTab, buildParams());
  }, [activeTab, filterBrand, filterModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // load filter models when brand changes
  useEffect(() => {
    if (filterBrand) {
      getVehicleModels(filterBrand)
        .then((r) => setFilterModels(r.data?.models || []))
        .catch(() => setFilterModels([]));
    } else {
      setFilterModels([]);
      setFilterModel(null);
    }
  }, [filterBrand]);

  // debounced search
  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchItems(activeTab, buildParams({ search: text.trim() }));
    }, 400);
  };

  // ── CRUD handlers ────────────────────────────────────────────────
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editItem) {
        await updateCatalogItem(editItem._id, payload.itemType, payload);
      } else {
        await createCatalogItem(payload);
      }
      setShowForm(false);
      setEditItem(null);
      // refresh list + categories so count pill and dropdowns stay fresh
      fetchItems(activeTab, buildParams());
      fetchCategories(activeTab);
    } catch (e) {
      Alert.alert(
        editItem ? "Update Failed" : "Add Failed",
        e.displayMessage || "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      `Delete ${isPart ? "Part" : "Service"}`,
      `"${item.name}" will be removed from your catalog.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCatalogItem(item._id, activeTab);
              fetchItems(activeTab, buildParams());
              fetchCategories(activeTab);
            } catch (e) {
              Alert.alert("Error", e.displayMessage || "Could not delete.");
            }
          },
        },
      ],
    );
  };

  const handleImport = async (fileUri, fileName) => {
    setImporting(true);
    try {
      const res = await bulkUploadCatalog(activeTab, fileUri, fileName);
      fetchItems(activeTab, buildParams());
      fetchCategories(activeTab);
      return res.data || res;
    } catch (e) {
      Alert.alert("Import Error", e.displayMessage || "Import failed.");
      return null;
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setFilterBrand(null);
    setFilterModel(null);
    setSearch("");
    fetchItems(activeTab, {});
  };

  const hasFilters = !!(filterBrand || filterModel);
  const data = isPart ? parts : services;
  const categories = isPart ? partCats : svcCats;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Nav */}
      <TopNav
        title="Services & Parts"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={[styles.iconBtn, hasFilters && styles.iconBtnActive]}
            onPress={() => setShowFilter((v) => !v)}
          >
            <Ionicons
              name="filter-outline"
              size={20}
              color={hasFilters ? COLORS.primary : COLORS.textPrimary}
            />
            {hasFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = tab.id === "service" ? services.length : parts.length;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.id);
                setSearch("");
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text
                  style={[
                    styles.tabCountText,
                    active && styles.tabCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter bar */}
      {showFilter && (
        <FilterBar
          brand={filterBrand}
          model={filterModel}
          brands={allBrands}
          models={filterModels}
          onBrandChange={setFilterBrand}
          onModelChange={setFilterModel}
          onClear={clearFilters}
        />
      )}

      {/* Search + actions */}
      <View style={styles.topBar}>
        <AppInput
          icon="search-outline"
          placeholder={`Search ${isPart ? "parts" : "services"}…`}
          value={search}
          onChangeText={handleSearch}
        />
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.csvBtn}
            onPress={() => setShowUpload(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.csvBtnText}>CSV / Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallAddBtn}
            onPress={() => {
              setEditItem(null);
              setShowForm(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.smallAddBtnText}>
              {`+ ${isPart ? "Part" : "Service"}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHead, { flex: 3 }]}>(No.) Name</Text>
        <Text
          style={[
            styles.colHead,
            { width: isPart ? 80 : 60, textAlign: "right" },
          ]}
        >
          MRP
        </Text>
        <Text style={[styles.colHead, { width: 44, textAlign: "right" }]}>
          Edit
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) =>
            isPart ? (
              <PartRow
                item={item}
                isLast={index === data.length - 1}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <ServiceRow
                item={item}
                isLast={index === data.length - 1}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          }
          ListEmptyComponent={
            <EmptyState
              emoji={isPart ? "📦" : "🔧"}
              title={`No ${isPart ? "parts" : "services"} found`}
              description={
                search || hasFilters
                  ? "Try a different search or clear filters"
                  : `Tap "+ ${isPart ? "Part" : "Service"}" or import a file to get started`
              }
            />
          }
        />
      )}

      {/* Add / Edit modal */}
      <ItemFormModal
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        saving={saving}
        editItem={editItem}
        itemType={activeTab}
        categories={categories}
      />

      {/* Bulk upload modal */}
      <BulkUploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onImport={handleImport}
        importing={importing}
        itemType={activeTab}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Nav right button
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: { backgroundColor: COLORS.primaryLight },
  filterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // Tabs
  tabBar: {
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
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  tabTextActive: { color: COLORS.primary },
  tabCount: {
    minWidth: 20,
    height: 18,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabCountActive: { backgroundColor: COLORS.primaryLight },
  tabCountText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  tabCountTextActive: { color: COLORS.primary },

  // Filter bar
  filterBar: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.xs,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  clearBtnText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  smallAddBtn: {
    minWidth: 110,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  smallAddBtnText: {
    fontSize: SIZES.textSm,
    fontFamily: FONTS.semibold,
    color: COLORS.white,
  },
  // Search + actions
  topBar: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    gap: SIZES.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  csvBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 6,
    paddingHorizontal: SIZES.sm + 4,
    backgroundColor: COLORS.primaryLight,
  },
  csvBtnText: {
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
  listContent: { paddingBottom: 40 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  tableRowLast: { borderBottomWidth: 0 },
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

  // Loader / empty
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyNote: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 40,
  },

  // Modal
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

  // Section card
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

  // Row fields
  rowFields: { flexDirection: "row", gap: SIZES.sm },
  rowField: { flex: 1 },

  // Applicability
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

  // Multi-select
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

  // CSV modal
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    backgroundColor: COLORS.primaryLight,
  },
  filePickerText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },
  csvHint: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  csvCode: { fontFamily: FONTS.medium, color: COLORS.textPrimary },
  resultRow: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultBold: { fontFamily: FONTS.bold },
  errorRow: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.error,
    marginLeft: 8,
  },
});
