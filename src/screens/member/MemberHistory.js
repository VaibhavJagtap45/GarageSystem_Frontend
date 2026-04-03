import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { memberGetOrders } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import MiniCard from "../../components/portal/MiniCard";
import Empty from "../../components/portal/Empty";

export default function MemberHistory({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await memberGetOrders({
        assignedToMe: "true",
        status: "completed",
      });
      setOrders(r.data?.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavBar title="History" />

      {/* Summary stats */}
      {orders.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: SIZES.sm,
            margin: SIZES.screenPadding,
            marginBottom: 0,
          }}
        >
          <MiniCard
            label="Completed Jobs"
            value={orders.length}
            color="#22c55e"
          />
          <MiniCard
            label="Revenue"
            value={inr(totalRevenue)}
            color={COLORS.primary}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <Empty
          icon="checkmark-done-outline"
          title="No completed jobs yet"
          sub="Jobs you complete will appear here"
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: SIZES.screenPadding }}
          renderItem={({ item: o }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() =>
                navigation.navigate("MOrderDetail", { orderId: o._id })
              }
              activeOpacity={0.8}
            >
              <View style={s.top}>
                <Text style={s.no}>{o.orderNo}</Text>
                <Badge status={o.status} />
              </View>
              <Text style={s.cust}>
                {o.customerId?.fullName || "Customer"} · {o.customerId?.phoneNo}
              </Text>
              <Text style={s.veh}>
                {o.vehicleId?.vehicleBrand} {o.vehicleId?.vehicleModel} ·{" "}
                {o.vehicleId?.vehicleRegisterNo}
              </Text>
              <View style={s.footer}>
                <Text style={s.date}>{fmtDate(o.createdAt)}</Text>
                <Text style={s.amt}>{inr(o.totalAmount)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  no: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  cust: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  veh: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  amt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },
});
