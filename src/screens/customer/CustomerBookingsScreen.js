import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import axiosClient from "../../api/axios";
import { getMyBookings, createMyBooking, cancelMyBooking } from "../../api/booking";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     { bg: "#FEF3C7", text: "#D97706" },
  confirmed:   { bg: "#D1FAE5", text: "#059669" },
  in_progress: { bg: "#DBEAFE", text: "#2563EB" },
  completed:   { bg: "#F3F4F6", text: "#374151" },
  cancelled:   { bg: "#FEE2E2", text: "#DC2626" },
};

const STATUS_LABELS = {
  pending:     "Pending Confirmation",
  confirmed:   "Confirmed",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatScheduledAt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day   = DAY_NAMES[d.getDay()];
  const date  = d.getDate();
  const month = MONTH_SHORT[d.getMonth()];
  const h     = d.getHours();
  const m     = d.getMinutes();
  const ampm  = h < 12 ? "AM" : "PM";
  const dh    = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${day}, ${date} ${month} • ${dh}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Generate next 30 days
const generateDays = () =>
  Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

// Generate time slots 8 AM – 7 PM every 30 min
const generateTimeSlots = () => {
  const slots = [];
  for (let totalMin = 8 * 60; totalMin <= 19 * 60; totalMin += 30) {
    const h    = Math.floor(totalMin / 60);
    const m    = totalMin % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const dh   = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push({ label: `${dh}:${String(m).padStart(2, "0")} ${ampm}`, hours: h, minutes: m });
  }
  return slots;
};

const DAYS       = generateDays();
const TIME_SLOTS = generateTimeSlots();

const SERVICE_PRESETS = [
  "Oil Change",
  "General Service",
  "Tyre Puncture",
  "Battery Check",
  "Brake Service",
  "Chain Lubrication",
  "Carburetor Cleaning",
  "Other",
];

function buildBookingText(booking, garageName) {
  const dt      = formatScheduledAt(booking.scheduledAt);
  const service = booking.serviceType || "General Service";
  const vehicle = booking.vehicle
    ? `${booking.vehicle.vehicleBrand || ""} ${booking.vehicle.vehicleModel || ""}`.trim()
    : "";
  return (
    `*Booking Confirmed!* ✅\n` +
    `Booking No: ${booking.bookingNo || ""}\n` +
    `Date & Time: ${dt}\n` +
    `Service: ${service}\n` +
    (vehicle ? `Vehicle: ${vehicle}\n` : "") +
    `Garage: ${garageName || "Your Garage"}\n\n` +
    `Please arrive 5 mins early. See you soon! 🔧`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Card
// ─────────────────────────────────────────────────────────────────────────────
function BookingCard({ booking, garageName, onCancel }) {
  const status  = booking.status;
  const sc      = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const vehicle = booking.vehicle;

  const handleAddToCalendar = () => {
    const start = new Date(booking.scheduledAt);
    const end   = new Date(start.getTime() + (booking.duration || 60) * 60 * 1000);
    const fmt   = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const title = encodeURIComponent(`Garage Appointment – ${booking.serviceType || "Service"}`);
    const details = encodeURIComponent(buildBookingText(booking, garageName));
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open Google Calendar."),
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildBookingText(booking, garageName));
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Alert.alert("WhatsApp not installed", "Please install WhatsApp to use this feature."),
    );
  };

  const handleShareSms = () => {
    const body = encodeURIComponent(buildBookingText(booking, garageName));
    const url  = Platform.OS === "ios" ? `sms:&body=${body}` : `sms:?body=${body}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open SMS."));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingNo}>{booking.bookingNo || "—"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {STATUS_LABELS[status] || status}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        <Text style={[styles.cardRowText, { color: COLORS.primary, fontFamily: FONTS.semibold }]}>
          {formatScheduledAt(booking.scheduledAt)}
        </Text>
      </View>

      {booking.serviceType ? (
        <View style={styles.cardRow}>
          <Ionicons name="construct-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.cardRowText} numberOfLines={1}>{booking.serviceType}</Text>
        </View>
      ) : null}

      {vehicle ? (
        <View style={styles.cardRow}>
          <Ionicons name="car-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.cardRowText} numberOfLines={1}>
            {vehicle.vehicleBrand} {vehicle.vehicleModel}
            {vehicle.vehicleRegisterNo ? `  •  ${vehicle.vehicleRegisterNo}` : ""}
          </Text>
        </View>
      ) : null}

      {booking.notes ? (
        <View style={styles.cardRow}>
          <Ionicons name="chatbubble-outline" size={14} color={COLORS.textMuted} />
          <Text style={[styles.cardRowText, { color: COLORS.textMuted }]} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      ) : null}

      {/* Actions row */}
      {(status === "confirmed" || status === "pending") && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionPill} onPress={handleAddToCalendar}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.error} />
            <Text style={[styles.actionPillText, { color: COLORS.error }]}>Calendar</Text>
          </TouchableOpacity>
          {status === "confirmed" && (
            <>
              <TouchableOpacity style={styles.actionPill} onPress={handleShareWhatsApp}>
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                <Text style={[styles.actionPillText, { color: "#25D366" }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill} onPress={handleShareSms}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.actionPillText}>SMS</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.actionPill, styles.actionPillCancel]}
            onPress={() => onCancel(booking._id)}
          >
            <Ionicons name="close-circle-outline" size={14} color={COLORS.error} />
            <Text style={[styles.actionPillText, { color: COLORS.error }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Book Appointment Modal
// ─────────────────────────────────────────────────────────────────────────────
function BookingModal({ visible, onClose, onBooked, vehicles }) {
  const [selectedVehicle,  setSelectedVehicle]  = useState(null);
  const [selectedDayIdx,   setSelectedDayIdx]   = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [serviceType,      setServiceType]      = useState("");
  const [customService,    setCustomService]    = useState("");
  const [notes,            setNotes]            = useState("");
  const [saving,           setSaving]           = useState(false);
  const [errors,           setErrors]           = useState({});

  const resetForm = () => {
    setSelectedVehicle(null);
    setSelectedDayIdx(0);
    setSelectedTimeSlot(null);
    setServiceType("");
    setCustomService("");
    setNotes("");
    setErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const validate = () => {
    const e = {};
    if (selectedTimeSlot === null)  e.time = "Please select a time slot";
    const svc = serviceType === "Other" ? customService.trim() : serviceType;
    if (!svc)                        e.service = "Please select a service type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const day  = DAYS[selectedDayIdx];
      const slot = TIME_SLOTS[selectedTimeSlot];
      const scheduledAt = new Date(day);
      scheduledAt.setHours(slot.hours, slot.minutes, 0, 0);

      const finalService = serviceType === "Other" ? customService.trim() : serviceType;
      await createMyBooking({
        scheduledAt: scheduledAt.toISOString(),
        serviceType: finalService,
        notes: notes.trim(),
        ...(selectedVehicle && { vehicleId: selectedVehicle._id }),
      });
      resetForm();
      onBooked();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to send booking request.");
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = (d, idx) => {
    if (idx === 0) return "Today";
    if (idx === 1) return "Tomorrow";
    return DAY_NAMES[d.getDay()];
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Vehicle (optional) */}
              {vehicles.length > 0 && (
                <>
                  <Text style={styles.label}>Vehicle (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                    {vehicles.map((v) => (
                      <TouchableOpacity
                        key={v._id}
                        style={[
                          styles.chip,
                          selectedVehicle?._id === v._id && styles.chipActive,
                        ]}
                        onPress={() =>
                          setSelectedVehicle(selectedVehicle?._id === v._id ? null : v)
                        }
                      >
                        <Ionicons
                          name="car-outline"
                          size={13}
                          color={selectedVehicle?._id === v._id ? "#fff" : COLORS.textSecondary}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            selectedVehicle?._id === v._id && styles.chipTextActive,
                          ]}
                        >
                          {v.vehicleBrand} {v.vehicleModel}
                          {v.vehicleRegisterNo ? ` • ${v.vehicleRegisterNo}` : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Date */}
              <Text style={styles.label}>Select Date *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                {DAYS.map((d, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayChip, selectedDayIdx === idx && styles.dayChipActive]}
                    onPress={() => setSelectedDayIdx(idx)}
                  >
                    <Text style={[styles.dayChipLabel, selectedDayIdx === idx && styles.dayChipLabelActive]}>
                      {dayLabel(d, idx)}
                    </Text>
                    <Text style={[styles.dayChipDate, selectedDayIdx === idx && styles.dayChipDateActive]}>
                      {d.getDate()} {MONTH_SHORT[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Time */}
              <Text style={styles.label}>
                Select Time *
                {errors.time ? <Text style={{ color: COLORS.error }}> — {errors.time}</Text> : null}
              </Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((slot, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.timeChip, selectedTimeSlot === idx && styles.timeChipActive]}
                    onPress={() => setSelectedTimeSlot(idx)}
                  >
                    <Text style={[styles.timeChipText, selectedTimeSlot === idx && styles.timeChipTextActive]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Service type */}
              <Text style={styles.label}>
                Service Type *
                {errors.service ? <Text style={{ color: COLORS.error }}> — {errors.service}</Text> : null}
              </Text>
              <View style={styles.presetGrid}>
                {SERVICE_PRESETS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.presetChip, serviceType === s && styles.presetChipActive]}
                    onPress={() => { setServiceType(s); setErrors((e) => ({ ...e, service: null })); }}
                  >
                    <Text style={[styles.presetText, serviceType === s && styles.presetTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {serviceType === "Other" && (
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the service..."
                  placeholderTextColor={COLORS.textMuted}
                  value={customService}
                  onChangeText={setCustomService}
                />
              )}

              {/* Notes */}
              <Text style={styles.label}>Additional Notes (optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 72, textAlignVertical: "top" }]}
                placeholder="Any special instructions or details..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={{ height: 32 }} />
            </ScrollView>

            {/* Book button */}
            <TouchableOpacity
              style={[styles.bookBtn, saving && { opacity: 0.7 }]}
              onPress={handleBook}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                  <Text style={styles.bookBtnText}>Send Booking Request</Text>
                </>
              )}
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
export default function CustomerBookingsScreen() {
  const { user } = useSelector((s) => s.auth);
  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [vehicles,       setVehicles]       = useState([]);
  const [garageInfo,     setGarageInfo]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, gRes] = await Promise.allSettled([
        getMyBookings(),
        axiosClient.get("/customer/vehicles"),
        axiosClient.get("/customer/garage-info"),
      ]);
      if (bRes.status === "fulfilled") setBookings(bRes.value?.data?.bookings || []);
      if (vRes.status === "fulfilled") setVehicles(vRes.value?.data?.data?.vehicles || []);
      if (gRes.status === "fulfilled") setGarageInfo(gRes.value?.data?.data?.garage || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCancel = (id) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          // Optimistic
          setBookings((prev) =>
            prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)),
          );
          try {
            await cancelMyBooking(id);
          } catch (err) {
            // Rollback
            load();
            Alert.alert("Error", err.displayMessage || "Could not cancel booking.");
          }
        },
      },
    ]);
  };

  const garageName = garageInfo?.garageName || "Your Garage";
  const upcomingCount = bookings.filter((b) =>
    ["pending", "confirmed"].includes(b.status),
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          {upcomingCount > 0 && (
            <Text style={styles.headerSub}>{upcomingCount} upcoming</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.bookFab}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.bookFabText}>Book</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={[
            styles.list,
            bookings.length === 0 && styles.listEmpty,
          ]}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              garageName={garageName}
              onCancel={handleCancel}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={52} color={COLORS.borderLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>
                Tap "Book" to schedule your next service appointment
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.emptyBtnText}>Book an Appointment</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BookingModal
        visible={showModal}
        vehicles={vehicles}
        onClose={() => setShowModal(false)}
        onBooked={() => {
          setShowModal(false);
          load();
          Alert.alert(
            "Booking Sent!",
            "Your appointment request has been sent to the garage. You will be notified once confirmed.",
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  headerSub: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.primary, marginTop: 2 },

  bookFab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...SHADOWS.sm,
  },
  bookFabText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: "#fff" },

  list: { padding: SIZES.screenPadding, gap: SIZES.md, paddingBottom: 32 },
  listEmpty: { flex: 1 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bookingNo: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  statusText: { fontFamily: FONTS.semibold, fontSize: 10 },

  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  cardRowText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    flex: 1,
  },

  cardActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionPillCancel: { marginLeft: "auto" },
  actionPillText: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontFamily: FONTS.semibold, fontSize: SIZES.textLg, color: COLORS.textMuted },
  emptySub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: "#fff" },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
  },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary },

  label: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: 6,
  },

  hScroll: { marginBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  chipTextActive: { color: "#fff", fontFamily: FONTS.medium },

  dayChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
    minWidth: 64,
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipLabel: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted },
  dayChipLabelActive: { color: "#fff" },
  dayChipDate: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  dayChipDateActive: { color: "rgba(255,255,255,0.85)" },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipText: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  timeChipTextActive: { color: "#fff", fontFamily: FONTS.medium },

  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  presetChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  presetText: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primary, fontFamily: FONTS.medium },

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

  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    marginTop: SIZES.sm,
  },
  bookBtnText: { fontFamily: FONTS.semibold, fontSize: SIZES.textMd, color: "#fff" },
});
