import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPORTS_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

const CATEGORIES = [
  { key: "active", label: "Active",   subtitle: "Used within 30 days",    color: COLORS.success,  bg: COLORS.successLight, icon: "check-circle-outline" },
  { key: "slow",   label: "Slow",     subtitle: "30–90 days inactive",    color: "#BA7517",       bg: "#FFFBEB",           icon: "clock-alert-outline" },
  { key: "dead",   label: "Dead",     subtitle: "Over 90 days or never",  color: COLORS.error,    bg: COLORS.errorLight,   icon: "alert-circle-outline" },
];

function fmt(n) {
  if (!n) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmtDate(d) {
  if (!d) return "Never used";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function PartRow({ item, color, isLast }) {
  return (
    <View style={[s.partRow, isLast && s.partRowLast]}>
      <View style={s.partLeft}>
        <Text style={s.partName} numberOfLines={1}>{item.partName}</Text>
        {item.partCode ? <Text style={s.partCode}>{item.partCode}</Text> : null}
        <Text style={s.partMeta}>{item.category ?? "General"}{item.brand ? ` · ${item.brand}` : ""}</Text>
        <Text style={s.partUsed}>Last used: {fmtDate(item.lastUsedAt)}</Text>
      </View>
      <View style={s.partRight}>
        <Text style={s.partQty}>{item.quantityInHand ?? 0} units</Text>
        <Text style={[s.partValue, { color }]}>₹{fmt(item.stockValue)}</Text>
      </View>
    </View>
  );
}

function CategorySection({ cat, data, expanded, onToggle }) {
  const items = data[cat.key]?.items ?? [];
  const count = data[cat.key]?.count ?? 0;
  const value = data[cat.key]?.value ?? 0;

  return (
    <View style={s.catSection}>
      <TouchableOpacity
        style={[s.catHeader, { backgroundColor: cat.bg, borderColor: `${cat.color}30` }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[s.catIcon, { backgroundColor: `${cat.color}20` }]}>
          <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
        </View>
        <View style={s.catHeaderContent}>
          <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
          <Text style={s.catSubtitle}>{cat.subtitle}</Text>
        </View>
        <View style={s.catHeaderRight}>
          <Text style={[s.catCount, { color: cat.color }]}>{count} items</Text>
          <Text style={s.catValue}>₹{fmt(value)}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={cat.color}
          />
        </View>
      </TouchableOpacity>

      {expanded && items.length > 0 && (
        <View style={s.card}>
          {items.map((item, i) => (
            <PartRow
              key={item._id}
              item={item}
              color={cat.color}
              isLast={i === items.length - 1}
            />
          ))}
        </View>
      )}
      {expanded && items.length === 0 && (
        <View style={s.emptySmall}>
          <Text style={s.emptySmallText}>No items in this category</Text>
        </View>
      )}
    </View>
  );
}

export default function InventoryAgeingScreen() {
  const [data, setData] = useState({ active: { items: [], count: 0, value: 0 }, slow: { items: [], count: 0, value: 0 }, dead: { items: [], count: 0, value: 0 }, totalItems: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({ active: true, slow: true, dead: true });

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axiosClient.get(REPORTS_ENDPOINTS.INVENTORY_AGEING);
      const d = res.data?.data ?? {};
      setData({
        active:     d.active     ?? { items: [], count: 0, value: 0 },
        slow:       d.slow       ?? { items: [], count: 0, value: 0 },
        dead:       d.dead       ?? { items: [], count: 0, value: 0 },
        totalItems: d.totalItems ?? 0,
        totalValue: d.totalValue ?? 0,
      });
    } catch {
      setData({ active: { items: [], count: 0, value: 0 }, slow: { items: [], count: 0, value: 0 }, dead: { items: [], count: 0, value: 0 }, totalItems: 0, totalValue: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleCat = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Inventory Ageing" showBack transparent={false} />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview */}
          <View style={s.section}>
            <View style={s.overviewCard}>
              <View style={s.overviewRow}>
                <View style={s.overviewItem}>
                  <Text style={s.overviewVal}>{data.totalItems}</Text>
                  <Text style={s.overviewLbl}>Total SKUs tracked</Text>
                </View>
                <View style={s.overviewDivider} />
                <View style={s.overviewItem}>
                  <Text style={s.overviewVal}>₹{fmt(data.totalValue)}</Text>
                  <Text style={s.overviewLbl}>Total Stock Value</Text>
                </View>
              </View>
              {/* Visual split bar */}
              {data.totalItems > 0 && (
                <View style={s.splitBarTrack}>
                  {CATEGORIES.map((cat) => {
                    const pct = ((data[cat.key]?.count ?? 0) / (data.totalItems || 1)) * 100;
                    return pct > 0 ? (
                      <View
                        key={cat.key}
                        style={[s.splitBarSeg, { width: `${pct}%`, backgroundColor: cat.color }]}
                      />
                    ) : null;
                  })}
                </View>
              )}
              <View style={s.splitLegend}>
                {CATEGORIES.map((cat) => (
                  <View key={cat.key} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={s.legendText}>{cat.label} ({data[cat.key]?.count ?? 0})</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={s.section}>
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.key}
                cat={cat}
                data={data}
                expanded={expanded[cat.key]}
                onToggle={() => toggleCat(cat.key)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 80 },

  section: { marginTop: 20, paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },

  overviewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  overviewRow: { flexDirection: "row", marginBottom: SIZES.md },
  overviewItem: { flex: 1, alignItems: "center" },
  overviewDivider: { width: 1, backgroundColor: COLORS.borderLight },
  overviewVal: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  overviewLbl: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },

  splitBarTrack: {
    height: 10, borderRadius: SIZES.radiusFull,
    overflow: "hidden", flexDirection: "row",
    backgroundColor: COLORS.bgSection, marginBottom: SIZES.sm,
  },
  splitBarSeg: { height: "100%" },

  splitLegend: { flexDirection: "row", justifyContent: "center", gap: SIZES.md, flexWrap: "wrap" },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },

  catSection: { marginBottom: SIZES.sm },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    marginBottom: SIZES.xs,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  catIcon: {
    width: 38, height: 38, borderRadius: SIZES.radiusMd,
    alignItems: "center", justifyContent: "center",
  },
  catHeaderContent: { flex: 1 },
  catLabel:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase },
  catSubtitle: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  catHeaderRight: { alignItems: "flex-end", gap: 2 },
  catCount: { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  catValue: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  partRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  partRowLast: { borderBottomWidth: 0 },
  partLeft: { flex: 1, gap: 2 },
  partName:  { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  partCode:  { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  partMeta:  { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textSecondary },
  partUsed:  { fontFamily: FONTS.regular,  fontSize: SIZES.textXs,   color: COLORS.textMuted },
  partRight: { alignItems: "flex-end", gap: 3 },
  partQty:   { fontFamily: FONTS.medium,   fontSize: SIZES.textSm,   color: COLORS.textSecondary },
  partValue: { fontFamily: FONTS.bold,     fontSize: SIZES.textBase },

  emptySmall: { paddingVertical: SIZES.md, alignItems: "center" },
  emptySmallText: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
});
