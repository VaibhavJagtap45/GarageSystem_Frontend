// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ScrollView,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRoute } from "@react-navigation/native";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import AppInput from "../../components/ui/AppInput";
// import EmptyState from "../../components/ui/EmptyState";
// import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
// import Badge from "../../components/ui/Badge";

// const TABS = [
//   { id: "CREATED", label: "Created", badgeVariant: "info" },
//   { id: "IN_PROGRESS", label: "WIP", badgeVariant: "warning" },
//   { id: "VEHICLE_READY", label: "Ready", badgeVariant: "success" },
//   { id: "COMPLETED", label: "Completed", badgeVariant: "neutral" },
// ];

// function OrderCard({ order }) {
//   return (
//     <View style={styles.orderCard}>
//       <View style={styles.orderLeft}>
//         <View style={styles.orderIconWrap}>
//           <Ionicons
//             name="document-text-outline"
//             size={20}
//             color={COLORS.primary}
//           />
//         </View>
//         <View style={styles.orderInfo}>
//           <Text style={styles.orderCustomer} numberOfLines={1}>
//             {order.customer}
//           </Text>
//           <Text style={styles.orderMeta}>
//             {order.vehicle} · #{order.id}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.orderRight}>
//         <Text style={styles.orderAmount}>₹{order.amount}</Text>
//         <Badge label={order.status} variant={order.badgeVariant} />
//       </View>
//     </View>
//   );
// }

// export default function OrdersScreen() {
//   const route = useRoute();
//   const initialTab = route.params?.initialTab || "CREATED";
//   const [activeTab, setActiveTab] = useState(initialTab);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [orders] = useState([]);
//   const [loading] = useState(false);

//   const rightElement = (
//     <View style={styles.headerIcons}>
//       <TouchableOpacity
//         style={styles.iconBtn}
//         accessibilityLabel="Refresh"
//         accessibilityRole="button"
//       >
//         <Ionicons name="refresh-outline" size={20} color={COLORS.textPrimary} />
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={styles.iconBtn}
//         accessibilityLabel="Filter"
//         accessibilityRole="button"
//       >
//         <Ionicons name="options-outline" size={20} color={COLORS.textPrimary} />
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe} edges={["bottom"]}>
//       <TopNav title="Orders" transparent={false} rightElement={rightElement} />

//       <View style={styles.tabsWrapper}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.tabsScroll}
//         >
//           {TABS.map((tab) => {
//             const isActive = activeTab === tab.id;
//             return (
//               <TouchableOpacity
//                 key={tab.id}
//                 style={[styles.tabChip, isActive && styles.tabChipActive]}
//                 onPress={() => setActiveTab(tab.id)}
//                 activeOpacity={0.8}
//                 accessibilityLabel={tab.label}
//                 accessibilityRole="tab"
//                 accessibilityState={{ selected: isActive }}
//               >
//                 <Text
//                   style={[styles.tabText, isActive && styles.tabTextActive]}
//                 >
//                   {tab.label}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>
//       </View>

