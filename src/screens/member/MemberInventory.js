import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { memberGetInventory } from "../../api/portal";
import { inr } from "../../utils/portalHelpers";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";

export default function MemberInventory() {
  const [items, setItems]     = useState([]);
  const [cats, setCats]       = useState([]);
  const [selCat, setSelCat]   = useState(null);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selCat) params.category = selCat;
      if (search.trim()) params.search = search.trim();
      const r = await memberGetInventory(params);
      setItems(r.data?.data?.items || []);
      if (!selCat) setCats(r.data?.data?.categories || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selCat, search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  // Re-run when search or category changes while screen is already focused
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavBar title="Inventory" />

      {/* Search */}
      <View style={s.srow}>
        <View style={s.sbox}>
          <Ionicons name="search-outline" size={15} color={COLORS.textMuted} />
          <TextInput
            style={s.sinput}
            placeholder="Search parts…"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
          />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44 }}
        contentContainerStyle={{ paddingHorizontal: SIZES.screenPadding, gap: 8, alignItems: "center" }}
      >
        {[null, ...cats].map((c) => (
          <TouchableOpacity
            key={String(c)}
            style={[s.chip, selCat === c && s.chipOn]}
            onPress={() => setSelCat(c)}
          >
            <Text style={[s.chipTxt, selCat === c && s.chipTxtOn]}>{c || "All"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <Empty icon="cube-outline" title="No parts found" sub="Try a different search" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: SIZES.screenPadding }}
          renderItem={({ item }) => {
            const inStock = item.quantityInHand > 0;
            return (
              <View style={s.card}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.partName}</Text>
                  {item.partCode ? <Text style={s.code}>{item.partCode}</Text> : null}
                  <Text style={s.cat}>{item.category}</Text>
                  {item.manufacturer ? <Text style={s.mfr}>{item.manufacturer}</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={s.price}>{inr(item.sellingPrice)}</Text>
                  <View style={[s.stockBadge, { backgroundColor: inStock ? "#22c55e22" : "#ef444422" }]}>
                    <Text style={[s.stockTxt, { color: inStock ? "#22c55e" : "#ef4444" }]}>
                      {item.quantityInHand} {item.unit}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  srow:       { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm },
  sbox:       { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.borderLight, gap: 8 },
  sinput:     { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  chip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgCard },
  chipOn:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt:    { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  chipTxtOn:  { color: COLORS.white },
  card:       { flexDirection: "row", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  name:       { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  code:       { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 1 },
  cat:        { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.primary, marginTop: 2 },
  mfr:        { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  price:      { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary },
  stockBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  stockTxt:   { fontFamily: FONTS.semibold, fontSize: 10 },
});
