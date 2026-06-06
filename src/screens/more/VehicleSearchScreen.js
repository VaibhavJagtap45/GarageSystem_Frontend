import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPAIR_ORDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

function ResultCard({ customer, vehicle, onCreateOrder, onViewInvoices }) {
  const initial = (customer?.fullName || "?").charAt(0).toUpperCase();
  const vehicleLabel = [vehicle?.vehicleBrand, vehicle?.vehicleModel, vehicle?.vehicleVariant]
    .filter(Boolean)
    .join(" ");

  return (
    <View style={s.resultCard}>
      <View style={s.resultHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={s.customerInfo}>
          <Text style={s.customerName} numberOfLines={1}>
            {customer?.fullName || "\u2014"}
          </Text>
          <View style={s.metaRow}>
            <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.metaText}>{customer?.phoneNo || "\u2014"}</Text>
          </View>
        </View>
      </View>

      {vehicle && (
        <View style={s.vehicleRow}>
          <View style={s.vehicleIconWrap}>
            <Ionicons name="car-sport-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={s.vehicleInfo}>
            <Text style={s.vehicleName} numberOfLines={1}>
              {vehicleLabel || "\u2014"}
            </Text>
            {vehicle.vehicleRegisterNo ? (
              <View style={s.regBadge}>
                <Text style={s.regBadgeText}>{vehicle.vehicleRegisterNo}</Text>
              </View>
            ) : null}
            {vehicle.vehicleKmDriven != null ? (
              <View style={s.kmRow}>
                <Ionicons
                  name="speedometer-outline"
                  size={11}
                  color={COLORS.textMuted}
                />
                <Text style={s.kmText}>
                  {new Intl.NumberFormat("en-IN").format(vehicle.vehicleKmDriven)} km
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      <View style={s.cardActions}>
        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnPrimary]}
          onPress={onCreateOrder}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
          <Text style={s.actionBtnPrimaryText}>New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnOutline]}
          onPress={onViewInvoices}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
          <Text style={s.actionBtnOutlineText}>Invoices</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function VehicleSearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const isSearchActive = query.trim().length > 0;
  const displayResults = isSearchActive ? searchResults : allResults;

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.SEARCH_VEHICLE);
      setAllResults(res.data?.data?.results ?? []);
    } catch (e) {
      setError(e.displayMessage ?? "Failed to load vehicles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const handleSearch = useCallback(async (text) => {
    const q = text.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.SEARCH_VEHICLE, {
        params: { q },
      });
      setSearchResults(res.data?.data?.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (val) => {
    setQuery(val);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    debounceRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setError("");
    Keyboard.dismiss();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  const handleCreateOrder = (item) => {
    navigation.navigate("CustomerRepairOrder", {
      customer: item.customer,
      vehicle: item.vehicle,
    });
  };

  const handleViewInvoices = (item) => {
    navigation.navigate("InvoiceList", { customerId: item.customer?._id });
  };

  const renderItem = ({ item }) => (
    <ResultCard
      customer={item.customer}
      vehicle={item.vehicle}
      onCreateOrder={() => handleCreateOrder(item)}
      onViewInvoices={() => handleViewInvoices(item)}
    />
  );

  const ListHeader = () => (
    <>
      {!loading && !error && displayResults.length > 0 && (
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {isSearchActive ? "Search Results" : "All Customers & Vehicles"}
          </Text>
          <View style={s.countBadge}>
            <Text style={s.countText}>{displayResults.length}</Text>
          </View>
        </View>
      )}
    </>
  );

  const ListEmpty = () => {
    if (loading) {
      return (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.centerText}>Loading vehicles...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={s.errorCard}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorDesc}>{error}</Text>
        </View>
      );
    }

    if (isSearchActive && searching) {
      return (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.centerText}>Searching...</Text>
        </View>
      );
    }

    if (isSearchActive) {
      return (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconCircle}>
            <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
          </View>
          <Text style={s.emptyTitle}>No results found</Text>
          <Text style={s.emptyDesc}>
            Try a different name, phone number, or registration number.
          </Text>
        </View>
      );
    }

    return (
      <View style={s.emptyWrap}>
        <View style={s.emptyIconCircle}>
          <Ionicons name="car-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={s.emptyTitle}>No vehicles yet</Text>
        <Text style={s.emptyDesc}>
          Vehicles will appear here once customers create repair orders.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Vehicle Search" showBack transparent={false} />

      <View style={s.searchBar}>
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search name, phone, or reg number..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {isSearchActive && searching && (
          <View style={s.searchingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </View>

      <FlatList
        data={displayResults}
        keyExtractor={(item, i) => (item.vehicle?._id || item.customer?._id || String(i))}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  searchBar: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.xs,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    minHeight: SIZES.inputHeight || 48,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  searchingIndicator: {
    position: "absolute",
    right: SIZES.screenPadding + SIZES.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: SIZES.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 26,
    alignItems: "center",
  },
  countText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },

  list: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: 120,
    gap: SIZES.sm,
    flexGrow: 1,
  },

  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: SIZES.md,
  },
  centerText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
  },

  errorCard: {
    alignItems: "center",
    backgroundColor: COLORS.errorLight,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: SIZES.md,
  },
  errorTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.error,
  },
  errorDesc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.error,
    textAlign: "center",
  },

  resultCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.primary,
  },
  customerInfo: { flex: 1, gap: 2 },
  customerName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    flex: 1,
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  vehicleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: { flex: 1, gap: 4 },
  vehicleName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  regBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  regBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  kmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  kmText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  cardActions: {
    flexDirection: "row",
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionBtnPrimaryText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
  },
  actionBtnOutline: { borderWidth: 1.5, borderColor: COLORS.primary },
  actionBtnOutlineText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: SIZES.sm,
    paddingHorizontal: SIZES.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.xs,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
