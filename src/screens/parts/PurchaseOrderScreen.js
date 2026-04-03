// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   FlatList,
//   Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import AppInput from "../../components/ui/AppInput";
// import AppButton from "../../components/ui/AppButton";
// import AppSelect from "../../components/ui/AppSelect";
// import AppToggle from "../../components/ui/AppToggle";
// import EmptyState from "../../components/ui/EmptyState";

// const TABS = [
//   { id: "CREATE_ORDER", label: "CREATE ORDER" },
//   { id: "ORDERS", label: "ORDERS" },
// ];

// export default function PurchaseOrderScreen() {
//   const [activeTab, setActiveTab] = useState("CREATE_ORDER");
//   const [vendor, setVendor] = useState("");
//   const [repairOrder, setRepairOrder] = useState("");
//   const [parts, setParts] = useState([]);
//   const [comments, setComments] = useState("");
//   const [notifyVendor, setNotifyVendor] = useState(false);
//   const [orders] = useState([]); // Replace with real orders data

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
//       <TopNav title="Purchase Order" transparent={false} />

//       {/* Tabs */}
//       <View style={styles.tabsWrapper}>
//         {TABS.map((tab) => {
//           const isActive = activeTab === tab.id;
//           return (
//             <TouchableOpacity
//               key={tab.id}
//               style={[styles.tab, isActive && styles.activeTab]}
//               onPress={() => setActiveTab(tab.id)}
//               activeOpacity={0.8}
//             >
//               <Text style={[styles.tabText, isActive && styles.activeTabText]}>
//                 {tab.label}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {activeTab === "CREATE_ORDER" ? (
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Vendor Dropdown */}
//           <AppSelect
//             icon="person-outline"
//             placeholder="Vendor"
//             options={[]}
//             value={vendor}
//             onChange={setVendor}
//           />

//           {/* Repair Order Dropdown */}
//           <AppSelect
//             icon="document-text-outline"
//             placeholder="Repair Order"
//             options={[]}
//             value={repairOrder}
//             onChange={setRepairOrder}
//           />

//           {/* Parts/Stocks Section */}
//           <View style={styles.sectionBlock}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionLabel}>PARTS/STOCKS</Text>
//               <AppButton
//                 title="Add"
//                 variant="primary"
//                 size="sm"
//                 leftIcon="add-circle"
//                 fullWidth={false}
//                 onPress={() => {}}
//               />
//             </View>

//             {/* Parts Column Headers */}
//             <View style={styles.partsHeader}>
//               <Text style={[styles.partsCol, { flex: 1.5 }]}>Part No.</Text>
//               <Text style={[styles.partsCol, { flex: 2 }]}>Part Name</Text>
//               <Text style={[styles.partsCol, { flex: 1, textAlign: "center" }]}>
//                 Qty
//               </Text>
//               <Text style={[styles.partsCol, { flex: 1, textAlign: "right" }]}>
//                 Image
//               </Text>
//             </View>

//             {parts.length === 0 ? (
//               <View style={styles.partEmptyWrap}>
//                 <EmptyState emoji="🔩" title="No parts added yet" />
//               </View>
//             ) : (
//               parts.map((p, i) => (
//                 <View key={i} style={styles.partRow}>
//                   <Text style={[styles.partCell, { flex: 1.5 }]}>{p.no}</Text>
//                   <Text style={[styles.partCell, { flex: 2 }]}>{p.name}</Text>
//                   <Text
//                     style={[styles.partCell, { flex: 1, textAlign: "center" }]}
//                   >
//                     {p.qty}
//                   </Text>
//                 </View>
//               ))
//             )}
//           </View>

//           {/* Comments */}
//           <AppInput
//             placeholder="Comments or instructions to vendor?"
//             value={comments}
//             onChangeText={setComments}
//             multiline
//             numberOfLines={3}
//             style={styles.commentsInput}
//           />

//           {/* Notify Vendor Toggle */}
//           <AppToggle
//             label="Notify Vendor (SMS & e-mail)?"
//             icon="notifications-outline"
//             value={notifyVendor}
//             onChange={setNotifyVendor}
//           />

