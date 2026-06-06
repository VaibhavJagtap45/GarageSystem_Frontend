import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetInvoiceDetail } from "../../api/portal";
import { inr, fmtDate } from "../../utils/portalHelpers";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import LineRow from "../../components/portal/LineRow";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "0.00";
  return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDateFull(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── PDF HTML Builder (matches owner invoice style) ─────────────────────────
function buildPdfHtml(invoice, garage) {
  const customer = invoice.customerId;
  const vehicle = invoice.vehicleId;

  const garageName    = garage?.garageName ?? "Garage";
  const garageAddress = garage?.garageAddress ?? "";
  const garagePhone   = garage?.garageContactNumber ?? "";
  const garageGst     = garage?.gstNumber ?? "";

  const logoLetter = garageName.charAt(0).toUpperCase();
  const logoHtml = garage?.garageLogo
    ? `<img src="${garage.garageLogo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div class="logo-circle">${logoLetter}</div>`;

  const serviceRows = (invoice.services ?? [])
    .map(
      (sv) => `
      <tr>
        <td>${sv.name ?? ""}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${fmt(sv.price ?? sv.lineTotal)}</td>
        <td style="text-align:right">${fmt(sv.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const partRows = (invoice.parts ?? [])
    .map(
      (p) => `
      <tr>
        <td>${p.name ?? ""}</td>
        <td style="text-align:center">${p.quantity ?? 1}</td>
        <td style="text-align:right">${fmt(p.unitPrice)}</td>
        <td style="text-align:right">${fmt(p.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const subTotal = (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);
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
          ${garagePhone ? `<div>&#9742;&nbsp;${garagePhone}</div>` : ""}
          ${garageGst ? `<div>GST: ${garageGst}</div>` : ""}
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
            ${
              vehicle
                ? `${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}<br>${vehicle.vehicleRegisterNo ?? ""}`
                : "—"
            }
          </td>
          <td style="text-align:right; vertical-align:top">
            ${fmtDateFull(invoice.createdAt)}<br>
            Amount: &#8377;${fmt(grandTotal)}
          </td>
        </tr>
      </table>

      ${
        serviceRows
          ? `
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
        </table>`
          : ""
      }

      ${
        partRows
          ? `
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
        </table>`
          : ""
      }

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
          ${
            (invoice.taxAmount ?? 0) > 0
              ? `<tr>
                <td class="summary-label">TAX:</td>
                <td class="summary-value">&#8377;${fmt(invoice.taxAmount)}</td>
               </tr>`
              : ""
          }
          ${
            (invoice.discountAmount ?? 0) > 0
              ? `<tr>
                <td class="summary-label">DISCOUNT:</td>
                <td class="summary-value">-&#8377;${fmt(invoice.discountAmount)}</td>
               </tr>`
              : ""
          }
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
      ${
        invoice.notes
          ? `<div style="margin-top:12px; font-size:11px; color:#555;"><b>Notes:</b> ${invoice.notes}</div>`
          : ""
      }
      <div style="text-align:center; margin-top:20px; font-size:11px; color:#888;">
        Thank you for your business!
      </div>
    </body>
    </html>
  `;
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function CustomerInvoiceDetail({ route, navigation }) {
  const { invoiceId } = route.params;
  const tabBarH = useBottomTabBarHeight();

  const [invoice, setInv]           = useState(null);
  const [garage, setGarage]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generatingPdf, setGenerating] = useState(false);

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
        Alert.alert(
          "Sharing not available",
          "Your device does not support file sharing.",
        );
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
      if (invoice.vehicleId.vehicleRegisterNo)
        t += ` (${invoice.vehicleId.vehicleRegisterNo})`;
      t += "\n";
    }
    t += `\nGRAND TOTAL: Rs.${fmt(invoice.totalAmount)}\n`;
    t += `\nThank you for your business!`;
    const body = encodeURIComponent(t);
    const url =
      Platform.OS === "ios" ? `sms:+${phone}&body=${body}` : `sms:+${phone}?body=${body}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open SMS app."),
    );
  };

  if (loading)
    return (
      <SafeAreaView style={s.safe}>
        <NavBar title="Loading…" onBack={() => navigation.goBack()} />
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );

  if (!invoice)
    return <Empty icon="alert-circle-outline" title="Invoice not found" />;

  const servicesSubTotal =
    invoice.services?.reduce((sum, sv) => sum + (sv.lineTotal || 0), 0) || 0;
  const partsSubTotal =
    invoice.parts?.reduce((sum, p) => sum + (p.lineTotal || 0), 0) || 0;

  const totalsRows = [
    invoice.services?.length > 0 && { l: "Services", v: inr(servicesSubTotal) },
    invoice.parts?.length > 0 && { l: "Parts", v: inr(partsSubTotal) },
    invoice.discountAmount > 0 && {
      l: "Discount",
      v: "- " + inr(invoice.discountAmount),
      green: true,
    },
    invoice.taxAmount > 0 && { l: "Tax", v: inr(invoice.taxAmount) },
  ].filter(Boolean);

  const paid = invoice.paymentStatus === "paid";
  const partial = invoice.paymentStatus === "partially_paid";
  const paymentLabel = paid
    ? "Fully paid"
    : partial
      ? "Partially paid"
      : "Payment pending";
  const heroGrad = paid
    ? ["#16a34a", "#22c55e"]
    : partial
      ? ["#d97706", "#f59e0b"]
      : ["#1d4ed8", "#3b82f6"];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <NavBar
        title={invoice.invoiceNo || "Invoice"}
        subtitle={fmtDate(invoice.createdAt)}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 100 }}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={heroGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={[s.heroDeco, { width: 160, height: 160, top: -40, right: -30 }]} />
          <View style={[s.heroDeco, { width: 80, height: 80, bottom: -20, left: -10 }]} />

          <View style={s.heroTopRow}>
            <View style={s.heroIconWrap}>
              <Ionicons
                name={paid ? "checkmark-circle" : "receipt"}
                size={22}
                color={COLORS.white}
              />
            </View>
            <View style={s.heroStatusBadge}>
              <View style={s.heroStatusDot} />
              <Text style={s.heroStatusTxt}>{paymentLabel}</Text>
            </View>
          </View>

          <Text style={s.heroEyebrow}>Grand total</Text>
          <Text style={s.heroAmt}>{inr(invoice.totalAmount)}</Text>
          {garage?.garageName ? (
            <Text style={s.heroIssued} numberOfLines={1}>
              Issued by {garage.garageName}
            </Text>
          ) : null}

          <View style={s.heroStatsRow}>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>
                {invoice.services?.length || 0}
              </Text>
              <Text style={s.heroStatLbl}>Services</Text>
            </View>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>{invoice.parts?.length || 0}</Text>
              <Text style={s.heroStatLbl}>Parts</Text>
            </View>
            <View style={s.heroStatCard}>
              <Text style={s.heroStatVal}>
                {(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
              </Text>
              <Text style={s.heroStatLbl}>Mode</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.contentWrap}>
          {/* ── Garage header ── */}
          {garage && (
            <View style={s.garageCard}>
              {garage.garageLogo ? (
                <Image source={{ uri: garage.garageLogo }} style={s.logoImg} />
              ) : (
                <LinearGradient
                  colors={["#1d4ed8", "#3b82f6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.logoWrap}
                >
                  <Text style={s.logoLetter}>
                    {garage.garageName?.charAt(0)?.toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.gname}>{garage.garageName}</Text>
                {garage.garageOwnerName ? (
                  <Text style={s.ginfo}>{garage.garageOwnerName}</Text>
                ) : null}
                {garage.garageAddress ? (
                  <Text style={s.ginfo}>{garage.garageAddress}</Text>
                ) : null}
                {garage.garageContactNumber ? (
                  <View style={s.ginfoRow}>
                    <Ionicons name="call-outline" size={12} color="#1d4ed8" />
                    <Text style={[s.ginfo, { color: "#1d4ed8", fontFamily: FONTS.semibold }]}>
                      {garage.garageContactNumber}
                    </Text>
                  </View>
                ) : null}
                {garage.isGstApplicable && garage.gstNumber ? (
                  <Text style={s.gst}>GST: {garage.gstNumber}</Text>
                ) : null}
              </View>
            </View>
          )}

          {/* ── Meta card ── */}
          <View style={s.metaCard}>
            <View style={s.metaItem}>
              <Text style={s.metaLbl}>Invoice</Text>
              <Text style={s.metaVal}>{invoice.invoiceNo || "—"}</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <Text style={s.metaLbl}>Issued</Text>
              <Text style={s.metaVal}>{fmtDate(invoice.createdAt)}</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <Text style={s.metaLbl}>Amount</Text>
              <Text style={[s.metaVal, { color: "#1d4ed8" }]}>
                {inr(invoice.totalAmount)}
              </Text>
            </View>
          </View>

          {/* ── Vehicle ── */}
          {invoice.vehicleId && (
            <View style={s.block}>
              <Text style={s.blockTitle}>Vehicle</Text>
              <View style={s.infoCard}>
                <View style={s.infoIconWrap}>
                  <Ionicons name="car-sport-outline" size={17} color="#1d4ed8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoMain}>
                    {invoice.vehicleId.vehicleBrand}{" "}
                    {invoice.vehicleId.vehicleModel}
                  </Text>
                  <Text style={s.infoSub}>
                    {invoice.vehicleId.vehicleRegisterNo}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Services ── */}
          {invoice.services?.length > 0 && (
            <View style={s.block}>
              <View style={s.blockHead}>
                <View style={[s.blockIcon, { backgroundColor: "#dbeafe" }]}>
                  <MaterialCommunityIcons
                    name="wrench-outline"
                    size={15}
                    color="#1d4ed8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.blockTitle}>Services</Text>
                  <Text style={s.blockSub}>
                    {invoice.services.length} item
                    {invoice.services.length === 1 ? "" : "s"} · {inr(servicesSubTotal)}
                  </Text>
                </View>
              </View>
              <View style={s.linesCard}>
                {invoice.services.map((sv, i) => (
                  <LineRow key={i} name={sv.name} amt={inr(sv.lineTotal)} />
                ))}
              </View>
            </View>
          )}

          {/* ── Parts ── */}
          {invoice.parts?.length > 0 && (
            <View style={s.block}>
              <View style={s.blockHead}>
                <View style={[s.blockIcon, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="cog-outline" size={16} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.blockTitle}>Parts</Text>
                  <Text style={s.blockSub}>
                    {invoice.parts.length} part
                    {invoice.parts.length === 1 ? "" : "s"} · {inr(partsSubTotal)}
                  </Text>
                </View>
              </View>
              <View style={s.linesCard}>
                {invoice.parts.map((p, i) => (
                  <LineRow
                    key={i}
                    name={`${p.name} × ${p.quantity}`}
                    amt={inr(p.lineTotal)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Totals ── */}
          <View style={s.block}>
            <Text style={s.blockTitle}>Payment breakdown</Text>
            <View style={s.totalsBox}>
              {totalsRows.map((r) => (
                <View key={r.l} style={s.totalsRow}>
                  <Text style={s.totalsLabel}>{r.l}</Text>
                  <Text
                    style={[s.totalsVal, r.green && { color: "#22c55e" }]}
                  >
                    {r.v}
                  </Text>
                </View>
              ))}
              <View style={s.totalFinalRow}>
                <Text style={s.totalFinalLabel}>Grand total</Text>
                <Text style={s.totalFinalAmt}>{inr(invoice.totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* ── Payment mode ── */}
          <View style={s.payRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.payLbl}>Payment mode</Text>
              <Text style={s.payVal}>
                {(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                s.payPill,
                {
                  backgroundColor: paid
                    ? "#dcfce7"
                    : partial
                      ? "#fef3c7"
                      : "#fee2e2",
                },
              ]}
            >
              <Ionicons
                name={
                  paid
                    ? "checkmark-circle-outline"
                    : partial
                      ? "time-outline"
                      : "alert-circle-outline"
                }
                size={14}
                color={paid ? "#22c55e" : partial ? "#f59e0b" : "#ef4444"}
              />
              <Text
                style={[
                  s.payPillTxt,
                  {
                    color: paid
                      ? "#22c55e"
                      : partial
                        ? "#f59e0b"
                        : "#ef4444",
                  },
                ]}
              >
                {(invoice.paymentStatus ?? "unpaid").toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ── Notes ── */}
          {invoice.notes ? (
            <View style={s.block}>
              <Text style={s.blockTitle}>Notes</Text>
              <View style={s.notesCard}>
                <Ionicons name="document-text-outline" size={14} color={COLORS.textMuted} />
                <Text style={s.notesTxt}>{invoice.notes}</Text>
              </View>
            </View>
          ) : null}

          <Text style={s.footer}>Thank you for your business ✨</Text>
        </View>
      </ScrollView>

      {/* ── Floating action bar ── */}
      <View style={[s.actionBar, { bottom: tabBarH }]}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={handleDownloadPdf}
          disabled={generatingPdf}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#1d4ed8", "#3b82f6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.actionBtnInner}
          >
            {generatingPdf ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={COLORS.white} />
                <Text style={s.actionTxt}>Download PDF</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={handleShareSms}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#16a34a", "#22c55e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.actionBtnInner}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
            <Text style={s.actionTxt}>Share SMS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  heroDeco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  heroStatusTxt: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroEyebrow: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroAmt: {
    fontFamily: FONTS.extrabold,
    fontSize: 34,
    color: COLORS.white,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  heroIssued: {
    marginTop: 2,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.85)",
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: SIZES.md,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 10,
  },
  heroStatVal: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: COLORS.white,
    letterSpacing: -0.1,
  },
  heroStatLbl: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.78)",
  },

  contentWrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },

  // Garage card
  garageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    ...SHADOWS.sm,
  },
  logoImg: { width: 48, height: 48, borderRadius: 24, flexShrink: 0 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...SHADOWS.sm,
  },
  logoLetter: {
    fontFamily: FONTS.extrabold,
    fontSize: 20,
    color: COLORS.white,
  },
  gname: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: "#1d4ed8",
    letterSpacing: -0.1,
  },
  ginfo: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ginfoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  gst: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 4 },

  // Meta card
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  metaItem: { flex: 1 },
  metaLbl: {
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaVal: {
    marginTop: 3,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 4,
  },

  // Blocks
  block: { marginBottom: SIZES.md },
  blockHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SIZES.sm,
  },
  blockIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  blockTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  blockSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  infoMain: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  infoSub: {
    marginTop: 2,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  // Lines card
  linesCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    paddingHorizontal: SIZES.md,
    ...SHADOWS.sm,
  },

  // Totals
  totalsBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalsLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  totalsVal: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalFinalLabel: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  totalFinalAmt: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: "#1d4ed8",
    letterSpacing: -0.3,
  },

  // Payment row
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  payLbl: {
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  payVal: {
    marginTop: 3,
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  payPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  payPillTxt: {
    fontFamily: FONTS.extrabold,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  // Notes
  notesCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
  },
  notesTxt: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  footer: {
    marginTop: SIZES.md,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  // Action bar
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: SIZES.sm,
    padding: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  actionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
  },
  actionTxt: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
    letterSpacing: -0.1,
  },
});
