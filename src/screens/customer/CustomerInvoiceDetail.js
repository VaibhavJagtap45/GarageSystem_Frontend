import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert, Platform, Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetInvoiceDetail } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import Badge from "../../components/portal/Badge";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import LineRow from "../../components/portal/LineRow";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDateFull(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── PDF HTML Builder (matches owner invoice style) ───────────────────────────
function buildPdfHtml(invoice, garage) {
  const customer = invoice.customerId;
  const vehicle  = invoice.vehicleId;

  const garageName    = garage?.garageName ?? "Garage";
  const garageAddress = garage?.garageAddress ?? "";
  const garagePhone   = garage?.garageContactNumber ?? "";
  const garageGst     = garage?.gstNumber ?? "";

  const logoLetter = garageName.charAt(0).toUpperCase();
  const logoHtml   = garage?.garageLogo
    ? `<img src="${garage.garageLogo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div class="logo-circle">${logoLetter}</div>`;

  const serviceRows = (invoice.services ?? [])
    .map((sv) => `
      <tr>
        <td>${sv.name ?? ""}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${fmt(sv.price ?? sv.lineTotal)}</td>
        <td style="text-align:right">${fmt(sv.lineTotal)}</td>
      </tr>`)
    .join("");

  const partRows = (invoice.parts ?? [])
    .map((p) => `
      <tr>
        <td>${p.name ?? ""}</td>
        <td style="text-align:center">${p.quantity ?? 1}</td>
        <td style="text-align:right">${fmt(p.unitPrice)}</td>
        <td style="text-align:right">${fmt(p.lineTotal)}</td>
      </tr>`)
    .join("");

  const subTotal   = (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);
  const grandTotal = invoice.totalAmount ?? 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          padding: 24px;
          color: #000;
          background: #fff;
        }
        h1 {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
          letter-spacing: 1px;
        }
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #ccc;
          padding: 16px;
          margin-bottom: 0;
        }
        .logo-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          line-height: 80px;
          flex-shrink: 0;
        }
        .garage-info { text-align: right; line-height: 1.7; }
        .garage-name { font-weight: bold; font-size: 14px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; }
        .section-hdr td {
          background: #BDD7EE;
          font-weight: bold;
          padding: 6px 8px;
          border: 1px solid #9DC3E6;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        tbody tr td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; }
        .total-row td {
          font-weight: bold;
          border-top: 1px solid #aaa;
          padding: 6px 8px;
        }
        .grand-total-row td {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          padding: 8px;
        }
        .spacer { height: 10px; }
        .summary-label { text-align: right; }
        .summary-value { text-align: right; width: 120px; }
        .customer-cell { vertical-align: top; line-height: 1.7; }
      </style>
    </head>
    <body>
      <h1>Invoice</h1>

      <div class="top-header">
        ${logoHtml}
        <div class="garage-info">
          <div class="garage-name">${garageName.toUpperCase()}</div>
          ${garageAddress ? `<div>${garageAddress}</div>` : ""}
          ${garagePhone   ? `<div>&#9742;&nbsp;${garagePhone}</div>` : ""}
          ${garageGst     ? `<div>GST: ${garageGst}</div>` : ""}
        </div>
      </div>

      <table>
        <tr class="section-hdr">
          <td style="width:38%">CUSTOMER</td>
          <td style="width:30%">VEHICLE</td>
          <td style="width:32%; text-align:right">ESTIMATE</td>
        </tr>
        <tr>
          <td class="customer-cell">
            ${customer?.fullName ?? "—"}<br>
            ${customer?.phoneNo ?? ""}<br>
            ${customer?.emailId ?? ""}
          </td>
          <td class="customer-cell">
            ${vehicle
              ? `${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}<br>${vehicle.vehicleRegisterNo ?? ""}`
              : "—"}
          </td>
          <td style="text-align:right; vertical-align:top">
            ${fmtDateFull(invoice.createdAt)}<br>
            Amount: &#8377;${fmt(grandTotal)}
          </td>
        </tr>
      </table>

      ${serviceRows ? `
        <div class="spacer"></div>
        <table>
          <tr class="section-hdr">
            <td>SERVICES</td>
            <td style="text-align:center; width:50px">QTY</td>
            <td style="text-align:right; width:80px">RATE</td>
            <td style="text-align:right; width:90px">AMOUNT</td>
          </tr>
          <tbody>${serviceRows}</tbody>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Total :</td>
            <td style="text-align:right">&#8377;${fmt(invoice.servicesSubTotal)}</td>
          </tr>
        </table>` : ""}

      ${partRows ? `
        <div class="spacer"></div>
        <table>
          <tr class="section-hdr">
            <td>PARTS</td>
            <td style="text-align:center; width:50px">QTY</td>
            <td style="text-align:right; width:80px">RATE</td>
            <td style="text-align:right; width:90px">AMOUNT</td>
          </tr>
          <tbody>${partRows}</tbody>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Total :</td>
            <td style="text-align:right">&#8377;${fmt(invoice.partsSubTotal)}</td>
          </tr>
        </table>` : ""}

      <div class="spacer"></div>
      <table>
        <tr class="section-hdr">
          <td colspan="2">SUMMARY</td>
        </tr>
        <tbody>
          <tr>
            <td class="summary-label">SUB TOTAL:</td>
            <td class="summary-value">&#8377;${fmt(subTotal)}</td>
          </tr>
          ${(invoice.labourCharge ?? 0) > 0
            ? `<tr>
                <td class="summary-label">LABOUR (${invoice.labourPercent ?? 20}%):</td>
                <td class="summary-value">&#8377;${fmt(invoice.labourCharge)}</td>
               </tr>` : ""}
          ${(invoice.taxAmount ?? 0) > 0
            ? `<tr>
                <td class="summary-label">TAX:</td>
                <td class="summary-value">&#8377;${fmt(invoice.taxAmount)}</td>
               </tr>` : ""}
          ${(invoice.discountAmount ?? 0) > 0
            ? `<tr>
                <td class="summary-label">DISCOUNT:</td>
                <td class="summary-value">-&#8377;${fmt(invoice.discountAmount)}</td>
               </tr>` : ""}
        </tbody>
        <tr class="grand-total-row">
          <td class="summary-label">GRAND TOTAL:</td>
          <td class="summary-value">&#8377;${fmt(grandTotal)}</td>
        </tr>
      </table>

      <div class="spacer"></div>
      <div style="font-size:11px; color:#555; text-align:center; margin-top:8px;">
        Payment Mode: ${(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Status: ${(invoice.paymentStatus ?? "unpaid").toUpperCase()}
      </div>
      ${invoice.notes
        ? `<div style="margin-top:12px; font-size:11px; color:#555;"><b>Notes:</b> ${invoice.notes}</div>`
        : ""}
      <div style="text-align:center; margin-top:20px; font-size:11px; color:#888;">
        Thank you for your business!
      </div>
    </body>
    </html>
  `;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CustomerInvoiceDetail({ route, navigation }) {
  const { invoiceId } = route.params;
  const tabBarH = useBottomTabBarHeight();

  const [invoice,      setInv]         = useState(null);
  const [garage,       setGarage]      = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [generatingPdf,setGenerating]  = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetch() {
        try {
          const r = await customerGetInvoiceDetail(invoiceId);
          setInv(r.data?.data?.invoice);
          setGarage(r.data?.data?.garage);
        } catch {
          setInv(null);
        } finally {
          setLoading(false);
        }
      }
      fetch();
    }, [invoiceId]),
  );

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const html = buildPdfHtml(invoice, garage);
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing not available", "Your device does not support file sharing.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Invoice ${invoice.invoiceNo}`,
        UTI: "com.adobe.pdf",
      });
    } catch {
      Alert.alert("Error", "Could not generate or share PDF.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShareSms = () => {
    if (!invoice) return;
    const rawPhone = (invoice.customerId?.phoneNo ?? "").replace(/\D/g, "");
    const phone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
    let t = "";
    if (garage?.garageName) t += `${garage.garageName}\n`;
    t += `\nINVOICE: ${invoice.invoiceNo ?? "—"}\n`;
    t += `Date: ${fmtDateFull(invoice.createdAt)}\n`;
    if (invoice.vehicleId) {
      t += `Vehicle: ${invoice.vehicleId.vehicleBrand ?? ""} ${invoice.vehicleId.vehicleModel ?? ""}`;
      if (invoice.vehicleId.vehicleRegisterNo) t += ` (${invoice.vehicleId.vehicleRegisterNo})`;
      t += "\n";
    }
    t += `\nGRAND TOTAL: Rs.${fmt(invoice.totalAmount)}\n`;
    t += `\nThank you for your business!`;
    const body = encodeURIComponent(t);
    const url  = Platform.OS === "ios"
      ? `sms:+${phone}&body=${body}`
      : `sms:+${phone}?body=${body}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open SMS app."));
  };

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />;
  if (!invoice) return <Empty icon="alert-circle-outline" title="Invoice not found" />;

  const servicesSubTotal = invoice.services?.reduce((sum, sv) => sum + (sv.lineTotal || 0), 0) || 0;
  const partsSubTotal    = invoice.parts?.reduce((sum, p)  => sum + (p.lineTotal  || 0), 0) || 0;

  const totalsRows = [
    { l: "Services", v: inr(servicesSubTotal) },
    { l: "Parts",    v: inr(partsSubTotal)    },
    invoice.labourCharge  > 0 && { l: `Labour (${invoice.labourPercent ?? 0}%)`, v: inr(invoice.labourCharge)  },
    invoice.discountAmount > 0 && { l: "Discount", v: "− " + inr(invoice.discountAmount), green: true },
    invoice.taxAmount      > 0 && { l: "Tax",      v: inr(invoice.taxAmount) },
  ].filter(Boolean);

  const paid = invoice.paymentStatus === "paid";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <NavBar title={invoice.invoiceNo || "Invoice"} onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: tabBarH + 100 }}
      >
        {/* ── Garage header ── */}
        {garage && (
          <View style={s.garageCard}>
            {garage.garageLogo ? (
              <Image source={{ uri: garage.garageLogo }} style={s.logoImg} />
            ) : (
              <View style={s.logoWrap}>
                <Text style={s.logoLetter}>{garage.garageName?.charAt(0)?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.gname}>{garage.garageName}</Text>
              {garage.garageOwnerName    ? <Text style={s.ginfo}>{garage.garageOwnerName}</Text>    : null}
              {garage.garageAddress      ? <Text style={s.ginfo}>{garage.garageAddress}</Text>      : null}
              {garage.garageContactNumber? (
                <View style={s.ginfoRow}>
                  <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                  <Text style={s.ginfo}>{garage.garageContactNumber}</Text>
                </View>
              ) : null}
              {garage.isGstApplicable && garage.gstNumber ? (
                <Text style={s.gst}>GST: {garage.gstNumber}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Invoice meta ── */}
        <View style={s.metaCard}>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Invoice No</Text>
            <Text style={s.metaVal}>{invoice.invoiceNo || "—"}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Date</Text>
            <Text style={s.metaVal}>{fmtDate(invoice.createdAt)}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Status</Text>
            <Badge status={invoice.paymentStatus} />
          </View>
        </View>

        {/* ── Vehicle ── */}
        {invoice.vehicleId && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Vehicle</Text>
            <View style={s.card}>
              <View style={s.cardRow}>
                <View style={s.cardIcon}>
                  <Ionicons name="car-sport-outline" size={18} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardMain}>
                    {invoice.vehicleId.vehicleBrand} {invoice.vehicleId.vehicleModel}
                  </Text>
                  <Text style={s.cardSub}>{invoice.vehicleId.vehicleRegisterNo}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Services ── */}
        {invoice.services?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services</Text>
            <View style={s.linesCard}>
              {invoice.services.map((sv, i) => (
                <LineRow key={i} name={sv.name} amt={inr(sv.lineTotal)} />
              ))}
            </View>
          </View>
        )}

        {/* ── Parts ── */}
        {invoice.parts?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Parts</Text>
            <View style={s.linesCard}>
              {invoice.parts.map((p, i) => (
                <LineRow key={i} name={`${p.name} × ${p.quantity}`} amt={inr(p.lineTotal)} />
              ))}
            </View>
          </View>
        )}

        {/* ── Totals ── */}
        <View style={s.totalsBox}>
          {totalsRows.map((r) => (
            <View key={r.l} style={s.totalsRow}>
              <Text style={s.totalsLabel}>{r.l}</Text>
              <Text style={[s.totalsVal, r.green && { color: "#22c55e" }]}>{r.v}</Text>
            </View>
          ))}
          <View style={s.totalFinalRow}>
            <Text style={s.totalFinalLabel}>Grand Total</Text>
            <Text style={s.totalFinalAmt}>{inr(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* ── Payment mode ── */}
        <View style={s.payRow}>
          <View style={s.payItem}>
            <Text style={s.payLbl}>Payment Mode</Text>
            <Text style={s.payVal}>
              {(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View style={[s.payPill, { backgroundColor: paid ? "#dcfce7" : "#fef3c7" }]}>
            <Ionicons
              name={paid ? "checkmark-circle-outline" : "time-outline"}
              size={14}
              color={paid ? "#22c55e" : "#f59e0b"}
            />
            <Text style={[s.payPillTxt, { color: paid ? "#22c55e" : "#f59e0b" }]}>
              {(invoice.paymentStatus ?? "unpaid").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes ? (
          <Text style={s.notes}>Note: {invoice.notes}</Text>
        ) : null}
      </ScrollView>

      {/* ── Action bar ── */}
      <View style={[s.actionBar, { bottom: tabBarH }]}>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: "#3b82f6" }]}
          onPress={handleDownloadPdf}
          disabled={generatingPdf}
          activeOpacity={0.85}
        >
          {generatingPdf
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : (
              <>
                <Ionicons name="download-outline" size={18} color={COLORS.white} />
                <Text style={s.actionTxt}>Download PDF</Text>
              </>
            )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: "#22c55e" }]}
          onPress={handleShareSms}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
          <Text style={s.actionTxt}>Share SMS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Garage card
  garageCard: {
    flexDirection: "row", alignItems: "flex-start", gap: SIZES.sm,
    backgroundColor: "#dbeafe", borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: "#93c5fd",
  },
  logoImg:  { width: 48, height: 48, borderRadius: 24, flexShrink: 0 },
  logoWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#1d4ed8",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: { fontFamily: FONTS.extrabold, fontSize: 20, color: COLORS.white },
  gname:    { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: "#1d4ed8" },
  ginfo:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary, marginTop: 2 },
  ginfoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  gst:      { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },

  // Meta
  metaCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  metaItem:  {},
  metaLbl:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  metaVal:   { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },

  // Sections
  section:      { marginBottom: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: SIZES.sm },

  // Generic card
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm,
  },
  cardRow:  { flexDirection: "row", alignItems: "center", gap: SIZES.sm, padding: SIZES.md },
  cardIcon: { width: 40, height: 40, borderRadius: SIZES.radiusSm, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  cardMain: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  cardSub:  { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },

  // Line rows card
  linesCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.borderLight, overflow: "hidden", ...SHADOWS.sm,
  },

  // Totals
  totalsBox: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    padding: SIZES.lg, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  totalsRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  totalsLabel:    { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  totalsVal:      { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  totalFinalRow:  { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 6, paddingTop: 10 },
  totalFinalLabel:{ fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  totalFinalAmt:  { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: "#3b82f6" },

  // Payment row
  payRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  payLbl:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  payVal:    { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  payPill:   { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: SIZES.radiusFull, paddingHorizontal: 12, paddingVertical: 6 },
  payPillTxt:{ fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  notes: {
    fontFamily: FONTS.regular, fontSize: SIZES.textSm,
    color: COLORS.textMuted, fontStyle: "italic",
    marginBottom: SIZES.lg,
  },

  // Action bar
  actionBar: {
    position: "absolute", left: 0, right: 0,
    flexDirection: "row", gap: SIZES.sm,
    padding: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: SIZES.radiusFull, paddingVertical: 13, gap: 7,
  },
  actionTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },
});