//           {/* Create Order Button */}
//           <AppButton
//             title="Create Order"
//             onPress={() => {}}
//             variant="primary"
//             size="lg"
//             style={styles.createOrderBtn}
//           />
//         </ScrollView>
//       ) : (
//         // ORDERS Tab
//         <View style={styles.ordersTab}>
//           {orders.length === 0 ? (
//             <EmptyState emoji="📋" title="No purchase orders found" />
//           ) : (
//             <FlatList
//               data={orders}
//               keyExtractor={(item) => item.id.toString()}
//               renderItem={() => null}
//               showsVerticalScrollIndicator={false}
//             />
//           )}
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//   },
//   tabsWrapper: {
//     flexDirection: "row",
//     backgroundColor: COLORS.bgCard,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: SIZES.md,
//     alignItems: "center",
//     borderBottomWidth: 2,
//     borderBottomColor: "transparent",
//   },
//   activeTab: {
//     borderBottomColor: COLORS.primary,
//   },
//   tabText: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//     letterSpacing: 0.5,
//   },
//   activeTabText: {
//     fontFamily: FONTS.semibold,
//     color: COLORS.primary,
//   },
//   scrollContent: {
//     padding: SIZES.screenPadding,
//     paddingBottom: Platform.OS === "ios" ? 120 : 100,
//   },

//   sectionBlock: {
//     marginTop: SIZES.sm,
//     marginBottom: SIZES.md,
//     borderRadius: SIZES.radiusSm,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     backgroundColor: COLORS.bgCard,
//     overflow: "hidden",
//     ...SHADOWS.sm,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.md,
//   },
//   sectionLabel: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//     letterSpacing: 0.5,
//   },

//   partsHeader: {
//     flexDirection: "row",
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   partsCol: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//   },
//   partEmptyWrap: {
//     paddingVertical: SIZES.md,
//   },
//   partRow: {
//     flexDirection: "row",
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   partCell: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//   },
//   commentsInput: {
//     marginBottom: SIZES.md,
//   },
//   createOrderBtn: {
//     backgroundColor: COLORS.primaryDark,
//   },
//   ordersTab: {
//     flex: 1,
//     padding: SIZES.screenPadding,
//   },
// });

import React, { useState, useEffect, useCallback } from "react";
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
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import AppToggle from "../../components/ui/AppToggle";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import axiosClient from "../../api/axios";
import {
  PURCHASE_ORDER_ENDPOINTS,
  REPAIR_ORDER_ENDPOINTS,
  CATALOG_ENDPOINTS,
  USER_ENDPOINTS,
} from "../../utils/constants";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "CREATE", label: "CREATE ORDER", icon: "add-circle-outline" },
  { id: "ORDERS", label: "ORDERS", icon: "list-outline" },
];

const STATUS_META = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "info" },
  received: { label: "Received", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
};

