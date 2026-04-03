import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import EmptyState from "../../components/ui/EmptyState";
import axiosClient from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const TAG_ENDPOINTS = {
  LIST:   "/tags",
  CREATE: "/tags",
  UPDATE: (id) => `/tags/${id}`,
  DELETE: (id) => `/tags/${id}`,
};

const TAG_COLORS = [
  { id: "black",  hex: "#111111", name: "Black"  },
  { id: "pink",   hex: "#E91E8C", name: "Pink"   },
  { id: "purple", hex: "#9C27B0", name: "Purple" },
  { id: "indigo", hex: "#3F51B5", name: "Indigo" },
  { id: "blue",   hex: "#2196F3", name: "Blue"   },
  { id: "teal",   hex: "#009688", name: "Teal"   },
  { id: "green",  hex: "#4CAF50", name: "Green"  },
  { id: "lime",   hex: "#CDDC39", name: "Lime"   },
  { id: "yellow", hex: "#FFEB3B", name: "Yellow" },
  { id: "orange", hex: "#FF9800", name: "Orange" },
  { id: "grey",   hex: "#607D8B", name: "Grey"   },
  { id: "dark",   hex: "#263238", name: "Dark"   },
];

const TAG_TYPES = [
  { value: "invoice",      label: "Invoice"      },
  { value: "repair_order", label: "Repair Order" },
  { value: "both",         label: "Both"         },
];

const FILTER_TABS = [
  { key: "all",          label: "All"          },
  { key: "invoice",      label: "Invoice"      },
  { key: "repair_order", label: "Repair Order" },
];

// light colors that need dark text
const LIGHT_HEX = new Set(["#FFEB3B", "#CDDC39"]);

const getColorByHex = (hex) => TAG_COLORS.find((c) => c.hex === hex) ?? TAG_COLORS[0];
const displayHex    = (hex) => (LIGHT_HEX.has(hex) ? "#B8860B" : hex);
const checkmarkColor = (hex) => (LIGHT_HEX.has(hex) ? "#333" : "#fff");

function tagTypeLabel(type) {
  return TAG_TYPES.find((t) => t.value === type)?.label ?? type ?? "";
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────
function ColorSwatch({ color, selected, onPress }) {
  return (
    <TouchableOpacity
      style={styles.swatchWrap}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityLabel={color.name}
      accessibilityState={{ checked: selected }}
    >
      <View
        style={[
          styles.swatch,
          { borderColor: displayHex(color.hex) },
          selected && { backgroundColor: color.hex },
        ]}
      >
        {selected && (
          <Ionicons name="checkmark" size={13} color={checkmarkColor(color.hex)} />
        )}
      </View>
      <Text
        style={[
          styles.swatchLabel,
          selected && { color: displayHex(color.hex), fontFamily: FONTS.semibold },
        ]}
        numberOfLines={1}
      >
        {color.name}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tag Modal ────────────────────────────────────────────────────────────────
function TagModal({ visible, onClose, onSave, editTag = null, saving = false }) {
  const isEdit = !!editTag;

  const [name,    setName]    = useState("");
  const [type,    setType]    = useState(null);
  const [colorId, setColorId] = useState("black");
  const [errors,  setErrors]  = useState({});

  const handleOpen = () => {
    setName(editTag?.name ?? "");
    setType(editTag?.tagType ?? null);
    // map hex from API back to color id
    const c = getColorByHex(editTag?.color ?? "#111111");
    setColorId(c.id);
    setErrors({});
  };

  const selectedColor = TAG_COLORS.find((c) => c.id === colorId) ?? TAG_COLORS[0];

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Tag name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), tagType: type ?? "both", color: selectedColor.hex });
  };

  const previewHex = displayHex(selectedColor.hex);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Tag" : "Create Tag"}</Text>
            <Text style={styles.modalSubtitle}>
              {isEdit ? "Update tag details" : "Add a new label for organizing"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalClose}
            disabled={saving}
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
          {/* Live Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewHint}>Preview</Text>
            <View
              style={[
                styles.previewChip,
                { borderColor: previewHex, backgroundColor: `${selectedColor.hex}18` },
              ]}
            >
              <View style={[styles.previewDot, { backgroundColor: previewHex }]} />
              <Text style={[styles.previewChipText, { color: previewHex }]}>
                {name.trim() || "Tag Preview"}
              </Text>
            </View>
          </View>

          {/* Tag Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="pricetag-outline" size={15} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionCardTitle}>Tag Details</Text>
            </View>

            <AppInput
              label="Tag Name"
              icon="pricetag-outline"
              placeholder="e.g. Regular Service"
              value={name}
              onChangeText={(v) => { setName(v); if (errors.name) setErrors({}); }}
              error={errors.name}
              accessibilityLabel="Tag name"
            />

            <AppSelect
              label="Tag Type"
              icon="layers-outline"
              placeholder="Select tag type"
              options={TAG_TYPES}
              value={type}
              onChange={setType}
            />
          </View>

          {/* Color Picker */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="color-palette-outline" size={15} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionCardTitle}>Tag Color</Text>
              <View style={[styles.selectedColorBadge, { backgroundColor: `${selectedColor.hex}20`, borderColor: previewHex }]}>
                <Text style={[styles.selectedColorText, { color: previewHex }]}>{selectedColor.name}</Text>
              </View>
            </View>

            <View style={styles.colorGrid}>
              {TAG_COLORS.map((c) => (
                <ColorSwatch
                  key={c.id}
                  color={c}
                  selected={colorId === c.id}
                  onPress={() => setColorId(c.id)}
                />
              ))}
            </View>
          </View>

          <AppButton
            title={saving ? "Saving…" : (isEdit ? "Save Changes" : "Create Tag")}
            variant="gradient"
            size="lg"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tag Row ──────────────────────────────────────────────────────────────────
