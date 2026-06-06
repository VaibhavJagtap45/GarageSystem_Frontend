import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const STATUS_CONFIG = {
  pending_approval: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: "time-outline" },
  approved: { label: "Approved", color: "#3B82F6", bg: "#EFF6FF", icon: "checkmark-circle-outline" },
  in_transit: { label: "In Transit", color: "#8B5CF6", bg: "#F5F3FF", icon: "car-outline" },
  received: { label: "Received", color: COLORS.primary, bg: COLORS.primaryLight, icon: "checkmark-done-outline" },
  rejected: { label: "Rejected", color: "#EF4444", bg: "#FEF2F2", icon: "close-circle-outline" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6", icon: "ban-outline" },
};

export default function InventoryTransfersScreen() {
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [currentGarageId, setCurrentGarageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFranchise, setIsFranchise] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState("1");
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const loadAll = useCallback(async () => {
    const results = await Promise.allSettled([
      axiosClient.get("/inventory-transfers"),
      axiosClient.get("/inventory-transfers/branches"),
      axiosClient.get("/inventory-transfers/inventory-items"),
    ]);

    if (results[0].status === "fulfilled") {
      setTransfers(results[0].value?.data?.data?.transfers || []);
    }
    if (results[1].status === "fulfilled") {
      const data = results[1].value?.data?.data;
      setBranches(data?.branches || []);
      setCurrentGarageId(data?.currentGarageId || null);
      setIsFranchise(data?.isFranchise === true);
    }
    if (results[2].status === "fulfilled") {
      setInventoryItems(results[2].value?.data?.data?.items || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const createRequest = async () => {
    if (!selectedBranch || !selectedItem) return;
    setCreating(true);
    try {
      await axiosClient.post("/inventory-transfers", {
        toGarageId: selectedBranch._id,
        items: [
          {
            inventoryId: selectedItem._id,
            partName: selectedItem.partName,
            partCode: selectedItem.partCode || null,
            quantity: Number(qty) || 1,
            unitPrice: selectedItem.sellingPrice || 0,
          },
        ],
      });
      setSelectedBranch(null);
      setSelectedItem(null);
      setQty("1");
      setShowForm(false);
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create transfer request";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const action = async (id, type) => {
    try {
      await axiosClient.patch(`/inventory-transfers/${id}/${type}`);
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.message || "Action failed";
      Alert.alert("Error", msg);
    }
  };

  const filteredBranches = branchSearch
    ? branches.filter(
        (b) =>
          b.garageName?.toLowerCase().includes(branchSearch.toLowerCase()) ||
          b.garageAddress?.toLowerCase().includes(branchSearch.toLowerCase())
      )
    : branches;

  const filteredItems = itemSearch
    ? inventoryItems.filter(
        (i) =>
          i.partName?.toLowerCase().includes(itemSearch.toLowerCase()) ||
          i.partCode?.toLowerCase().includes(itemSearch.toLowerCase())
      )
    : inventoryItems;

  const renderTransferCard = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_approval;
    const fromName = item.fromGarageId?.garageName || "Unknown";
    const toName = item.toGarageId?.garageName || "Unknown";
    const fromAddr = item.fromGarageId?.garageAddress || "";
    const toAddr = item.toGarageId?.garageAddress || "";
    const isMyGarage = (id) => String(id) === String(currentGarageId);
    const direction = isMyGarage(item.fromGarageId?._id) ? "outgoing" : "incoming";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={[styles.directionBadge, { backgroundColor: direction === "outgoing" ? "#FEF3C7" : "#DBEAFE" }]}>
            <Ionicons
              name={direction === "outgoing" ? "arrow-up-outline" : "arrow-down-outline"}
              size={12}
              color={direction === "outgoing" ? "#D97706" : "#2563EB"}
            />
            <Text style={{ fontSize: 11, fontFamily: FONTS.medium, color: direction === "outgoing" ? "#D97706" : "#2563EB" }}>
              {direction === "outgoing" ? "Sent" : "Received"}
            </Text>
          </View>
        </View>

        <View style={styles.garageRow}>
          <View style={styles.garageInfo}>
            <Text style={styles.garageLabel}>From</Text>
            <Text style={styles.garageName}>{fromName}</Text>
            {fromAddr ? <Text style={styles.garageAddr} numberOfLines={1}>{fromAddr}</Text> : null}
          </View>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} style={{ marginHorizontal: 8 }} />
          <View style={styles.garageInfo}>
            <Text style={styles.garageLabel}>To</Text>
            <Text style={styles.garageName}>{toName}</Text>
            {toAddr ? <Text style={styles.garageAddr} numberOfLines={1}>{toAddr}</Text> : null}
          </View>
        </View>

        {item.items?.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionTitle}>Items</Text>
            {item.items.map((it, idx) => {
              const displayName = it.inventoryId?.partName || it.partName;
              const displayCode = it.inventoryId?.partCode || it.partCode;
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemName}>
                    {displayName}
                    {displayCode ? ` (${displayCode})` : ""}
                  </Text>
                  <Text style={styles.itemQty}>x{it.quantity}</Text>
                </View>
              );
            })}
          </View>
        )}

        {item.requestedBy && (
          <Text style={styles.requestedBy}>
            Requested by {item.requestedBy.fullName}
          </Text>
        )}

        <View style={styles.actionRow}>
          {item.status === "pending_approval" && (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => action(item._id, "approve")}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => action(item._id, "reject")}>
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === "approved" && isMyGarage(item.fromGarageId?._id) && (
            <TouchableOpacity style={[styles.actionBtn, styles.transitBtn]} onPress={() => action(item._id, "in-transit")}>
              <Ionicons name="car-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Mark In Transit</Text>
            </TouchableOpacity>
          )}
          {item.status === "in_transit" && isMyGarage(item.toGarageId?._id) && (
            <TouchableOpacity style={[styles.actionBtn, styles.receiveBtn]} onPress={() => action(item._id, "receive")}>
              <Ionicons name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Mark Received</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <TopNav title="Inventory Transfers" transparent={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!isFranchise) {
    return (
      <View style={styles.safe}>
        <TopNav title="Inventory Transfers" transparent={false} />
        <View style={styles.center}>
          <Ionicons name="business-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Franchise Only</Text>
          <Text style={styles.emptyDesc}>
            Inventory transfers are only available for garages that are part of a franchise network.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <TopNav title="Inventory Transfers" transparent={false} />
      <View style={styles.container}>
        {!showForm && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>New Transfer Request</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Transfer Request</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Transfer To (Branch)</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowBranchPicker(true)}>
              {selectedBranch ? (
                <View>
                  <Text style={styles.selectorText}>{selectedBranch.garageName}</Text>
                  {selectedBranch.garageAddress ? (
                    <Text style={styles.selectorSub} numberOfLines={1}>{selectedBranch.garageAddress}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select branch garage...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Inventory Item</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowItemPicker(true)}>
              {selectedItem ? (
                <View>
                  <Text style={styles.selectorText}>
                    {selectedItem.partName}
                    {selectedItem.partCode ? ` (${selectedItem.partCode})` : ""}
                  </Text>
                  <Text style={styles.selectorSub}>
                    Stock: {selectedItem.quantityInHand} | {selectedItem.category}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select inventory item...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="number-pad"
              value={qty}
              onChangeText={setQty}
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!selectedBranch || !selectedItem || creating) && styles.submitBtnDisabled]}
              onPress={createRequest}
              disabled={!selectedBranch || !selectedItem || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Send Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Transfer History</Text>
          <Text style={styles.listCount}>{transfers.length}</Text>
        </View>

        <FlatList
          data={transfers}
          keyExtractor={(item) => item._id}
          renderItem={renderTransferCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
          contentContainerStyle={transfers.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="swap-horizontal-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Transfers Yet</Text>
              <Text style={styles.emptyDesc}>Create a transfer request to move inventory between your franchise branches.</Text>
            </View>
          }
        />
      </View>

      {/* Branch Picker Modal */}
      <Modal visible={showBranchPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Branch</Text>
              <TouchableOpacity onPress={() => { setShowBranchPicker(false); setBranchSearch(""); }}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Search branches..."
              value={branchSearch}
              onChangeText={setBranchSearch}
            />
            <FlatList
              data={filteredBranches}
              keyExtractor={(b) => b._id}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedBranch?._id === b._id && styles.pickerItemActive]}
                  onPress={() => { setSelectedBranch(b); setShowBranchPicker(false); setBranchSearch(""); }}
                >
                  <Ionicons name="business-outline" size={20} color={selectedBranch?._id === b._id ? COLORS.primary : COLORS.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.pickerItemText, selectedBranch?._id === b._id && { color: COLORS.primary }]}>{b.garageName}</Text>
                    {b.garageAddress ? <Text style={styles.pickerItemSub} numberOfLines={1}>{b.garageAddress}</Text> : null}
                  </View>
                  {selectedBranch?._id === b._id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerEmpty}>No branches found</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Item Picker Modal */}
      <Modal visible={showItemPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => { setShowItemPicker(false); setItemSearch(""); }}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Search items..."
              value={itemSearch}
              onChangeText={setItemSearch}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={(i) => i._id}
              renderItem={({ item: i }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedItem?._id === i._id && styles.pickerItemActive]}
                  onPress={() => { setSelectedItem(i); setShowItemPicker(false); setItemSearch(""); }}
                >
                  <Ionicons name="cube-outline" size={20} color={selectedItem?._id === i._id ? COLORS.primary : COLORS.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.pickerItemText, selectedItem?._id === i._id && { color: COLORS.primary }]}>
                      {i.partName}{i.partCode ? ` (${i.partCode})` : ""}
                    </Text>
                    <Text style={styles.pickerItemSub}>
                      Stock: {i.quantityInHand} | {i.category}{i.brand ? ` | ${i.brand}` : ""}
                    </Text>
                  </View>
                  {selectedItem?._id === i._id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerEmpty}>No items found</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: SIZES.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 13,
    marginBottom: 16,
  },
  createBtnText: { color: "#fff", fontFamily: FONTS.semibold, fontSize: SIZES.textBase },

  formCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  formTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  fieldLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginBottom: 6, marginTop: 10 },

  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    backgroundColor: COLORS.bgInput,
  },
  selectorText: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  selectorSub: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  selectorPlaceholder: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },

  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    backgroundColor: COLORS.bgInput,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 13,
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontFamily: FONTS.semibold, fontSize: SIZES.textBase },

  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  listTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  listCount: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
  directionBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  garageRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  garageInfo: { flex: 1 },
  garageLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 2 },
  garageName: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  garageAddr: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },

  itemsSection: { backgroundColor: COLORS.bgInput, borderRadius: SIZES.radiusSm, padding: 10, marginBottom: 8 },
  itemsSectionTitle: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  itemName: { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  itemQty: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textSecondary },

  requestedBy: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 8 },

  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: SIZES.radiusSm,
  },
  actionBtnText: { color: "#fff", fontFamily: FONTS.semibold, fontSize: SIZES.textSm },
  approveBtn: { backgroundColor: COLORS.primary },
  rejectBtn: { backgroundColor: "#EF4444" },
  transitBtn: { backgroundColor: "#8B5CF6" },
  receiveBtn: { backgroundColor: "#3B82F6" },

  emptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginTop: 12 },
  emptyDesc: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", marginTop: 6, maxWidth: 280 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: "70%",
    padding: 16,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  modalSearch: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusSm,
    padding: 10,
    marginBottom: 10,
    backgroundColor: COLORS.bgInput,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryLight },
  pickerItemText: { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  pickerItemSub: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  pickerEmpty: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", padding: 24 },
});
