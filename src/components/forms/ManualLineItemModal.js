import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import AppButton from "../ui/AppButton";
import AppInput from "../ui/AppInput";

const roundMoney = (value) =>
  Number(Math.max(Number(value) || 0, 0).toFixed(2));

function parsePositiveNumber(value) {
  return Math.max(Number(value) || 0, 0);
}

export default function ManualLineItemModal({
  visible,
  itemType,
  title,
  lineTotalMode = "preTax",
  onClose,
  onSubmit,
}) {
  const isPart = itemType === "part";
  const [form, setForm] = useState({
    name: "",
    partCode: "",
    price: "",
    quantity: "1",
    discount: "",
    taxPercent: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setForm({
      name: "",
      partCode: "",
      price: "",
      quantity: "1",
      discount: "",
      taxPercent: "",
    });
    setError("");
  }, [visible, itemType]);

  const quantity = useMemo(
    () => (isPart ? Math.max(parseInt(form.quantity, 10) || 1, 1) : 1),
    [form.quantity, isPart],
  );
  const price = useMemo(() => parsePositiveNumber(form.price), [form.price]);
  const grossAmount = useMemo(
    () => roundMoney(price * quantity),
    [price, quantity],
  );
  const discount = useMemo(
    () => Math.min(parsePositiveNumber(form.discount), grossAmount),
    [form.discount, grossAmount],
  );
  const taxableAmount = useMemo(
    () => roundMoney(grossAmount - discount),
    [grossAmount, discount],
  );
  const taxPercent = useMemo(
    () => parsePositiveNumber(form.taxPercent),
    [form.taxPercent],
  );
  const taxAmount = useMemo(
    () => roundMoney(taxableAmount * (taxPercent / 100)),
    [taxableAmount, taxPercent],
  );
  const lineTotal = useMemo(
    () =>
      roundMoney(
        lineTotalMode === "inclusiveTax"
          ? taxableAmount + taxAmount
          : taxableAmount,
      ),
    [lineTotalMode, taxableAmount, taxAmount],
  );

  const setField = (key) => (value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) {
      setError(`Please enter a ${isPart ? "part" : "service"} name.`);
      return;
    }

    // const payload = isPart
    //   ? {
    //       entryMode: "manual",
    //       inventoryId: null,
    //       partCode: form.partCode.trim() || null,
    //       name,
    //       quantity,
    //       unitPrice: roundMoney(price),
    //       discount: roundMoney(discount),
    //       taxPercent: roundMoney(taxPercent),
    //       lineTotal,
    //     }
    //   : {
    //       entryMode: "manual",
    //       catalogId: null,
    //       name,
    //       price: roundMoney(price),
    //       discount: roundMoney(discount),
    //       taxPercent: roundMoney(taxPercent),
    //       lineTotal,
    //     };
    const payload = isPart
      ? {
          entryMode: "manual",
          isManual: true,
          inventoryId: null,
          partCode: form.partCode.trim() || null,
          name,
          quantity,
          unitPrice: roundMoney(price),
          price: roundMoney(price),
          discount: roundMoney(discount),
          taxPercent: roundMoney(taxPercent),
          lineTotal,
        }
      : {
          entryMode: "manual",
          isManual: true,
          catalogId: null,
          name,
          price: roundMoney(price),
          discount: roundMoney(discount),
          taxPercent: roundMoney(taxPercent),
          lineTotal,
        };
    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {title || `Add Manual ${isPart ? "Part" : "Service"}`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <Ionicons
                  name={isPart ? "cube-outline" : "construct-outline"}
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>
                  Custom {isPart ? "part" : "service"} entry
                </Text>
                <Text style={styles.introText}>
                  Save a one-off item without adding it to the catalog first.
                </Text>
              </View>
            </View>

            <AppInput
              label={`${isPart ? "Part" : "Service"} name`}
              value={form.name}
              onChangeText={setField("name")}
              placeholder={
                isPart
                  ? "Brake fluid, Clip set..."
                  : "Diagnostic visit, Pickup charge..."
              }
              icon={isPart ? "cube-outline" : "construct-outline"}
              autoCapitalize="words"
            />

            {isPart ? (
              <AppInput
                label="Part code"
                value={form.partCode}
                onChangeText={setField("partCode")}
                placeholder="Optional internal code"
                icon="pricetag-outline"
                autoCapitalize="characters"
              />
            ) : null}

            <View style={styles.twoCol}>
              <View style={styles.twoColItem}>
                <AppInput
                  label={isPart ? "Unit price" : "Price"}
                  value={form.price}
                  onChangeText={setField("price")}
                  placeholder="0.00"
                  icon="cash-outline"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.twoColItem}>
                <AppInput
                  label={isPart ? "Quantity" : "Discount"}
                  value={isPart ? form.quantity : form.discount}
                  onChangeText={setField(isPart ? "quantity" : "discount")}
                  placeholder={isPart ? "1" : "0.00"}
                  icon={isPart ? "albums-outline" : "remove-circle-outline"}
                  keyboardType={isPart ? "number-pad" : "decimal-pad"}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              {isPart ? (
                <View style={styles.twoColItem}>
                  <AppInput
                    label="Discount"
                    value={form.discount}
                    onChangeText={setField("discount")}
                    placeholder="0.00"
                    icon="remove-circle-outline"
                    keyboardType="decimal-pad"
                  />
                </View>
              ) : (
                <View style={styles.twoColItem} />
              )}
              <View style={styles.twoColItem}>
                <AppInput
                  label="Tax %"
                  value={form.taxPercent}
                  onChangeText={setField("taxPercent")}
                  placeholder="0"
                  icon="receipt-outline"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Base amount</Text>
                <Text style={styles.previewValue}>
                  ₹{grossAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Discount</Text>
                <Text style={styles.previewValue}>₹{discount.toFixed(2)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Tax</Text>
                <Text style={styles.previewValue}>₹{taxAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.previewRow, styles.previewRowFinal]}>
                <Text style={styles.previewLabelFinal}>
                  {lineTotalMode === "inclusiveTax"
                    ? "Line total"
                    : "Taxable total"}
                </Text>
                <Text style={styles.previewValueFinal}>
                  ₹{lineTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title={`Add ${isPart ? "Part" : "Service"}`}
              variant="gradient"
              size="lg"
              onPress={handleSave}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  introCard: {
    flexDirection: "row",
    gap: SIZES.sm,
    alignItems: "flex-start",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  introIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  introText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 19,
  },
  twoCol: {
    flexDirection: "row",
    gap: SIZES.sm,
  },
  twoColItem: { flex: 1 },
  previewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  previewRowFinal: {
    marginTop: SIZES.xs,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  previewLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  previewLabelFinal: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  previewValueFinal: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.error,
    marginTop: SIZES.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.bgCard,
  },
});
