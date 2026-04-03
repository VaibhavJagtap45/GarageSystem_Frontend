import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS, REPAIR_ORDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const DATE_CHIPS = [
  { key: "all",   label: "All"        },
  { key: "today", label: "Today"      },
  { key: "week",  label: "This Week"  },
  { key: "month", label: "This Month" },
];

function getDateRange(key) {
  const n = new Date();
  if (key === "today")
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  if (key === "week") {
    const d = n.getDay(); const diff = d === 0 ? -6 : 1 - d;
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), n.getDate() + diff).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  }
  if (key === "month")
    return { dateFrom: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(), dateTo: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59).toISOString() };
  return {};
}

function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtAmt(n)  { return "₹" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function CancelledCard({ order }) {
  const name     = order.customerId?.fullName ?? "—";
  const phone    = order.customerId?.phoneNo  ?? "";
  const regNo    = order.vehicleId?.vehicleRegisterNo ?? "—";
  const vehicle  = [order.vehicleId?.vehicleBrand, order.vehicleId?.vehicleModel].filter(Boolean).join(" ") || "—";

  const handleCall = () => {
    if (!phone) { Alert.alert("No phone number"); return; }
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.orderNo} numberOfLines={1}>{order.orderNo ?? "—"}</Text>
        <View style={s.cancelBadge}><Text style={s.cancelBadgeText}>CANCELLED</Text></View>
      </View>

      <View style={s.cardRow}>
        <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
        <Text style={s.cardRowText} numberOfLines={1}>{name}</Text>
        {phone ? <Text style={s.cardRowMuted}>· {phone}</Text> : null}
      </View>

      <View style={s.cardRow}>
        <Ionicons name="car-outline" size={13} color={COLORS.textMuted} />
        <Text style={s.cardRowText} numberOfLines={1}>{vehicle}</Text>
        <View style={s.regPill}><Text style={s.regPillText}>{regNo}</Text></View>
      </View>

      <View style={s.cardFooter}>
        <View style={{ gap: 2 }}>
          <View style={s.cardRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.cardMuted}>{fmtDate(order.updatedAt ?? order.createdAt)}</Text>
          </View>
          <Text style={s.cardAmt}>{fmtAmt(order.totalAmount)}</Text>
        </View>
        {phone ? (
          <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Ionicons name="call" size={14} color={COLORS.white} />
            <Text style={s.callBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function EmptyState({ isFiltered }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIconCircle}>
        <Ionicons name="ban-outline" size={40} color={COLORS.textMuted} />
      </View>
      <Text style={s.emptyTitle}>{isFiltered ? "No results found" : "No cancelled orders"}</Text>
      <Text style={s.emptyDesc}>
        {isFiltered ? "Try adjusting your search or date filter." : "Cancelled repair orders will appear here."}
      </Text>
    </View>
  );
}

const LIMIT = 20;

export default function CancelledOrdersScreen() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [dateChip,    setDateChip]    = useState("all");
  const [query,       setQuery]       = useState("");

  const fetchOrders = useCallback(async ({ pageNum = 1, chip = dateChip, refresh = false, loadMore = false } = {}) => {
    if (refresh) setRefreshing(true);
    else if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = { page: pageNum, limit: LIMIT, ...getDateRange(chip) };
      const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.CANCELLED, { params });
      const fetched = res.data?.data?.orders ?? [];
      const total   = res.data?.data?.total  ?? fetched.length;

      setOrders((prev) => pageNum === 1 ? fetched : [...prev, ...fetched]);
      setHasMore(pageNum * LIMIT < total);
      setPage(pageNum);
    } catch (e) {
      Alert.alert("Error", e.displayMessage ?? "Failed to load cancelled orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [dateChip]);

  useEffect(() => { fetchOrders(); }, []);

  const handleChip = (chip) => {
    setDateChip(chip);
    setQuery("");
    fetchOrders({ pageNum: 1, chip });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const name    = (o.customerId?.fullName ?? "").toLowerCase();
      const phone   = o.customerId?.phoneNo ?? "";
      const orderNo = (o.orderNo ?? "").toLowerCase();
      const reg     = (o.vehicleId?.vehicleRegisterNo ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || orderNo.includes(q) || reg.includes(q);
    });
  }, [orders, query]);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Cancelled Orders" showBack transparent={false} />

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Name, phone, order no, reg…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date chips */}
      <View style={s.chipsRow}>
        {DATE_CHIPS.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[s.chip, dateChip === c.key && s.chipActive]}
            onPress={() => handleChip(c.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, dateChip === c.key && s.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id ?? item.orderNo ?? String(Math.random())}
          renderItem={({ item }) => <CancelledCard order={item} />}
          contentContainerStyle={[s.listContent, filtered.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SIZES.sm }} />}
          ListEmptyComponent={<EmptyState isFiltered={query.length > 0 || dateChip !== "all"} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: SIZES.md }} /> : null}
          onEndReached={() => { if (!loadingMore && hasMore) fetchOrders({ pageNum: page + 1, loadMore: true }); }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders({ pageNum: 1, refresh: true })} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    marginBottom: 0,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textPrimary, padding: 0 },

  chipsRow:    { flexDirection: "row", paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm, gap: SIZES.sm },
  chip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight },
  chipActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:    { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontFamily: FONTS.semibold },

  listContent: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.xs + 2,
    ...SHADOWS.sm,
  },
  cardHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  orderNo:     { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary, flex: 1, marginRight: SIZES.sm },
  cancelBadge: { backgroundColor: COLORS.errorLight, borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 3, borderWidth: 1, borderColor: "#FECACA" },
  cancelBadgeText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.error, letterSpacing: 0.5 },

  cardRow:     { flexDirection: "row", alignItems: "center", gap: 5 },
  cardRowText: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, flexShrink: 1 },
  cardRowMuted: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },

  regPill:     { backgroundColor: COLORS.bgSection, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.borderLight, marginLeft: 2 },
  regPillText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textSecondary, letterSpacing: 0.5 },

  cardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SIZES.xs },
  cardMuted:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  cardAmt:     { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },

  callBtn:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs + 2 },
  callBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },

  emptyWrap:       { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: SIZES.xxl, gap: SIZES.md },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgSection, alignItems: "center", justifyContent: "center", marginBottom: SIZES.sm },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, textAlign: "center" },
  emptyDesc:       { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted, textAlign: "center", lineHeight: 22, paddingHorizontal: SIZES.lg },
});
