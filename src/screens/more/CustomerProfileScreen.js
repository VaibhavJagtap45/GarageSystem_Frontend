import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, VEHICLE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppSelect from "../../components/ui/AppSelect";
import AppButton from "../../components/ui/AppButton";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import axiosClient from "../../api/axios";
import {
  addVehicle,
  getVehiclesByCustomer,
  updateVehicle,
} from "../../api/user";

// ─── Info row inside profile card ──────────────────────────────────────────────
function InfoRow({ icon, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.infoText}>{value}</Text>
    </View>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, index, onEdit }) {
  return (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleIconWrap}>
        <MaterialCommunityIcons
          name="car-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>
          {vehicle.vehicleBrand} {vehicle.vehicleModel}
        </Text>
        {vehicle.vehicleRegisterNo ? (
          <View style={styles.vehicleMeta}>
            <Ionicons
              name="id-card-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.vehicleMetaText}>
              {vehicle.vehicleRegisterNo}
            </Text>
          </View>
        ) : null}
        {vehicle.vehiclePurchaseDate ? (
          <View style={styles.vehicleMeta}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.vehicleMetaText}>
              {new Date(vehicle.vehiclePurchaseDate).toLocaleDateString(
                "en-IN",
              )}
            </Text>
          </View>
        ) : null}
        {vehicle.vehicleKmDriven != null ? (
          <View style={styles.vehicleMeta}>
            <Ionicons
              name="speedometer-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.vehicleMetaText}>
              {new Intl.NumberFormat("en-IN").format(vehicle.vehicleKmDriven)} km
            </Text>
          </View>
        ) : null}
        {vehicle.vehicleInsuranceProvider ? (
          <View style={styles.vehicleMeta}>
            <Ionicons
              name="shield-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.vehicleMetaText}>
              {vehicle.vehicleInsuranceProvider}
              {vehicle.vehiclePolicyNo ? ` · ${vehicle.vehiclePolicyNo}` : ""}
            </Text>
          </View>
        ) : null}
        {vehicle.vehicleInsuranceExpire ? (
          <View style={styles.vehicleMeta}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.vehicleMetaText}>
              Expires:{" "}
              {new Date(vehicle.vehicleInsuranceExpire).toLocaleDateString(
                "en-IN",
              )}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.vehicleCardRight}>
        <View style={styles.vehicleIndexWrap}>
          <Text style={styles.vehicleIndex}>{index}</Text>
        </View>
        <TouchableOpacity
          style={styles.editVehicleBtn}
          onPress={() => onEdit(vehicle)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel={`Edit vehicle ${vehicle.vehicleBrand} ${vehicle.vehicleModel}`}
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};