//       <View style={styles.content}>
//         <AppInput
//           icon="search-outline"
//           placeholder="Search name · phone · reg no"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           style={styles.searchInput}
//           accessibilityLabel="Search orders"
//         />
//         {loading ? (
//           <View>
//             {[0, 1, 2].map((i) => (
//               <SkeletonListItem key={i} style={styles.skeleton} />
//             ))}
//           </View>
//         ) : orders.length === 0 ? (
//           <EmptyState
//             emoji="🛒"
//             title="No orders yet"
//             description={`No ${TABS.find((t) => t.id === activeTab)?.label?.toLowerCase()} orders to show`}
//           />
//         ) : (
//           <FlatList
//             data={orders}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => <OrderCard order={item} />}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContent}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.bg },
//   headerIcons: {
//     flex: 1,
//     justifyContent: "flex-end",
//     flexDirection: "row",
//     gap: SIZES.xs,
//   },
//   iconBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: SIZES.radiusFull,
//     backgroundColor: COLORS.bgSection,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tabsWrapper: {
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//     backgroundColor: COLORS.bgCard,
//     paddingVertical: SIZES.sm,
//     ...SHADOWS.sm,
//   },
//   tabsScroll: {
//     paddingHorizontal: SIZES.screenPadding,
//     gap: SIZES.sm,
//     alignItems: "center",
//   },
//   tabChip: {
//     paddingHorizontal: SIZES.md,
//     paddingVertical: 7,
//     borderRadius: SIZES.radiusFull,
//     borderWidth: 1.5,
//     borderColor: COLORS.borderLight,
//     backgroundColor: COLORS.bgCard,
//   },
//   tabChipActive: {
//     backgroundColor: COLORS.primaryLight,
//     borderColor: COLORS.primary,
//   },
//   tabText: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//   },
//   tabTextActive: { fontFamily: FONTS.semibold, color: COLORS.primary },
//   content: { flex: 1, padding: SIZES.screenPadding },
//   searchInput: { marginBottom: SIZES.md },
//   listContent: { paddingBottom: 120 },
//   separator: { height: SIZES.sm },
//   skeleton: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     marginBottom: SIZES.sm,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   orderCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.md,
//     gap: SIZES.sm,
//     ...SHADOWS.sm,
//   },
//   orderLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: SIZES.md,
//     flex: 1,
//   },
//   orderIconWrap: {
//     width: 40,
//     height: 40,
//     borderRadius: SIZES.radiusMd,
//     backgroundColor: COLORS.primaryLight,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   orderInfo: { flex: 1 },
//   orderCustomer: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },
//   orderMeta: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//     marginTop: 3,
//   },
//   orderRight: { alignItems: "flex-end", gap: 6 },
//   orderAmount: {
//     fontFamily: FONTS.bold,
//     fontSize: SIZES.textBase,
//     color: COLORS.primary,
//   },
// });

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  REPAIR_ORDER_ENDPOINTS,
  INVOICE_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import Badge from "../../components/ui/Badge";
import axiosClient from "../../api/axios";

// ─── Tab config — maps frontend tab IDs → backend status values ──────────────
const TABS = [
  { id: "created", label: "Created", badgeVariant: "info" },
  { id: "in_progress", label: "WIP", badgeVariant: "warning" },
  { id: "vehicle_ready", label: "Ready", badgeVariant: "success" },
  { id: "completed", label: "Completed", badgeVariant: "neutral" },
  { id: "cancelled", label: "Cancelled", badgeVariant: "error" },
];

