import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetOrderDetail } from "../../api/portal";
import { inr, fmtDate, STATUS_LABEL } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import LineRow from "../../components/portal/LineRow";

const STEPS = ["created", "in_progress", "vehicle_ready", "completed"];

export default function CustomerOrderDetail({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetch() {
        try {
          const r = await customerGetOrderDetail(orderId);
          setOrder(r.data?.data?.order);
          setInvoice(r.data?.data?.invoice);
        } catch {
          setOrder(null);
        } finally {
          setLoading(false);
        }
      }
      fetch();
    }, [orderId]),
  );

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />;
  if (!order)  return <Empty icon="alert-circle-outline" title="Order not found" />;

  const cur = STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavBar title={order.orderNo || "Order Detail"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: 40 }}>

        {/* Top card */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={s.vehName}>
              {order.vehicleId?.vehicleBrand} {order.vehicleId?.vehicleModel}
            </Text>
            <Badge status={order.status} />
          </View>
          <Text style={s.regNo}>{order.vehicleId?.vehicleRegisterNo}</Text>
          {order.vehicleId?.vehicleVariant ? (
            <Text style={s.variant}>{order.vehicleId.vehicleVariant}</Text>
          ) : null}
          {order.assignedTo ? (
            <View style={s.mechanicRow}>
              <Ionicons name="person-circle-outline" size={15} color={COLORS.primary} />
              <Text style={s.mechanic}>Mechanic: {order.assignedTo.fullName}</Text>
              {order.assignedTo.phoneNo ? (
                <Text style={s.mechPhone}> · {order.assignedTo.phoneNo}</Text>
              ) : null}
            </View>
          ) : null}
          {order.estimatedDeliveryAt ? (
            <Text style={s.eta}>ETA: {fmtDate(order.estimatedDeliveryAt)}</Text>
          ) : null}
        </View>

        {/* Progress tracker */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            {STEPS.map((step, i) => (
              <View key={step} style={s.stepCol}>
                <View style={[s.dot, i <= cur && s.dotOn]}>
                  {i <= cur && <Ionicons name="checkmark" size={9} color={COLORS.white} />}
                </View>
                <Text style={[s.stepTxt, i <= cur && s.stepTxtOn]}>
                  {STATUS_LABEL[step]}
                </Text>
              </View>
            ))}
          </View>
          {/* connector lines */}
          <View style={s.connectorRow} pointerEvents="none">
            {STEPS.slice(0, -1).map((step, i) => (
              <View key={step} style={[s.connector, i < cur && s.connectorOn]} />
            ))}
          </View>
        </View>

        {/* Customer note */}
        {order.customerNote ? (
          <View style={s.noteBox}>
            <Text style={s.noteLabel}>Your Note</Text>
            <Text style={s.noteTxt}>{order.customerNote}</Text>
          </View>
        ) : null}

        {/* Services */}
        {order.services?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services</Text>
            {order.services.map((svc, i) => (
              <LineRow key={i} name={svc.name} amt={inr(svc.lineTotal)} />
            ))}
          </View>
        )}

        {/* Parts used */}
        {order.parts?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Parts Used</Text>
            {order.parts.map((p, i) => (
              <LineRow key={i} name={`${p.name} × ${p.quantity}`} amt={inr(p.lineTotal)} />
            ))}
          </View>
        )}

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalAmt}>{inr(order.totalAmount)}</Text>
        </View>

        {/* Invoice button */}
        {invoice ? (
          <TouchableOpacity
            style={s.invoiceBtn}
            onPress={() => navigation.navigate("CInvoiceDetail", { invoiceId: invoice._id })}
          >
            <Ionicons name="receipt-outline" size={17} color={COLORS.white} />
            <Text style={s.invoiceBtnTxt}>View Invoice</Text>
            <Badge status={invoice.paymentStatus} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card:         { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.lg, marginBottom: SIZES.lg, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  vehName:      { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  regNo:        { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted, marginTop: 4 },
  variant:      { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  mechanicRow:  { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  mechanic:     { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.primary },
  mechPhone:    { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
  eta:          { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },

  // Progress
  progressWrap: { marginBottom: SIZES.xl, position: "relative" },
  progressRow:  { flexDirection: "row", justifyContent: "space-between" },
  stepCol:      { flex: 1, alignItems: "center", gap: 6 },
  dot:          { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.borderLight, alignItems: "center", justifyContent: "center", zIndex: 1 },
  dotOn:        { backgroundColor: COLORS.primary },
  stepTxt:      { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.textMuted, textAlign: "center" },
  stepTxtOn:    { color: COLORS.primary, fontFamily: FONTS.semibold },
  connectorRow: { position: "absolute", top: 10, left: "12%", right: "12%", flexDirection: "row", justifyContent: "space-between" },
  connector:    { flex: 1, height: 2, backgroundColor: COLORS.borderLight, marginHorizontal: 2 },
  connectorOn:  { backgroundColor: COLORS.primary },

  noteBox:    { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  noteLabel:  { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 4 },
  noteTxt:    { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, fontStyle: "italic" },
  section:    { marginBottom: SIZES.lg },
  sectionTitle:{ fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  totalRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: SIZES.md, borderTopWidth: 2, borderTopColor: COLORS.border, marginBottom: SIZES.lg },
  totalLabel: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  totalAmt:   { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.primary },
  invoiceBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, padding: 14, gap: 8, justifyContent: "center" },
  invoiceBtnTxt:{ fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white, flex: 1, textAlign: "center" },
});