function TagRow({ tag, isLast, onEdit, onDelete }) {
  const color = getColorByHex(tag.color ?? "#111111");
  const hex   = displayHex(color.hex);

  return (
    <View style={[styles.tagRow, !isLast && styles.tagRowBorder]}>
      <View style={styles.tagLeft}>
        <View style={[styles.tagDot, { backgroundColor: hex }]} />
        <View style={[styles.tagChip, { borderColor: hex, backgroundColor: `${color.hex}15` }]}>
          <Text style={[styles.tagChipText, { color: hex }]} numberOfLines={1}>{tag.name}</Text>
        </View>
        {tag.tagType && (
          <Text style={styles.tagType} numberOfLines={1}>{tagTypeLabel(tag.tagType)}</Text>
        )}
      </View>

      <View style={styles.tagActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(tag)}
          activeOpacity={0.7}
          accessibilityLabel={`Edit ${tag.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(tag)}
          activeOpacity={0.7}
          accessibilityLabel={`Delete ${tag.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TagsManagementScreen() {
  const [tags,       setTags]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [filterTab,  setFilterTab]  = useState("all");
  const [showModal,  setShowModal]  = useState(false);
  const [editTag,    setEditTag]    = useState(null);

  const fetchTags = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await axiosClient.get(TAG_ENDPOINTS.LIST);
      setTags(res.data?.data?.tags ?? res.data?.data ?? []);
    } catch { setTags([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchTags(); }, []));

  const filtered = useMemo(() => {
    if (filterTab === "all") return tags;
    return tags.filter((t) => t.tagType === filterTab || t.tagType === "both");
  }, [tags, filterTab]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const key = tagTypeLabel(t.tagType) || "General";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map);
  }, [filtered]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editTag) {
        const res = await axiosClient.put(TAG_ENDPOINTS.UPDATE(editTag._id), data);
        const updated = res.data?.data?.tag ?? res.data?.data;
        setTags((prev) => prev.map((t) => (t._id === editTag._id ? updated : t)));
      } else {
        const res = await axiosClient.post(TAG_ENDPOINTS.CREATE, data);
        const created = res.data?.data?.tag ?? res.data?.data;
        setTags((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditTag(null);
    } catch (e) {
      Alert.alert("Error", e.displayMessage ?? "Could not save tag.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag) => {
    setEditTag(tag);
    setShowModal(true);
  };

  const handleDelete = (tag) => {
    Alert.alert(
      "Delete Tag",
      `Are you sure you want to delete "${tag.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(TAG_ENDPOINTS.DELETE(tag._id));
              setTags((prev) => prev.filter((t) => t._id !== tag._id));
            } catch (e) {
              Alert.alert("Error", e.displayMessage ?? "Could not delete tag.");
            }
          },
        },
      ],
    );
  };

  const openCreate = () => {
    setEditTag(null);
    setShowModal(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Tags"
        showBack
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={openCreate}
            activeOpacity={0.8}
            accessibilityLabel="Create tag"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchTags(true)} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {/* Summary strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{tags.length}</Text>
              <Text style={styles.summaryLabel}>Total Tags</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {tags.filter((t) => t.tagType === "invoice" || t.tagType === "both").length}
              </Text>
              <Text style={styles.summaryLabel}>Invoice</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {tags.filter((t) => t.tagType === "repair_order" || t.tagType === "both").length}
              </Text>
              <Text style={styles.summaryLabel}>Repair Order</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: SIZES.xs }}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, filterTab === tab.key && styles.filterTabActive]}
                onPress={() => setFilterTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, filterTab === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* New Tag button */}
          <View style={styles.searchRow}>
            <AppButton title="+ New Tag" variant="gradient" size="sm" onPress={openCreate} />
          </View>

          {/* Grouped tag list */}
          {filtered.length === 0 ? (
            <EmptyState
              emoji="🏷️"
              title="No tags found"
              description={`Tap "+ New Tag" to create your first tag`}
            />
          ) : (
            grouped.map(([groupTitle, groupTags]) => (
              <View key={groupTitle} style={styles.group}>
                <Text style={styles.groupTitle}>{groupTitle}</Text>
                <View style={styles.listCard}>
                  {groupTags.map((tag, index) => (
                    <TagRow
                      key={tag._id}
                      tag={tag}
                      isLast={index === groupTags.length - 1}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TagModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditTag(null); }}
        onSave={handleSave}
        editTag={editTag}
        saving={saving}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 40,
    gap: SIZES.md,
  },

  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryItem:   { flex: 1, alignItems: "center" },
  summaryValue:  { fontFamily: FONTS.bold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  summaryLabel:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight },

  filterRow: { flexGrow: 0 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterTabActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText:       { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  filterTabTextActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  searchRow: { flex: 1, flexDirection: "column", alignItems: "flex-start", gap: SIZES.sm },

  group:      { gap: SIZES.xs },
  groupTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingLeft: SIZES.xs,
  },

  listCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
  },
  tagRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tagLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    flex: 1,
    marginRight: SIZES.sm,
  },
  tagDot:     { width: 8, height: 8, borderRadius: 4 },
  tagChip:    { borderWidth: 1, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.sm + 2, paddingVertical: 3, maxWidth: 160 },
  tagChipText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  tagType:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  tagActions: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  editBtn: {
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
  editBtnText: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.primary },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  modalTitle:    { fontFamily: FONTS.semibold, fontSize: SIZES.textLg, color: COLORS.textPrimary, letterSpacing: -0.2 },
  modalSubtitle: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: { height: 1, backgroundColor: COLORS.borderLight },
  modalBody: { padding: SIZES.screenPadding, paddingBottom: 60, gap: SIZES.md },

  previewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    alignItems: "center",
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  previewHint: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
  },
  previewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  previewDot:     { width: 8, height: 8, borderRadius: 4 },
  previewChipText: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase },

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
  sectionCardTitle:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, flex: 1 },
  selectedColorBadge:  { borderWidth: 1, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.sm, paddingVertical: 3 },
  selectedColorText:   { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  swatchWrap: { width: "14%", alignItems: "center", gap: 4 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  swatchLabel: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.textMuted, textAlign: "center" },
});
