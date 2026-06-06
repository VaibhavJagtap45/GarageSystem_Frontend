import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetOrders } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import PortalHeroCard from "../../components/portal/PortalHeroCard";
import SectionHeader from "../../components/portal/SectionHeader";

const FILTERS = [
  { key: null,            label: "All",        icon: "layers-outline"           },
  { key: "created",       label: "Requested",  icon: "time-outline"             },
  { key: "in_progress",   label: "In Progress",icon: "construct-outline"        },
  { key: "vehicle_ready", label: "Ready",      icon: "car-outline"              },
  { key: "completed",     label: "Done",       icon: "checkmark-circle-outline" },
  { key: "cancelled",     label: "Cancelled",  icon: "close-circle-outline"     },
];

const STATUS_COLOR = {
  created:       "#f59e0b",
  in_progress:   "#6366f1",
  vehicle_ready: "#0ea5e9",
  completed:     "#22c55e",
  cancelled:     "#ef4444",
};

export default function CustomerOrders({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [filt,    setFilt]    = useState(null);

  const activeCount = orders.filter((order) =>
    ["created", "in_progress", "vehicle_ready"].includes(order.status),
  ).length;
  const completedCount = orders.filter((order) => order.status === "completed").length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await customerGetOrders(filt ? { status: filt } : {});
      setOrders(r.data?.data?.orders || []);
    } catch {
      setError(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filt]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item: o }) => {
    const accent = STATUS_COLOR[o.status] ?? COLORS.primary;
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: accent }]}
        onPress={() => navigation.navigate("COrderDetail", { orderId: o._id })}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.no}>{o.orderNo || "Order"}</Text>
          <View style={s.infoRow}>
            <Ionicons name="car-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.veh}>
              {o.vehicleId?.vehicleBrand} {o.vehicleId?.vehicleModel}
              {o.vehicleId?.vehicleRegisterNo ? `  ·  ${o.vehicleId.vehicleRegisterNo}` : ""}
            </Text>
          </View>
          {o.customerNote ? (
            <View style={s.infoRow}>
              <Ionicons name="chatbox-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.note} numberOfLines={1}>{o.customerNote}</Text>
            </View>
          ) : null}
          {o.assignedTo ? (
            <View style={s.infoRow}>
              <Ionicons name="construct-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.mech}>Mechanic: {o.assignedTo.fullName}</Text>
            </View>
          ) : null}
          <Text style={s.date}>{fmtDate(o.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6, paddingLeft: SIZES.sm }}>
          <Badge status={o.status} />
          {o.totalAmount > 0 && <Text style={s.amt}>{inr(o.totalAmount)}</Text>}
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <NavBar title="My Orders" />

      <PortalHeroCard
        eyebrow="Order tracking"
        title="Track every repair job with better clarity."
        subtitle="Filter by status, open a job, and follow progress from request to completion."
        icon="car-outline"
        stats={[
          { label: "Total", value: String(orders.length) },
          { label: "Active", value: String(activeCount) },
          { label: "Done", value: String(completedCount) },
        ]}
      />

      {/* Status filter chips */}
      <View style={s.filterWrap}>
        <SectionHeader
          title="Status filters"
          subtitle="Jump directly to the orders you care about right now."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 48 }}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={String(f.key)}
              style={[chip.base, filt === f.key && chip.on]}
              onPress={() => setFilt(f.key)}
            >
              <Ionicons
                name={f.icon}
                size={13}
                color={filt === f.key ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[chip.txt, filt === f.key && chip.txtOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ alignItems: "center", marginTop: 60, gap: 12 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary }}>
            Could not load orders
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: 32 }}>
            The server may be waking up. Wait a moment and tap Retry.
          </Text>
          <TouchableOpacity
            onPress={load}
            style={{ marginTop: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, paddingHorizontal: 28, paddingVertical: 12 }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <Empty
          icon="car-outline"
          title="No orders found"
          sub="Try a different filter or book a new service request."
          actionLabel="Browse services"
          onAction={() => navigation.navigate("Services")}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: tabBarH + 16 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const chip = StyleSheet.create({
  base: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1, borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },
  on:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  txt:   { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  txtOn: { color: COLORS.white, fontFamily: FONTS.semibold },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  filterWrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm + 2,
    borderWidth: 1, borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  no:   { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: 2 },
  veh:  { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1 },
  note: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, fontStyle: "italic", flex: 1 },
  mech: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, flex: 1 },
  date: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },
  amt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary },
});
