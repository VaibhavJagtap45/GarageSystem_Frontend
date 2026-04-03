import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import { addUser } from "../../api/user";
import axiosClient from "../../api/axios";
import { VEHICLE_ENDPOINTS } from "../../utils/constants";

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, subtitle, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Row field helper ─────────────────────────────────────────────────────────
function RowFields({ children }) {
  return <View style={styles.rowFields}>{children}</View>;
}
function RowField({ children }) {
  return <View style={styles.rowField}>{children}</View>;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = ["Customer", "Vehicle", "Review"];
  return (
    <View style={styles.stepWrap}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  done && styles.stepDotDone,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      (active || done) && styles.stepNumActive,
                    ]}
                  >
                    {idx}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive]}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Step 1: Customer Details ─────────────────────────────────────────────────
function CustomerStep({ form, setField, errors }) {
  return (
    <SectionCard
      title="Customer Details"
      icon="person-outline"
      subtitle="Required to create the customer account"
    >
      <RowFields>
        <RowField>
          <AppInput
            label="First Name *"
            icon="person-outline"
            placeholder="First name"
            value={form.firstName}
            onChangeText={setField("firstName")}
            autoCapitalize="words"
            error={errors.firstName}
          />
        </RowField>
        <RowField>
          <AppInput
            label="Last Name"
            icon="person-outline"
            placeholder="Last name"
            value={form.lastName}
            onChangeText={setField("lastName")}
            autoCapitalize="words"
          />
        </RowField>
      </RowFields>

      <AppInput
        label="Phone Number *"
        icon="call-outline"
        placeholder="10-digit mobile number"
        value={form.phone}
        onChangeText={setField("phone")}
        keyboardType="phone-pad"
        maxLength={10}
        error={errors.phone}
      />
      <AppInput
        label="Email Address"
        icon="mail-outline"
        placeholder="Optional"
        value={form.email}
        onChangeText={setField("email")}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AppInput
        label="Address"
        icon="location-outline"
        placeholder="Optional"
        value={form.address}
        onChangeText={setField("address")}
        multiline
        numberOfLines={2}
      />
    </SectionCard>
  );
}

