import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, USER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import Avatar from "../../components/ui/Avatar";
import axiosClient from "../../api/axios";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n ? Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00";

const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtSince = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—";

// ─── Status config ────────────────────────────────────────────────────────────

const PO_STATUS = {
  draft:     { label: "Draft",     bg: COLORS.bgSection,    color: COLORS.textMuted },
  sent:      { label: "Sent",      bg: COLORS.primaryLight, color: COLORS.primary },
  received:  { label: "Received",  bg: COLORS.successLight, color: COLORS.success },
  cancelled: { label: "Cancelled", bg: COLORS.errorLight,   color: COLORS.error },
};

// ─── Purchase Order Row (expandable) ─────────────────────────────────────────

function PORow({ order, isLast }) {
  const [open, setOpen] = useState(false);
  const sc = PO_STATUS[order.status] ?? PO_STATUS.draft;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[s.poCard, isLast && s.poCardLast]}>
      <TouchableOpacity style={s.poHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.poHeaderLeft}>
          <Text style={s.poNo}>{order.orderNo || "—"}</Text>
          <Text style={s.poDate}>{fmtD(order.createdAt)}</Text>
          <Text style={s.poItems}>{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={s.poHeaderRight}>
          <Text style={s.poAmt}>₹{fmt(order.totalAmount)}</Text>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={15}
            color={COLORS.textMuted}
            style={{ marginTop: 2 }}
          />
        </View>
      </TouchableOpacity>

      {open && order.items?.length > 0 && (
        <View style={s.itemsBox}>
          <View style={s.itemsHead}>
            <Text style={[s.thTxt, { flex: 3 }]}>Part</Text>
            <Text style={[s.thTxt, s.thR]}>Qty</Text>
            <Text style={[s.thTxt, s.thR]}>Unit ₹</Text>
            <Text style={[s.thTxt, s.thR]}>Total ₹</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i} style={[s.itemRow, i === order.items.length - 1 && s.itemRowLast]}>
              <View style={{ flex: 3 }}>
                <Text style={s.itemName} numberOfLines={1}>{item.partName}</Text>
                {item.partCode ? <Text style={s.itemCode}>{item.partCode}</Text> : null}
              </View>
              <Text style={[s.itemCell, s.thR]}>{item.quantity}</Text>
              <Text style={[s.itemCell, s.thR]}>₹{fmt(item.unitPrice)}</Text>
              <Text style={[s.itemCell, s.thR, s.itemBold]}>₹{fmt(item.lineTotal)}</Text>
            </View>
          ))}
          {order.comments ? (
            <View style={s.notesBox}>
              <Text style={s.notesTxt}>Note: {order.comments}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Stock-In Row (expandable) ────────────────────────────────────────────────

function StockInRow({ entry, isLast }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  const pending = (entry.totalAmount || 0) - (entry.paidAmount || 0);

  return (
    <View style={[s.poCard, isLast && s.poCardLast]}>
      <TouchableOpacity style={s.poHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.poHeaderLeft}>
          <Text style={s.poNo}>{entry.invoiceNo || `Stock Entry`}</Text>
          <Text style={s.poDate}>{fmtD(entry.date)}</Text>
          <Text style={s.poItems}>{entry.items?.length ?? 0} part{entry.items?.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={s.poHeaderRight}>
          <Text style={s.poAmt}>₹{fmt(entry.totalAmount)}</Text>
          {pending > 0.01 ? (
            <Text style={s.pendingTxt}>₹{fmt(pending)} due</Text>
          ) : (
            <View style={[s.badge, { backgroundColor: COLORS.successLight }]}>
              <Text style={[s.badgeTxt, { color: COLORS.success }]}>Paid</Text>
            </View>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={15}
            color={COLORS.textMuted}
            style={{ marginTop: 2 }}
          />
        </View>
      </TouchableOpacity>

      {open && entry.items?.length > 0 && (
        <View style={s.itemsBox}>
          <View style={s.itemsHead}>
            <Text style={[s.thTxt, { flex: 3 }]}>Part</Text>
            <Text style={[s.thTxt, s.thR]}>Qty</Text>
            <Text style={[s.thTxt, s.thR]}>Unit ₹</Text>
            <Text style={[s.thTxt, s.thR]}>Total ₹</Text>
          </View>
          {entry.items.map((item, i) => (
            <View key={i} style={[s.itemRow, i === entry.items.length - 1 && s.itemRowLast]}>
              <View style={{ flex: 3 }}>
                <Text style={s.itemName} numberOfLines={1}>{item.partName}</Text>
                {item.partCode ? <Text style={s.itemCode}>{item.partCode}</Text> : null}
              </View>
              <Text style={[s.itemCell, s.thR]}>{item.quantityAdded}</Text>
              <Text style={[s.itemCell, s.thR]}>₹{fmt(item.purchasePrice)}</Text>
              <Text style={[s.itemCell, s.thR, s.itemBold]}>₹{fmt(item.lineTotal)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VendorDetailScreen() {
  const route = useRoute();
  const { vendorId, vendorName } = route.params ?? {};

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState("orders"); // "orders" | "stockin"

  const load = useCallback(async (refresh = false) => {
    if (!vendorId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await axiosClient.get(USER_ENDPOINTS.VENDOR_DETAIL(vendorId));
      setData(res.data?.data ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const vendor = data?.user ?? null;
  const stats  = data?.stats ?? { totalOrders: 0, totalValue: 0, pendingOrders: 0, pendingValue: 0, receivedOrders: 0 };
  const orders = data?.purchaseOrders ?? [];
  const stockIns = data?.stockIns ?? [];

  const call = () => vendor?.phoneNo && Linking.openURL(`tel:${vendor.phoneNo}`);
  const mail = () => vendor?.emailId && Linking.openURL(`mailto:${vendor.emailId}`);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title={vendorName ?? "Vendor Details"} showBack transparent={false} />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !vendor ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="store-off-outline" size={64} color={COLORS.borderLight} />
          <Text style={s.emptyTitle}>Vendor not found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* ── Profile header ───────────────────────────────────────── */}
          <View style={s.profileCard}>
            <Avatar name={vendor.fullName} size="xl" />
            <Text style={s.vendorName}>{vendor.fullName}</Text>
            {vendor.address ? (
              <View style={s.addressRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={s.addressTxt} numberOfLines={2}>{vendor.address}</Text>
              </View>
            ) : null}
            <Text style={s.sinceText}>Vendor since {fmtSince(vendor.createdAt)}</Text>

            {/* Contact action buttons */}
            <View style={s.contactRow}>
              <TouchableOpacity style={s.contactBtn} onPress={call} activeOpacity={0.8}>
                <Ionicons name="call" size={18} color={COLORS.white} />
                <Text style={s.contactBtnTxt}>{vendor.phoneNo}</Text>
              </TouchableOpacity>
              {vendor.emailId ? (
                <TouchableOpacity style={[s.contactBtn, s.contactBtnOutline]} onPress={mail} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                  <Text style={[s.contactBtnTxt, { color: COLORS.primary }]} numberOfLines={1}>{vendor.emailId}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* ── Stats row ────────────────────────────────────────────── */}
          <View style={s.statsRow}>
            <View style={[s.statCard, s.statBorderR]}>
              <Text style={s.statVal}>{stats.totalOrders}</Text>
              <Text style={s.statLbl}>Total Orders</Text>
            </View>
            <View style={[s.statCard, s.statBorderR]}>
              <Text style={s.statVal}>₹{fmt(stats.totalValue)}</Text>
              <Text style={s.statLbl}>Total Value</Text>
            </View>
            <View style={[s.statCard, s.statBorderR]}>
              <Text style={[s.statVal, stats.pendingOrders > 0 && { color: COLORS.error }]}>
                {stats.pendingOrders}
              </Text>
              <Text style={s.statLbl}>Pending</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: COLORS.success }]}>{stats.receivedOrders}</Text>
              <Text style={s.statLbl}>Received</Text>
            </View>
          </View>

          {/* ── Pending due banner ────────────────────────────────────── */}
          {stats.pendingValue > 0 && (
            <View style={s.dueBanner}>
              <MaterialCommunityIcons name="clock-alert-outline" size={16} color={COLORS.error} />
              <Text style={s.dueBannerTxt}>
                ₹{fmt(stats.pendingValue)} outstanding across {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? "s" : ""}
              </Text>
            </View>
          )}

          {/* ── Tab toggle ────────────────────────────────────────────── */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tabBtn, activeTab === "orders" && s.tabBtnActive]}
              onPress={() => setActiveTab("orders")}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={15}
                color={activeTab === "orders" ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[s.tabTxt, activeTab === "orders" && s.tabTxtActive]}>
                Purchase Orders ({orders.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, activeTab === "stockin" && s.tabBtnActive]}
              onPress={() => setActiveTab("stockin")}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-down-circle-outline"
                size={15}
                color={activeTab === "stockin" ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[s.tabTxt, activeTab === "stockin" && s.tabTxtActive]}>
                Stock Received ({stockIns.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Purchase Orders ───────────────────────────────────────── */}
          {activeTab === "orders" && (
            <View style={s.section}>
              {orders.length === 0 ? (
                <View style={s.emptyBox}>
                  <MaterialCommunityIcons name="clipboard-off-outline" size={44} color={COLORS.borderLight} />
                  <Text style={s.emptyTxt}>No purchase orders yet</Text>
                </View>
              ) : (
                <View style={s.listCard}>
                  {orders.map((o, i) => (
                    <PORow key={o._id} order={o} isLast={i === orders.length - 1} />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Stock-In history ──────────────────────────────────────── */}
          {activeTab === "stockin" && (
            <View style={s.section}>
              {stockIns.length === 0 ? (
                <View style={s.emptyBox}>
                  <MaterialCommunityIcons name="package-variant-closed" size={44} color={COLORS.borderLight} />
                  <Text style={s.emptyTxt}>No stock received yet</Text>
                </View>
              ) : (
                <View style={s.listCard}>
                  {stockIns.map((e, i) => (
                    <StockInRow key={e._id} entry={e} isLast={i === stockIns.length - 1} />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.sm },
  scroll: { paddingBottom: 80 },

  // ── Profile ───────────────────────────────────────────────────────────────
  profileCard: {
    margin: SIZES.screenPadding,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    padding: SIZES.lg,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  vendorName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXl,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  addressRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 4, paddingHorizontal: SIZES.md,
  },
  addressTxt: {
    fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.textSecondary, flex: 1, textAlign: "center",
  },
  sinceText: {
    fontFamily: FONTS.regular, fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  contactRow: { flexDirection: "row", gap: SIZES.sm, flexWrap: "wrap", justifyContent: "center", marginTop: SIZES.xs },
  contactBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
    maxWidth: 200,
  },
  contactBtnOutline: {
    backgroundColor: COLORS.bgSection,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  contactBtnTxt: {
    fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white, flexShrink: 1,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  statCard:    { flex: 1, alignItems: "center", paddingVertical: SIZES.md, gap: 2 },
  statBorderR: { borderRightWidth: 1, borderRightColor: COLORS.borderLight },
  statVal:     { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  statLbl:     { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // ── Due banner ────────────────────────────────────────────────────────────
  dueBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.sm,
    backgroundColor: COLORS.errorLight, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: `${COLORS.error}30`,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
  },
  dueBannerTxt: {
    fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.error, flex: 1,
  },

  // ── Tab toggle ────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: "row", gap: SIZES.sm,
    marginHorizontal: SIZES.screenPadding, marginBottom: SIZES.sm,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabTxt:       { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textMuted },
  tabTxtActive: { color: COLORS.white },

  // ── List card ─────────────────────────────────────────────────────────────
  section:  { paddingHorizontal: SIZES.screenPadding },
  listCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },

  // ── PO / StockIn row ──────────────────────────────────────────────────────
  poCard:     { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  poCardLast: { borderBottomWidth: 0 },
  poHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 2, gap: SIZES.sm,
  },
  poHeaderLeft:  { flex: 1, gap: 2 },
  poHeaderRight: { alignItems: "flex-end", gap: 3, minWidth: 80 },
  poNo:      { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  poDate:    { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  poItems:   { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  poAmt:     { fontFamily: FONTS.bold,     fontSize: SIZES.textBase,  color: COLORS.textPrimary },
  pendingTxt:{ fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.error },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  badgeTxt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Expanded items ────────────────────────────────────────────────────────
  itemsBox: {
    backgroundColor: COLORS.bgSection, marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm, overflow: "hidden",
  },
  itemsHead: {
    flexDirection: "row", paddingHorizontal: SIZES.sm, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  thTxt: { flex: 1.2, fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, textTransform: "uppercase" },
  thR:   { textAlign: "right" },
  itemRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  itemRowLast: { borderBottomWidth: 0 },
  itemName: { fontFamily: FONTS.medium,  fontSize: SIZES.textBase, color: COLORS.textPrimary },
  itemCode: { fontFamily: FONTS.regular, fontSize: SIZES.textXs,   color: COLORS.textMuted, marginTop: 1 },
  itemCell: { flex: 1.2, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  itemBold: { fontFamily: FONTS.bold, color: COLORS.textPrimary },
  notesBox: { padding: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  notesTxt: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, fontStyle: "italic" },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyBox:   { alignItems: "center", paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyTxt:   { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },
  emptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
});
