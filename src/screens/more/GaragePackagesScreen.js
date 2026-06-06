import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import AppToggle from "../../components/ui/AppToggle";
import AppRadioGroup from "../../components/ui/AppRadioGroup";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "GENERAL", label: "General", icon: "layers-outline" },
  { id: "AMC", label: "AMC", icon: "refresh-outline" },
];

const PACKAGE_TYPES = [
  "Basic Service",
  "Standard Service",
  "Premium Service",
  "Full Service",
  "Custom",
].map((v) => ({ value: v, label: v }));

const APPLICABILITY_OPTIONS = [
  { value: "generic", label: "Generic (Applicable for all Models)" },
  { value: "class", label: "By Class (Upto 180cc, More than 180cc, etc.)" },
  { value: "specific", label: "Specific for Vehicle Brand(s) and/or Model(s)" },
];

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function ModalShell({ visible, title, subtitle, onClose, children }) {
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
          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalDivider} />
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

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      {(title || icon) && (
        <View style={styles.sectionCardHeader}>
          {icon && (
            <View style={styles.sectionIconWrap}>
              <Ionicons name={icon} size={15} color={COLORS.primary} />
            </View>
          )}
          {title && <Text style={styles.sectionCardTitle}>{title}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

// ─── Section Add Row ──────────────────────────────────────────────────────────
function SectionAddRow({ label, icon, count = 0, onAdd }) {
  return (
    <View style={styles.sectionAddRow}>
      <View style={styles.sectionAddLeft}>
        {icon && (
          <View style={styles.sectionAddIconWrap}>
            <Ionicons name={icon} size={15} color={COLORS.primary} />
          </View>
        )}
        <Text style={styles.sectionAddLabel}>{label}</Text>
        {count > 0 && (
          <View style={styles.sectionAddCount}>
            <Text style={styles.sectionAddCountText}>{count}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.addChip}
        onPress={onAdd}
        activeOpacity={0.8}
        accessibilityLabel={`Add ${label}`}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={14} color={COLORS.primary} />
        <Text style={styles.addChipText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Totals Row ───────────────────────────────────────────────────────────────
function TotalRow({ label, value, isGrand = false }) {
  return (
    <View style={[styles.totalRow, isGrand && styles.totalRowGrand]}>
      <Text style={[styles.totalLabel, isGrand && styles.totalLabelGrand]}>
        {label}
      </Text>
      <Text style={[styles.totalValue, isGrand && styles.totalValueGrand]}>
        ₹{value ?? 0}
      </Text>
    </View>
  );
}

// ─── Info Note ────────────────────────────────────────────────────────────────
function InfoNote({ text }) {
  return (
    <View style={styles.infoNote}>
      <Ionicons
        name="information-circle-outline"
        size={14}
        color={COLORS.primary}
      />
      <Text style={styles.infoNoteText}>{text}</Text>
    </View>
  );
}

// ─── General Package Modal ────────────────────────────────────────────────────
const GENERAL_INIT = {
  name: "",
  type: null,
  doorstep: false,
  description: "",
  applicability: "generic",
  services: [],
  parts: [],
  servicesTotal: 0,
  partsTotal: 0,
  discount: 0,
  publishToPortal: false,
};

function CreatePackageModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState(GENERAL_INIT);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const grandTotal = Math.max(
    0,
    form.servicesTotal + form.partsTotal - form.discount,
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Package name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    setForm(GENERAL_INIT);
    setErrors({});
    onClose();
  };

  return (
    <ModalShell
      visible={visible}
      title="Create Package"
      subtitle="General service package"
      onClose={onClose}
    >
      {/* Basic Info */}
      <SectionCard title="Package Info" icon="layers-outline">
        <InfoNote text="Price will be calculated only if all individual item prices are available" />

        <AppInput
          label="Package Name"
          icon="layers-outline"
          placeholder="e.g. Basic Service Package"
          value={form.name}
          onChangeText={set("name")}
          error={errors.name}
          accessibilityLabel="Package name"
        />

        <AppSelect
          label="Package Type"
          icon="grid-outline"
          placeholder="Select package type"
          options={PACKAGE_TYPES}
          value={form.type}
          onChange={set("type")}
        />

        <AppInput
          label="Description"
          icon="document-text-outline"
          placeholder="Describe what's included…"
          value={form.description}
          onChangeText={set("description")}
          multiline
          numberOfLines={3}
          accessibilityLabel="Description"
        />
      </SectionCard>

      {/* Services & Parts */}
      <SectionCard title="Inclusions" icon="construct-outline">
        <SectionAddRow
          label="Services"
          icon="construct-outline"
          count={form.services.length}
          onAdd={() => Alert.alert("Add Service", "Service picker coming soon")}
        />
        <View style={styles.inclusionDivider} />
        <SectionAddRow
          label="Parts"
          icon="cube-outline"
          count={form.parts.length}
          onAdd={() => Alert.alert("Add Part", "Part picker coming soon")}
        />
      </SectionCard>

      {/* Applicability */}
      <SectionCard title="Applicability" icon="car-outline">
        <AppRadioGroup
          options={APPLICABILITY_OPTIONS}
          value={form.applicability}
          onChange={set("applicability")}
          direction="column"
        />
      </SectionCard>

      {/* Media */}
      <SectionCard title="Media" icon="image-outline">
        <TouchableOpacity
          style={styles.addImageBtn}
          onPress={() => Alert.alert("Add Image", "Image picker coming soon")}
          activeOpacity={0.8}
          accessibilityLabel="Add Image"
          accessibilityRole="button"
        >
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.addImageText}>Upload Package Image</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* Pricing */}
      <SectionCard title="Pricing Summary" icon="pricetag-outline">
        <TotalRow label="Services Total" value={form.servicesTotal} />
        <TotalRow label="Parts Total" value={form.partsTotal} />
        <TotalRow label="Discount Applied" value={form.discount} />
        <View style={styles.totalDivider} />
        <TotalRow label="Grand Total" value={grandTotal} isGrand />
      </SectionCard>

      {/* Settings */}
      <SectionCard title="Settings" icon="settings-outline">
        <AppToggle
          label="Available for Doorstep Service"
          sublabel="Technician visits customer location"
          icon="home-outline"
          value={form.doorstep}
          onChange={set("doorstep")}
        />
        <AppToggle
          label="Publish to Portal"
          sublabel="Make this package visible to customers"
          icon="globe-outline"
          value={form.publishToPortal}
          onChange={set("publishToPortal")}
        />
      </SectionCard>

      <AppButton
        title="Create Package"
        variant="gradient"
        size="lg"
        onPress={handleSave}
      />
    </ModalShell>
  );
}

// ─── AMC Package Modal ────────────────────────────────────────────────────────
const AMC_INIT = {
  name: "",
  description: "",
  price: "",
  validity: "",
  services: [],
  parts: [],
  otherService: "0",
  otherParts: "0",
};

function CreateAmcPackageModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState(AMC_INIT);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Package name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    setForm(AMC_INIT);
    setErrors({});
    onClose();
  };

  return (
    <ModalShell
      visible={visible}
      title="Create AMC Package"
      subtitle="Annual Maintenance Contract"
      onClose={onClose}
    >
      {/* Basic Info */}
      <SectionCard title="Package Info" icon="refresh-outline">
        <AppInput
          label="Package Name"
          icon="layers-outline"
          placeholder="e.g. Annual Maintenance Plan"
          value={form.name}
          onChangeText={set("name")}
          error={errors.name}
          accessibilityLabel="Package name"
        />
        <AppInput
          label="Description"
          icon="document-text-outline"
          placeholder="Describe what's included…"
          value={form.description}
          onChangeText={set("description")}
          multiline
          numberOfLines={3}
          accessibilityLabel="Description"
        />
      </SectionCard>

      {/* Pricing & Validity */}
      <SectionCard title="Pricing & Validity" icon="pricetag-outline">
        <View style={styles.rowFields}>
          <View style={styles.rowField}>
            <AppInput
              label="Price (₹)"
              icon="pricetag-outline"
              placeholder="0.00"
              value={form.price}
              onChangeText={set("price")}
              keyboardType="numeric"
              accessibilityLabel="Price"
            />
          </View>
          <View style={styles.rowField}>
            <AppInput
              label="Validity (Months)"
              icon="time-outline"
              placeholder="e.g. 12"
              value={form.validity}
              onChangeText={set("validity")}
              keyboardType="numeric"
              accessibilityLabel="Validity in months"
            />
          </View>
        </View>
      </SectionCard>

      {/* Inclusions */}
      <SectionCard title="Inclusions" icon="construct-outline">
        <SectionAddRow
          label="Services"
          icon="construct-outline"
          count={form.services.length}
          onAdd={() => Alert.alert("Add Service", "Service picker coming soon")}
        />
        <View style={styles.inclusionDivider} />
        <SectionAddRow
          label="Parts"
          icon="cube-outline"
          count={form.parts.length}
          onAdd={() => Alert.alert("Add Part", "Part picker coming soon")}
        />
      </SectionCard>

      {/* Additional Discount */}
      <SectionCard title="Additional Discount %" icon="receipt-outline">
        <View style={styles.rowFields}>
          <View style={styles.rowField}>
            <AppInput
              label="Other Services"
              icon="construct-outline"
              placeholder="0"
              value={form.otherService}
              onChangeText={set("otherService")}
              keyboardType="numeric"
              accessibilityLabel="Other service discount"
            />
          </View>
          <View style={styles.rowField}>
            <AppInput
              label="Other Parts"
              icon="cube-outline"
              placeholder="0"
              value={form.otherParts}
              onChangeText={set("otherParts")}
              keyboardType="numeric"
              accessibilityLabel="Other parts discount"
            />
          </View>
        </View>
      </SectionCard>

      <AppButton
        title="Create AMC Package"
        variant="gradient"
        size="lg"
        onPress={handleSave}
      />
    </ModalShell>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, isAmc = false, onEdit }) {
  return (
    <TouchableOpacity
      style={styles.pkgCard}
      onPress={() => onEdit(pkg)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={pkg.name}
    >
      <View style={styles.pkgIconWrap}>
        <Ionicons
          name={isAmc ? "refresh-outline" : "layers-outline"}
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.pkgInfo}>
        <View style={styles.pkgNameRow}>
          <Text style={styles.pkgName} numberOfLines={1}>
            {pkg.name}
          </Text>
          {pkg.publishToPortal && (
            <Badge label="Published" variant="success" size="sm" />
          )}
        </View>
        <View style={styles.pkgMeta}>
          {pkg.type && <Text style={styles.pkgType}>{pkg.type}</Text>}
          {pkg.doorstep && (
            <View style={styles.pkgMetaChip}>
              <Ionicons name="home-outline" size={10} color={COLORS.primary} />
              <Text style={styles.pkgMetaChipText}>Doorstep</Text>
            </View>
          )}
          {pkg.validity && (
            <View style={styles.pkgMetaChip}>
              <Ionicons name="time-outline" size={10} color={COLORS.primary} />
              <Text style={styles.pkgMetaChipText}>{pkg.validity} months</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GaragePackagesScreen() {
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [showCreateGeneral, setShowCreateGeneral] = useState(false);
  const [showCreateAmc, setShowCreateAmc] = useState(false);
  const [generalPackages, setGeneralPackages] = useState([]);
  const [amcPackages, setAmcPackages] = useState([]);

  const isGeneral = activeTab === "GENERAL";
  const data = isGeneral ? generalPackages : amcPackages;

  const handleSaveGeneral = (form) =>
    setGeneralPackages((p) => [...p, { id: Date.now().toString(), ...form }]);

  const handleSaveAmc = (form) =>
    setAmcPackages((p) => [...p, { id: Date.now().toString(), ...form }]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Garage Packages"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() =>
              isGeneral ? setShowCreateGeneral(true) : setShowCreateAmc(true)
            }
            activeOpacity={0.8}
            accessibilityLabel="Create package"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
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
                  {tab.id === "GENERAL"
                    ? generalPackages.length
                    : amcPackages.length}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create btn row */}
      <View style={styles.createBtnRow}>
        <AppButton
          title={isGeneral ? "+ Create Package" : "+ Create AMC Package"}
          variant="gradient"
          size="sm"
          onPress={() =>
            isGeneral ? setShowCreateGeneral(true) : setShowCreateAmc(true)
          }
        />
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        renderItem={({ item }) => (
          <PackageCard
            pkg={item}
            isAmc={!isGeneral}
            onEdit={() => Alert.alert("Edit", `Editing "${item.name}"`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji={isGeneral ? "📦" : "🔄"}
            title={`No ${isGeneral ? "General" : "AMC"} Packages`}
            description={`Tap "${isGeneral ? "+ Create Package" : "+ Create AMC Package"}" to get started`}
          />
        }
      />

      <CreatePackageModal
        visible={showCreateGeneral}
        onClose={() => setShowCreateGeneral(false)}
        onSave={handleSaveGeneral}
      />
      <CreateAmcPackageModal
        visible={showCreateAmc}
        onClose={() => setShowCreateAmc(false)}
        onSave={handleSaveAmc}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
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

  // Create btn row
  createBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 120,
  },

  // Package Card
  pkgCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.md,
    ...SHADOWS.sm,
  },
  pkgIconWrap: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pkgInfo: { flex: 1 },
  pkgNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
    marginBottom: 4,
  },
  pkgName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pkgMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  pkgType: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  pkgMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pkgMetaChipText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.primary,
  },

  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  modalHeaderText: { flex: 1 },
  modalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
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
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  modalBody: {
    padding: SIZES.screenPadding,
    gap: SIZES.md,
    paddingBottom: 60,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  // Info Note
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm + 2,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  infoNoteText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.primaryDark,
    lineHeight: 17,
  },

  // Section Add Row
  sectionAddRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.sm + 2,
  },
  sectionAddLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    flex: 1,
  },
  sectionAddIconWrap: {
    width: 28,
    height: 28,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionAddLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  sectionAddCount: {
    minWidth: 20,
    height: 18,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  sectionAddCountText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.primary,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  addChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  inclusionDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },

  // Add Image
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    justifyContent: "center",
  },
  addImageText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Totals
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  totalRowGrand: {
    borderBottomWidth: 0,
    paddingTop: SIZES.sm,
  },
  totalLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textSecondary,
  },
  totalLabelGrand: {
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  totalValueGrand: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.xs,
  },

  // Row fields
  rowFields: {
    flexDirection: "row",
    gap: SIZES.sm,
  },
  rowField: { flex: 1 },
});