// ─── Step 2: Vehicle Details ──────────────────────────────────────────────────
function VehicleStep({
  form,
  setField,
  errors,
  brandOptions,
  modelOptions,
  brandsLoading,
  modelsLoading,
}) {
  return (
    <>
      <SectionCard
        title="Vehicle Details"
        icon="car-outline"
        subtitle="Basic vehicle information"
      >
        <RowFields>
          <RowField>
            <AppSelect
              label="Brand *"
              icon="car-outline"
              placeholder={brandsLoading ? "Loading…" : "Select brand"}
              options={brandOptions}
              value={form.vehicleBrand}
              onChange={setField("vehicleBrand")}
              error={errors.vehicleBrand}
            />
          </RowField>
          <RowField>
            <AppSelect
              label="Model *"
              icon="git-branch-outline"
              placeholder={
                !form.vehicleBrand
                  ? "Select brand first"
                  : modelsLoading
                    ? "Loading…"
                    : "Select model"
              }
              options={modelOptions}
              value={form.vehicleModel}
              onChange={setField("vehicleModel")}
              disabled={!form.vehicleBrand}
              error={errors.vehicleModel}
            />
          </RowField>
        </RowFields>

        <AppInput
          label="Registration Number *"
          icon="id-card-outline"
          placeholder="MH12AB1234"
          value={form.vehicleRegisterNo}
          onChangeText={setField("vehicleRegisterNo")}
          autoCapitalize="characters"
          error={errors.vehicleRegisterNo}
        />

        <AppInput
          label="Variant / Trim"
          icon="layers-outline"
          placeholder="e.g. Diesel, AMT, V3 (optional)"
          value={form.vehicleVariant}
          onChangeText={setField("vehicleVariant")}
        />
      </SectionCard>

      <SectionCard
        title="Additional Info"
        icon="document-text-outline"
        subtitle="Engine, VIN and insurance details (optional)"
      >
        <RowFields>
          <RowField>
            <AppInput
              label="Engine No."
              icon="settings-outline"
              placeholder="Optional"
              value={form.vehicleEngineNo}
              onChangeText={setField("vehicleEngineNo")}
              autoCapitalize="characters"
            />
          </RowField>
          <RowField>
            <AppInput
              label="VIN / Chassis No."
              icon="barcode-outline"
              placeholder="Optional"
              value={form.vehicleVinNo}
              onChangeText={setField("vehicleVinNo")}
              autoCapitalize="characters"
            />
          </RowField>
        </RowFields>

        <AppInput
          label="Insurance Provider"
          icon="shield-outline"
          placeholder="Optional"
          value={form.vehicleInsuranceProvider}
          onChangeText={setField("vehicleInsuranceProvider")}
          autoCapitalize="words"
        />
        <RowFields>
          <RowField>
            <AppInput
              label="Policy Number"
              icon="document-outline"
              placeholder="Optional"
              value={form.vehiclePolicyNo}
              onChangeText={setField("vehiclePolicyNo")}
              autoCapitalize="characters"
            />
          </RowField>
          <RowField>
            <AppInput
              label="Insurance Expiry"
              icon="calendar-outline"
              placeholder="DD/MM/YYYY"
              value={form.vehicleInsuranceExpiry}
              onChangeText={setField("vehicleInsuranceExpiry")}
              keyboardType="numeric"
            />
          </RowField>
        </RowFields>
      </SectionCard>
    </>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function ReviewStep({ form }) {
  const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");
  return (
    <SectionCard title="Review & Confirm" icon="checkmark-circle-outline">
      {/* Customer summary */}
      <View style={styles.reviewGroup}>
        <Text style={styles.reviewGroupLabel}>CUSTOMER</Text>
        <ReviewRow icon="person-outline" label="Name" value={fullName || "—"} />
        <ReviewRow
          icon="call-outline"
          label="Phone"
          value={form.phone || "—"}
        />
        {form.email && (
          <ReviewRow icon="mail-outline" label="Email" value={form.email} />
        )}
        {form.address && (
          <ReviewRow
            icon="location-outline"
            label="Address"
            value={form.address}
          />
        )}
      </View>

      <View style={styles.reviewDivider} />

      {/* Vehicle summary */}
      <View style={styles.reviewGroup}>
        <Text style={styles.reviewGroupLabel}>VEHICLE</Text>
        <ReviewRow
          icon="car-outline"
          label="Brand / Model"
          value={`${form.vehicleBrand} ${form.vehicleModel}`}
        />
        {form.vehicleRegisterNo && (
          <ReviewRow
            icon="id-card-outline"
            label="Reg. No."
            value={form.vehicleRegisterNo}
          />
        )}
        {form.vehicleVariant && (
          <ReviewRow
            icon="layers-outline"
            label="Variant"
            value={form.vehicleVariant}
          />
        )}
        {form.vehicleEngineNo && (
          <ReviewRow
            icon="settings-outline"
            label="Engine No."
            value={form.vehicleEngineNo}
          />
        )}
      </View>
    </SectionCard>
  );
}

function ReviewRow({ icon, label, value }) {
  return (
    <View style={styles.reviewRow}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FORM_INIT = {
  // Customer
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  // Vehicle
  vehicleBrand: null,
  vehicleModel: null,
  vehicleRegisterNo: "",
  vehicleVariant: "",
  vehicleEngineNo: "",
  vehicleVinNo: "",
  vehicleInsuranceProvider: "",
  vehiclePolicyNo: "",
  vehicleInsuranceExpiry: "",
};

export default function CreateCustomerVehicleScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // onSuccess callback passed from CustomerRepairOrderScreen
  const onSuccess = route.params?.onSuccess;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Vehicle meta
  const [brandOptions, setBrandOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  // ── Load brands on mount ──────────────────────────────────────────
  useEffect(() => {
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
  }, []);

  // ── Load models when brand changes ───────────────────────────────
  useEffect(() => {
    if (!form.vehicleBrand) {
      setModelOptions([]);
      return;
    }
    setModelsLoading(true);
    axiosClient
      .get(VEHICLE_ENDPOINTS.MODELS, { params: { brand: form.vehicleBrand } })
      .then((r) =>
        setModelOptions(
          (r.data?.data?.models ?? []).map((m) => ({ value: m, label: m })),
        ),
      )
      .catch(() => setModelOptions([]))
      .finally(() => setModelsLoading(false));
  }, [form.vehicleBrand]);

  const setField = (key) => (val) => {
    setForm((p) => ({
      ...p,
      [key]: val,
      // Reset model when brand changes
      ...(key === "vehicleBrand" ? { vehicleModel: null } : {}),
    }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  // ── Step validators ───────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.vehicleBrand) e.vehicleBrand = "Brand is required";
    if (!form.vehicleModel) e.vehicleModel = "Model is required";
    if (!form.vehicleRegisterNo.trim())
      e.vehicleRegisterNo = "Registration number is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ── Submit ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setSaving(true);
    const fullName = [form.firstName.trim(), form.lastName.trim()]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await addUser({
        fullName,
        phoneNo: form.phone.trim(),
        role: "customer",
        ...(form.email.trim() && { emailId: form.email.trim() }),
        ...(form.address.trim() && { address: form.address.trim() }),
        // Vehicle fields — backend creates both in one call
        vehicleBrand: form.vehicleBrand,
        vehicleModel: form.vehicleModel,
        vehicleRegisterNo: form.vehicleRegisterNo.trim().toUpperCase(),
        ...(form.vehicleEngineNo.trim() && {
          vehicleEngineNo: form.vehicleEngineNo.trim(),
        }),
        ...(form.vehicleVinNo.trim() && {
          vehicleVinNo: form.vehicleVinNo.trim(),
        }),
        ...(form.vehicleInsuranceProvider.trim() && {
          vehicleInsuranceProvider: form.vehicleInsuranceProvider.trim(),
        }),
        ...(form.vehiclePolicyNo.trim() && {
          vehiclePolicyNo: form.vehiclePolicyNo.trim(),
        }),
      });

      const newCustomer = res.data?.user;
      const newVehicle = res.data?.vehicle;

      Alert.alert(
        "Created Successfully",
        `${fullName} and their vehicle have been saved.`,
        [
          {
            text: "Open Repair Order",
            onPress: () => {
              // Pass new customer+vehicle back to CustomerRepairOrderScreen
              if (onSuccess && newCustomer && newVehicle) {
                onSuccess({ customer: newCustomer, vehicle: newVehicle });
              }
              navigation.goBack();
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="New Customer + Vehicle" transparent={false} />

      {/* Step indicator */}
      <View style={styles.stepWrapOuter}>
        <StepIndicator currentStep={step} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <CustomerStep form={form} setField={setField} errors={errors} />
        )}
        {step === 2 && (
          <VehicleStep
            form={form}
            setField={setField}
            errors={errors}
            brandOptions={brandOptions}
            modelOptions={modelOptions}
            brandsLoading={brandsLoading}
            modelsLoading={modelsLoading}
          />
        )}
        {step === 3 && <ReviewStep form={form} />}
      </ScrollView>

      {/* Footer navigation */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            {step < 3 ? (
              <AppButton
                title="Next"
                variant="gradient"
                size="lg"
                onPress={handleNext}
                rightIcon="arrow-forward"
              />
            ) : (
              <AppButton
                title={saving ? "Creating…" : "Create & Open Repair Order"}
                variant="gradient"
                size="lg"
                onPress={handleCreate}
                disabled={saving}
                leftIcon="checkmark-circle-outline"
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Step indicator
  stepWrapOuter: {
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.screenPadding,
  },
  stepWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgSection,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  stepDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  stepNumActive: { color: COLORS.primary },
  stepLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  stepLabelActive: { fontFamily: FONTS.semibold, color: COLORS.primary },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.borderLight,
    marginBottom: 14,
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: COLORS.primary },

  // Scroll
  scroll: {
    padding: SIZES.screenPadding,
    paddingBottom: Platform.OS === "ios" ? 140 : 120,
    gap: SIZES.md,
  },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  sectionBody: { padding: SIZES.md, gap: SIZES.xs },

  // Row helpers
  rowFields: { flexDirection: "row", gap: SIZES.sm },
  rowField: { flex: 1 },

  // Review step
  reviewGroup: { gap: SIZES.sm },
  reviewGroupLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: SIZES.xs,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingVertical: 5,
  },
  reviewLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    width: 90,
  },
  reviewValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.md,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerRow: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  backBtnText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
});