const ddmmyyyyToISO = (value) => {
  if (!value || !value.trim()) return undefined;

  const parts = value.trim().split("/");
  if (parts.length !== 3) return undefined;

  const [dd, mm, yyyy] = parts.map((p) => Number(p));
  if (!dd || !mm || !yyyy) return undefined;

  const date = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
};
// ─── Vehicle Form Modal (shared by Add & Edit) ────────────────────────────────
function VehicleFormModal({ visible, onClose, onSave, saving, initialData }) {
  const isEdit = !!initialData;

  const [vehicleBrand, setVehicleBrand] = useState(null);
  const [vehicleModel, setVehicleModel] = useState(null);
  const [vehicleRegisterNo, setVehicleRegisterNo] = useState("");
  const [vehiclePurchaseDate, setVehiclePurchaseDate] = useState("");
  const [vehicleKmDriven, setVehicleKmDriven] = useState("");
  const [vehicleEngineNo, setVehicleEngineNo] = useState("");
  const [vehicleVinNo, setVehicleVinNo] = useState("");
  const [vehicleInsuranceProvider, setVehicleInsuranceProvider] = useState("");
  const [vehiclePolicyNo, setVehiclePolicyNo] = useState("");
  const [vehicleInsuranceExpire, setVehicleInsuranceExpire] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Brand / Model dropdown state ─────────────────────────────────
  const [brandOptions,  setBrandOptions]  = useState([]);
  const [modelOptions,  setModelOptions]  = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load brands once when modal opens
  useEffect(() => {
    if (!visible) return;
    setBrandsLoading(true);
    axiosClient
      .get(VEHICLE_ENDPOINTS.BRANDS)
      .then((r) =>
        setBrandOptions(
          (r.data?.data?.brands ?? []).map((b) => ({ value: b, label: b })),
        ),
      )
      .catch(() => setBrandOptions([]))
      .finally(() => setBrandsLoading(false));
  }, [visible]);

  // Load models whenever brand changes
  useEffect(() => {
    if (!vehicleBrand) { setModelOptions([]); return; }
    setModelsLoading(true);
    axiosClient
      .get(VEHICLE_ENDPOINTS.MODELS, { params: { brand: vehicleBrand } })
      .then((r) =>
        setModelOptions(
          (r.data?.data?.models ?? []).map((m) => ({ value: m, label: m })),
        ),
      )
      .catch(() => setModelOptions([]))
      .finally(() => setModelsLoading(false));
  }, [vehicleBrand]);

  // Populate fields when editing
  useEffect(() => {
    if (visible && initialData) {
      setVehicleBrand(initialData.vehicleBrand || null);
      setVehicleModel(initialData.vehicleModel || null);
      setVehicleRegisterNo(initialData.vehicleRegisterNo || "");
      setVehiclePurchaseDate(formatDateForInput(initialData.vehiclePurchaseDate));
      setVehicleKmDriven(
        initialData.vehicleKmDriven != null
          ? String(initialData.vehicleKmDriven)
          : "",
      );
      setVehicleEngineNo(initialData.vehicleEngineNo || "");
      setVehicleVinNo(initialData.vehicleVinNo || "");
      setVehicleInsuranceProvider(initialData.vehicleInsuranceProvider || "");
      setVehiclePolicyNo(initialData.vehiclePolicyNo || "");
      setVehicleInsuranceExpire(formatDateForInput(initialData.vehicleInsuranceExpire));
      const hasAdvanced =
        initialData.vehicleEngineNo ||
        initialData.vehicleVinNo ||
        initialData.vehicleInsuranceProvider ||
        initialData.vehiclePolicyNo ||
        initialData.vehicleInsuranceExpire;
      setShowMore(!!hasAdvanced);
    } else if (visible && !initialData) {
      resetForm();
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setVehicleBrand(null);
    setVehicleModel(null);
    setModelOptions([]);
    setVehicleRegisterNo("");
    setVehiclePurchaseDate("");
    setVehicleKmDriven("");
    setVehicleEngineNo("");
    setVehicleVinNo("");
    setVehicleInsuranceProvider("");
    setVehiclePolicyNo("");
    setVehicleInsuranceExpire("");
    setShowMore(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const e = {};
    if (!vehicleBrand)            e.vehicleBrand = "Brand is required";
    if (!vehicleModel)            e.vehicleModel = "Model is required";
    if (!vehicleRegisterNo.trim()) e.vehicleRegisterNo = "Registration number is required";
    if (vehiclePurchaseDate.trim() && !ddmmyyyyToISO(vehiclePurchaseDate))
      e.vehiclePurchaseDate = "Use DD/MM/YYYY format";
    if (vehicleInsuranceExpire.trim() && !ddmmyyyyToISO(vehicleInsuranceExpire))
      e.vehicleInsuranceExpire = "Use DD/MM/YYYY format";
    if (vehicleKmDriven !== "" && vehicleKmDriven != null) {
      const km = Number(vehicleKmDriven);
      if (!Number.isFinite(km) || km < 0 || !Number.isInteger(km))
        e.vehicleKmDriven = "Enter a valid non-negative number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // const handleSave = () => {
  //   if (!validate()) return;
  //   onSave(
  //     {
  //       vehicleBrand: vehicleBrand.trim(),
  //       vehicleModel: vehicleModel.trim(),
  //       vehicleRegisterNo: vehicleRegisterNo.trim(),
  //       vehiclePurchaseDate: vehiclePurchaseDate.trim() || undefined,
  //       vehicleEngineNo: vehicleEngineNo.trim() || undefined,
  //       vehicleVinNo: vehicleVinNo.trim() || undefined,
  //       vehicleInsuranceProvider: vehicleInsuranceProvider.trim() || undefined,
  //       vehiclePolicyNo: vehiclePolicyNo.trim() || undefined,
  //       vehicleInsuranceExpire: vehicleInsuranceExpire.trim() || undefined,
  //     },
  //     resetForm,
  //   );
  // };

  const handleSave = () => {
    if (!validate()) return;

    const purchaseDateISO = ddmmyyyyToISO(vehiclePurchaseDate);
    const insuranceExpireISO = ddmmyyyyToISO(vehicleInsuranceExpire);

    onSave(
      {
        vehicleBrand,
        vehicleModel,
        vehicleRegisterNo: vehicleRegisterNo.trim().toUpperCase(),
        vehiclePurchaseDate: purchaseDateISO,
        vehicleKmDriven:
          vehicleKmDriven !== "" && vehicleKmDriven != null
            ? Number(vehicleKmDriven)
            : undefined,
        vehicleEngineNo: vehicleEngineNo.trim() || undefined,
        vehicleVinNo: vehicleVinNo.trim() || undefined,
        vehicleInsuranceProvider: vehicleInsuranceProvider.trim() || undefined,
        vehiclePolicyNo: vehiclePolicyNo.trim() || undefined,
        vehicleInsuranceExpire: insuranceExpireISO,
      },
      resetForm,
    );
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalKAV}
        >
          <View style={styles.modalSheet}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconWrap}>
                  <MaterialCommunityIcons
                    name={isEdit ? "car-wrench" : "car-outline"}
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {isEdit ? "Edit Vehicle" : "Add Vehicle"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={saving}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldGroupLabel}>BASIC DETAILS</Text>

              <AppSelect
                label="Brand *"
                icon="car-outline"
                placeholder={brandsLoading ? "Loading…" : "Select brand"}
                options={brandOptions}
                value={vehicleBrand}
                onChange={(val) => {
                  setVehicleBrand(val);
                  setVehicleModel(null);
                  setModelOptions([]);
                  setErrors((e) => ({ ...e, vehicleBrand: null, vehicleModel: null }));
                }}
                error={errors.vehicleBrand}
              />
              <AppSelect
                label="Model *"
                icon="git-branch-outline"
                placeholder={
                  !vehicleBrand
                    ? "Select brand first"
                    : modelsLoading
                      ? "Loading…"
                      : "Select model"
                }
                options={modelOptions}
                value={vehicleModel}
                onChange={(val) => {
                  setVehicleModel(val);
                  setErrors((e) => ({ ...e, vehicleModel: null }));
                }}
                disabled={!vehicleBrand}
                error={errors.vehicleModel}
              />
              <AppInput
                label="Registration Number *"
                icon="id-card-outline"
                value={vehicleRegisterNo}
                onChangeText={(t) => {
                  setVehicleRegisterNo(t);
                  setErrors((e) => ({ ...e, vehicleRegisterNo: null }));
                }}
                placeholder="MH12AB1234"
                autoCapitalize="characters"
                error={errors.vehicleRegisterNo}
              />
              {/* <AppInput
                label="Purchase Date"
                icon="calendar-outline"
                value={vehiclePurchaseDate}
                onChangeText={setVehiclePurchaseDate}
                placeholder="DD/MM/YYYY"
              /> */}
              <AppInput
                label="Purchase Date"
                icon="calendar-outline"
                value={vehiclePurchaseDate}
                onChangeText={(t) => {
                  setVehiclePurchaseDate(t);
                  setErrors((e) => ({ ...e, vehiclePurchaseDate: null }));
                }}
                placeholder="DD/MM/YYYY"
                error={errors.vehiclePurchaseDate}
              />
              <AppInput
                label="Km Driven"
                icon="speedometer-outline"
                value={vehicleKmDriven}
                onChangeText={(t) => {
                  setVehicleKmDriven(t.replace(/[^0-9]/g, ""));
                  setErrors((e) => ({ ...e, vehicleKmDriven: null }));
                }}
                placeholder="e.g. 12500"
                keyboardType="numeric"
                maxLength={7}
                error={errors.vehicleKmDriven}
              />
              {/* Toggle advanced fields */}
              <TouchableOpacity
                style={styles.moreToggle}
                onPress={() => setShowMore((p) => !p)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.moreToggleText}>
                  {showMore ? "Hide advanced fields" : "Show advanced fields"}
                </Text>
                <Ionicons
                  name={showMore ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {showMore && (
                <>
                  <Text
                    style={[styles.fieldGroupLabel, { marginTop: SIZES.sm }]}
                  >
                    ADVANCED DETAILS
                  </Text>
                  <AppInput
                    label="Engine Number"
                    icon="settings-outline"
                    value={vehicleEngineNo}
                    onChangeText={setVehicleEngineNo}
                    placeholder="Optional"
                    autoCapitalize="characters"
                  />
                  <AppInput
                    label="VIN / Chassis Number"
                    icon="barcode-outline"
                    value={vehicleVinNo}
                    onChangeText={setVehicleVinNo}
                    placeholder="Optional"
                    autoCapitalize="characters"
                  />
                  <Text
                    style={[styles.fieldGroupLabel, { marginTop: SIZES.xs }]}
                  >
                    INSURANCE
                  </Text>
                  <AppInput
                    label="Insurance Provider"
                    icon="shield-outline"
                    value={vehicleInsuranceProvider}
                    onChangeText={setVehicleInsuranceProvider}
                    placeholder="Optional"
                  />
                  <AppInput
                    label="Policy Number"
                    icon="document-outline"
                    value={vehiclePolicyNo}
                    onChangeText={setVehiclePolicyNo}
                    placeholder="Optional"
                  />
                  {/* <AppInput
                    label="Insurance Expiry"
                    icon="time-outline"
                    value={vehicleInsuranceExpire}
                    onChangeText={setVehicleInsuranceExpire}
                    placeholder="DD/MM/YYYY"
                  /> */}
                  <AppInput
                    label="Insurance Expiry"
                    icon="time-outline"
                    value={vehicleInsuranceExpire}
                    onChangeText={(t) => {
                      setVehicleInsuranceExpire(t);
                      setErrors((e) => ({
                        ...e,
                        vehicleInsuranceExpire: null,
                      }));
                    }}
                    placeholder="DD/MM/YYYY"
                    error={errors.vehicleInsuranceExpire}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title={
                  saving
                    ? isEdit
                      ? "Saving…"
                      : "Adding…"
                    : isEdit
                      ? "Save Changes"
                      : "Save Vehicle"
                }
                variant="gradient"
                size="lg"
                onPress={handleSave}
                disabled={saving}
                accessibilityLabel={
                  isEdit ? "Save vehicle changes" : "Save vehicle"
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CustomerProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const customer = route.params?.customer ?? {};

  const customerId = customer._id;
  const displayName = customer.fullName || customer.name || "Unknown Customer";
  const displayPhone = customer.phoneNo || customer.mobile || "—";

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Modal state — null = closed, "add" = add mode, vehicle object = edit mode
  const [modalData, setModalData] = useState(null);

  // ── Fetch vehicles ─────────────────────────────────────────────────────────
  const fetchVehicles = useCallback(
    async (isRefresh = false) => {
      if (!customerId) return;
      isRefresh ? setRefreshing(true) : setLoadingVehicles(true);
      try {
        const res = await getVehiclesByCustomer(customerId);
        setVehicles(res?.data?.vehicles ?? []);
      } catch (err) {
        Alert.alert(
          "Error",
          err?.response?.data?.message || "Failed to load vehicles.",
        );
      } finally {
        isRefresh ? setRefreshing(false) : setLoadingVehicles(false);
      }
    },
    [customerId],
  );

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ── Add vehicle ────────────────────────────────────────────────────────────
  const handleAddVehicle = async (vehicleData, resetForm) => {
    if (!customerId) {
      Alert.alert("Error", "Customer ID is missing.");
      return;
    }
    setSavingVehicle(true);
    try {
      await addVehicle({ customerId, ...vehicleData });
      setModalData(null);
      resetForm?.();
      fetchVehicles();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to add vehicle.",
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  // ── Edit vehicle ───────────────────────────────────────────────────────────
  const handleEditVehicle = async (vehicleData, resetForm) => {
    if (!modalData?._id) return;
    setSavingVehicle(true);
    try {
      await updateVehicle(modalData._id, vehicleData);
      setModalData(null);
      resetForm?.();
      fetchVehicles();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to update vehicle.",
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  const isEditMode = modalData && modalData !== "add";
  const modalVisible = modalData !== null;

  const rightElement = (
    <TouchableOpacity
      style={styles.addVehicleBtn}
      onPress={() => setModalData("add")}
      activeOpacity={0.8}
      accessibilityLabel="Add vehicle"
      accessibilityRole="button"
    >
      <Ionicons name="add" size={16} color={COLORS.primary} />
      <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="Customer Profile"
        transparent={false}
        showBack
        rightElement={rightElement}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchVehicles(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={displayName} size="lg" />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              <InfoRow icon="call-outline" value={displayPhone} />
              <InfoRow icon="mail-outline" value={customer.email} />
            </View>
          </View>
          {customer.address || customer.city ? (
            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.addressText} numberOfLines={2}>
                {[customer.address, customer.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}
          {customer.gstNo ? (
            <View style={styles.addressRow}>
              <Ionicons
                name="receipt-outline"
                size={14}
                color={COLORS.textMuted}
              />
              <Text style={styles.addressText}>GST: {customer.gstNo}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Vehicles Section ── */}
        <View style={styles.vehiclesSection}>
          <View style={styles.vehiclesSectionHeader}>
            <View style={styles.vehiclesSectionLeft}>
              <MaterialCommunityIcons
                name="car-multiple"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.vehiclesSectionTitle}>Vehicles</Text>
              {vehicles.length > 0 && (
                <View style={styles.vehicleCountBadge}>
                  <Text style={styles.vehicleCountText}>{vehicles.length}</Text>
                </View>
              )}
            </View>
          </View>

          {loadingVehicles ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading vehicles…</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <EmptyState
              emoji="🚗"
              title="No vehicles added"
              description="Tap 'Add Vehicle' to register a vehicle for this customer."
            />
          ) : (
            <View style={styles.vehicleList}>
              {vehicles.map((v, idx) => (
                <VehicleCard
                  key={v._id}
                  vehicle={v}
                  index={idx + 1}
                  onEdit={(vehicle) => setModalData(vehicle)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Vehicle Form Modal (Add / Edit) ── */}
      <VehicleFormModal
        visible={modalVisible}
        onClose={() => setModalData(null)}
        onSave={isEditMode ? handleEditVehicle : handleAddVehicle}
        saving={savingVehicle}
        initialData={isEditMode ? modalData : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    padding: SIZES.screenPadding,
    paddingBottom: 120,
    gap: SIZES.md,
  },

  // ── Profile card
  profileCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  profileTop: { flexDirection: "row", alignItems: "center", gap: SIZES.md },
  profileMeta: { flex: 1, gap: 4 },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    paddingTop: SIZES.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  addressText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // ── Vehicles section
  vehiclesSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  vehiclesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.neutral50 || COLORS.bg,
  },
  vehiclesSectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  vehiclesSectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  vehicleCountBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  vehicleCountText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  addVehicleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 5,
  },
  addVehicleBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  vehicleList: { padding: SIZES.md, gap: SIZES.sm },
  loaderWrap: {
    alignItems: "center",
    paddingVertical: SIZES.xl,
    gap: SIZES.sm,
  },
  loaderText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },

  // ── Vehicle card
  vehicleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.md,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
  },
  vehicleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: { flex: 1, gap: 3 },
  vehicleName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  vehicleMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  vehicleMetaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  vehicleCardRight: {
    alignItems: "center",
    gap: SIZES.xs,
  },
  vehicleIndexWrap: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgInput,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  vehicleIndex: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  editVehicleBtn: {
    width: 28,
    height: 28,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalKAV: { width: "100%" },
  modalSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingTop: SIZES.sm,
    paddingBottom: Platform.OS === "ios" ? 34 : SIZES.md,
    maxHeight: "100%",
    ...SHADOWS.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center",
    marginBottom: SIZES.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  fieldGroupLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SIZES.sm,
    textTransform: "uppercase",
  },
  moreToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
  },
  moreToggleText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  modalFooter: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
