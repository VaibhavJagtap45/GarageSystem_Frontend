import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "0.00";
  return Number(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// RFC 4180-compliant CSV cell escaping
function csvCell(value) {
  if (value == null) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const HEADERS = [
  "Order No",
  "Date",
  "Customer Name",
  "Phone",
  "Vehicle Reg",
  "Vehicle",
  "Status",
  "Services (₹)",
  "Parts (₹)",
  "Discount (₹)",
  "Tax (₹)",
  "Total (₹)",
  "Payment Mode",
];

function rowValues(r) {
  return [
    r.orderNo,
    r.date,
    r.customerName,
    r.customerPhone,
    r.vehicleRegNo,
    r.vehicle,
    r.status,
    r.servicesTotal,
    r.partsTotal,
    r.discountAmount,
    r.taxTotal,
    r.totalAmount,
    r.paymentMode,
  ];
}

// ── CSV builder ──────────────────────────────────────────────────────────────
// UTF-8 BOM + \r\n line endings — required for Tally & Excel to open correctly
function buildCsv(rows) {
  const lines = [HEADERS.map(csvCell).join(",")];
  for (const r of rows) lines.push(rowValues(r).map(csvCell).join(","));
  return "\uFEFF" + lines.join("\r\n");
}

// ── HTML (Excel-compatible XLS) builder ──────────────────────────────────────
// Microsoft Office recognises this MHTML envelope and opens it as a spreadsheet.
// No xlsx library needed — Excel opens HTML tables with .xls extension natively.
function buildExcelHtml(rows, dateFrom, dateTo) {
  const thCells = HEADERS.map((h) => `<th>${h}</th>`).join("");
  const bodyRows = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f2f7ff";
      const tds = rowValues(r)
        .map((v) => `<td>${v ?? ""}</td>`)
        .join("");
      return `<tr style="background:${bg}">${tds}</tr>`;
    })
    .join("");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <!--[if gte mso 9]><xml>
    <x:ExcelWorkbook><x:ExcelWorksheets>
      <x:ExcelWorksheet><x:Name>Tally Export</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets></x:ExcelWorkbook>
  </xml><![endif]-->
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    h2 { color: #1a3a5c; margin-bottom: 4px; }
    p  { color: #666; font-size: 10pt; margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #1a3a5c; color: #fff; padding: 7px 10px; text-align: left; font-size: 10pt; }
    td { padding: 6px 10px; border-bottom: 1px solid #dde3ea; font-size: 10pt; }
    .total-row { font-weight: bold; background: #eef4ff !important; }
  </style>
</head>
<body>
  <h2>Tally Export — Repair Orders</h2>
  <p>Date range: ${dateFrom} to ${dateTo} &nbsp;|&nbsp; Total orders: ${rows.length}</p>
  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

// ── HTML (PDF-ready) builder ──────────────────────────────────────────────────
function buildPdfHtml(rows, dateFrom, dateTo) {
  const totalAmount = rows.reduce(
    (s, r) => s + (Number(r.totalAmount) || 0),
    0,
  );
  const thCells = HEADERS.map((h) => `<th>${h}</th>`).join("");
  const bodyRows = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f0f4fa";
      const tds = rowValues(r)
        .map((v, idx) => {
          const align = idx >= 7 && idx <= 11 ? "right" : "left";
          return `<td style="text-align:${align}">${v ?? ""}</td>`;
        })
        .join("");
      return `<tr style="background:${bg}">${tds}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  @page { margin: 16mm; size: A4 landscape; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #222; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .title { font-size: 18pt; font-weight: bold; color: #1a3a5c; }
  .subtitle { font-size: 9pt; color: #666; margin-top: 2px; }
  .badge { background: #1a3a5c; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
  .summary { display: flex; gap: 16px; margin-bottom: 14px; }
  .sumbox { background: #f0f4fa; border-radius: 6px; padding: 8px 16px; text-align: center; flex: 1; }
  .sumval { font-size: 14pt; font-weight: bold; color: #1a3a5c; }
  .sumlbl { font-size: 8pt; color: #888; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1a3a5c; color: #fff; }
  th { padding: 6px 7px; font-size: 8pt; text-align: left; white-space: nowrap; }
  td { padding: 5px 7px; font-size: 8pt; border-bottom: 1px solid #e0e5f0; }
  .footer { margin-top: 16px; font-size: 8pt; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="title">Tally Export</div>
    <div class="subtitle">Repair Order Summary &nbsp;|&nbsp; ${dateFrom} → ${dateTo}</div>
  </div>
  <div class="badge">Aapno Garage</div>
</div>
<div class="summary">
  <div class="sumbox"><div class="sumval">${rows.length}</div><div class="sumlbl">Total Orders</div></div>
  <div class="sumbox"><div class="sumval" style="color:#1a7a4c">₹${fmt(totalAmount)}</div><div class="sumlbl">Grand Total</div></div>
  <div class="sumbox"><div class="sumval">${rows.filter((r) => r.paymentMode === "cash").length}</div><div class="sumlbl">Cash</div></div>
  <div class="sumbox"><div class="sumval">${rows.filter((r) => r.paymentMode !== "cash").length}</div><div class="sumlbl">Digital / Other</div></div>
</div>
<table>
  <thead><tr>${thCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
<div class="footer">Generated on ${new Date().toLocaleString("en-IN")} — Aapno Garage System</div>
</body></html>`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseDateInput(str) {
  if (!str || str.length < 10) return null;
  const [d, m, y] = str.split("/");
  if (!d || !m || !y) return null;
  const dt = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}
function today() {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")}/${String(n.getMonth() + 1).padStart(2, "0")}/${n.getFullYear()}`;
}
function firstOfMonth() {
  const n = new Date();
  return `01/${String(n.getMonth() + 1).padStart(2, "0")}/${n.getFullYear()}`;
}

import * as FileSystem from "expo-file-system";

// ─── Export format config ─────────────────────────────────────────────────────
const FORMATS = [
  {
    id: "pdf",
    label: "PDF",
    icon: "document-text-outline",
    color: "#C0392B",
    bg: "#FDEDEC",
    desc: "Formatted A4 report",
  },
  {
    id: "csv",
    label: "CSV",
    icon: "grid-outline",
    color: "#1a7a4c",
    bg: "#edfaf4",
    desc: "For Tally & spreadsheets",
  },
  {
    id: "excel",
    label: "Excel",
    icon: "stats-chart-outline",
    color: "#1D6F42",
    bg: "#e8f5ee",
    desc: "Opens in MS Excel",
  },
];

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TallyExportScreen() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exportingFmt, setExportingFmt] = useState(null); // "pdf" | "csv" | "excel" | null

  // ── Generate data from backend ───────────────────────────────────────────
  const handleGenerate = async () => {
    const from = parseDateInput(dateFrom);
    const to = parseDateInput(dateTo);
    if (!from) {
      Alert.alert("Invalid date", "Enter From date as DD/MM/YYYY");
      return;
    }
    if (!to) {
      Alert.alert("Invalid date", "Enter To date as DD/MM/YYYY");
      return;
    }

    setLoading(true);
    setGenerated(false);
    setRows([]);
    try {
      const res = await axiosClient.get("/repair-orders/tally-export", {
        params: { dateFrom: from, dateTo: to },
      });
      setRows(res.data?.data?.rows ?? []);
      setGenerated(true);
    } catch (e) {
      Alert.alert(
        "Error",
        e.displayMessage ??
          "Could not fetch export data. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Export as PDF (uses expo-print — no file-system needed) ──────────────
  const exportPdf = async () => {
    setExportingFmt("pdf");
    try {
      const html = buildPdfHtml(rows, dateFrom, dateTo);
      // printToFileAsync writes to a temp dir internally — no expo-file-system import needed
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not supported on this device/emulator.",
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Tally Export PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      Alert.alert("PDF Export Failed", e?.message ?? "Could not generate PDF.");
    } finally {
      setExportingFmt(null);
    }
  };

  // ── Export as CSV or Excel (uses expo-file-system) ────────────────────────
  const exportFileFormat = async (format) => {
    setExportingFmt(format);
    try {
      const ts = Date.now();
      let content, fileName, mimeType, uti;

      if (format === "csv") {
        content = buildCsv(rows);
        fileName = `tally_export_${ts}.csv`;
        mimeType = "text/csv";
        uti = "public.comma-separated-values-text";
      } else {
        // Excel — HTML table with Office XML namespace envelope
        content = buildExcelHtml(rows, dateFrom, dateTo);
        fileName = `tally_export_${ts}.xls`;
        mimeType = "application/vnd.ms-excel";
        uti = "com.microsoft.excel.xls";
      }

      const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      const fileUri = baseDir + fileName;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing Unavailable", "File saved at:\n" + fileUri);
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Share ${format.toUpperCase()} Export`,
        UTI: uti,
      });
    } catch (e) {
      Alert.alert(
        `${format.toUpperCase()} Export Failed`,
        e?.message ?? "Could not export file.",
      );
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExport = (fmt) => {
    if (!rows.length) {
      Alert.alert("No data", "Generate the export first.");
      return;
    }
    if (fmt === "pdf") return exportPdf();
    return exportFileFormat(fmt);
  };

  const totalAmount = rows.reduce(
    (s, r) => s + (Number(r.totalAmount) || 0),
    0,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Tally Export" showBack transparent={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            Export repair orders for Tally accounting. Choose PDF, CSV, or Excel
            after generating.
          </Text>
        </View>

        {/* ── Date range card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Date Range</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>From Date</Text>
              <View style={styles.dateInputWrap}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <TextInput
                  style={styles.dateInput}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={COLORS.textMuted}
              style={{ marginTop: 22 }}
            />
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>To Date</Text>
              <View style={styles.dateInputWrap}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <TextInput
                  style={styles.dateInput}
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.btnDisabled]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="sync-outline" size={18} color={COLORS.white} />
                <Text style={styles.generateBtnText}>Generate Export</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Summary + Export buttons ── */}
        {generated && rows.length > 0 && (
          <>
            {/* Summary strip */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{rows.length}</Text>
                <Text style={styles.summaryLabel}>Orders</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                  ₹{fmt(totalAmount)}
                </Text>
                <Text style={styles.summaryLabel}>Total Amount</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{dateFrom}</Text>
                <Text style={styles.summaryLabel}>From</Text>
              </View>
            </View>

            {/* Export format cards */}
            <Text style={styles.exportTitle}>Export Format</Text>
            <View style={styles.formatRow}>
              {FORMATS.map((fmt) => {
                const isExporting = exportingFmt === fmt.id;
                return (
                  <TouchableOpacity
                    key={fmt.id}
                    style={[
                      styles.formatCard,
                      {
                        borderColor: fmt.color + "55",
                        backgroundColor: fmt.bg,
                      },
                    ]}
                    onPress={() => handleExport(fmt.id)}
                    disabled={!!exportingFmt}
                    activeOpacity={0.8}
                  >
                    {isExporting ? (
                      <ActivityIndicator size="small" color={fmt.color} />
                    ) : (
                      <Ionicons name={fmt.icon} size={26} color={fmt.color} />
                    )}
                    <Text style={[styles.fmtLabel, { color: fmt.color }]}>
                      {fmt.label}
                    </Text>
                    <Text style={styles.fmtDesc}>{fmt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preview table */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Preview — first {Math.min(rows.length, 10)} of {rows.length} row
                {rows.length !== 1 ? "s" : ""}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    {[
                      "Order No",
                      "Date",
                      "Customer",
                      "Vehicle",
                      "Total (₹)",
                      "Mode",
                    ].map((h) => (
                      <Text
                        key={h}
                        style={[styles.tableCell, styles.tableHeaderCell]}
                      >
                        {h}
                      </Text>
                    ))}
                  </View>
                  {rows.slice(0, 10).map((r, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableRow,
                        i % 2 === 1 && styles.tableRowAlt,
                      ]}
                    >
                      <Text style={styles.tableCell}>{r.orderNo}</Text>
                      <Text style={styles.tableCell}>{r.date}</Text>
                      <Text
                        style={[styles.tableCell, { width: 120 }]}
                        numberOfLines={1}
                      >
                        {r.customerName}
                      </Text>
                      <Text
                        style={[styles.tableCell, { width: 100 }]}
                        numberOfLines={1}
                      >
                        {r.vehicleRegNo || r.vehicle}
                      </Text>
                      <Text style={[styles.tableCell, { textAlign: "right" }]}>
                        ₹{fmt(r.totalAmount)}
                      </Text>
                      <Text style={styles.tableCell}>{r.paymentMode}</Text>
                    </View>
                  ))}
                  {rows.length > 10 && (
                    <Text style={styles.moreRows}>
                      … and {rows.length - 10} more rows in the export
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </>
        )}

        {/* Empty state */}
        {generated && rows.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons
              name="document-outline"
              size={48}
              color={COLORS.borderLight}
            />
            <Text style={styles.emptyText}>
              No orders found for this date range.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 60 },

  infoBanner: {
    flexDirection: "row",
    gap: SIZES.sm,
    alignItems: "flex-start",
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    lineHeight: 18,
  },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },

  dateRow: {
    flexDirection: "row",
    gap: SIZES.sm,
    alignItems: "flex-end",
    marginBottom: SIZES.md,
  },
  dateField: { flex: 1 },
  dateLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginBottom: 5,
  },
  dateInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
  },
  dateInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    padding: 0,
  },

  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.xs,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 13,
  },
  btnDisabled: { opacity: 0.6 },
  generateBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.white,
  },

  // Summary strip
  summaryCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  summaryItem: { flex: 1, padding: SIZES.md, alignItems: "center", gap: 3 },
  summaryValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight },

  // Export format picker
  exportTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  formatRow: { flexDirection: "row", gap: SIZES.sm },
  formatCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 100,
    ...SHADOWS.sm,
  },
  fmtLabel: { fontFamily: FONTS.bold, fontSize: SIZES.textBase },
  fmtDesc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  // Preview table
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableRowAlt: { backgroundColor: COLORS.bgSection },
  tableHeader: { backgroundColor: "#BDD7EE" },
  tableCell: {
    width: 80,
    padding: 8,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textPrimary,
  },
  tableHeaderCell: { fontFamily: FONTS.bold, color: "#1a3a5c" },
  moreRows: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    padding: SIZES.sm,
    textAlign: "center",
  },

  emptyWrap: { alignItems: "center", paddingVertical: SIZES.xl, gap: SIZES.sm },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
