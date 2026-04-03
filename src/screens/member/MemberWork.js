import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Toast from "react-native-toast-message";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  memberGetOrders,
  memberAcceptOrder,
  memberRejectOrder,
  memberUpdateStatus,
} from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";

export default function MemberWork({ navigation }) {
  const { user }   = useSelector((s) => s.auth);
  const tabBarH    = useBottomTabBarHeight();
  const [tab, setTab] = useState("mine");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params =
        tab === "mine"
          ? { assignedToMe: "true" }
          : { status: "created,in_progress,vehicle_ready" };
      const r = await memberGetOrders(params);
      setOrders(r.data?.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  // Re-run when tab changes while screen is already focused
  useEffect(() => { load(); }, [load]);

  const act = async (id, key, fn) => {
    setBusy(id + key);
    try {
      await fn();
      load();
      Toast.show({ type: "success", text1: "Done!" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: e?.displayMessage || "Action failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = (id) =>
    Alert.alert(
      "Reject Assignment",
      "Remove your assignment from this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => act(id, "rej", () => memberRejectOrder(id)),
        },
      ],
    );

  // Status config for left border colour on cards
  const STATUS_COLOR = {
    created:       "#f59e0b",
    in_progress:   "#6366f1",
    vehicle_ready: "#0ea5e9",
    completed:     "#22c55e",
  };

  const renderOrder = ({ item: o }) => {
    const isMyOrder = String(o.assignedTo?._id || o.assignedTo) === String(user?._id);
    const isBusy    = (key) => busy === o._id + key;
    const accent    = STATUS_COLOR[o.status] ?? COLORS.primary;

    const showActions =
      (o.status === "created" && isMyOrder) ||
      (o.status === "created" && !o.assignedTo) ||
      o.status === "in_progress" ||
      o.status === "vehicle_ready";

    return (
      <View style={[s.card, { borderLeftColor: accent }]}>
        {/* Header — tap to open detail */}
        <TouchableOpacity
          style={s.cardHead}
          onPress={() => navigation.navigate("MOrderDetail", { orderId: o._id })}
          activeOpacity={0.8}
        >
          {/* Left: order info */}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.no}>{o.orderNo}</Text>
            <View style={s.infoRow}>
              <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.cust}>
                {o.customerId?.fullName || "Customer"}
                {o.customerId?.phoneNo ? `  ·  ${o.customerId.phoneNo}` : ""}
              </Text>
            </View>
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
            <Text style={s.date}>{fmtDate(o.createdAt)}</Text>
          </View>

          {/* Right: badge + amount */}
          <View style={{ alignItems: "flex-end", gap: 6, paddingLeft: SIZES.sm }}>
            <Badge status={o.status} />
            {o.totalAmount > 0 && <Text style={s.amt}>{inr(o.totalAmount)}</Text>}
            <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Action strip */}
        {showActions && (
          <View style={s.actions}>
            {o.status === "created" && isMyOrder && (
              <>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: COLORS.primary }]}
                  disabled={!!busy}
                  onPress={() => act(o._id, "acc", () => memberAcceptOrder(o._id))}
                >
                  {isBusy("acc") ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                    <><Ionicons name="checkmark-outline" size={15} color={COLORS.white} /><Text style={s.actionTxt}>Accept</Text></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { borderWidth: 1.5, borderColor: COLORS.error, backgroundColor: "transparent" }]}
                  disabled={!!busy}
                  onPress={() => confirmReject(o._id)}
                >
                  <Ionicons name="close-outline" size={15} color={COLORS.error} />
                  <Text style={[s.actionTxt, { color: COLORS.error }]}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            {o.status === "created" && !o.assignedTo && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: "#6366f1", flex: 1 }]}
                disabled={!!busy}
                onPress={() => act(o._id, "start", () => memberUpdateStatus(o._id, "in_progress"))}
              >
                {isBusy("start") ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                  <><Ionicons name="play-outline" size={15} color={COLORS.white} /><Text style={s.actionTxt}>Start Work</Text></>
                )}
              </TouchableOpacity>
            )}
            {o.status === "in_progress" && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: "#f59e0b", flex: 1 }]}
                disabled={!!busy}
                onPress={() => act(o._id, "ready", () => memberUpdateStatus(o._id, "vehicle_ready"))}
              >
                {isBusy("ready") ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                  <><Ionicons name="car-outline" size={15} color={COLORS.white} /><Text style={s.actionTxt}>Mark Ready</Text></>
                )}
              </TouchableOpacity>
            )}
            {o.status === "vehicle_ready" && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: "#22c55e", flex: 1 }]}
                disabled={!!busy}
                onPress={() => act(o._id, "done", () => memberUpdateStatus(o._id, "completed"))}
              >
                {isBusy("done") ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                  <><Ionicons name="checkmark-done-outline" size={15} color={COLORS.white} /><Text style={s.actionTxt}>Complete</Text></>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <NavBar title="My Work" />

      {/* Tab switcher */}
      <View style={s.tabRow}>
        {[
          { k: "mine", l: "My Assigned", icon: "person-outline" },
          { k: "all",  l: "All Active",  icon: "layers-outline"  },
        ].map((t) => (
          <TouchableOpacity
            key={t.k}
            style={[s.tabBtn, tab === t.k && s.tabBtnOn]}
            onPress={() => setTab(t.k)}
          >
            <Ionicons name={t.icon} size={14} color={tab === t.k ? COLORS.white : COLORS.textMuted} />
            <Text style={[s.tabTxt, tab === t.k && s.tabTxtOn]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : orders.length === 0 ? (
        <Empty
          icon="hammer-outline"
          title="No orders"
          sub={tab === "mine" ? "Nothing assigned to you yet" : "No active orders in garage"}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: tabBarH + 16 }}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginVertical: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusFull,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: SIZES.radiusFull, gap: 5,
  },
  tabBtnOn: { backgroundColor: COLORS.primary },
  tabTxt:   { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted },
  tabTxtOn: { color: COLORS.white, fontFamily: FONTS.semibold },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm + 2,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardHead: { flexDirection: "row", padding: SIZES.md, gap: SIZES.sm },
  infoRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  no:   { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: 2 },
  cust: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1 },
  veh:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, flex: 1 },
  note: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, fontStyle: "italic", flex: 1 },
  date: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },
  amt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary },

  actions: {
    flexDirection: "row", gap: SIZES.sm,
    padding: SIZES.sm + 2,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: SIZES.radiusFull, paddingVertical: 10, gap: 5,
  },
  actionTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },
});
