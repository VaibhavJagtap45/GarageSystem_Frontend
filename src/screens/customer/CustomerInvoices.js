import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetInvoices } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";

const PAYMENT_COLOR = {
  paid:         "#22c55e",
  unpaid:       "#f59e0b",
  partially_paid: "#6366f1",
};

export default function CustomerInvoices({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await customerGetInvoices();
      setInvoices(r.data?.data?.invoices || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item: inv }) => {
    const accent = PAYMENT_COLOR[inv.paymentStatus] ?? COLORS.primary;
    const paid   = inv.paymentStatus === "paid";
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: accent }]}
        onPress={() => navigation.navigate("CInvoiceDetail", { invoiceId: inv._id })}
        activeOpacity={0.8}
      >
        {/* Header row */}
        <View style={s.cardHead}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.no}>{inv.invoiceNo || "Invoice"}</Text>
            <View style={s.infoRow}>
              <Ionicons name="car-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.veh}>
                {inv.vehicleId?.vehicleBrand} {inv.vehicleId?.vehicleModel}
                {inv.vehicleId?.vehicleRegisterNo ? `  ·  ${inv.vehicleId.vehicleRegisterNo}` : ""}
              </Text>
            </View>
            {inv.repairOrderId?.orderNo ? (
              <View style={s.infoRow}>
                <Ionicons name="document-text-outline" size={12} color={COLORS.textMuted} />
                <Text style={s.roNo}>Order: {inv.repairOrderId.orderNo}</Text>
              </View>
            ) : null}
            <Text style={s.date}>{fmtDate(inv.createdAt)}</Text>
          </View>

          {/* Right side */}
          <View style={{ alignItems: "flex-end", gap: 6, paddingLeft: SIZES.sm }}>
            <View style={[s.statusPill, { backgroundColor: accent + "18" }]}>
              <View style={[s.statusDot, { backgroundColor: accent }]} />
              <Text style={[s.statusTxt, { color: accent }]}>
                {paid ? "Paid" : inv.paymentStatus === "partially_paid" ? "Partial" : "Unpaid"}
              </Text>
            </View>
            <Text style={s.amt}>{inr(inv.totalAmount)}</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <NavBar title="My Invoices" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : invoices.length === 0 ? (
        <Empty
          icon="receipt-outline"
          title="No invoices yet"
          sub="Invoices appear after service completion"
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(inv) => inv._id}
          contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: tabBarH + 16 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm + 2,
    borderWidth: 1, borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardHead: { flexDirection: "row", padding: SIZES.md, gap: SIZES.sm },
  infoRow:  { flexDirection: "row", alignItems: "center", gap: 4 },

  no:   { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: 2 },
  veh:  { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1 },
  roNo: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, flex: 1 },
  date: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },
  amt:  { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },
});
