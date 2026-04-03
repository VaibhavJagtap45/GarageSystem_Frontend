import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CHECKLISTS = [
  { id: "1", name: "60 Points Check", sections: 5 },
  { id: "2", name: "Pre-Delivery Check", sections: 3 },
  { id: "3", name: "Oil Service Check", sections: 2 },
];

// ─── Add Checklist Modal ──────────────────────────────────────────────────────
function AddChecklistModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Checklist name is required");
      return;
    }
    onAdd(name.trim());
    setName("");
    setError("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalIconWrap}>
                <Ionicons
                  name="checkbox-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Add New Checklist</Text>
                <Text style={styles.modalSubtitle}>
                  Create a new jobcard checklist
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.modalClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Body */}
          <View style={styles.modalBody}>
            <AppInput
              label="Checklist Name"
              icon="document-text-outline"
              placeholder="e.g. 60 Points Check"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError("");
              }}
              error={error}
              accessibilityLabel="Checklist name"
              autoCapitalize="words"
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.addBtnWrap}>
                <AppButton
                  title="Add Checklist"
                  variant="gradient"
                  size="md"
                  onPress={handleAdd}
                  accessibilityLabel="Add checklist"
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Checklist Card ───────────────────────────────────────────────────────────
function ChecklistCard({ item, onEdit, onDelete, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {/* Left */}
      <View style={styles.cardLeft}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="checkbox-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardMeta}>
            {item.sections} {item.sections === 1 ? "section" : "sections"}
          </Text>
        </View>
      </View>

      {/* Right */}
      <View style={styles.cardRight}>
        <Badge label={`${item.sections} Sections`} variant="info" size="sm" />
        <TouchableOpacity
          style={styles.editIconBtn}
          onPress={() => onEdit(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Edit ${item.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="pencil-outline" size={15} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={() => onDelete(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Delete ${item.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function JobCardChecklistScreen() {
  const [checklists, setChecklists] = useState(MOCK_CHECKLISTS);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleAdd = (name) => {
    if (editItem) {
      setChecklists((prev) =>
        prev.map((c) => (c.id === editItem.id ? { ...c, name } : c)),
      );
      setEditItem(null);
    } else {
      setChecklists((prev) => [
        ...prev,
        { id: Date.now().toString(), name, sections: 0 },
      ]);
    }
    setShowModal(false);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Checklist",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setChecklists((prev) => prev.filter((c) => c.id !== item.id)),
        },
      ],
    );
  };

  const handleOpen = () => {
    setEditItem(null);
    setShowModal(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Jobcards / Checklists"
        transparent={false}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={handleOpen}
            activeOpacity={0.8}
            accessibilityLabel="Add checklist"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Summary strip */}
      {checklists.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{checklists.length}</Text>
            <Text style={styles.summaryLabel}>Checklists</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {checklists.reduce((acc, c) => acc + c.sections, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Total Sections</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {checklists.filter((c) => c.sections > 0).length}
            </Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>
      )}

      {/* Create button row */}
      <View style={styles.createBtnRow}>
        <AppButton
          title="+ Add New Checklist"
          variant="gradient"
          size="sm"
          onPress={handleOpen}
          accessibilityLabel="Add new checklist"
        />
      </View>

      {/* List */}
      <FlatList
        data={checklists}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        renderItem={({ item }) => (
          <ChecklistCard
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPress={() =>
              Alert.alert("Open", `Opening "${item.name}" checklist`)
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📋"
            title="No checklists yet"
            description='Tap "+ Add New Checklist" to create your first jobcard checklist'
          />
        }
      />

      <AddChecklistModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        onAdd={handleAdd}
        editItem={editItem}
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

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
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
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },

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
    paddingBottom: 40,
  },

  // Checklist Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    flex: 1,
    marginRight: SIZES.sm,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: SIZES.screenPadding,
  },
  modalSheet: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    flex: 1,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  modalClose: {
    width: 30,
    height: 30,
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
    padding: SIZES.md,
    gap: SIZES.md,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SIZES.sm,
    marginTop: SIZES.xs,
  },
  cancelBtn: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cancelBtnText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  addBtnWrap: {
    flex: 1,
  },
});