// ─── Part picker modal — searches catalog inventory ───────────────────────────
function PartPickerModal({ visible, onClose, onAdd }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
        params: { itemType: "part", search: search || undefined, limit: 100 },
      });
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Header */}
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Add Part / Stock</Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.pickerSearchWrap}>
          <AppInput
            icon="search-outline"
            placeholder="Search parts…"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* List */}
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
                style={styles.partPickerRow}
                onPress={() => {
                  onAdd(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.partPickerName}>{item.name}</Text>
                  <Text style={styles.partPickerSub}>
                    {item.no ? `${item.no}  · ` : ""}
                    {item.category}
                    {item.manufacturer ? `  · ${item.manufacturer}` : ""}
                  </Text>
                  <Text style={styles.partPickerStock}>
                    In stock: {item.stock ?? 0}
                  </Text>
                </View>
                <View style={styles.partPickerRight}>
                  <Text style={styles.partPickerPrice}>
                    {item.mrp > 0 ? `₹${item.mrp}` : "—"}
                  </Text>
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.pickerEmpty}>No parts found.</Text>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Part line row inside the order form ──────────────────────────────────────
function OrderPartRow({ item, index, onRemove, onQtyChange }) {
  return (
    <View style={styles.orderPartRow}>
      <View style={styles.orderPartInfo}>
        <Text style={styles.orderPartName} numberOfLines={1}>
          {item.partName}
        </Text>
        {item.partCode ? (
          <Text style={styles.orderPartCode}>{item.partCode}</Text>
        ) : null}
      </View>

      {/* Qty stepper */}
      <View style={styles.qtyStepper}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(index, Math.max(1, item.quantity - 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={14} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(index, item.quantity + 1)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.orderPartPrice}>
        {item.unitPrice > 0
          ? `₹${(item.unitPrice * item.quantity).toFixed(0)}`
          : "—"}
      </Text>

      <TouchableOpacity
        onPress={() => onRemove(index)}
        style={styles.removeBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Section block header ─────────────────────────────────────────────────────
function SectionBlock({ label, action, children }) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

// ─── Order card in the list tab ───────────────────────────────────────────────
function OrderCard({ order, onStatusChange }) {
  const meta = STATUS_META[order.status] || STATUS_META.draft;
  const vendor = order.vendorId;
  const repairOrder = order.repairOrderId;

  const confirmChange = (nextStatus, label) => {
    Alert.alert(
      `${label}?`,
      `Change this order to "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => onStatusChange(order._id, nextStatus) },
      ],
    );
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardTop}>
        <View>
          <Text style={styles.orderNo}>{order.orderNo}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
        <Badge label={meta.label} variant={meta.variant} />
      </View>

      {vendor && (
        <View style={styles.orderMetaRow}>
          <Ionicons name="storefront-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.orderMetaText}>{vendor.fullName}</Text>
        </View>
      )}

      {repairOrder && (
        <View style={styles.orderMetaRow}>
          <Ionicons name="document-text-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.orderMetaText}>RO: {repairOrder.orderNo}</Text>
        </View>
      )}

      <View style={styles.orderCardBottom}>
        <Text style={styles.orderItemCount}>
          {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.orderTotal}>
          ₹{(order.totalAmount || 0).toFixed(2)}
        </Text>
      </View>

      {/* Action buttons based on current status */}
      {(order.status === "draft" || order.status === "sent") && (
        <View style={styles.orderActions}>
          {order.status === "draft" && (
            <TouchableOpacity
              style={[styles.orderActionBtn, styles.orderActionSend]}
              onPress={() => confirmChange("sent", "Send to Vendor")}
              activeOpacity={0.8}
            >
              <Ionicons name="send-outline" size={13} color={COLORS.white} />
              <Text style={styles.orderActionBtnText}>Send to Vendor</Text>
            </TouchableOpacity>
          )}
          {order.status === "sent" && (
            <TouchableOpacity
              style={[styles.orderActionBtn, styles.orderActionReceive]}
              onPress={() => confirmChange("received", "Mark Received")}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-outline" size={13} color={COLORS.white} />
              <Text style={styles.orderActionBtnText}>Mark Received</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.orderActionBtn, styles.orderActionCancel]}
            onPress={() => confirmChange("cancelled", "Cancel Order")}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={13} color={COLORS.error} />
            <Text style={styles.orderActionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Create Order Tab ─────────────────────────────────────────────────────────
function CreateOrderTab({ onCreated }) {
  const [vendorId, setVendorId] = useState(null);
  const [repairOrderId, setRepairOrderId] = useState(null);
  const [parts, setParts] = useState([]);
  const [comments, setComments] = useState("");
  const [notifyVendor, setNotifyVendor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // vendor & repair order dropdown options
  const [vendorOptions, setVendorOptions] = useState([]);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [loadingDrops, setLoadingDrops] = useState(false);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDrops(true);
      try {
        const [vRes, roRes] = await Promise.all([
          axiosClient.get(USER_ENDPOINTS.VENDORS_LIST),
          axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, {
            params: { limit: 100 },
          }),
        ]);
        const vendors = vRes.data?.data?.users ?? [];
        const ros = roRes.data?.data?.orders ?? [];
        setVendorOptions(
          vendors.map((v) => ({ value: v._id, label: v.fullName })),
        );
        setRepairOrderOptions(
          ros.map((r) => ({
            value: r._id,
            label: `${r.orderNo} — ${r.customerId?.fullName || ""}`,
          })),
        );
      } catch {
        // silently ignore — dropdowns just stay empty
      } finally {
        setLoadingDrops(false);
      }
    };
    loadDropdowns();
  }, []);

  const handleAddPart = (catalogItem) => {
    setParts((prev) => [
      ...prev,
      {
        inventoryId: catalogItem._id,
        partCode: catalogItem.no || null,
        partName: catalogItem.name,
        quantity: 1,
        unitPrice: catalogItem.mrp || 0,
        lineTotal: catalogItem.mrp || 0,
      },
    ]);
  };

  const handleRemovePart = (index) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, qty) => {
    setParts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, quantity: qty, lineTotal: +(p.unitPrice * qty).toFixed(2) }
          : p,
      ),
    );
  };

  const totalAmount = parts.reduce((s, p) => s + (p.lineTotal || 0), 0);

  const handleCreate = async () => {
    if (!parts.length) {
      Alert.alert("No parts", "Add at least one part to create an order.");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post(PURCHASE_ORDER_ENDPOINTS.LIST, {
        vendorId: vendorId || undefined,
        repairOrderId: repairOrderId || undefined,
        items: parts,
        comments: comments.trim() || null,
        notifyVendor,
        totalAmount,
      });
      Alert.alert("Success", "Purchase order created.", [
        { text: "OK", onPress: onCreated },
      ]);
      // Reset form
      setVendorId(null);
      setRepairOrderId(null);
      setParts([]);
      setComments("");
      setNotifyVendor(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e.displayMessage || "Could not create purchase order.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.createScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Vendor */}
      <AppSelect
        label="Vendor"
        icon="storefront-outline"
        placeholder={loadingDrops ? "Loading vendors…" : "Select vendor"}
        options={vendorOptions}
        value={vendorId}
        onChange={setVendorId}
      />

      {/* Repair Order link */}
      <AppSelect
        label="Link to Repair Order (optional)"
        icon="document-text-outline"
        placeholder={loadingDrops ? "Loading orders…" : "Select repair order"}
        options={repairOrderOptions}
        value={repairOrderId}
        onChange={setRepairOrderId}
      />

      {/* Parts / Stocks */}
      <SectionBlock
        label="PARTS / STOCKS"
        action={
          <TouchableOpacity
            style={styles.addChip}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={15} color={COLORS.white} />
            <Text style={styles.addChipText}>Add</Text>
          </TouchableOpacity>
        }
      >
        {/* Column headers */}
        {parts.length > 0 && (
          <View style={styles.partsColHeader}>
            <Text style={[styles.partsCol, { flex: 3 }]}>Part</Text>
            <Text style={[styles.partsCol, { width: 80, textAlign: "center" }]}>
              Qty
            </Text>
            <Text style={[styles.partsCol, { width: 64, textAlign: "right" }]}>
              Total
            </Text>
            <View style={{ width: 28 }} />
          </View>
        )}

        {parts.length === 0 ? (
          <View style={styles.partsEmpty}>
            <Ionicons name="cube-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.partsEmptyText}>No parts added yet</Text>
            <TouchableOpacity
              style={styles.partsEmptyAdd}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.partsEmptyAddText}>+ Add Part</Text>
            </TouchableOpacity>
          </View>
        ) : (
          parts.map((p, i) => (
            <OrderPartRow
              key={i}
              item={p}
              index={i}
              onRemove={handleRemovePart}
              onQtyChange={handleQtyChange}
            />
          ))
        )}

        {/* Total line */}
        {parts.length > 0 && (
          <View style={styles.partsTotalRow}>
            <Text style={styles.partsTotalLabel}>
              {parts.length} item{parts.length !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.partsTotalValue}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        )}
      </SectionBlock>

      {/* Comments */}
      <AppInput
        label="Comments / Instructions"
        icon="chatbubble-outline"
        placeholder="Notes or instructions to vendor…"
        value={comments}
        onChangeText={setComments}
        multiline
        numberOfLines={3}
      />

      {/* Notify toggle */}
      <View style={styles.toggleWrap}>
        <AppToggle
          label="Notify Vendor (SMS & e-mail)?"
          icon="notifications-outline"
          value={notifyVendor}
          onChange={setNotifyVendor}
        />
      </View>

      {/* Create button */}
      <AppButton
        title={saving ? "Creating Order…" : "Create Order"}
        variant="gradient"
        size="lg"
        onPress={handleCreate}
        disabled={saving || !parts.length}
        style={styles.createBtn}
      />

      {/* Part picker modal */}
      <PartPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onAdd={handleAddPart}
      />
    </ScrollView>
  );
}

// ─── Orders List Tab ──────────────────────────────────────────────────────────
function OrdersListTab({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const STATUS_FILTER_OPTIONS = [
    { value: "", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "received", label: "Received" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(PURCHASE_ORDER_ENDPOINTS.LIST, {
          params: { status: status || undefined, limit: 100 },
        });
        setOrders(res.data?.data?.orders ?? []);
      } catch (e) {
        setError(e.displayMessage || "Could not load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  const handleStatusChange = useCallback(async (id, nextStatus) => {
    try {
      await axiosClient.put(PURCHASE_ORDER_ENDPOINTS.DETAIL(id), { status: nextStatus });
      fetchOrders();
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Could not update order status.");
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Status filter */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const active = (status ?? "") === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatus(opt.value || null)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchOrders()}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard order={item} onStatusChange={handleStatusChange} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          onRefresh={() => fetchOrders(true)}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No purchase orders"
              description={
                status
                  ? `No ${status} orders found.`
                  : "Create your first purchase order."
              }
            />
          }
        />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PurchaseOrderScreen() {
  const [activeTab, setActiveTab] = useState("CREATE");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setActiveTab("ORDERS");
    setRefreshKey((k) => k + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Purchase Order" transparent={false} />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "CREATE" ? (
        <CreateOrderTab onCreated={handleCreated} />
      ) : (
        <OrdersListTab refreshKey={refreshKey} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

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
    letterSpacing: 0.3,
  },
  tabTextActive: { color: COLORS.primary },

  // Create tab scroll
  createScroll: {
    padding: SIZES.screenPadding,
    gap: SIZES.md,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
  },

  // Section block
  sectionBlock: {
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
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

  // Parts column header
  partsColHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSection,
  },
  partsCol: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Parts empty state
  partsEmpty: {
    alignItems: "center",
    paddingVertical: SIZES.xl,
    gap: SIZES.sm,
  },
  partsEmptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
  },
  partsEmptyAdd: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  partsEmptyAddText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Order part row
  orderPartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  orderPartInfo: { flex: 3 },
  orderPartName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  orderPartCode: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  orderPartPrice: {
    width: 64,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  removeBtn: { width: 28, alignItems: "center" },

  // Qty stepper
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    width: 80,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgSection,
  },
  qtyValue: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  // Parts total
  partsTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.bgSection,
  },
  partsTotalLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  partsTotalValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },

  // Toggles
  toggleWrap: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.sm,
    ...SHADOWS.sm,
  },

  createBtn: { marginTop: SIZES.sm },

  // Orders list tab
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  filterChips: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs + 2,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  filterChipTextActive: { color: COLORS.primary, fontFamily: FONTS.semibold },

  ordersList: {
    padding: SIZES.screenPadding,
    paddingBottom: 40,
    gap: SIZES.sm,
  },

  // Order card
  orderCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  orderCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderMetaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  orderCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  orderItemCount: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  orderTotal: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },

  // Order action buttons
  orderActions: {
    flexDirection: "row",
    gap: SIZES.sm,
    paddingTop: SIZES.xs,
  },
  orderActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: SIZES.radiusMd,
  },
  orderActionSend:    { backgroundColor: COLORS.primary },
  orderActionReceive: { backgroundColor: COLORS.success },
  orderActionCancel:  { borderWidth: 1, borderColor: COLORS.error, backgroundColor: "transparent" },
  orderActionBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.white },
  orderActionCancelText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.error },

  // Picker modal
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
  pickerSearchWrap: {
    paddingHorizontal: SIZES.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SIZES.sm,
  },
  partPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  partPickerName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  partPickerSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  partPickerStock: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.success,
    marginTop: 1,
  },
  partPickerRight: { alignItems: "flex-end", gap: 4 },
  partPickerPrice: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  pickerEmpty: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: 40,
  },

  // Loader
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
