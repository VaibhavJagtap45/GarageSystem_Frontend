// import { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Linking,
//   Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { Ionicons } from "@expo/vector-icons";
// import { useSelector } from "react-redux";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import { INVOICE_ENDPOINTS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import axiosClient from "../../api/axios";

// // ─── Config ───────────────────────────────────────────────────────────────────
// const STATUS_CONFIG = {
//   draft:     { label: "Draft",     color: COLORS.textMuted,  bg: COLORS.bgSection   },
//   sent:      { label: "Sent",      color: COLORS.warning,    bg: COLORS.warningLight },
//   paid:      { label: "Paid",      color: COLORS.success,    bg: COLORS.successLight },
//   cancelled: { label: "Cancelled", color: COLORS.error,      bg: COLORS.errorLight   },
// };

// const PAYMENT_STATUS_CONFIG = {
//   unpaid:  { label: "Unpaid",  color: COLORS.error,   bg: COLORS.errorLight   },
//   partial: { label: "Partial", color: COLORS.warning, bg: COLORS.warningLight },
//   paid:    { label: "Paid",    color: COLORS.success, bg: COLORS.successLight },
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function fmt(n) {
//   if (n == null) return "0.00";
//   return Number(n)
//     .toFixed(2)
//     .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// function fmtDate(dateStr) {
//   if (!dateStr) return "—";
//   return new Date(dateStr).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// // ─── PDF HTML Builder ─────────────────────────────────────────────────────────
// function buildPdfHtml(invoice, garage) {
//   const customer = invoice.customerId;
//   const vehicle  = invoice.vehicleId;

//   const garageName    = garage?.garageName ?? "Garage";
//   const garageAddress = garage?.garageAddress ?? "";
//   const garagePhone   = garage?.garageContactNumber ?? "";
//   const garageGst     = garage?.gstNumber ?? "";

//   const logoLetter = garageName.charAt(0).toUpperCase();

//   const serviceRows = (invoice.services ?? [])
//     .map(
//       (s) => `
//       <tr>
//         <td>${s.name ?? ""}</td>
//         <td style="text-align:center">1</td>
//         <td style="text-align:right">${fmt(s.price ?? s.lineTotal)}</td>
//         <td style="text-align:right">${fmt(s.lineTotal)}</td>
//       </tr>`
//     )
//     .join("");

//   const partRows = (invoice.parts ?? [])
//     .map(
//       (p) => `
//       <tr>
//         <td>${p.name ?? ""}</td>
//         <td style="text-align:center">${p.quantity ?? 1}</td>
//         <td style="text-align:right">${fmt(p.unitPrice)}</td>
//         <td style="text-align:right">${fmt(p.lineTotal)}</td>
//       </tr>`
//     )
//     .join("");

//   const subTotal   = (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);
//   const grandTotal = invoice.totalAmount ?? 0;

//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <style>
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         body {
//           font-family: 'Courier New', Courier, monospace;
//           font-size: 12px;
//           padding: 24px;
//           color: #000;
//           background: #fff;
//         }
//         h1 {
//           text-align: center;
//           font-size: 20px;
//           font-weight: bold;
//           margin-bottom: 16px;
//           letter-spacing: 1px;
//         }
//         /* ── Top header ── */
//         .top-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           border: 1px solid #ccc;
//           padding: 16px;
//           margin-bottom: 0;
//         }
//         .logo-circle {
//           width: 80px;
//           height: 80px;
//           border-radius: 50%;
//           background: #1a6b45;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #fff;
//           font-size: 32px;
//           font-weight: bold;
//           text-align: center;
//           line-height: 80px;
//           flex-shrink: 0;
//         }
//         .garage-info { text-align: right; line-height: 1.7; }
//         .garage-name { font-weight: bold; font-size: 14px; letter-spacing: 0.5px; }
//         /* ── Tables ── */
//         table { width: 100%; border-collapse: collapse; }
//         .section-hdr td {
//           background: #BDD7EE;
//           font-weight: bold;
//           padding: 6px 8px;
//           border: 1px solid #9DC3E6;
//           font-size: 11px;
//           letter-spacing: 0.5px;
//         }
//         tbody tr td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; }
//         .total-row td {
//           font-weight: bold;
//           border-top: 1px solid #aaa;
//           padding: 6px 8px;
//         }
//         .grand-total-row td {
//           font-weight: bold;
//           font-size: 14px;
//           border-top: 2px solid #000;
//           padding: 8px;
//         }
//         .spacer { height: 10px; }
//         .summary-label { text-align: right; }
//         .summary-value { text-align: right; width: 120px; }
//         .customer-cell { vertical-align: top; line-height: 1.7; }
//       </style>
//     </head>
//     <body>
//       <h1>Invoice</h1>

//       <!-- ── Garage Header ── -->
//       <div class="top-header">
//         <div class="logo-circle">${logoLetter}</div>
//         <div class="garage-info">
//           <div class="garage-name">${garageName.toUpperCase()}</div>
//           ${garageAddress ? `<div>${garageAddress}</div>` : ""}
//           ${garagePhone   ? `<div>&#9742;&nbsp;${garagePhone}</div>` : ""}
//           ${garageGst     ? `<div>GST: ${garageGst}</div>` : ""}
//         </div>
//       </div>

//       <!-- ── Customer / Vehicle / Estimate ── -->
//       <table>
//         <tr class="section-hdr">
//           <td style="width:38%">CUSTOMER</td>
//           <td style="width:30%">VEHICLE</td>
//           <td style="width:32%; text-align:right">ESTIMATE</td>
//         </tr>
//         <tr>
//           <td class="customer-cell">
//             ${customer?.fullName ?? "—"}<br>
//             ${customer?.phoneNo  ?? ""}<br>
//             ${customer?.emailId  ?? ""}
//           </td>
//           <td class="customer-cell">
//             ${vehicle
//               ? `${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}<br>${vehicle.vehicleRegisterNo ?? ""}`
//               : "—"}
//           </td>
//           <td style="text-align:right; vertical-align:top">
//             ${fmtDate(invoice.createdAt)}<br>
//             Amount: &#8377;${fmt(grandTotal)}
//           </td>
//         </tr>
//       </table>

//       <!-- ── Services ── -->
//       ${
//         serviceRows
//           ? `<div class="spacer"></div>
//              <table>
//                <tr class="section-hdr">
//                  <td>SERVICES</td>
//                  <td style="text-align:center; width:50px">QTY</td>
//                  <td style="text-align:right; width:80px">RATE</td>
//                  <td style="text-align:right; width:90px">AMOUNT</td>
//                </tr>
//                <tbody>${serviceRows}</tbody>
//                <tr class="total-row">
//                  <td colspan="3" style="text-align:right">Total :</td>
//                  <td style="text-align:right">&#8377;${fmt(invoice.servicesSubTotal)}</td>
//                </tr>
//              </table>`
//           : ""
//       }

//       <!-- ── Parts ── -->
//       ${
//         partRows
//           ? `<div class="spacer"></div>
//              <table>
//                <tr class="section-hdr">
//                  <td>PARTS</td>
//                  <td style="text-align:center; width:50px">QTY</td>
//                  <td style="text-align:right; width:80px">RATE</td>
//                  <td style="text-align:right; width:90px">AMOUNT</td>
//                </tr>
//                <tbody>${partRows}</tbody>
//                <tr class="total-row">
//                  <td colspan="3" style="text-align:right">Total :</td>
//                  <td style="text-align:right">&#8377;${fmt(invoice.partsSubTotal)}</td>
//                </tr>
//              </table>`
//           : ""
//       }

//       <!-- ── Summary ── -->
//       <div class="spacer"></div>
//       <table>
//         <tr class="section-hdr">
//           <td colspan="2">SUMMARY</td>
//         </tr>
//         <tbody>
//           <tr>
//             <td class="summary-label">SUB TOTAL:</td>
//             <td class="summary-value">&#8377;${fmt(subTotal)}</td>
//           </tr>
//           ${
//             (invoice.labourCharge ?? 0) > 0
//               ? `<tr>
//                    <td class="summary-label">LABOUR (${invoice.labourPercent ?? 20}%):</td>
//                    <td class="summary-value">&#8377;${fmt(invoice.labourCharge)}</td>
//                  </tr>`
//               : ""
//           }
//           ${
//             (invoice.taxAmount ?? 0) > 0
//               ? `<tr>
//                    <td class="summary-label">TAX:</td>
//                    <td class="summary-value">&#8377;${fmt(invoice.taxAmount)}</td>
//                  </tr>`
//               : ""
//           }
//           ${
//             (invoice.discountAmount ?? 0) > 0
//               ? `<tr>
//                    <td class="summary-label">DISCOUNT:</td>
//                    <td class="summary-value">-&#8377;${fmt(invoice.discountAmount)}</td>
//                  </tr>`
//               : ""
//           }
//         </tbody>
//         <tr class="grand-total-row">
//           <td class="summary-label">GRAND TOTAL:</td>
//           <td class="summary-value">&#8377;${fmt(grandTotal)}</td>
//         </tr>
//       </table>

//       <!-- ── Payment ── -->
//       <div class="spacer"></div>
//       <div style="font-size:11px; color:#555; text-align:center; margin-top:8px;">
//         Payment Mode: ${(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
//         &nbsp;&nbsp;|&nbsp;&nbsp;
//         Status: ${(invoice.paymentStatus ?? "unpaid").toUpperCase()}
//       </div>
//       ${invoice.notes ? `<div style="margin-top:12px; font-size:11px; color:#555;"><b>Notes:</b> ${invoice.notes}</div>` : ""}
//       <div style="text-align:center; margin-top:20px; font-size:11px; color:#888;">
//         Thank you for your business!
//       </div>
//     </body>
//     </html>
//   `;
// }

// // ─── Share text builder (for SMS) ────────────────────────────────────────────
// function buildShareText(invoice, garage) {
//   if (!invoice) return "";
//   const customer = invoice.customerId;
//   const vehicle  = invoice.vehicleId;

//   let t = "";
//   if (garage?.garageName) t += `${garage.garageName}\n`;
//   if (garage?.garageAddress) t += `${garage.garageAddress}\n`;
//   if (garage?.garageContactNumber) t += `Ph: ${garage.garageContactNumber}\n`;

//   t += `\nINVOICE: ${invoice.invoiceNo ?? "—"}\n`;
//   t += `Date: ${fmtDate(invoice.createdAt)}\n`;

//   if (customer?.fullName) {
//     t += `\nBill To: ${customer.fullName}\n`;
//     if (customer.phoneNo) t += `Ph: ${customer.phoneNo}\n`;
//   }
//   if (vehicle) {
//     t += `Vehicle: ${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}`;
//     if (vehicle.vehicleRegisterNo) t += ` (${vehicle.vehicleRegisterNo})`;
//     t += "\n";
//   }

//   if (invoice.services?.length) {
//     t += `\nServices:\n`;
//     invoice.services.forEach((s) => (t += `  ${s.name}: Rs.${fmt(s.lineTotal)}\n`));
//   }
//   if (invoice.parts?.length) {
//     t += `\nParts:\n`;
//     invoice.parts.forEach(
//       (p) => (t += `  ${p.name} x${p.quantity}: Rs.${fmt(p.lineTotal)}\n`)
//     );
//   }

//   t += `\nSub Total : Rs.${fmt((invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0))}\n`;
//   if ((invoice.labourCharge ?? 0) > 0)
//     t += `Labour    : Rs.${fmt(invoice.labourCharge)}\n`;
//   if ((invoice.taxAmount ?? 0) > 0)
//     t += `Tax       : Rs.${fmt(invoice.taxAmount)}\n`;
//   if ((invoice.discountAmount ?? 0) > 0)
//     t += `Discount  : -Rs.${fmt(invoice.discountAmount)}\n`;
//   t += `TOTAL     : Rs.${fmt(invoice.totalAmount)}\n`;
//   t += `\nThank you for your business!`;
//   return t;
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────
// function SectionHeader({ title }) {
//   return (
//     <View style={styles.sectionHeader}>
//       <Text style={styles.sectionHeaderText}>{title}</Text>
//     </View>
//   );
// }

// function Divider() {
//   return <View style={styles.divider} />;
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function InvoiceDetailScreen() {
//   const navigation = useNavigation();
//   const route      = useRoute();
//   const { invoiceId, invoice: seedInvoice } = route.params ?? {};
//   const garage = useSelector((s) => s.auth.garage);

//   const [invoice, setInvoice]           = useState(seedInvoice ?? null);
//   const [loading, setLoading]           = useState(!seedInvoice);
//   const [marking, setMarking]           = useState(false);
//   const [generatingPdf, setGeneratingPdf] = useState(false);

//   // ── Fetch ────────────────────────────────────────────────────────
//   const fetchInvoice = useCallback(async () => {
//     const id = invoiceId ?? seedInvoice?._id;
//     if (!id) return;
//     setLoading(true);
//     try {
//       const res = await axiosClient.get(INVOICE_ENDPOINTS.DETAIL(id));
//       setInvoice(res.data?.data?.invoice ?? null);
//     } catch (e) {
//       Alert.alert("Error", e.displayMessage || "Failed to load invoice.");
//     } finally {
//       setLoading(false);
//     }
//   }, [invoiceId, seedInvoice]);

//   useEffect(() => {
//     if (!seedInvoice) fetchInvoice();
//   }, []);

//   // ── Generate PDF and share ───────────────────────────────────────
//   const handleSharePdf = async () => {
//     if (!invoice) return;
//     setGeneratingPdf(true);
//     try {
//       const html      = buildPdfHtml(invoice, garage);
//       const { uri }   = await Print.printToFileAsync({ html });
//       const available = await Sharing.isAvailableAsync();
//       if (!available) {
//         Alert.alert("Sharing not available", "Your device does not support file sharing.");
//         return;
//       }
//       await Sharing.shareAsync(uri, {
//         mimeType:    "application/pdf",
//         dialogTitle: `Invoice ${invoice.invoiceNo}`,
//         UTI:         "com.adobe.pdf",
//       });
//     } catch (e) {
//       Alert.alert("Error", "Could not generate or share PDF.");
//     } finally {
//       setGeneratingPdf(false);
//     }
//   };

//   // ── SMS share (text only) ────────────────────────────────────────
//   const handleShareSms = () => {
//     const rawPhone = (invoice?.customerId?.phoneNo ?? "").replace(/\D/g, "");
//     const phone    = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
//     const body     = encodeURIComponent(buildShareText(invoice, garage));
//     const url =
//       Platform.OS === "ios"
//         ? `sms:+${phone}&body=${body}`
//         : `sms:+${phone}?body=${body}`;
//     Linking.openURL(url).catch(() =>
//       Alert.alert("Error", "Could not open SMS app.")
//     );
//   };

//   // ── Mark as Paid ─────────────────────────────────────────────────
//   const handleMarkPaid = () => {
//     Alert.alert("Mark as Paid", "Mark this invoice as fully paid?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes, Mark Paid",
//         onPress: async () => {
//           setMarking(true);
//           try {
//             const res = await axiosClient.put(
//               INVOICE_ENDPOINTS.DETAIL(invoice._id),
//               { paymentStatus: "paid", status: "paid" }
//             );
//             setInvoice(
//               res.data?.data?.invoice ?? {
//                 ...invoice,
//                 paymentStatus: "paid",
//                 status: "paid",
//               }
//             );
//           } catch (e) {
//             Alert.alert("Error", e.displayMessage || "Could not update invoice.");
//           } finally {
//             setMarking(false);
//           }
//         },
//       },
//     ]);
//   };

//   // ── Loading / empty ──────────────────────────────────────────────
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safe} edges={["bottom"]}>
//         <TopNav title="Invoice" transparent={false} />
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!invoice) {
//     return (
//       <SafeAreaView style={styles.safe} edges={["bottom"]}>
//         <TopNav title="Invoice" transparent={false} />
//         <View style={styles.center}>
//           <Ionicons name="document-text-outline" size={52} color={COLORS.borderLight} />
//           <Text style={styles.emptyText}>Invoice not found.</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const statusCfg   = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
//   const payStatusCfg = PAYMENT_STATUS_CONFIG[invoice.paymentStatus] ?? PAYMENT_STATUS_CONFIG.unpaid;
//   const customer     = invoice.customerId;
//   const vehicle      = invoice.vehicleId;
//   const isPaid       = invoice.paymentStatus === "paid";
//   const subTotal     = (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);

//   return (
//     <SafeAreaView style={styles.safe} edges={["bottom"]}>
//       {/* ── Nav ── */}
//       <TopNav
//         title={invoice.invoiceNo ?? "Invoice"}
//         transparent={false}
//         rightElement={
//           <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
//             <Text style={[styles.statusPillText, { color: statusCfg.color }]}>
//               {statusCfg.label}
//             </Text>
//           </View>
//         }
//       />

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Invoice document card ── */}
//         <View style={styles.invoiceCard}>
//           {/* Invoice title */}
//           <Text style={styles.invoiceTitle}>INVOICE</Text>

//           {/* ── Garage header ── */}
//           <View style={styles.garageHeader}>
//             <View style={styles.logoCircle}>
//               <Text style={styles.logoLetter}>
//                 {(garage?.garageName ?? "G").charAt(0).toUpperCase()}
//               </Text>
//             </View>
//             <View style={styles.garageInfo}>
//               <Text style={styles.garageName}>
//                 {(garage?.garageName ?? "Garage").toUpperCase()}
//               </Text>
//               {garage?.garageAddress ? (
//                 <Text style={styles.garageDetail}>{garage.garageAddress}</Text>
//               ) : null}
//               {garage?.garageContactNumber ? (
//                 <Text style={styles.garageDetail}>
//                   ☎  {garage.garageContactNumber}
//                 </Text>
//               ) : null}
//               {garage?.gstNumber ? (
//                 <Text style={styles.garageDetail}>GST: {garage.gstNumber}</Text>
//               ) : null}
//             </View>
//           </View>

//           {/* ── Customer / Vehicle / Estimate ── */}
//           <View style={styles.tableHeaderRow}>
//             <Text style={[styles.tableHeaderCell, { flex: 2 }]}>CUSTOMER</Text>
//             <Text style={[styles.tableHeaderCell, { flex: 2 }]}>VEHICLE</Text>
//             <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}>
//               ESTIMATE
//             </Text>
//           </View>
//           <View style={styles.customerRow}>
//             <View style={{ flex: 2 }}>
//               <Text style={styles.customerName}>{customer?.fullName ?? "—"}</Text>
//               {customer?.phoneNo ? (
//                 <Text style={styles.customerDetail}>{customer.phoneNo}</Text>
//               ) : null}
//               {customer?.emailId ? (
//                 <Text style={styles.customerDetail}>{customer.emailId}</Text>
//               ) : null}
//             </View>
//             <View style={{ flex: 2 }}>
//               {vehicle ? (
//                 <>
//                   <Text style={styles.customerName}>
//                     {vehicle.vehicleBrand ?? ""} {vehicle.vehicleModel ?? ""}
//                   </Text>
//                   {vehicle.vehicleRegisterNo ? (
//                     <Text style={styles.customerDetail}>
//                       {vehicle.vehicleRegisterNo}
//                     </Text>
//                   ) : null}
//                 </>
//               ) : (
//                 <Text style={styles.customerDetail}>—</Text>
//               )}
//             </View>
//             <View style={{ flex: 2, alignItems: "flex-end" }}>
//               <Text style={styles.customerDetail}>{fmtDate(invoice.createdAt)}</Text>
//               <Text style={styles.estimateAmount}>₹{fmt(invoice.totalAmount)}</Text>
//             </View>
//           </View>

//           {/* ── Services ── */}
//           {invoice.services?.length > 0 && (
//             <>
//               <View style={styles.tableHeaderRow}>
//                 <Text style={[styles.tableHeaderCell, { flex: 4 }]}>SERVICES</Text>
//                 <Text style={[styles.tableHeaderCell, styles.colCenter, { flex: 1 }]}>
//                   QTY
//                 </Text>
//                 <Text style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}>
//                   RATE
//                 </Text>
//                 <Text style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}>
//                   AMOUNT
//                 </Text>
//               </View>
//               {invoice.services.map((s, i) => (
//                 <View
//                   key={i}
//                   style={[styles.tableDataRow, i % 2 === 1 && styles.tableDataRowAlt]}
//                 >
//                   <Text style={[styles.tableCell, { flex: 4 }]} numberOfLines={2}>
//                     {s.name}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.colCenter, { flex: 1 }]}>1</Text>
//                   <Text style={[styles.tableCell, styles.colRight, { flex: 2 }]}>
//                     {fmt(s.price ?? s.lineTotal)}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.colRight, { flex: 2 }]}>
//                     {fmt(s.lineTotal)}
//                   </Text>
//                 </View>
//               ))}
//               <View style={styles.tableTotalRow}>
//                 <Text style={[styles.tableTotalLabel, { flex: 7 }]}>Total :</Text>
//                 <Text style={[styles.tableTotalValue, { flex: 2 }]}>
//                   ₹{fmt(invoice.servicesSubTotal)}
//                 </Text>
//               </View>
//             </>
//           )}

//           {/* ── Parts ── */}
//           {invoice.parts?.length > 0 && (
//             <>
//               <View style={[styles.tableHeaderRow, { marginTop: 8 }]}>
//                 <Text style={[styles.tableHeaderCell, { flex: 4 }]}>PARTS</Text>
//                 <Text style={[styles.tableHeaderCell, styles.colCenter, { flex: 1 }]}>
//                   QTY
//                 </Text>
//                 <Text style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}>
//                   RATE
//                 </Text>
//                 <Text style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}>
//                   AMOUNT
//                 </Text>
//               </View>
//               {invoice.parts.map((p, i) => (
//                 <View
//                   key={i}
//                   style={[styles.tableDataRow, i % 2 === 1 && styles.tableDataRowAlt]}
//                 >
//                   <Text style={[styles.tableCell, { flex: 4 }]} numberOfLines={2}>
//                     {p.name}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.colCenter, { flex: 1 }]}>
//                     {p.quantity ?? 1}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.colRight, { flex: 2 }]}>
//                     {fmt(p.unitPrice)}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.colRight, { flex: 2 }]}>
//                     {fmt(p.lineTotal)}
//                   </Text>
//                 </View>
//               ))}
//               <View style={styles.tableTotalRow}>
//                 <Text style={[styles.tableTotalLabel, { flex: 7 }]}>Total :</Text>
//                 <Text style={[styles.tableTotalValue, { flex: 2 }]}>
//                   ₹{fmt(invoice.partsSubTotal)}
//                 </Text>
//               </View>
//             </>
//           )}

//           {/* ── Summary ── */}
//           <View style={[styles.tableHeaderRow, { marginTop: 8 }]}>
//             <Text style={styles.tableHeaderCell}>SUMMARY</Text>
//           </View>
//           <View style={styles.summaryBody}>
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>SUB TOTAL:</Text>
//               <Text style={styles.summaryValue}>₹{fmt(subTotal)}</Text>
//             </View>
//             {(invoice.labourCharge ?? 0) > 0 && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>
//                   LABOUR ({invoice.labourPercent ?? 20}%):
//                 </Text>
//                 <Text style={styles.summaryValue}>₹{fmt(invoice.labourCharge)}</Text>
//               </View>
//             )}
//             {(invoice.taxAmount ?? 0) > 0 && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>TAX:</Text>
//                 <Text style={styles.summaryValue}>₹{fmt(invoice.taxAmount)}</Text>
//               </View>
//             )}
//             {(invoice.discountAmount ?? 0) > 0 && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>DISCOUNT:</Text>
//                 <Text style={[styles.summaryValue, { color: COLORS.error }]}>
//                   -₹{fmt(invoice.discountAmount)}
//                 </Text>
//               </View>
//             )}
//             <View style={styles.grandTotalRow}>
//               <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
//               <Text style={styles.grandTotalValue}>₹{fmt(invoice.totalAmount)}</Text>
//             </View>
//           </View>
//         </View>

//         {/* ── Payment & Status chips ── */}
//         <View style={styles.paymentRow}>
//           <View style={styles.paymentChip}>
//             <Ionicons name="card-outline" size={14} color={COLORS.textSecondary} />
//             <Text style={styles.paymentChipText}>
//               {(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
//             </Text>
//           </View>
//           <View
//             style={[styles.paymentChip, { backgroundColor: payStatusCfg.bg }]}
//           >
//             <Text style={[styles.paymentChipText, { color: payStatusCfg.color }]}>
//               {payStatusCfg.label}
//             </Text>
//           </View>
//           <View style={[styles.paymentChip, { backgroundColor: statusCfg.bg }]}>
//             <Text style={[styles.paymentChipText, { color: statusCfg.color }]}>
//               {statusCfg.label}
//             </Text>
//           </View>
//         </View>

//         {/* ── Tags ── */}
//         {invoice.tags?.length > 0 && (
//           <View style={styles.tagsRow}>
//             {invoice.tags.map((tag, i) => (
//               <View key={i} style={styles.tag}>
//                 <Text style={styles.tagText}>{tag}</Text>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* ── Notes ── */}
//         {invoice.notes ? (
//           <View style={styles.notesBox}>
//             <Text style={styles.notesLabel}>Notes</Text>
//             <Text style={styles.notesText}>{invoice.notes}</Text>
//           </View>
//         ) : null}

//         {/* ── Go to list ── */}
//         <TouchableOpacity
//           style={styles.listLinkBtn}
//           onPress={() => navigation.navigate("InvoiceList")}
//           activeOpacity={0.75}
//         >
//           <Ionicons name="list-outline" size={17} color={COLORS.primary} />
//           <Text style={styles.listLinkText}>View All Invoices</Text>
//           <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
//         </TouchableOpacity>

//         <View style={{ height: 160 }} />
//       </ScrollView>

//       {/* ── Bottom Action Bar ── */}
//       <View style={styles.bottomBar}>
//         {/* Share row */}
//         <View style={styles.shareRow}>
//           {/* Share PDF */}
//           <TouchableOpacity
//             style={[styles.shareBtn, generatingPdf && { opacity: 0.6 }]}
//             onPress={handleSharePdf}
//             activeOpacity={0.75}
//             disabled={generatingPdf}
//           >
//             {generatingPdf ? (
//               <ActivityIndicator size="small" color={COLORS.primary} />
//             ) : (
//               <Ionicons name="share-social-outline" size={22} color={COLORS.primary} />
//             )}
//             <Text style={styles.shareBtnLabel}>
//               {generatingPdf ? "Generating…" : "Share PDF"}
//             </Text>
//           </TouchableOpacity>

//           {/* SMS */}
//           <TouchableOpacity
//             style={styles.shareBtn}
//             onPress={handleShareSms}
//             activeOpacity={0.75}
//           >
//             <Ionicons name="chatbubble-outline" size={22} color="#F59E0B" />
//             <Text style={styles.shareBtnLabel}>SMS</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Mark Paid / Paid Banner */}
//         {!isPaid ? (
//           <TouchableOpacity
//             style={[styles.markPaidBtn, marking && { opacity: 0.6 }]}
//             onPress={handleMarkPaid}
//             activeOpacity={0.85}
//             disabled={marking}
//           >
//             {marking ? (
//               <ActivityIndicator size="small" color={COLORS.white} />
//             ) : (
//               <>
//                 <Ionicons
//                   name="checkmark-circle-outline"
//                   size={18}
//                   color={COLORS.white}
//                 />
//                 <Text style={styles.markPaidText}>Mark as Paid</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         ) : (
//           <View style={styles.paidBanner}>
//             <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
//             <Text style={styles.paidBannerText}>Payment Received</Text>
//           </View>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F0F2F5" },
//   scroll: { flex: 1 },
//   scrollContent: { padding: SIZES.screenPadding, paddingTop: SIZES.md },
//   center: { flex: 1, alignItems: "center", justifyContent: "center", gap: SIZES.md },
//   emptyText: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textBase,
//     color: COLORS.textMuted,
//   },

//   // Nav status pill
//   statusPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 5,
//     borderRadius: SIZES.radiusFull,
//   },
//   statusPillText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

//   // ── Invoice document card ──
//   invoiceCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: SIZES.radiusMd,
//     overflow: "hidden",
//     ...SHADOWS.md,
//     marginBottom: SIZES.sm,
//   },
//   invoiceTitle: {
//     fontFamily: FONTS.bold,
//     fontSize: 18,
//     color: "#1a1a1a",
//     textAlign: "center",
//     paddingVertical: 12,
//     letterSpacing: 2,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//   },

//   // Garage header inside card
//   garageHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//   },
//   logoCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: COLORS.primary,
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   logoLetter: {
//     fontFamily: FONTS.extrabold,
//     fontSize: 24,
//     color: COLORS.white,
//   },
//   garageInfo: { flex: 1, alignItems: "flex-end" },
//   garageName: {
//     fontFamily: FONTS.bold,
//     fontSize: 13,
//     color: "#1a1a1a",
//     letterSpacing: 0.5,
//   },
//   garageDetail: {
//     fontFamily: FONTS.regular,
//     fontSize: 11,
//     color: "#555",
//     marginTop: 2,
//   },

//   // ── Table header band (blue) ──
//   tableHeaderRow: {
//     flexDirection: "row",
//     backgroundColor: "#BDD7EE",
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: "#9DC3E6",
//   },
//   tableHeaderCell: {
//     fontFamily: FONTS.bold,
//     fontSize: 10,
//     color: "#1a3a5c",
//     letterSpacing: 0.5,
//   },

//   // Customer / Vehicle / Estimate row
//   customerRow: {
//     flexDirection: "row",
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E8E8E8",
//   },
//   customerName: {
//     fontFamily: FONTS.semibold,
//     fontSize: 12,
//     color: "#1a1a1a",
//     marginBottom: 2,
//   },
//   customerDetail: {
//     fontFamily: FONTS.regular,
//     fontSize: 11,
//     color: "#555",
//     marginTop: 1,
//   },
//   estimateAmount: {
//     fontFamily: FONTS.bold,
//     fontSize: 13,
//     color: COLORS.primary,
//     marginTop: 4,
//   },

//   // ── Table data rows ──
//   tableDataRow: {
//     flexDirection: "row",
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   tableDataRowAlt: { backgroundColor: "#F8FBFF" },
//   tableCell: {
//     fontFamily: FONTS.regular,
//     fontSize: 11,
//     color: "#1a1a1a",
//   },
//   colCenter: { textAlign: "center" },
//   colRight:  { textAlign: "right" },

//   tableTotalRow: {
//     flexDirection: "row",
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//     borderTopWidth: 1,
//     borderTopColor: "#B0B0B0",
//     backgroundColor: "#F8F8F8",
//   },
//   tableTotalLabel: {
//     fontFamily: FONTS.bold,
//     fontSize: 11,
//     color: "#1a1a1a",
//     textAlign: "right",
//   },
//   tableTotalValue: {
//     fontFamily: FONTS.bold,
//     fontSize: 11,
//     color: "#1a1a1a",
//     textAlign: "right",
//   },

//   // ── Summary ──
//   summaryBody: {
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 4,
//   },
//   summaryLabel: {
//     fontFamily: FONTS.regular,
//     fontSize: 11,
//     color: "#555",
//   },
//   summaryValue: {
//     fontFamily: FONTS.medium,
//     fontSize: 11,
//     color: "#1a1a1a",
//   },
//   grandTotalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingTop: 8,
//     marginTop: 4,
//     borderTopWidth: 2,
//     borderTopColor: "#1a1a1a",
//   },
//   grandTotalLabel: {
//     fontFamily: FONTS.bold,
//     fontSize: 13,
//     color: "#1a1a1a",
//   },
//   grandTotalValue: {
//     fontFamily: FONTS.extrabold,
//     fontSize: 15,
//     color: COLORS.primary,
//   },

//   // ── Payment chips ──
//   paymentRow: {
//     flexDirection: "row",
//     gap: SIZES.xs,
//     marginBottom: SIZES.sm,
//     flexWrap: "wrap",
//   },
//   paymentChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: COLORS.bgSection,
//     borderRadius: SIZES.radiusFull,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   paymentChipText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.textSecondary,
//   },

//   // Tags
//   tagsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: SIZES.xs,
//     marginBottom: SIZES.sm,
//   },
//   tag: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     backgroundColor: COLORS.primaryLight,
//     borderRadius: SIZES.radiusFull,
//   },
//   tagText: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textXs,
//     color: COLORS.primary,
//   },

//   // Notes
//   notesBox: {
//     backgroundColor: COLORS.warningLight,
//     borderRadius: SIZES.radiusMd,
//     padding: SIZES.md,
//     marginBottom: SIZES.sm,
//     borderWidth: 1,
//     borderColor: COLORS.secondaryLight,
//   },
//   notesLabel: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.warning,
//     marginBottom: 4,
//   },
//   notesText: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textSecondary,
//   },

//   // List link
//   listLinkBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: SIZES.xs,
//     paddingVertical: SIZES.sm,
//     justifyContent: "center",
//   },
//   listLinkText: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textSm,
//     color: COLORS.primary,
//     flex: 1,
//     textAlign: "center",
//   },

//   // ── Bottom Bar ──
//   bottomBar: {
//     position: "absolute",
//     bottom: Platform.OS === "ios" ? 90 : 70,
//     left: 0,
//     right: 0,
//     backgroundColor: COLORS.bgCard,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.borderLight,
//     paddingHorizontal: SIZES.screenPadding,
//     paddingTop: SIZES.sm,
//     paddingBottom: SIZES.sm,
//     gap: SIZES.sm,
//     ...SHADOWS.md,
//   },
//   shareRow: { flexDirection: "row", gap: SIZES.sm },
//   shareBtn: {
//     flex: 1,
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: COLORS.bgSection,
//     borderRadius: SIZES.radiusMd,
//     paddingVertical: 10,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   shareBtnLabel: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textXs,
//     color: COLORS.textSecondary,
//   },
//   markPaidBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: SIZES.xs,
//     backgroundColor: COLORS.primary,
//     borderRadius: SIZES.radiusMd,
//     paddingVertical: 13,
//   },
//   markPaidText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.white,
//   },
//   paidBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: SIZES.xs,
//     paddingVertical: 12,
//     backgroundColor: COLORS.successLight,
//     borderRadius: SIZES.radiusMd,
//   },
//   paidBannerText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.success,
//   },

//   divider: {
//     height: 1,
//     backgroundColor: COLORS.borderLight,
//     marginVertical: SIZES.sm,
//   },
// });

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { INVOICE_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: "Draft", color: COLORS.textMuted, bg: COLORS.bgSection },
  sent: { label: "Sent", color: COLORS.warning, bg: COLORS.warningLight },
  paid: { label: "Paid", color: COLORS.success, bg: COLORS.successLight },
  cancelled: { label: "Cancelled", color: COLORS.error, bg: COLORS.errorLight },
};

const PAYMENT_STATUS_CONFIG = {
  unpaid: { label: "Unpaid", color: COLORS.error, bg: COLORS.errorLight },
  partial: { label: "Partial", color: COLORS.warning, bg: COLORS.warningLight },
  paid: { label: "Paid", color: COLORS.success, bg: COLORS.successLight },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "0.00";
  return Number(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── PDF HTML Builder ─────────────────────────────────────────────────────────
function buildPdfHtml(invoice, garage) {
  const customer = invoice.customerId;
  const vehicle = invoice.vehicleId;

  const garageName = garage?.garageName ?? "Garage";
  const garageAddress = garage?.garageAddress ?? "";
  const garagePhone = garage?.garageContactNumber ?? "";
  const garageGst = garage?.gstNumber ?? "";

  const logoLetter = garageName.charAt(0).toUpperCase();
  const logoHtml = garage?.garageLogo
    ? `<img src="${garage.garageLogo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div class="logo-circle">${logoLetter}</div>`;

  const serviceRows = (invoice.services ?? [])
    .map(
      (s) => `
      <tr>
        <td>${s.name ?? ""}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${fmt(s.price ?? s.lineTotal)}</td>
        <td style="text-align:right">${fmt(s.lineTotal)}</td>
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

  const subTotal =
    (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);
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
        /* ── Top header ── */
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
          background: #1a6b45;
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
        /* ── Tables ── */
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

      <!-- ── Garage Header ── -->
      <div class="top-header">
        ${logoHtml}
        <div class="garage-info">
          <div class="garage-name">${garageName.toUpperCase()}</div>
          ${garageAddress ? `<div>${garageAddress}</div>` : ""}
          ${garagePhone ? `<div>&#9742;&nbsp;${garagePhone}</div>` : ""}
          ${garageGst ? `<div>GST: ${garageGst}</div>` : ""}
        </div>
      </div>

      <!-- ── Customer / Vehicle / Estimate ── -->
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
            ${fmtDate(invoice.createdAt)}<br>
            Amount: &#8377;${fmt(grandTotal)}
          </td>
        </tr>
      </table>

      <!-- ── Services ── -->
      ${
        serviceRows
          ? `<div class="spacer"></div>
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

      <!-- ── Parts ── -->
      ${
        partRows
          ? `<div class="spacer"></div>
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

      <!-- ── Summary ── -->
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
            (invoice.labourCharge ?? 0) > 0
              ? `<tr>
                   <td class="summary-label">LABOUR (${invoice.labourPercent ?? 20}%):</td>
                   <td class="summary-value">&#8377;${fmt(invoice.labourCharge)}</td>
                 </tr>`
              : ""
          }
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

      <!-- ── Payment ── -->
      <div class="spacer"></div>
      <div style="font-size:11px; color:#555; text-align:center; margin-top:8px;">
        Payment Mode: ${(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Status: ${(invoice.paymentStatus ?? "unpaid").toUpperCase()}
      </div>
      ${invoice.notes ? `<div style="margin-top:12px; font-size:11px; color:#555;"><b>Notes:</b> ${invoice.notes}</div>` : ""}
      <div style="text-align:center; margin-top:20px; font-size:11px; color:#888;">
        Thank you for your business!
      </div>
    </body>
    </html>
  `;
}

// ─── Share text builder (for SMS) ────────────────────────────────────────────
function buildShareText(invoice, garage) {
  if (!invoice) return "";
  const customer = invoice.customerId;
  const vehicle = invoice.vehicleId;

  let t = "";
  if (garage?.garageName) t += `${garage.garageName}\n`;
  if (garage?.garageAddress) t += `${garage.garageAddress}\n`;
  if (garage?.garageContactNumber) t += `Ph: ${garage.garageContactNumber}\n`;

  t += `\nINVOICE: ${invoice.invoiceNo ?? "—"}\n`;
  t += `Date: ${fmtDate(invoice.createdAt)}\n`;

  if (customer?.fullName) {
    t += `\nBill To: ${customer.fullName}\n`;
    if (customer.phoneNo) t += `Ph: ${customer.phoneNo}\n`;
  }
  if (vehicle) {
    t += `Vehicle: ${vehicle.vehicleBrand ?? ""} ${vehicle.vehicleModel ?? ""}`;
    if (vehicle.vehicleRegisterNo) t += ` (${vehicle.vehicleRegisterNo})`;
    t += "\n";
  }

  if (invoice.services?.length) {
    t += `\nServices:\n`;
    invoice.services.forEach(
      (s) => (t += `  ${s.name}: Rs.${fmt(s.lineTotal)}\n`),
    );
  }
  if (invoice.parts?.length) {
    t += `\nParts:\n`;
    invoice.parts.forEach(
      (p) => (t += `  ${p.name} x${p.quantity}: Rs.${fmt(p.lineTotal)}\n`),
    );
  }

  t += `\nSub Total : Rs.${fmt((invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0))}\n`;
  if ((invoice.labourCharge ?? 0) > 0)
    t += `Labour    : Rs.${fmt(invoice.labourCharge)}\n`;
  if ((invoice.taxAmount ?? 0) > 0)
    t += `Tax       : Rs.${fmt(invoice.taxAmount)}\n`;
  if ((invoice.discountAmount ?? 0) > 0)
    t += `Discount  : -Rs.${fmt(invoice.discountAmount)}\n`;
  t += `TOTAL     : Rs.${fmt(invoice.totalAmount)}\n`;
  t += `\nThank you for your business!`;
  return t;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InvoiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoiceId, invoice: seedInvoice } = route.params ?? {};
  const garage = useSelector((s) => s.auth.garage);
  const tabBarHeight = useBottomTabBarHeight();

  const [invoice, setInvoice] = useState(seedInvoice ?? null);
  const [loading, setLoading] = useState(!seedInvoice);
  const [marking, setMarking] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchInvoice = useCallback(async () => {
    const id = invoiceId ?? seedInvoice?._id;
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(INVOICE_ENDPOINTS.DETAIL(id));
      setInvoice(res.data?.data?.invoice ?? null);
    } catch (e) {
      Alert.alert("Error", e.displayMessage || "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, seedInvoice]);

  useEffect(() => {
    if (!seedInvoice) fetchInvoice();
  }, []);

  // ── Generate PDF and share ───────────────────────────────────────
  const handleSharePdf = async () => {
    if (!invoice) return;
    setGeneratingPdf(true);
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
    } catch (e) {
      Alert.alert("Error", "Could not generate or share PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ── SMS share (text only) ────────────────────────────────────────
  const handleShareSms = () => {
    const rawPhone = (invoice?.customerId?.phoneNo ?? "").replace(/\D/g, "");
    const phone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
    const body = encodeURIComponent(buildShareText(invoice, garage));
    const url =
      Platform.OS === "ios"
        ? `sms:+${phone}&body=${body}`
        : `sms:+${phone}?body=${body}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open SMS app."),
    );
  };

  // ── Mark as Paid ─────────────────────────────────────────────────
  const handleMarkPaid = () => {
    Alert.alert("Mark as Paid", "Mark this invoice as fully paid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Mark Paid",
        onPress: async () => {
          setMarking(true);
          try {
            const res = await axiosClient.put(
              INVOICE_ENDPOINTS.DETAIL(invoice._id),
              { paymentStatus: "paid", status: "paid" },
            );
            setInvoice(
              res.data?.data?.invoice ?? {
                ...invoice,
                paymentStatus: "paid",
                status: "paid",
              },
            );
          } catch (e) {
            Alert.alert(
              "Error",
              e.displayMessage || "Could not update invoice.",
            );
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  };

  // ── Loading / empty ──────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <TopNav title="Invoice" transparent={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <TopNav title="Invoice" transparent={false} />
        <View style={styles.center}>
          <Ionicons
            name="document-text-outline"
            size={52}
            color={COLORS.borderLight}
          />
          <Text style={styles.emptyText}>Invoice not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
  const payStatusCfg =
    PAYMENT_STATUS_CONFIG[invoice.paymentStatus] ??
    PAYMENT_STATUS_CONFIG.unpaid;
  const customer = invoice.customerId;
  const vehicle = invoice.vehicleId;
  const isPaid = invoice.paymentStatus === "paid";
  const subTotal =
    (invoice.servicesSubTotal ?? 0) + (invoice.partsSubTotal ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* ── Nav ── */}
      <TopNav
        title={invoice.invoiceNo ?? "Invoice"}
        transparent={false}
        rightElement={
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Invoice document card ── */}
        <View style={styles.invoiceCard}>
          {/* Invoice title */}
          <Text style={styles.invoiceTitle}>INVOICE</Text>

          {/* ── Garage header ── */}
          <View style={styles.garageHeader}>
            {garage?.garageLogo ? (
              <Image
                source={{ uri: garage.garageLogo }}
                style={styles.logoCircle}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>
                  {(garage?.garageName ?? "G").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.garageInfo}>
              <Text style={styles.garageName}>
                {(garage?.garageName ?? "Garage").toUpperCase()}
              </Text>
              {garage?.garageAddress ? (
                <Text style={styles.garageDetail}>{garage.garageAddress}</Text>
              ) : null}
              {garage?.garageContactNumber ? (
                <Text style={styles.garageDetail}>
                  ☎ {garage.garageContactNumber}
                </Text>
              ) : null}
              {garage?.gstNumber ? (
                <Text style={styles.garageDetail}>GST: {garage.gstNumber}</Text>
              ) : null}
            </View>
          </View>

          {/* ── Customer / Vehicle / Estimate ── */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>CUSTOMER</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>VEHICLE</Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}
            >
              ESTIMATE
            </Text>
          </View>
          <View style={styles.customerRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.customerName}>
                {customer?.fullName ?? "—"}
              </Text>
              {customer?.phoneNo ? (
                <Text style={styles.customerDetail}>{customer.phoneNo}</Text>
              ) : null}
              {customer?.emailId ? (
                <Text style={styles.customerDetail}>{customer.emailId}</Text>
              ) : null}
            </View>
            <View style={{ flex: 2 }}>
              {vehicle ? (
                <>
                  <Text style={styles.customerName}>
                    {vehicle.vehicleBrand ?? ""} {vehicle.vehicleModel ?? ""}
                  </Text>
                  {vehicle.vehicleRegisterNo ? (
                    <Text style={styles.customerDetail}>
                      {vehicle.vehicleRegisterNo}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.customerDetail}>—</Text>
              )}
            </View>
            <View style={{ flex: 2, alignItems: "flex-end" }}>
              <Text style={styles.customerDetail}>
                {fmtDate(invoice.createdAt)}
              </Text>
              <Text style={styles.estimateAmount}>
                ₹{fmt(invoice.totalAmount)}
              </Text>
            </View>
          </View>

          {/* ── Services ── */}
          {invoice.services?.length > 0 && (
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 4 }]}>
                  SERVICES
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.colCenter,
                    { flex: 1 },
                  ]}
                >
                  QTY
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}
                >
                  RATE
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}
                >
                  AMOUNT
                </Text>
              </View>
              {invoice.services.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableDataRow,
                    i % 2 === 1 && styles.tableDataRowAlt,
                  ]}
                >
                  <Text
                    style={[styles.tableCell, { flex: 4 }]}
                    numberOfLines={2}
                  >
                    {s.name}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCenter, { flex: 1 }]}
                  >
                    1
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colRight, { flex: 2 }]}
                  >
                    {fmt(s.price ?? s.lineTotal)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colRight, { flex: 2 }]}
                  >
                    {fmt(s.lineTotal)}
                  </Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tableTotalLabel, { flex: 7 }]}>
                  Total :
                </Text>
                <Text style={[styles.tableTotalValue, { flex: 2 }]}>
                  ₹{fmt(invoice.servicesSubTotal)}
                </Text>
              </View>
            </>
          )}

          {/* ── Parts ── */}
          {invoice.parts?.length > 0 && (
            <>
              <View style={[styles.tableHeaderRow, { marginTop: 8 }]}>
                <Text style={[styles.tableHeaderCell, { flex: 4 }]}>PARTS</Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.colCenter,
                    { flex: 1 },
                  ]}
                >
                  QTY
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}
                >
                  RATE
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.colRight, { flex: 2 }]}
                >
                  AMOUNT
                </Text>
              </View>
              {invoice.parts.map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableDataRow,
                    i % 2 === 1 && styles.tableDataRowAlt,
                  ]}
                >
                  <Text
                    style={[styles.tableCell, { flex: 4 }]}
                    numberOfLines={2}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCenter, { flex: 1 }]}
                  >
                    {p.quantity ?? 1}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colRight, { flex: 2 }]}
                  >
                    {fmt(p.unitPrice)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colRight, { flex: 2 }]}
                  >
                    {fmt(p.lineTotal)}
                  </Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tableTotalLabel, { flex: 7 }]}>
                  Total :
                </Text>
                <Text style={[styles.tableTotalValue, { flex: 2 }]}>
                  ₹{fmt(invoice.partsSubTotal)}
                </Text>
              </View>
            </>
          )}

          {/* ── Summary ── */}
          <View style={[styles.tableHeaderRow, { marginTop: 8 }]}>
            <Text style={styles.tableHeaderCell}>SUMMARY</Text>
          </View>
          <View style={styles.summaryBody}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUB TOTAL:</Text>
              <Text style={styles.summaryValue}>₹{fmt(subTotal)}</Text>
            </View>
            {(invoice.labourCharge ?? 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  LABOUR ({invoice.labourPercent ?? 20}%):
                </Text>
                <Text style={styles.summaryValue}>
                  ₹{fmt(invoice.labourCharge)}
                </Text>
              </View>
            )}
            {(invoice.taxAmount ?? 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>TAX:</Text>
                <Text style={styles.summaryValue}>
                  ₹{fmt(invoice.taxAmount)}
                </Text>
              </View>
            )}
            {(invoice.discountAmount ?? 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>DISCOUNT:</Text>
                <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                  -₹{fmt(invoice.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
              <Text style={styles.grandTotalValue}>
                ₹{fmt(invoice.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Payment & Status chips ── */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentChip}>
            <Ionicons
              name="card-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.paymentChipText}>
              {(invoice.paymentMode ?? "cash").replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View
            style={[styles.paymentChip, { backgroundColor: payStatusCfg.bg }]}
          >
            <Text
              style={[styles.paymentChipText, { color: payStatusCfg.color }]}
            >
              {payStatusCfg.label}
            </Text>
          </View>
          <View style={[styles.paymentChip, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.paymentChipText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* ── Tags ── */}
        {invoice.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {invoice.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Notes ── */}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Go to list ── */}
        <TouchableOpacity
          style={styles.listLinkBtn}
          onPress={() => navigation.navigate("InvoiceList")}
          activeOpacity={0.75}
        >
          <Ionicons name="list-outline" size={17} color={COLORS.primary} />
          <Text style={styles.listLinkText}>View All Invoices</Text>
          <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[styles.bottomBar, { bottom: tabBarHeight }]}>
        {/* Share row */}
        <View style={styles.shareRow}>
          {/* Share PDF */}
          <TouchableOpacity
            style={[styles.shareBtn, generatingPdf && { opacity: 0.6 }]}
            onPress={handleSharePdf}
            activeOpacity={0.75}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="share-social-outline"
                size={22}
                color={COLORS.primary}
              />
            )}
            <Text style={styles.shareBtnLabel}>
              {generatingPdf ? "Generating…" : "Share PDF"}
            </Text>
          </TouchableOpacity>

          {/* SMS */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareSms}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#F59E0B" />
            <Text style={styles.shareBtnLabel}>SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Mark Paid / Paid Banner */}
        {!isPaid ? (
          <TouchableOpacity
            style={[styles.markPaidBtn, marking && { opacity: 0.6 }]}
            onPress={handleMarkPaid}
            activeOpacity={0.85}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={COLORS.white}
                />
                <Text style={styles.markPaidText}>Mark as Paid</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.success}
            />
            <Text style={styles.paidBannerText}>Payment Received</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F2F5" },
  scroll: { flex: 1 },
  scrollContent: { padding: SIZES.screenPadding, paddingTop: SIZES.md },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.md,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
  },

  // Nav status pill
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  statusPillText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs },

  // ── Invoice document card ──
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: SIZES.radiusMd,
    overflow: "hidden",
    ...SHADOWS.md,
    marginBottom: SIZES.sm,
  },
  invoiceTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: "#1a1a1a",
    textAlign: "center",
    paddingVertical: 12,
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  // Garage header inside card
  garageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: {
    fontFamily: FONTS.extrabold,
    fontSize: 24,
    color: COLORS.white,
  },
  garageInfo: { flex: 1, alignItems: "flex-end" },
  garageName: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  garageDetail: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: "#555",
    marginTop: 2,
  },

  // ── Table header band (blue) ──
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#BDD7EE",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#9DC3E6",
  },
  tableHeaderCell: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: "#1a3a5c",
    letterSpacing: 0.5,
  },

  // Customer / Vehicle / Estimate row
  customerRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  customerName: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  customerDetail: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: "#555",
    marginTop: 1,
  },
  estimateAmount: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 4,
  },

  // ── Table data rows ──
  tableDataRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tableDataRowAlt: { backgroundColor: "#F8FBFF" },
  tableCell: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: "#1a1a1a",
  },
  colCenter: { textAlign: "center" },
  colRight: { textAlign: "right" },

  tableTotalRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "#B0B0B0",
    backgroundColor: "#F8F8F8",
  },
  tableTotalLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#1a1a1a",
    textAlign: "right",
  },
  tableTotalValue: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#1a1a1a",
    textAlign: "right",
  },

  // ── Summary ──
  summaryBody: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: "#555",
  },
  summaryValue: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: "#1a1a1a",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
  },
  grandTotalLabel: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: "#1a1a1a",
  },
  grandTotalValue: {
    fontFamily: FONTS.extrabold,
    fontSize: 15,
    color: COLORS.primary,
  },

  // ── Payment chips ──
  paymentRow: {
    flexDirection: "row",
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
    flexWrap: "wrap",
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  paymentChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusFull,
  },
  tagText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },

  // Notes
  notesBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.secondaryLight,
  },
  notesLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.warning,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },

  // List link
  listLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs,
    paddingVertical: SIZES.sm,
    justifyContent: "center",
  },
  listLinkText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    flex: 1,
    textAlign: "center",
  },

  // ── Bottom Bar ──
  bottomBar: {
    marginBottom: 40,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.sm,
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  shareRow: { flexDirection: "row", gap: SIZES.sm },
  shareBtn: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  shareBtnLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  markPaidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.xs,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 13,
  },
  markPaidText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
  },
  paidBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.xs,
    paddingVertical: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radiusMd,
  },
  paidBannerText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.success,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.sm,
  },
});