// Map old param values (from ServiceScreen) → new backend status strings
const PARAM_TO_STATUS = {
  CREATED: "created",
  IN_PROGRESS: "in_progress",
  VEHICLE_READY: "vehicle_ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const STATUS_META = {
  created: { label: "Created", variant: "info" },
  in_progress: { label: "WIP", variant: "warning" },
  vehicle_ready: { label: "Ready", variant: "success" },
  completed: { label: "Completed", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "error" },
};

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onPress, onAssign }) {
  const customer = order.customerId;
  const vehicle = order.vehicleId;
  const meta = STATUS_META[order.status] ?? STATUS_META.created;

  const vehicleLabel = vehicle
    ? `${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}`.trim()
    : "—";
  const regNo = vehicle?.vehicleRegisterNo ?? "";

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left icon */}
      <View style={styles.orderIconWrap}>
        <Ionicons
          name="document-text-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>

      {/* Main info */}
      <View style={styles.orderInfo}>
        <View style={styles.orderTopRow}>
          <Text style={styles.orderCustomer} numberOfLines={1}>
            {customer?.fullName ?? "Unknown Customer"}
          </Text>
          <Badge label={meta.label} variant={meta.variant} size="sm" />
        </View>

        <View style={styles.orderMidRow}>
          {vehicleLabel ? (
            <View style={styles.orderMetaChip}>
              <Ionicons name="car-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.orderMetaText}>{vehicleLabel}</Text>
            </View>
          ) : null}
          {regNo ? (
            <View style={styles.orderMetaChip}>
              <Ionicons
                name="id-card-outline"
                size={11}
                color={COLORS.textMuted}
              />
              <Text style={styles.orderMetaText}>{regNo}</Text>
            </View>
          ) : null}
          {customer?.phoneNo ? (
            <View style={styles.orderMetaChip}>
              <Ionicons
                name="call-outline"
                size={11}
                color={COLORS.textMuted}
              />
              <Text style={styles.orderMetaText}>{customer.phoneNo}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.orderBottomRow}>
          <Text style={styles.orderNo}>
            #{order.orderNo ?? order._id?.slice(-6)}
          </Text>
          <Text style={styles.orderDate}>{dateStr}</Text>
          <Text style={styles.orderAmount}>
            {order.totalAmount > 0
              ? `₹${order.totalAmount.toLocaleString("en-IN")}`
              : "—"}
          </Text>
        </View>

        {/* Mechanic assignment row */}
        <View style={styles.assignRow}>
          {order.assignedTo ? (
            <View style={styles.assignedChip}>
              <Ionicons name="person-outline" size={11} color="#6366f1" />
              <Text style={styles.assignedTxt} numberOfLines={1}>
                {order.assignedTo.fullName ?? "Mechanic"}
              </Text>
            </View>
          ) : null}
          {onAssign && (
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={(e) => { e.stopPropagation?.(); onAssign(order); }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={11} color={COLORS.white} />
              <Text style={styles.assignBtnTxt}>
                {order.assignedTo ? "Reassign" : "Assign"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {order.status === "completed" ? (
        <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonListItem key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────
function SummaryStrip({ counts }) {
  const items = [
    { label: "Created", count: counts.created ?? 0, color: "#3B82F6" },
    { label: "WIP", count: counts.in_progress ?? 0, color: COLORS.warning },
    { label: "Ready", count: counts.vehicle_ready ?? 0, color: COLORS.primary },
    { label: "Done", count: counts.completed ?? 0, color: COLORS.textMuted },
  ];
  return (
    <View style={styles.summaryStrip}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={styles.summaryDivider} />}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: item.color }]}>
              {item.count}
            </Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const route = useNavigation(); // not used for navigate here
  const routeData = useRoute();
  const navigation = useNavigation();

  // Map old-style param (CREATED, IN_PROGRESS…) to backend status
  const rawTab = routeData.params?.initialTab ?? "created";
  const initTab = PARAM_TO_STATUS[rawTab] ?? rawTab;

  const [activeTab, setActiveTab] = useState(initTab);
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const searchTimer = useRef(null);

  // ── Fetch orders ────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (opts = {}) => {
      const { isRefresh = false, tab = activeTab, q = search } = opts;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.LIST, {
          params: {
            status: tab,
            search: q.trim() || undefined,
            limit: 100,
          },
        });
        const data = res.data?.data;
        setOrders(data?.orders ?? []);
        setTotal(data?.total ?? 0);
      } catch (e) {
        setError(e.displayMessage || "Could not load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, search],
  );

  // ── Fetch counts for all statuses (for the summary strip) ───────
  const fetchCounts = useCallback(async () => {
    try {
      const statuses = ["created", "in_progress", "vehicle_ready", "completed"];
      const results = await Promise.all(
        statuses.map((s) =>
          axiosClient
            .get(REPAIR_ORDER_ENDPOINTS.LIST, {
              params: { status: s, limit: 1 },
            })
            .then((r) => ({ status: s, total: r.data?.data?.total ?? 0 }))
            .catch(() => ({ status: s, total: 0 })),
        ),
      );
      const map = {};
      results.forEach(({ status, total }) => {
        map[status] = total;
      });
      setCounts(map);
    } catch {
      /* silently ignore */
    }
  }, []);

  useEffect(() => {
    fetchOrders({ tab: activeTab });
    fetchCounts();
  }, [activeTab]);

  // ── Debounced search ────────────────────────────────────────────
  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchOrders({ tab: activeTab, q: text });
    }, 400);
  };

  // ── Refresh ─────────────────────────────────────────────────────
  const handleRefresh = () => {
    fetchOrders({ isRefresh: true, tab: activeTab, q: search });
    fetchCounts();
  };

  // ── Tab change ──────────────────────────────────────────────────
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch("");
    // fetchOrders is triggered by the useEffect on activeTab
  };

  // ── Status update ────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (order) => {
    const statusFlow = {
      created: "in_progress",
      in_progress: "vehicle_ready",
      vehicle_ready: "completed",
    };
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;

    const labels = {
      in_progress: "Mark as WIP",
      vehicle_ready: "Mark as Ready",
      completed: "Mark as Completed",
    };

    Alert.alert(
      labels[nextStatus],
      `Move "${order.customerId?.fullName ?? "order"}" to ${STATUS_META[nextStatus]?.label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await axiosClient.put(REPAIR_ORDER_ENDPOINTS.DETAIL(order._id), {
                status: nextStatus,
              });
              fetchOrders({ tab: activeTab, q: search });
              fetchCounts();
            } catch (e) {
              Alert.alert(
                "Error",
                e.displayMessage || "Could not update status.",
              );
            }
          },
        },
      ],
    );
  }, [fetchOrders, fetchCounts, activeTab, search]);

  // ── Completed order → view invoice ───────────────────────────────
  const handleOrderPress = useCallback(async (order) => {
    if (order.status === "completed") {
      try {
        const res = await axiosClient.get(INVOICE_ENDPOINTS.LIST, {
          params: { repairOrderId: order._id, limit: 1 },
        });
        const invoice = (res.data?.data?.invoices ?? [])[0];
        if (invoice) {
          navigation.navigate("InvoiceDetail", { invoice });
        } else {
          // No invoice yet — open CounterSale pre-filled with repair order data
          navigation.navigate("CounterSale", {
            prefill: {
              repairOrderId: order._id,
              customer: order.customerId,
              services: (order.services ?? []).map((s) => ({
                catalogId: s.catalogId,
                name: s.name,
                price: s.price || s.lineTotal || 0,
                discount: s.discount ?? 0,
                taxPercent: s.taxPercent ?? 0,
                lineTotal: s.lineTotal || s.price || 0,
                category: s.category,
              })),
              parts: (order.parts ?? []).map((p) => ({
                inventoryId: p.inventoryId,
                partCode: p.partCode,
                name: p.name,
                quantity: p.quantity ?? 1,
                unitPrice: p.unitPrice ?? 0,
                discount: p.discount ?? 0,
                taxPercent: p.taxPercent ?? 0,
                lineTotal: p.lineTotal ?? 0,
              })),
              tags: order.tags ?? [],
            },
          });
        }
      } catch {
        Alert.alert("Error", "Could not load invoice for this order.");
      }
    } else {
      handleStatusUpdate(order);
    }
  }, [navigation, handleStatusUpdate]);

  // ── Assign mechanic ─────────────────────────────────────────────
  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const openAssign = useCallback(async (order) => {
    setAssignTarget(order);
    setAssignModal(true);
    setLoadingMembers(true);
    try {
      const res = await axiosClient.get("/repair-orders/garage-members");
      setMembers(res.data?.data?.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const doAssign = useCallback(async (memberId) => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      await axiosClient.put(REPAIR_ORDER_ENDPOINTS.DETAIL(assignTarget._id), {
        assignedTo: memberId,
        assignedAt: new Date().toISOString(),
      });
      setAssignModal(false);
      fetchOrders({ tab: activeTab, q: search });
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Could not assign mechanic.");
    } finally {
      setAssigning(false);
    }
  }, [assignTarget, activeTab, search, fetchOrders]);

  // ── Render ───────────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) return <SkeletonCards />;

    if (error) {
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchOrders({ tab: activeTab, q: search })}
        />
      );
    }

    if (!orders.length) {
      return (
        <EmptyState
          emoji="🛒"
          title={search ? "No results found" : "No orders yet"}
          description={
            search
              ? `No orders matching "${search}"`
              : `No ${TABS.find((t) => t.id === activeTab)?.label?.toLowerCase()} orders`
          }
          ctaLabel={!search ? "Create Repair Order" : undefined}
          onCtaPress={
            !search
              ? () => navigation.navigate("CustomerRepairOrder")
              : undefined
          }
        />
      );
    }

    return (
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item)}
            onAssign={!["completed", "cancelled"].includes(item.status) ? () => openAssign(item) : undefined}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    );
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Orders"
        transparent={false}
        rightElement={
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleRefresh}
              accessibilityLabel="Refresh"
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("CustomerRepairOrder")}
              accessibilityLabel="Create new order"
            >
              <Ionicons name="add-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Summary counts strip */}
      <SummaryStrip counts={counts} />

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
                {count !== undefined && (
                  <View
                    style={[styles.tabCount, isActive && styles.tabCountActive]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        isActive && styles.tabCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <AppInput
          icon="search-outline"
          placeholder="Search name · phone · reg no · order no"
          value={search}
          onChangeText={handleSearch}
          accessibilityLabel="Search orders"
        />
        {total > 0 && !loading && (
          <Text style={styles.resultCount}>
            {total} order{total !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* ── Assign Mechanic Modal ──────────────────────────────── */}
      <Modal
        visible={assignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Mechanic</Text>
              <TouchableOpacity onPress={() => setAssignModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {assignTarget ? (
              <Text style={styles.modalSub}>
                Order #{assignTarget.orderNo} · {assignTarget.customerId?.fullName ?? "Customer"}
              </Text>
            ) : null}

            {loadingMembers ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : members.length === 0 ? (
              <Text style={styles.modalEmpty}>
                No mechanics in your garage yet.{"\n"}Add members from the More tab.
              </Text>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(m) => m._id}
                style={{ maxHeight: 320 }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.borderLight }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.memberRow}
                    onPress={() => doAssign(item._id)}
                    disabled={assigning}
                    activeOpacity={0.75}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarTxt}>
                        {(item.fullName || "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{item.fullName ?? "—"}</Text>
                      {item.phoneNo ? (
                        <Text style={styles.memberPhone}>{item.phoneNo}</Text>
                      ) : null}
                    </View>
                    {assigning ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={styles.modalCancel} onPress={() => setAssignModal(false)}>
              <Text style={styles.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  headerIcons: { flexDirection: "row", gap: SIZES.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    marginBottom: SIZES.xs,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryCount: { fontFamily: FONTS.bold, fontSize: SIZES.textMd },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight },

  // Tabs
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    paddingVertical: SIZES.sm,
  },
  tabsScroll: {
    paddingHorizontal: SIZES.screenPadding,
    gap: SIZES.sm,
    alignItems: "center",
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SIZES.md,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  tabChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  tabTextActive: { fontFamily: FONTS.semibold, color: COLORS.primary },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: COLORS.primary },
  tabCountText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  tabCountTextActive: { color: COLORS.white },

  // Search
  searchWrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xs,
  },
  resultCount: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
    marginLeft: 2,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },
  listContent: { paddingBottom: 120 },
  skeletonWrap: { gap: SIZES.sm },
  skeletonCard: {
    height: 100,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },

  // Order card
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  orderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderInfo: { flex: 1, gap: 4 },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
  },
  orderCustomer: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    flex: 1,
  },
  orderMidRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.xs + 2,
  },
  orderMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  orderMetaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  orderBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  orderNo: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  orderDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  orderAmount: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  // Assign mechanic row on card
  assignRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  assignedChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#6366f115", borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  assignedTxt: { fontFamily: FONTS.medium, fontSize: 11, color: "#6366f1", maxWidth: 120 },
  assignBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#6366f1", borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  assignBtnTxt: { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.white },

  // Assign modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  modalSub: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, marginBottom: 16 },
  modalEmpty: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", paddingVertical: 24, lineHeight: 22 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  memberAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center",
  },
  memberAvatarTxt: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.white },
  memberName: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  memberPhone: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  modalCancel: {
    marginTop: 16, padding: 14, borderRadius: 99, borderWidth: 1,
    borderColor: COLORS.borderLight, alignItems: "center",
  },
  modalCancelTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary },
});
