import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, REPAIR_ORDER_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import axiosClient from "../../api/axios";

const MAX_RECENT = 5;

function ResultCard({ customer, vehicle, onCreateOrder, onViewInvoices }) {
  const initial = (customer?.fullName || "?").charAt(0).toUpperCase();
  return (
    <View style={s.resultCard}>
      <View style={s.resultHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={s.customerInfo}>
          <Text style={s.customerName} numberOfLines={1}>{customer?.fullName || "—"}</Text>
          <View style={s.metaRow}>
            <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.metaText}>{customer?.phoneNo || "—"}</Text>
          </View>
          {customer?.emailId ? (
            <View style={s.metaRow}>
              <Ionicons name="mail-outline" size={12} color={COLORS.textMuted} />
              <Text style={s.metaText} numberOfLines={1}>{customer.emailId}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.vehicleRow}>
        <View style={s.vehicleIconWrap}>
          <Ionicons name="car-sport-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={s.vehicleInfo}>
          <Text style={s.vehicleName} numberOfLines={1}>
            {[vehicle?.vehicleBrand, vehicle?.vehicleModel, vehicle?.vehicleVariant].filter(Boolean).join(" ") || "—"}
          </Text>
          <View style={s.regBadge}>
            <Text style={s.regBadgeText}>{vehicle?.vehicleRegisterNo || "—"}</Text>
          </View>
        </View>
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={onCreateOrder} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
          <Text style={s.actionBtnPrimaryText}>New Repair Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnOutline]} onPress={onViewInvoices} activeOpacity={0.8}>
          <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
          <Text style={s.actionBtnOutlineText}>Invoices</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecentChip({ regNo, onPress }) {
  return (
    <TouchableOpacity style={s.chip} onPress={() => onPress(regNo)} activeOpacity={0.75}>
      <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
      <Text style={s.chipText}>{regNo}</Text>
    </TouchableOpacity>
  );
}

export default function VehicleSearchScreen() {
  const navigation = useNavigation();
  const [regNo,          setRegNo]          = useState("");
  const [regNoError,     setRegNoError]      = useState("");
  const [loading,        setLoading]         = useState(false);
  const [searchError,    setSearchError]     = useState("");
  const [results,        setResults]         = useState([]);
  const [recentSearches, setRecentSearches]  = useState([]);

  const handleRegNoChange = (val) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setRegNo(upper);
    setRegNoError("");
    setSearchError("");
    if (results.length) setResults([]);
  };

  const handleSearch = useCallback(async (overrideReg) => {
    const query = (overrideReg ?? regNo).trim().toUpperCase();
    if (!query) { setRegNoError("Please enter a registration number."); return; }
    Keyboard.dismiss();
    setLoading(true);
    setSearchError("");
    setResults([]);
    try {
      const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.SEARCH_VEHICLE, { params: { regNo: query } });
      const { results: found } = res.data?.data ?? {};
      if (!found?.length) { setSearchError("No vehicle found for this registration number."); return; }
      setResults(found);
      setRecentSearches((prev) => [query, ...prev.filter((r) => r !== query)].slice(0, MAX_RECENT));
    } catch (e) {
      setSearchError(e.displayMessage ?? "Vehicle not found. Please check the reg number.");
    } finally {
      setLoading(false);
    }
  }, [regNo]);

  const handleCreateOrder = (item) => {
    navigation.navigate("CustomerRepairOrder", { customer: item.customer, vehicle: item.vehicle });
  };

  const handleViewInvoices = (item) => {
    navigation.navigate("InvoiceList", { customerId: item.customer?._id });
  };

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <TopNav title="Vehicle Search" showBack transparent={false} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.searchSection}>
          <AppInput
            label="Registration Number"
            icon="car-outline"
            placeholder="e.g. MH12AB1234"
            value={regNo}
            onChangeText={handleRegNoChange}
            autoCapitalize="characters"
            maxLength={13}
            error={regNoError}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          <AppButton
            title="Search"
            variant="gradient"
            size="md"
            onPress={() => handleSearch()}
            disabled={loading}
          />
        </View>

        {recentSearches.length > 0 && !results.length && !loading && (
          <View style={s.recentSection}>
            <Text style={s.recentLabel}>Recent searches</Text>
            <View style={s.chipRow}>
              {recentSearches.map((reg) => (
                <RecentChip
                  key={reg}
                  regNo={reg}
                  onPress={(r) => { setRegNo(r); handleSearch(r); }}
                />
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={s.spinnerWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.spinnerText}>Searching…</Text>
          </View>
        )}

        {!loading && searchError ? (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
            <Text style={s.errorTitle}>Not Found</Text>
            <Text style={s.errorDesc}>{searchError}</Text>
          </View>
        ) : null}

        {!loading && results.length > 0 ? (
          results.map((item, i) => (
            <ResultCard
              key={item.vehicle?._id ?? i}
              customer={item.customer}
              vehicle={item.vehicle}
              onCreateOrder={() => handleCreateOrder(item)}
              onViewInvoices={() => handleViewInvoices(item)}
            />
          ))
        ) : null}

        {!loading && !results.length && !searchError && recentSearches.length === 0 && (
          <View style={s.hintWrap}>
            <View style={s.hintIconCircle}>
              <Ionicons name="search-circle-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={s.hintTitle}>Search by Registration</Text>
            <Text style={s.hintDesc}>
              Enter a vehicle registration number to look up the owner and vehicle details instantly.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.md, paddingBottom: 120 },

  searchSection: { gap: SIZES.sm, marginBottom: SIZES.lg },

  recentSection: { marginBottom: SIZES.lg },
  recentLabel:   { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted, marginBottom: SIZES.sm },
  chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: SIZES.sm },
  chip:          { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs + 2, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  chipText:      { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },

  spinnerWrap: { alignItems: "center", marginTop: SIZES.xxl, gap: SIZES.md },
  spinnerText: { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted },

  errorCard:  { alignItems: "center", backgroundColor: COLORS.errorLight, borderRadius: SIZES.radiusLg, padding: SIZES.lg, gap: SIZES.sm, borderWidth: 1, borderColor: "#FECACA", marginTop: SIZES.sm },
  errorTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.error },
  errorDesc:  { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.error, textAlign: "center" },

  resultCard:     { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.borderLight, padding: SIZES.md, marginTop: SIZES.sm, ...SHADOWS.md },
  resultHeader:   { flexDirection: "row", alignItems: "center", gap: SIZES.md, marginBottom: SIZES.md },
  avatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText:     { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.primary },
  customerInfo:   { flex: 1, gap: 3 },
  customerName:   { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  metaRow:        { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:       { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, flex: 1 },
  divider:        { height: 1, backgroundColor: COLORS.borderLight, marginBottom: SIZES.md },
  vehicleRow:     { flexDirection: "row", alignItems: "center", gap: SIZES.md, marginBottom: SIZES.lg },
  vehicleIconWrap: { width: 44, height: 44, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  vehicleInfo:    { flex: 1, gap: 6 },
  vehicleName:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  regBadge:       { alignSelf: "flex-start", backgroundColor: COLORS.bgSection, borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm + 2, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.borderLight },
  regBadgeText:   { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textSecondary, letterSpacing: 0.8 },

  cardActions:          { flexDirection: "row", gap: SIZES.sm },
  actionBtn:            { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: SIZES.radiusMd },
  actionBtnPrimary:     { backgroundColor: COLORS.primary },
  actionBtnPrimaryText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.white },
  actionBtnOutline:     { borderWidth: 1.5, borderColor: COLORS.primary },
  actionBtnOutlineText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary },

  hintWrap:       { alignItems: "center", paddingTop: SIZES.xxl, gap: SIZES.md, paddingHorizontal: SIZES.lg },
  hintIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: SIZES.sm },
  hintTitle:      { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textPrimary, textAlign: "center" },
  hintDesc:       { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
});
