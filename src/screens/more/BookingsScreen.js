import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  REPAIR_ORDER_ENDPOINTS,
  CATALOG_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";
import {
  listBookings,
  createBooking,
  updateBookingStatus,
  syncBookingCalendar,
} from "../../api/booking";
import { addUser } from "../../api/user";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
  { key: "cancelled",   label: "Cancelled" },
];

const STATUS_META = {
  pending:     { bg: "#FEF3C7", text: "#D97706", label: "Pending" },
  confirmed:   { bg: "#D1FAE5", text: "#059669", label: "Confirmed" },
  in_progress: { bg: "#DBEAFE", text: "#2563EB", label: "In Progress" },
  completed:   { bg: "#F3F4F6", text: "#374151", label: "Completed" },
  cancelled:   { bg: "#FEE2E2", text: "#DC2626", label: "Cancelled" },
};

const CALENDAR_SYNC_META = {
  synced:         { bg: "#D1FAE5", text: "#059669", icon: "checkmark-circle-outline", label: "Google Calendar synced" },
  failed:         { bg: "#FEE2E2", text: "#DC2626", icon: "alert-circle-outline", label: "Calendar sync failed" },
  not_connected:  { bg: "#FEF3C7", text: "#D97706", icon: "link-outline", label: "Connect Google Calendar" },
  not_configured: { bg: "#FEF3C7", text: "#D97706", icon: "settings-outline", label: "Calendar setup required" },
  deleted:        { bg: "#F3F4F6", text: "#374151", icon: "trash-outline", label: "Calendar event removed" },
  not_synced:     { bg: "#EFF6FF", text: "#2563EB", icon: "cloud-upload-outline", label: "Calendar not synced" },
};

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatScheduledAt(dateStr) {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  const day  = DAY_NAMES[d.getDay()];
  const date = d.getDate();
  const mon  = MONTH_SHORT[d.getMonth()];
  const h    = d.getHours();
  const m    = d.getMinutes();
  const ampm = h < 12 ? "AM" : "PM";
  const dh   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${day}, ${date} ${mon}  •  ${dh}:${String(m).padStart(2,"0")} ${ampm}`;
}

function buildShareText(booking, garageName) {
  const dt      = formatScheduledAt(booking.scheduledAt);
  const service = booking.serviceType || "General Service";
  const cust    = booking.customer || {};
  const veh     = booking.vehicle;
  const vehStr  = veh
    ? `${veh.vehicleBrand || ""} ${veh.vehicleModel || ""}${veh.vehicleRegisterNo ? ` (${veh.vehicleRegisterNo})` : ""}`.trim()
    : "";
  return (
    `*Booking Confirmed!* ✅\n` +
    `Booking No: ${booking.bookingNo || ""}\n` +
    `Customer: ${cust.fullName || ""}\n` +
    `Date & Time: ${dt}\n` +
    `Service: ${service}\n` +
    (vehStr ? `Vehicle: ${vehStr}\n` : "") +
    `Garage: ${garageName}\n\n` +
    `Please arrive 5 mins early. See you soon! 🔧`
  );
}

// Generate next 30 days
const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

// Time slots 8 AM – 7 PM every 30 min
const TIME_SLOTS = (() => {
  const slots = [];
  for (let min = 8 * 60; min <= 19 * 60; min += 30) {
    const h    = Math.floor(min / 60);
    const m    = min % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const dh   = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push({ label: `${dh}:${String(m).padStart(2,"0")} ${ampm}`, hours: h, minutes: m });
  }
  return slots;
})();

// ─────────────────────────────────────────────────────────────────────────────
// BookingCard
// ─────────────────────────────────────────────────────────────────────────────
function BookingCard({
  booking,
  garageName,
  onStatusChange,
  onCreateRO,
  onRetryCalendarSync,
  navigation,
}) {
  const { status } = booking;
  const sm       = STATUS_META[status] || STATUS_META.pending;
  const customer = booking.customer || {};
  const vehicle  = booking.vehicle;
  const rawPhone = (customer.phoneNo || "").replace(/\D/g, "");
  const phone    = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
  const canAct   = status === "pending" || status === "confirmed";
  const calendarStatus =
    booking.googleCalendar?.syncStatus ||
    (status === "confirmed" ? "not_synced" : null);
  const calendarMeta = calendarStatus
    ? CALENDAR_SYNC_META[calendarStatus] || CALENDAR_SYNC_META.not_synced
    : null;

  const shareWhatsApp = () => {
    const text = encodeURIComponent(buildShareText(booking, garageName));
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${text}`).catch(() =>
      Alert.alert("WhatsApp not installed", "Please install WhatsApp to use this feature."),
    );
  };

  const shareSms = () => {
    const body = encodeURIComponent(buildShareText(booking, garageName));
    const url  = Platform.OS === "ios"
      ? `sms:+${phone}&body=${body}`
      : `sms:+${phone}?body=${body}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open SMS."));
  };

  const handleCalendarAction = () => {
    if (booking.googleCalendar?.htmlLink) {
      Linking.openURL(booking.googleCalendar.htmlLink).catch(() =>
        Alert.alert("Error", "Could not open Google Calendar."),
      );
      return;
    }
    if (calendarStatus === "not_connected" || calendarStatus === "not_configured") {
      navigation.navigate("GoogleCalendarSettings");
      return;
    }
    if (status === "confirmed") {
      onRetryCalendarSync(booking);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top row: booking no + status badge + self-booked tag */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.bookingNo}>{booking.bookingNo || "—"}</Text>
          <View style={[styles.badge, { backgroundColor: sm.bg }]}>
            <Text style={[styles.badgeText, { color: sm.text }]}>{sm.label}</Text>
          </View>
          {booking.bookedBy === "customer" && (
            <View style={styles.selfTag}>
              <Ionicons name="person-outline" size={9} color={COLORS.primary} />
              <Text style={styles.selfTagText}>Self-booked</Text>
            </View>
          )}
        </View>
        {booking.repairOrderId && (
          <TouchableOpacity
            style={styles.roTag}
            onPress={() =>
              navigation.navigate("CustomerRepairOrder", {
                fromBooking: {
                  _id: booking._id,
                  bookingNo: booking.bookingNo,
                  customer: booking.customer,
                  vehicle: booking.vehicle,
                  serviceType: booking.serviceType,
                  notes: booking.notes,
                  scheduledAt: booking.scheduledAt,
                },
              })
            }
          >
            <Ionicons name="document-text-outline" size={12} color={COLORS.success} />
            <Text style={styles.roTagText}>RO Created</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Customer */}
      <View style={styles.infoRow}>
        <Ionicons name="person-circle-outline" size={15} color={COLORS.textMuted} />
        <Text style={styles.infoText} numberOfLines={1}>
          {customer.fullName || "—"}
          {customer.phoneNo ? `  ·  ${customer.phoneNo}` : ""}
        </Text>
      </View>

      {/* Date/time */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
        <Text style={[styles.infoText, { color: COLORS.primary, fontFamily: FONTS.semibold }]}>
          {formatScheduledAt(booking.scheduledAt)}
        </Text>
      </View>

      {calendarMeta ? (
        <View style={[styles.calendarSyncBox, { backgroundColor: calendarMeta.bg }]}>
          <Ionicons name={calendarMeta.icon} size={14} color={calendarMeta.text} />
          <Text style={[styles.calendarSyncText, { color: calendarMeta.text }]}>
            {calendarMeta.label}
          </Text>
          {booking.googleCalendar?.lastError ? (
            <Text
              style={[styles.calendarSyncError, { color: calendarMeta.text }]}
              numberOfLines={1}
            >
              {booking.googleCalendar.lastError}
            </Text>
          ) : null}
          {["failed", "not_synced"].includes(calendarStatus) ? (
            <TouchableOpacity onPress={() => onRetryCalendarSync(booking)}>
              <Text style={[styles.calendarSyncAction, { color: calendarMeta.text }]}>
                Retry
              </Text>
            </TouchableOpacity>
          ) : null}
          {["not_connected", "not_configured"].includes(calendarStatus) ? (
            <TouchableOpacity onPress={() => navigation.navigate("GoogleCalendarSettings")}>
              <Text style={[styles.calendarSyncAction, { color: calendarMeta.text }]}>
                Setup
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Service */}
      {booking.serviceType ? (
        <View style={styles.infoRow}>
          <Ionicons name="construct-outline" size={15} color={COLORS.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{booking.serviceType}</Text>
        </View>
      ) : null}

      {/* Vehicle */}
      {vehicle ? (
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={15} color={COLORS.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {vehicle.vehicleBrand} {vehicle.vehicleModel}
            {vehicle.vehicleRegisterNo ? `  ·  ${vehicle.vehicleRegisterNo}` : ""}
          </Text>
        </View>
      ) : null}

      {/* Notes */}
      {booking.notes ? (
        <View style={styles.infoRow}>
          <Ionicons name="chatbubble-outline" size={13} color={COLORS.textMuted} />
          <Text style={[styles.infoText, { color: COLORS.textMuted }]} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      ) : null}

      {/* Share row */}
      <View style={styles.shareRow}>
        <TouchableOpacity style={styles.shareBtn} onPress={shareWhatsApp}>
          <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
          <Text style={[styles.shareBtnText, { color: "#25D366" }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={shareSms}>
          <Ionicons name="chatbubble-ellipses-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.shareBtnText}>SMS</Text>
        </TouchableOpacity>
        {(status === "confirmed" || booking.googleCalendar?.htmlLink) && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleCalendarAction}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.error} />
            <Text style={[styles.shareBtnText, { color: COLORS.error }]}>
              {booking.googleCalendar?.htmlLink ? "Open Event" : "Sync Calendar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      {canAct && (
        <View style={styles.actionsRow}>
          {status === "pending" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
              onPress={() => onStatusChange(booking._id, "confirmed", booking)}
            >
              <Ionicons name="checkmark-outline" size={13} color="#fff" />
              <Text style={styles.actionBtnText}>Confirm</Text>
            </TouchableOpacity>
          )}

          {/* Create Advance RO button — visible for confirmed/pending when vehicle exists */}
          {vehicle && !booking.repairOrderId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => onCreateRO(booking)}
            >
              <Ionicons name="document-text-outline" size={13} color="#fff" />
              <Text style={styles.actionBtnText}>Create Advance RO</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.error }]}
            onPress={() => onStatusChange(booking._id, "cancelled", booking)}
          >
            <Ionicons name="close-outline" size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "in_progress" && !booking.repairOrderId && vehicle && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => onCreateRO(booking)}
          >
            <Ionicons name="document-text-outline" size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Open Repair Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.textMuted }]}
            onPress={() => onStatusChange(booking._id, "completed", booking)}
          >
            <Ionicons name="checkmark-done-outline" size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Booking Modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateBookingModal({ visible, onClose, onCreated }) {
  const [custQuery,     setCustQuery]     = useState("");
  const [custResults,   setCustResults]   = useState([]);
  const [custLoading,   setCustLoading]   = useState(false);
  const [selCustomer,   setSelCustomer]   = useState(null);
  const [custVehicles,  setCustVehicles]  = useState([]);
  const [vehLoading,    setVehLoading]    = useState(false);
  const [selVehicle,    setSelVehicle]    = useState(null);
  const [dayIdx,        setDayIdx]        = useState(0);
  const [timeIdx,       setTimeIdx]       = useState(null);
  const [serviceType,   setServiceType]   = useState("");
  const [notes,         setNotes]         = useState("");
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  // Service catalog
  const [services,      setServices]      = useState([]);
  const [svcLoading,    setSvcLoading]    = useState(false);
  const [selService,    setSelService]    = useState(null); // catalog item or "other"
  const [customService, setCustomService] = useState("");
  // New customer inline
  const [showNewCust,   setShowNewCust]   = useState(false);
  const [newCustName,   setNewCustName]   = useState("");
  const [newCustPhone,  setNewCustPhone]  = useState("");
  const [newCustEmail,  setNewCustEmail]  = useState("");
  const [addingCust,    setAddingCust]    = useState(false);
  const debounceRef = useRef(null);

  const reset = () => {
    setCustQuery(""); setCustResults([]); setSelCustomer(null);
    setCustVehicles([]); setSelVehicle(null);
    setDayIdx(0); setTimeIdx(null);
    setServiceType(""); setNotes(""); setErrors({});
    setSelService(null); setCustomService("");
    setShowNewCust(false); setNewCustName(""); setNewCustPhone(""); setNewCustEmail("");
  };

  const handleAddNewCustomer = async () => {
    if (!newCustName.trim()) return Alert.alert("Required", "Enter customer name.");
    if (!newCustPhone.trim()) return Alert.alert("Required", "Enter phone number.");
    setAddingCust(true);
    try {
      const res = await addUser({
        fullName: newCustName.trim(),
        phoneNo: newCustPhone.trim(),
        ...(newCustEmail.trim() && { emailId: newCustEmail.trim() }),
        role: "customer",
      });
      const newCust = res?.data?.user || res?.user;
      if (newCust) {
        setSelCustomer(newCust);
        setCustQuery("");
        setCustResults([]);
        setShowNewCust(false);
        setNewCustName(""); setNewCustPhone(""); setNewCustEmail("");
      } else {
        Alert.alert("Error", "Customer created but could not select them. Search for them manually.");
        setShowNewCust(false);
      }
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to add customer.");
    } finally { setAddingCust(false); }
  };

  // Fetch catalog services when modal opens
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setSvcLoading(true);
      try {
        const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
          params: { type: "service", limit: 50 },
        });
        const items = res.data?.data?.items || res.data?.data?.services || [];
        setServices(items);
      } catch { setServices([]); }
      finally { setSvcLoading(false); }
    })();
  }, [visible]);

  const handleClose = () => { reset(); onClose(); };

  // Debounced customer search
  useEffect(() => {
    if (!custQuery.trim()) { setCustResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCustLoading(true);
      try {
        const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.SEARCH_CUSTOMERS, {
          params: { q: custQuery.trim() },
        });
        setCustResults(res.data?.data?.customers || []);
      } catch { setCustResults([]); }
      finally { setCustLoading(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [custQuery]);

  // Load customer's vehicles when a customer is picked
  useEffect(() => {
    if (!selCustomer) { setCustVehicles([]); setSelVehicle(null); return; }
    (async () => {
      setVehLoading(true);
      try {
        const res = await axiosClient.get(`/vehicle/customer/${selCustomer._id}`);
        setCustVehicles(res.data?.data?.vehicles || []);
      } catch { setCustVehicles([]); }
      finally { setVehLoading(false); }
    })();
  }, [selCustomer]);

  // Resolve final service string from chip selection or custom input
  const resolvedService = () => {
    if (selService === "other") return customService.trim();
    if (selService) return selService.name || "";
    return serviceType.trim(); // fallback (shouldn't be needed)
  };

  const validate = () => {
    const e = {};
    if (!selCustomer)  e.customer = "Select a customer";
    if (timeIdx === null) e.time = "Select a time slot";
    const svc = resolvedService();
    if (!svc) e.service = selService === "other" ? "Enter service description" : "Select a service";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const d = new Date(DAYS[dayIdx]);
      d.setHours(TIME_SLOTS[timeIdx].hours, TIME_SLOTS[timeIdx].minutes, 0, 0);
      await createBooking({
        customerId: selCustomer._id,
        scheduledAt: d.toISOString(),
        serviceType: resolvedService(),
        notes: notes.trim(),
        ...(selVehicle && { vehicleId: selVehicle._id }),
      });
      reset();
      onCreated();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to create booking.");
    } finally { setSaving(false); }
  };

  const dayLabel = (d, idx) =>
    idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Booking</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Customer */}
              <Text style={styles.fieldLabel}>Customer *</Text>
              {selCustomer ? (
                <TouchableOpacity
                  style={styles.selectedCustomer}
                  onPress={() => { setSelCustomer(null); setCustQuery(""); }}
                >
                  <View style={styles.selectedCustomerAvatar}>
                    <Text style={styles.selectedCustomerInitial}>
                      {(selCustomer.fullName || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedCustomerName}>{selCustomer.fullName}</Text>
                    {selCustomer.phoneNo ? (
                      <Text style={styles.selectedCustomerPhone}>{selCustomer.phoneNo}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : (
                <>
                  <View style={[styles.searchBox, errors.customer && styles.inputError]}>
                    <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by name or phone..."
                      placeholderTextColor={COLORS.textMuted}
                      value={custQuery}
                      onChangeText={setCustQuery}
                    />
                    {custLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
                  </View>
                  {errors.customer ? <Text style={styles.errText}>{errors.customer}</Text> : null}
                  {custResults.length > 0 && (
                    <View style={styles.dropdown}>
                      {custResults.slice(0, 6).map((c) => (
                        <TouchableOpacity
                          key={c._id}
                          style={styles.dropdownItem}
                          onPress={() => { setSelCustomer(c); setCustQuery(""); setCustResults([]); }}
                        >
                          <View style={styles.dropdownAvatar}>
                            <Text style={styles.dropdownInitial}>
                              {(c.fullName || "?")[0].toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.dropdownName}>{c.fullName}</Text>
                            <Text style={styles.dropdownPhone}>{c.phoneNo || ""}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {!custLoading && custQuery.trim().length > 1 && custResults.length === 0 && (
                    <>
                      <Text style={styles.noResult}>No customers found</Text>
                      {!showNewCust ? (
                        <TouchableOpacity
                          style={styles.addCustBtn}
                          onPress={() => {
                            setShowNewCust(true);
                            setNewCustName(custQuery.trim());
                          }}
                        >
                          <Ionicons name="person-add-outline" size={15} color={COLORS.primary} />
                          <Text style={styles.addCustBtnText}>+ Add "{custQuery.trim()}" as new customer</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.newCustForm}>
                          <Text style={styles.newCustTitle}>New Customer</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="Full Name *"
                            placeholderTextColor={COLORS.textMuted}
                            value={newCustName}
                            onChangeText={setNewCustName}
                          />
                          <TextInput
                            style={[styles.textInput, { marginTop: 6 }]}
                            placeholder="Phone Number *"
                            placeholderTextColor={COLORS.textMuted}
                            value={newCustPhone}
                            onChangeText={setNewCustPhone}
                            keyboardType="phone-pad"
                          />
                          <TextInput
                            style={[styles.textInput, { marginTop: 6 }]}
                            placeholder="Email (optional)"
                            placeholderTextColor={COLORS.textMuted}
                            value={newCustEmail}
                            onChangeText={setNewCustEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                          <View style={styles.newCustActions}>
                            <TouchableOpacity
                              style={styles.newCustCancel}
                              onPress={() => setShowNewCust(false)}
                            >
                              <Text style={styles.newCustCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.newCustSave, addingCust && { opacity: 0.65 }]}
                              onPress={handleAddNewCustomer}
                              disabled={addingCust}
                            >
                              {addingCust
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.newCustSaveText}>Add Customer</Text>}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Vehicle (optional, shown after customer selected) */}
              {selCustomer && (
                <>
                  <Text style={styles.fieldLabel}>Vehicle (optional)</Text>
                  {vehLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
                  ) : custVehicles.length === 0 ? (
                    <Text style={styles.hintText}>No vehicles on record for this customer</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                      {custVehicles.map((v) => (
                        <TouchableOpacity
                          key={v._id}
                          style={[styles.chip, selVehicle?._id === v._id && styles.chipOn]}
                          onPress={() => setSelVehicle(selVehicle?._id === v._id ? null : v)}
                        >
                          <Ionicons name="car-outline" size={13}
                            color={selVehicle?._id === v._id ? "#fff" : COLORS.textSecondary} />
                          <Text style={[styles.chipText, selVehicle?._id === v._id && styles.chipTextOn]}>
                            {v.vehicleBrand} {v.vehicleModel}{v.vehicleRegisterNo ? ` · ${v.vehicleRegisterNo}` : ""}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* Date */}
              <Text style={styles.fieldLabel}>Date *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                {DAYS.map((d, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayChip, dayIdx === idx && styles.chipOn]}
                    onPress={() => setDayIdx(idx)}
                  >
                    <Text style={[styles.dayName, dayIdx === idx && styles.dayNameOn]}>
                      {dayLabel(d, idx)}
                    </Text>
                    <Text style={[styles.dayDate, dayIdx === idx && styles.dayDateOn]}>
                      {d.getDate()} {MONTH_SHORT[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Time */}
              <Text style={styles.fieldLabel}>
                Time *
                {errors.time ? <Text style={{ color: COLORS.error }}> — {errors.time}</Text> : null}
              </Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((slot, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.timeChip, timeIdx === idx && styles.chipOn]}
                    onPress={() => setTimeIdx(idx)}
                  >
                    <Text style={[styles.timeText, timeIdx === idx && styles.timeTextOn]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Service — from catalog */}
              <Text style={styles.fieldLabel}>
                Service Type *
                {errors.service ? <Text style={{ color: COLORS.error }}> — {errors.service}</Text> : null}
              </Text>
              {svcLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
              ) : (
                <View style={styles.serviceGrid}>
                  {services.map((svc) => {
                    const isOn = selService !== "other" && selService?._id === svc._id;
                    return (
                      <TouchableOpacity
                        key={svc._id}
                        style={[styles.svcChip, isOn && styles.svcChipOn]}
                        onPress={() => {
                          setSelService(isOn ? null : svc);
                          setErrors((e) => ({ ...e, service: null }));
                        }}
                      >
                        <Ionicons
                          name="construct-outline"
                          size={12}
                          color={isOn ? "#fff" : COLORS.textSecondary}
                        />
                        <Text style={[styles.svcChipText, isOn && styles.svcChipTextOn]} numberOfLines={1}>
                          {svc.name}
                        </Text>
                        {svc.mrp > 0 && (
                          <Text style={[styles.svcChipPrice, isOn && { color: "rgba(255,255,255,0.8)" }]}>
                            ₹{svc.mrp}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {/* Other option */}
                  <TouchableOpacity
                    style={[styles.svcChip, selService === "other" && styles.svcChipOn]}
                    onPress={() => {
                      setSelService(selService === "other" ? null : "other");
                      setErrors((e) => ({ ...e, service: null }));
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={12}
                      color={selService === "other" ? "#fff" : COLORS.textSecondary}
                    />
                    <Text style={[styles.svcChipText, selService === "other" && styles.svcChipTextOn]}>
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Custom service input — shown when "Other" is selected or no catalog items */}
              {(selService === "other" || (!svcLoading && services.length === 0)) && (
                <TextInput
                  style={[styles.textInput, errors.service && styles.inputError, { marginTop: 6 }]}
                  placeholder="Describe the service needed..."
                  placeholderTextColor={COLORS.textMuted}
                  value={customService}
                  onChangeText={(t) => {
                    setCustomService(t);
                    setErrors((e) => ({ ...e, service: null }));
                  }}
                />
              )}

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 72, textAlignVertical: "top" }]}
                placeholder="Customer complaints, special instructions..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={{ height: 28 }} />
            </ScrollView>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Create Booking</Text>
                  </>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const navigation  = useNavigation();
  const garage      = useSelector((s) => s.auth.garage);
  const garageName  = garage?.garageName || "Your Garage";

  const [bookings,    setBookings]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [refreshing,  setRefreshing] = useState(false);
  const [activeTab,   setActiveTab]  = useState("all");
  const [search,      setSearch]     = useState("");
  const [showCreate,  setShowCreate] = useState(false);

  const searchDebounce = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────
  const load = useCallback(async ({ tab, q, silent = false } = {}) => {
    const resolvedTab = tab ?? activeTab;
    const resolvedQ   = q  ?? search;
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (resolvedTab !== "all") params.status = resolvedTab;
      if (resolvedQ.trim()) params.search = resolvedQ.trim();
      const res = await listBookings(params);
      setBookings(res.data?.bookings || []);
    } catch { /* silently fail */ }
    finally  { setLoading(false); setRefreshing(false); }
  }, [activeTab, search]);

  useFocusEffect(useCallback(() => { load(); }, [activeTab]));

  // Debounced search
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      load({ q: search });
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // ── Tab change ────────────────────────────────────────────────────
  const handleTabChange = (key) => {
    setActiveTab(key);
    load({ tab: key, q: search });
  };

  // ── Status change ─────────────────────────────────────────────────
  const handleStatusChange = (id, newStatus, booking) => {
    const labels = { confirmed: "Confirm", cancelled: "Cancel", completed: "Complete" };
    const label  = labels[newStatus] || newStatus;
    Alert.alert(`${label} Booking`,
      `Are you sure you want to ${label.toLowerCase()} booking ${booking.bookingNo || ""}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: newStatus === "cancelled" ? "destructive" : "default",
          onPress: async () => {
            // Optimistic update
            setBookings((prev) =>
              prev.map((b) => b._id === id ? { ...b, status: newStatus } : b),
            );
            try {
              const res = await updateBookingStatus(id, newStatus);
              const updatedBooking = res.data?.booking;
              const calendarSync = res.data?.calendarSync;
              if (updatedBooking) {
                setBookings((prev) =>
                  prev.map((b) => b._id === id ? { ...b, ...updatedBooking } : b),
                );
              }
              if (newStatus === "confirmed") {
                // Offer to share confirmation
                const raw = (booking.customer?.phoneNo || "").replace(/\D/g,"");
                const p   = raw.startsWith("91") ? raw : `91${raw}`;
                const confirmedBooking = updatedBooking || { ...booking, status: "confirmed" };
                const txt = encodeURIComponent(buildShareText(confirmedBooking, garageName));
                const syncLine = calendarSync
                  ? calendarSync.ok
                    ? "Added to Google Calendar. "
                    : `${calendarSync.message || "Google Calendar sync needs attention."} `
                  : "";
                Alert.alert("Booking Confirmed!", `${syncLine}Share confirmation with customer?`, [
                  { text: "Skip" },
                  {
                    text: "WhatsApp",
                    onPress: () =>
                      Linking.openURL(`whatsapp://send?phone=${p}&text=${txt}`).catch(() => {}),
                  },
                ]);
              }
            } catch (err) {
              // Rollback
              setBookings((prev) =>
                prev.map((b) => b._id === id ? { ...b, status: booking.status } : b),
              );
              Alert.alert("Error", err.displayMessage || "Failed to update booking.");
            }
          },
        },
      ],
    );
  };

  // ── Create Advance RO ─────────────────────────────────────────────
  // Retry backend Google Calendar sync for confirmed bookings.
  const handleRetryCalendarSync = async (booking) => {
    setBookings((prev) =>
      prev.map((b) =>
        b._id === booking._id
          ? {
              ...b,
              googleCalendar: {
                ...(b.googleCalendar || {}),
                syncStatus: "not_synced",
                lastError: null,
              },
            }
          : b,
      ),
    );
    try {
      const res = await syncBookingCalendar(booking._id);
      const updatedBooking = res.data?.booking;
      const calendarSync = res.data?.calendarSync;
      if (updatedBooking) {
        setBookings((prev) =>
          prev.map((b) => b._id === booking._id ? { ...b, ...updatedBooking } : b),
        );
      }
      Alert.alert(
        calendarSync?.ok ? "Calendar Synced" : "Calendar Sync",
        calendarSync?.ok
          ? "Booking added to Google Calendar."
          : calendarSync?.message || "Google Calendar sync needs attention.",
      );
    } catch (err) {
      load({ silent: true });
      Alert.alert("Error", err.displayMessage || "Could not sync Google Calendar.");
    }
  };

  // Navigates to CustomerRepairOrderScreen with booking data pre-filled.
  // After RO is saved, the screen calls linkRepairOrder automatically.
  const handleCreateRO = (booking) => {
    navigation.navigate("CustomerRepairOrder", {
      fromBooking: {
        _id:         booking._id,
        bookingNo:   booking.bookingNo,
        customer:    booking.customer,
        vehicle:     booking.vehicle,
        serviceType: booking.serviceType,
        notes:       booking.notes,
        scheduledAt: booking.scheduledAt,
      },
    });
  };

  const counts = {
    pending:     bookings.filter((b) => b.status === "pending").length,
    confirmed:   bookings.filter((b) => b.status === "confirmed").length,
    in_progress: bookings.filter((b) => b.status === "in_progress").length,
  };
  const upcomingCount = counts.pending + counts.confirmed;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopNav
        title="Bookings"
        transparent={false}
        rightElement={
          upcomingCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{upcomingCount}</Text>
            </View>
          ) : null
        }
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer name or phone..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => handleTabChange(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
              {t.key !== "all" && counts[t.key] > 0
                ? ` (${counts[t.key]})`
                : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={[styles.list, bookings.length === 0 && { flex: 1 }]}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              garageName={garageName}
              onStatusChange={handleStatusChange}
              onCreateRO={handleCreateRO}
              onRetryCalendarSync={handleRetryCalendarSync}
              navigation={navigation}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={52} color={COLORS.borderLight} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySub}>
                {search ? `No results for "${search}"` : "Tap + to add a booking"}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateBookingModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load(); }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },

  headerBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: { fontFamily: FONTS.bold, fontSize: 11, color: "#fff" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  tabsScroll: { maxHeight: 44, marginTop: SIZES.sm },
  tabsContent: { paddingHorizontal: SIZES.screenPadding, gap: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textMuted },
  tabTextActive: { color: "#fff" },

  list: {
    padding: SIZES.screenPadding,
    gap: SIZES.md,
    paddingBottom: 100,
  },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  bookingNo: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  badgeText: { fontFamily: FONTS.semibold, fontSize: 10, textTransform: "capitalize" },
  selfTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  selfTagText: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.primary },
  roTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  roTagText: { fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.success },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  calendarSyncBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  calendarSyncText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },
  calendarSyncError: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 10,
  },
  calendarSyncAction: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
  },

  shareRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  shareBtnText: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },

  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  actionBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: "#fff" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 60,
  },
  emptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: COLORS.textMuted },
  emptySub: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.lg,
  },

  // Modal / Sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
  },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },

  fieldLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: 8,
  },
  inputError: { borderColor: COLORS.error },
  errText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.error, marginTop: 4 },
  noResult: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 6 },

  dropdown: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownInitial: { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.primary },
  dropdownName: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  dropdownPhone: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  selectedCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  selectedCustomerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCustomerInitial: { fontFamily: FONTS.bold, fontSize: SIZES.textMd, color: "#fff" },
  selectedCustomerName: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary },
  selectedCustomerPhone: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.primary },

  hintText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 4 },
  hScroll: { marginBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  chipTextOn: { color: "#fff", fontFamily: FONTS.medium },

  dayChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
    minWidth: 66,
  },
  dayName: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted },
  dayNameOn: { color: "#fff" },
  dayDate: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  dayDateOn: { color: "rgba(255,255,255,0.85)" },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  timeTextOn: { color: "#fff", fontFamily: FONTS.medium },

  textInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    marginTop: SIZES.sm,
  },
  saveBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: "#fff" },

  // New customer inline form
  addCustBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  addCustBtnText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    flex: 1,
  },
  newCustForm: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    marginTop: 4,
    gap: 0,
  },
  newCustTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    marginBottom: 8,
  },
  newCustActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  newCustCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgPrimary,
  },
  newCustCancelText: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  newCustSave: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary,
  },
  newCustSaveText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: "#fff" },

  // Service catalog chips
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  svcChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  svcChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  svcChipText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  svcChipTextOn: { color: "#fff", fontFamily: FONTS.medium },
  svcChipPrice: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.textMuted, marginLeft: 1 },
});
