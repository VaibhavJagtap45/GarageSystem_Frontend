import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  customerGetOrderDetail,
  customerCancelOrder,
} from "../../api/portal";
import { inr, fmtDate, STATUS_LABEL } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import LineRow from "../../components/portal/LineRow";

const STEPS = [
  { key: "created",       label: "Requested",   icon: "document-text-outline" },
  { key: "in_progress",   label: "In Progress", icon: "construct-outline"     },
  { key: "vehicle_ready", label: "Ready",       icon: "car-sport-outline"     },
  { key: "completed",     label: "Completed",   icon: "checkmark-done-outline"},
];

const STATUS_THEME = {
  created:       { color: "#f59e0b", grad: ["#d97706", "#f59e0b"], bg: "#fef3c7" },
  in_progress:   { color: "#6366f1", grad: ["#4f46e5", "#6366f1"], bg: "#e0e7ff" },
  vehicle_ready: { color: "#0ea5e9", grad: ["#0284c7", "#0ea5e9"], bg: "#e0f2fe" },
  completed:     { color: "#22c55e", grad: ["#16a34a", "#22c55e"], bg: "#dcfce7" },
  cancelled:     { color: "#ef4444", grad: ["#dc2626", "#ef4444"], bg: "#fee2e2" },
};

export default function CustomerOrderDetail({ route, navigation }) {
  const { orderId } = route.params;
  const tabBarH = useBottomTabBarHeight();
  const [order, setOrder]         = useState(null);
  const [invoice, setInvoice]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

  if (loading)
    return (
      <SafeAreaView style={s.safe}>
        <NavBar title="Loading…" onBack={() => navigation.goBack()} />
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );

  if (!order) return <Empty icon="alert-circle-outline" title="Order not found" />;

  const cur = STEPS.findIndex((x) => x.key === order.status);
  const isCancelled = order.status === "cancelled";
  const theme = STATUS_THEME[order.status] ?? STATUS_THEME.created;

  // Progress percent: 0/33/66/100
  const progressPct = isCancelled
    ? 100
    : cur < 0
      ? 0
      : Math.round((cur / (STEPS.length - 1)) * 100);

  function handleCancel() {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel order ${order.orderNo}? This cannot be undone.`,
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const r = await customerCancelOrder(orderId);
              setOrder(r.data?.data?.order ?? { ...order, status: "cancelled" });
            } catch (err) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Could not cancel order.",
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  const servicesTotal = (order.services || []).reduce(
    (sum, sv) => sum + (sv.lineTotal || 0),
    0,
  );
  const partsTotal = (order.parts || []).reduce(
    (sum, p) => sum + (p.lineTotal || 0),
    0,
  );

  const vehName = [
    order.vehicleId?.vehicleBrand,
    order.vehicleId?.vehicleModel,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <NavBar
        title={order.orderNo || "Order"}
        subtitle={fmtDate(order.createdAt)}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero status card ── */}
        <LinearGradient
          colors={isCancelled ? ["#dc2626", "#ef4444"] : theme.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={[s.heroDeco, { width: 160, height: 160, top: -40, right: -30 }]} />
          <View style={[s.heroDeco, { width: 70, height: 70, bottom: -10, left: -10 }]} />

          <View style={s.heroTopRow}>
            <View style={s.heroIconWrap}>
              <Ionicons name="car-sport" size={22} color={COLORS.white} />
            </View>
            <View style={s.heroStatusBadge}>
              <View style={s.heroStatusDot} />
              <Text style={s.heroStatusTxt}>
                {STATUS_LABEL[order.status] || order.status}
              </Text>
            </View>
          </View>

          <Text style={s.heroTitle} numberOfLines={1}>
            {vehName || "Your vehicle"}
          </Text>
          {order.vehicleId?.vehicleRegisterNo ? (
            <Text style={s.heroReg}>{order.vehicleId.vehicleRegisterNo}</Text>
          ) : null}

          <View style={s.heroStatsRow}>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>{inr(order.totalAmount)}</Text>
              <Text style={s.heroStatLbl}>Total</Text>
            </View>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>
                {(order.services?.length || 0) + (order.parts?.length || 0)}
              </Text>
              <Text style={s.heroStatLbl}>Line items</Text>
            </View>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>{fmtDate(order.createdAt)}</Text>
              <Text style={s.heroStatLbl}>Created</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.content}>
          {/* ── Progress tracker ── */}
          {!isCancelled && (
            <View style={s.timelineCard}>
              <View style={s.timelineHead}>
                <View>
                  <Text style={s.timelineTitle}>Job progress</Text>
                  <Text style={s.timelineSub}>
                    Stage {Math.max(0, cur) + 1} of {STEPS.length}
                  </Text>
                </View>
                <View style={[s.timelinePctPill, { backgroundColor: theme.bg }]}>
                  <Text style={[s.timelinePctTxt, { color: theme.color }]}>
                    {progressPct}%
                  </Text>
                </View>
              </View>

              {/* Bar */}
              <View style={s.progressBar}>
                <LinearGradient
                  colors={theme.grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${progressPct}%` }]}
                />
              </View>

              {/* Steps */}
              <View style={s.stepsRow}>
                {STEPS.map((step, i) => {
                  const active = i <= cur;
                  return (
                    <View key={step.key} style={s.stepItem}>
                      <View
                        style={[
                          s.stepCircle,
                          active && { backgroundColor: theme.color, borderColor: theme.color },
                        ]}
                      >
                        <Ionicons
                          name={active ? "checkmark" : step.icon}
                          size={12}
                          color={active ? COLORS.white : COLORS.textMuted}
                        />
                      </View>
                      <Text
                        style={[s.stepLbl, active && { color: theme.color, fontFamily: FONTS.bold }]}
                        numberOfLines={1}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {isCancelled && (
            <View style={s.cancelledBanner}>
              <View style={s.cancelledIcon}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cancelledTitle}>This order was cancelled</Text>
                <Text style={s.cancelledSub}>No charges will apply.</Text>
              </View>
            </View>
          )}

          {/* ── Vehicle & mechanic card ── */}
          <View style={s.infoCard}>
            <View style={s.infoCardHead}>
              <View style={s.infoIconWrap}>
                <Ionicons name="car-sport-outline" size={16} color="#1d4ed8" />
              </View>
              <Text style={s.infoCardTitle}>Vehicle</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLbl}>Vehicle</Text>
              <Text style={s.infoVal} numberOfLines={1}>
                {vehName || "—"}
              </Text>
            </View>
            {order.vehicleId?.vehicleRegisterNo ? (
              <View style={s.infoRow}>
                <Text style={s.infoLbl}>Register No.</Text>
                <Text style={s.infoVal}>{order.vehicleId.vehicleRegisterNo}</Text>
              </View>
            ) : null}
            {order.vehicleId?.vehicleVariant ? (
              <View style={s.infoRow}>
                <Text style={s.infoLbl}>Variant</Text>
                <Text style={s.infoVal}>{order.vehicleId.vehicleVariant}</Text>
              </View>
            ) : null}

            {(order.assignedTo || order.estimatedDeliveryAt) && (
              <View style={s.infoDivider} />
            )}

            {order.assignedTo ? (
              <View style={s.infoRow}>
                <Text style={s.infoLbl}>Mechanic</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.infoVal}>{order.assignedTo.fullName}</Text>
                  {order.assignedTo.phoneNo ? (
                    <Text style={s.infoSub}>{order.assignedTo.phoneNo}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {order.estimatedDeliveryAt ? (
              <View style={s.infoRow}>
                <Text style={s.infoLbl}>ETA</Text>
                <Text style={[s.infoVal, { color: "#f59e0b" }]}>
                  {fmtDate(order.estimatedDeliveryAt)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Customer note ── */}
          {order.customerNote ? (
            <View style={s.noteCard}>
              <View style={s.noteIconWrap}>
                <Ionicons name="chatbubble-outline" size={14} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.noteLbl}>Your note</Text>
                <Text style={s.noteTxt}>{order.customerNote}</Text>
              </View>
            </View>
          ) : null}

          {/* ── Services ── */}
          {order.services?.length > 0 && (
            <View style={s.listCard}>
              <View style={s.listHead}>
                <View style={[s.listIconWrap, { backgroundColor: "#dbeafe" }]}>
                  <MaterialCommunityIcons name="wrench-outline" size={15} color="#1d4ed8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>Services</Text>
                  <Text style={s.listSub}>
                    {order.services.length} item{order.services.length === 1 ? "" : "s"} · {inr(servicesTotal)}
                  </Text>
                </View>
              </View>
              <View style={s.listBody}>
                {order.services.map((sv, i) => (
                  <LineRow key={i} name={sv.name} amt={inr(sv.lineTotal)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Parts ── */}
          {order.parts?.length > 0 && (
            <View style={s.listCard}>
              <View style={s.listHead}>
                <View style={[s.listIconWrap, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="cog-outline" size={16} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>Parts</Text>
                  <Text style={s.listSub}>
                    {order.parts.length} part{order.parts.length === 1 ? "" : "s"} · {inr(partsTotal)}
                  </Text>
                </View>
              </View>
              <View style={s.listBody}>
                {order.parts.map((p, i) => (
                  <LineRow
                    key={i}
                    name={`${p.name} × ${p.quantity}`}
                    amt={inr(p.lineTotal)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Total ── */}
          <View style={s.totalCard}>
            <Text style={s.totalLabel}>Grand total</Text>
            <Text style={s.totalAmt}>{inr(order.totalAmount)}</Text>
          </View>

          {/* ── Action buttons ── */}
          {invoice && (
            <TouchableOpacity
              style={s.invoiceBtn}
              onPress={() =>
                navigation.navigate("CInvoiceDetail", { invoiceId: invoice._id })
              }
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#1d4ed8", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.invoiceBtnInner}
              >
                <Ionicons name="receipt-outline" size={18} color={COLORS.white} />
                <Text style={s.invoiceBtnTxt}>View invoice</Text>
                <View style={s.invoiceBadgeWrap}>
                  <Badge status={invoice.paymentStatus} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {order.status === "created" && (
            <TouchableOpacity
              style={[s.cancelBtn, cancelling && s.cancelBtnDisabled]}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.85}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              )}
              <Text style={s.cancelBtnTxt}>
                {cancelling ? "Cancelling…" : "Cancel order"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  heroStatusTxt: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXl,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroReg: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.4,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: SIZES.md,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 10,
  },
  heroStatVal: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  heroStatLbl: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.78)",
  },

  // Content wrapper
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  timelineHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timelineTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  timelineSub: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  timelinePctPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  timelinePctTxt: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textXs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSection,
    overflow: "hidden",
    marginBottom: SIZES.md,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLbl: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  // Cancelled banner
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: SIZES.md,
  },
  cancelledIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelledTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: "#dc2626",
  },
  cancelledSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: "#991b1b",
    marginTop: 2,
  },

  // Info card (vehicle/mechanic)
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  infoCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    gap: 12,
  },
  infoLbl: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  infoVal: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: "right",
  },
  infoSub: {
    marginTop: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 6,
  },

  // Customer note
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: SIZES.md,
  },
  noteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noteLbl: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    color: "#1d4ed8",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  noteTxt: {
    marginTop: 3,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: "#1e3a8a",
    lineHeight: 19,
  },

  // List card (services/parts)
  listCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.md,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listIconWrap: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  listTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  listSub: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  listBody: {
    paddingHorizontal: SIZES.md,
  },

  // Total
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: SIZES.md,
  },
  totalLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  totalAmt: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: "#1d4ed8",
    letterSpacing: -0.3,
  },

  // Invoice btn
  invoiceBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    marginBottom: SIZES.sm,
    ...SHADOWS.md,
  },
  invoiceBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SIZES.md,
    paddingVertical: 14,
  },
  invoiceBtnTxt: {
    flex: 1,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
    letterSpacing: -0.1,
  },
  invoiceBadgeWrap: {
    // badge component already has its own bg
  },

  // Cancel btn
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    backgroundColor: "#fff",
    padding: 14,
    marginTop: 2,
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnTxt: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: "#ef4444",
  },
});
