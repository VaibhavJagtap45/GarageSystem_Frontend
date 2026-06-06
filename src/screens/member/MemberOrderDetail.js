import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, FlatList, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  memberGetOrderDetail,
  memberUpdateStatus,
  memberUpdateParts,
  memberGetInventory,
} from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import LineRow from "../../components/portal/LineRow";
import M from "../../components/portal/modalStyles";

// status → [nextStatus, button label, color]
const NEXT_ACTION = {
  created:       ["in_progress",   "Start Work",     "#6366f1"],
  in_progress:   ["vehicle_ready", "Mark Ready",     "#f59e0b"],
  vehicle_ready: ["completed",     "Complete Order", "#22c55e"],
};

export default function MemberOrderDetail({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [pModal, setPModal]   = useState(false);
  const [inventory, setInv]   = useState([]);
  const [editParts, setEP]    = useState([]);
  const [invSearch, setIS]    = useState("");
  const [savingP, setSP]      = useState(false);
  const [updStat, setUS]      = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await memberGetOrderDetail(orderId);
      setOrder(r.data?.data?.order);
      setEP(r.data?.data?.order?.parts || []);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Parts management ────────────────────────────────────────────
  const loadInv = async () => {
    try {
      const r = await memberGetInventory({ search: invSearch, limit: 100 });
      setInv(r.data?.data?.items || []);
    } catch {
      setInv([]);
    }
  };

  const openParts = async () => {
    await loadInv();
    setPModal(true);
  };

  const addPart = (item) =>
    setEP((prev) => {
      const ex = prev.find((p) => p.inventoryId === item._id);
      if (ex) {
        return prev.map((p) =>
          p.inventoryId === item._id
            ? { ...p, quantity: p.quantity + 1, lineTotal: (p.quantity + 1) * p.unitPrice }
            : p,
        );
      }
      return [
        ...prev,
        {
          inventoryId: item._id,
          partCode:    item.partCode,
          name:        item.partName,
          quantity:    1,
          unitPrice:   item.sellingPrice,
          discount:    0,
          taxPercent:  item.taxPercent || 0,
          lineTotal:   item.sellingPrice,
        },
      ];
    });

  const rmPart = (id) => setEP((p) => p.filter((x) => x.inventoryId !== id));

  const saveParts = async () => {
    setSP(true);
    try {
      await memberUpdateParts(orderId, editParts);
      await load();
      setPModal(false);
      Toast.show({ type: "success", text1: "Parts updated!" });
    } catch (e) {
      Toast.show({ type: "error", text1: e?.displayMessage || "Failed." });
    } finally {
      setSP(false);
    }
  };

  // ── Status update ───────────────────────────────────────────────
  const doStatus = async (st) => {
    setUS(true);
    try {
      await memberUpdateStatus(orderId, st);
      await load();
      Toast.show({ type: "success", text1: `Status updated!` });
    } catch (e) {
      Toast.show({ type: "error", text1: e?.displayMessage || "Failed." });
    } finally {
      setUS(false);
    }
  };

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />;
  if (!order)  return <Empty icon="alert-circle-outline" title="Order not found" />;

  const next = NEXT_ACTION[order.status];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavBar title={order.orderNo || "Order"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: 100 }}>

        {/* Customer & vehicle */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={s.cname}>{order.customerId?.fullName || "Customer"}</Text>
              <Text style={s.phone}>{order.customerId?.phoneNo}</Text>
              {order.customerId?.emailId ? (
                <Text style={s.email}>{order.customerId.emailId}</Text>
              ) : null}
            </View>
            <Badge status={order.status} />
          </View>
          <View style={s.vehRow}>
            <Ionicons name="car-outline" size={15} color={COLORS.textMuted} />
            <Text style={s.veh}>
              {order.vehicleId?.vehicleBrand} {order.vehicleId?.vehicleModel} · {order.vehicleId?.vehicleRegisterNo}
            </Text>
          </View>
          {order.vehicleId?.vehicleVariant ? (
            <Text style={s.variant}>{order.vehicleId.vehicleVariant}</Text>
          ) : null}
          {order.customerNote ? (
            <View style={s.noteBox}>
              <Text style={s.noteL}>Customer Note</Text>
              <Text style={s.noteT}>{order.customerNote}</Text>
            </View>
          ) : null}
          {order.estimatedDeliveryAt ? (
            <Text style={s.eta}>ETA: {fmtDate(order.estimatedDeliveryAt)}</Text>
          ) : null}
        </View>

        {/* Services */}
        {order.services?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services</Text>
            {order.services.map((sv, i) => (
              <LineRow key={i} name={sv.name} amt={inr(sv.lineTotal)} />
            ))}
          </View>
        )}

        {/* Parts */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Parts Used</Text>
            {["in_progress", "vehicle_ready"].includes(order.status) && (
              <TouchableOpacity style={s.manageBtn} onPress={openParts}>
                <Ionicons name="create-outline" size={13} color={COLORS.white} />
                <Text style={s.manageBtnTxt}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          {order.parts?.length === 0 ? (
            <Text style={s.emptyParts}>No parts added yet.</Text>
          ) : (
            order.parts.map((p, i) => (
              <LineRow key={i} name={`${p.name} × ${p.quantity}`} amt={inr(p.lineTotal)} />
            ))
          )}
        </View>

        {/* Totals */}
        <View style={s.totalsBox}>
          {[
            ["Services",    inr(order.servicesTotal)],
            ["Parts",       inr(order.partsTotal)],
          ].map(([l, v]) => (
            <View key={l} style={s.totalsRow}>
              <Text style={s.totalsLabel}>{l}</Text>
              <Text style={s.totalsVal}>{v}</Text>
            </View>
          ))}
          <View style={s.totalFinalRow}>
            <Text style={s.totalFinalLabel}>Total</Text>
            <Text style={s.totalFinalAmt}>{inr(order.totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Status footer button */}
      {next && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: next[2] }, updStat && { opacity: 0.7 }]}
            onPress={() => doStatus(next[0])}
            disabled={updStat}
          >
            {updStat
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : (
                <>
                  <Ionicons name="arrow-forward-outline" size={17} color={COLORS.white} />
                  <Text style={s.nextTxt}>{next[1]}</Text>
                </>
              )}
          </TouchableOpacity>
        </View>
      )}

      {/* Manage parts modal */}
      <Modal visible={pModal} animationType="slide" transparent onRequestClose={() => setPModal(false)}>
        <View style={M.overlay}>
          <View style={[M.box, { maxHeight: "90%" }]}>
            <Text style={M.title}>Manage Parts</Text>

            {/* Current parts */}
            {editParts.length > 0 && (
              <View style={{ marginBottom: SIZES.md }}>
                <Text style={M.label}>Added ({editParts.length})</Text>
                {editParts.map((p) => (
                  <View
                    key={p.inventoryId || p.name}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}
                  >
                    <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary }}>
                      {p.name} × {p.quantity}
                    </Text>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary }}>
                      {inr(p.lineTotal)}
                    </Text>
                    <TouchableOpacity onPress={() => rmPart(p.inventoryId)}>
                      <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Inventory search */}
            <Text style={M.label}>Add from Inventory</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.borderLight, gap: 8, marginBottom: SIZES.sm }}>
              <Ionicons name="search-outline" size={13} color={COLORS.textMuted} />
              <TextInput
                style={{ flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary }}
                placeholder="Search parts…"
                placeholderTextColor={COLORS.textMuted}
                value={invSearch}
                onChangeText={setIS}
                onSubmitEditing={loadInv}
              />
            </View>

            <FlatList
              data={inventory}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 220 }}
              ListEmptyComponent={
                <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", paddingVertical: 12 }}>
                  Search above to find parts
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => addPart(item)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary }}>
                      {item.partName}
                    </Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted }}>
                      Stock: {item.quantityInHand} {item.unit}
                      {item.partCode ? ` · ${item.partCode}` : ""}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary }}>
                    {inr(item.sellingPrice)}
                  </Text>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            />

            <View style={[M.btns, { marginTop: SIZES.md }]}>
              <TouchableOpacity style={M.cancelBtn} onPress={() => setPModal(false)}>
                <Text style={M.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={M.confirmBtn} onPress={saveParts} disabled={savingP}>
                {savingP
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={M.confirmTxt}>Save Parts</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card:         { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.lg, marginBottom: SIZES.lg, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  cname:        { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  phone:        { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
  email:        { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  vehRow:       { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  veh:          { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  variant:      { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  noteBox:      { marginTop: SIZES.sm, backgroundColor: COLORS.bg, borderRadius: SIZES.radiusSm, padding: SIZES.sm },
  noteL:        { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted },
  noteT:        { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, fontStyle: "italic" },
  eta:          { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },
  section:      { marginBottom: SIZES.lg },
  sectionRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.sm },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  manageBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  manageBtnTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.white },
  emptyParts:   { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, fontStyle: "italic" },
  totalsBox:    { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  totalsRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  totalsLabel:  { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  totalsVal:    { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  totalFinalRow:{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 8 },
  totalFinalLabel:{ fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  totalFinalAmt:{ fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.primary },
  footer:       { position: "absolute", bottom: 0, left: 0, right: 0, padding: SIZES.screenPadding, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  nextBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: SIZES.radiusFull, padding: 14, gap: 8 },
  nextTxt:      { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },
});
