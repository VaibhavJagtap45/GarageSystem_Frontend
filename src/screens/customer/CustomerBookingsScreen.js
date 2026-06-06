import React, { useState, useCallback, useMemo } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import axiosClient from "../../api/axios";
import {
  getMyBookings,
  createMyBooking,
  cancelMyBooking,
} from "../../api/booking";
import Empty from "../../components/portal/Empty";
import NavBar from "../../components/portal/NavBar";

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_THEME = {
  pending:     { bg: "#fef3c7", color: "#d97706", label: "Pending" },
  confirmed:   { bg: "#dcfce7", color: "#16a34a", label: "Confirmed" },
  in_progress: { bg: "#dbeafe", color: "#2563eb", label: "In Progress" },
  completed:   { bg: "#f3f4f6", color: "#374151", label: "Completed" },
  cancelled:   { bg: "#fee2e2", color: "#dc2626", label: "Cancelled" },
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

const generateDays = () =>
  Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

const generateTimeSlots = () => {
  const slots = [];
  for (let totalMin = 8 * 60; totalMin <= 19 * 60; totalMin += 30) {
    const h    = Math.floor(totalMin / 60);
    const m    = totalMin % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const dh   = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push({
      label: `${dh}:${String(m).padStart(2, "0")} ${ampm}`,
      hours: h,
      minutes: m,
    });
  }
  return slots;
};

const DAYS = generateDays();
const TIME_SLOTS = generateTimeSlots();

const SERVICE_PRESETS = [
  { label: "Oil Change",          icon: "water-outline"         },
  { label: "General Service",     icon: "construct-outline"     },
  { label: "Tyre Puncture",       icon: "disc-outline"          },
  { label: "Battery Check",       icon: "battery-charging-outline" },
  { label: "Brake Service",       icon: "speedometer-outline"   },
  { label: "Chain Lubrication",   icon: "link-outline"          },
  { label: "Carburetor Cleaning", icon: "flame-outline"         },
  { label: "Other",               icon: "ellipsis-horizontal-outline" },
];

function buildBookingText(booking, garageName) {
  const dt = formatScheduledAt(booking.scheduledAt);
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

// ─── Booking card ───────────────────────────────────────────────────────────
function BookingCard({ booking, garageName, onCancel }) {
  const theme = STATUS_THEME[booking.status] ?? STATUS_THEME.pending;
  const vehicle = booking.vehicle;
  const isActive = booking.status === "confirmed" || booking.status === "pending";

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildBookingText(booking, garageName));
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Alert.alert(
        "WhatsApp not installed",
        "Please install WhatsApp to use this feature.",
      ),
    );
  };

  const handleShareSms = () => {
    const body = encodeURIComponent(buildBookingText(booking, garageName));
    const url = Platform.OS === "ios" ? `sms:&body=${body}` : `sms:?body=${body}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open SMS."),
    );
  };

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: theme.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingNo}>{booking.bookingNo || "Booking"}</Text>
            <Text style={styles.scheduleText}>
              {formatScheduledAt(booking.scheduledAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.color }]} />
            <Text style={[styles.statusText, { color: theme.color }]}>
              {theme.label}
            </Text>
          </View>
        </View>

        {booking.serviceType ? (
          <View style={styles.cardRow}>
            <View style={[styles.iconPill, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="construct-outline" size={12} color="#2563eb" />
            </View>
            <Text style={styles.cardRowText} numberOfLines={1}>
              {booking.serviceType}
            </Text>
          </View>
        ) : null}

        {vehicle ? (
          <View style={styles.cardRow}>
            <View style={[styles.iconPill, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="car-outline" size={12} color="#d97706" />
            </View>
            <Text style={styles.cardRowText} numberOfLines={1}>
              {vehicle.vehicleBrand} {vehicle.vehicleModel}
              {vehicle.vehicleRegisterNo
                ? `  ·  ${vehicle.vehicleRegisterNo}`
                : ""}
            </Text>
          </View>
        ) : null}

        {booking.notes ? (
          <View style={styles.cardRow}>
            <View style={[styles.iconPill, { backgroundColor: "#f1f5f9" }]}>
              <Ionicons name="chatbubble-outline" size={11} color="#64748b" />
            </View>
            <Text
              style={[styles.cardRowText, { color: COLORS.textMuted }]}
              numberOfLines={2}
            >
              {booking.notes}
            </Text>
          </View>
        ) : null}

        {isActive && (
          <View style={styles.cardActions}>
            {booking.status === "confirmed" && (
              <>
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={handleShareWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                  <Text style={[styles.actionPillText, { color: "#25D366" }]}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={handleShareSms}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={13}
                    color="#64748b"
                  />
                  <Text style={styles.actionPillText}>SMS</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionPill, styles.actionPillCancel]}
              onPress={() => onCancel(booking._id)}
            >
              <Ionicons name="close-circle-outline" size={13} color="#ef4444" />
              <Text style={[styles.actionPillText, { color: "#ef4444" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Booking modal ──────────────────────────────────────────────────────────
function BookingModal({ visible, onClose, onBooked, vehicles }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx]   = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [serviceType, setServiceType]       = useState("");
  const [customService, setCustomService]   = useState("");
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);
  const [errors, setErrors]                 = useState({});
  const [step, setStep]                     = useState(1);

  const resetForm = () => {
    setSelectedVehicle(null);
    setSelectedDayIdx(0);
    setSelectedTimeSlot(null);
    setServiceType("");
    setCustomService("");
    setNotes("");
    setErrors({});
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const e = {};
    if (selectedTimeSlot === null) e.time = "Please select a time slot";
    const svc = serviceType === "Other" ? customService.trim() : serviceType;
    if (!svc) e.service = "Please select a service type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const day = DAYS[selectedDayIdx];
      const slot = TIME_SLOTS[selectedTimeSlot];
      const scheduledAt = new Date(day);
      scheduledAt.setHours(slot.hours, slot.minutes, 0, 0);

      const finalService =
        serviceType === "Other" ? customService.trim() : serviceType;
      await createMyBooking({
        scheduledAt: scheduledAt.toISOString(),
        serviceType: finalService,
        notes: notes.trim(),
        ...(selectedVehicle && { vehicleId: selectedVehicle._id }),
      });
      resetForm();
      onBooked();
    } catch (err) {
      Alert.alert(
        "Error",
        err.displayMessage || "Failed to send booking request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = (d, idx) => {
    if (idx === 0) return "Today";
    if (idx === 1) return "Tomorrow";
    return DAY_NAMES[d.getDay()];
  };

  const canProceed1 =
    selectedTimeSlot !== null &&
    (serviceType === "Other" ? customService.trim() : serviceType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetEyebrow}>
                  Step {step} of 2
                </Text>
                <Text style={styles.sheetTitle}>
                  {step === 1 ? "When & what?" : "Final details"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: step === 1 ? "50%" : "100%" },
                ]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === 1 ? (
                <>
                  {/* Date */}
                  <Text style={styles.label}>
                    <Ionicons name="calendar-outline" size={13} color="#1d4ed8" />
                    {"  "}Pick a date
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.hScroll}
                    contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                  >
                    {DAYS.map((d, idx) => {
                      const active = selectedDayIdx === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                          onPress={() => setSelectedDayIdx(idx)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.dayChipLabel,
                              active && styles.dayChipLabelActive,
                            ]}
                          >
                            {dayLabel(d, idx)}
                          </Text>
                          <Text
                            style={[
                              styles.dayChipDate,
                              active && styles.dayChipDateActive,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                          <Text
                            style={[
                              styles.dayChipMonth,
                              active && styles.dayChipMonthActive,
                            ]}
                          >
                            {MONTH_SHORT[d.getMonth()]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Time */}
                  <Text style={styles.label}>
                    <Ionicons name="time-outline" size={13} color="#1d4ed8" />
                    {"  "}Pick a time slot
                    {errors.time ? (
                      <Text style={{ color: "#ef4444" }}> — {errors.time}</Text>
                    ) : null}
                  </Text>
                  <View style={styles.timeGrid}>
                    {TIME_SLOTS.map((slot, idx) => {
                      const active = selectedTimeSlot === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.timeChip,
                            active && styles.timeChipActive,
                          ]}
                          onPress={() => {
                            setSelectedTimeSlot(idx);
                            setErrors((e) => ({ ...e, time: null }));
                          }}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              active && styles.timeChipTextActive,
                            ]}
                          >
                            {slot.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Service type */}
                  <Text style={styles.label}>
                    <MaterialCommunityIcons
                      name="wrench-outline"
                      size={13}
                      color="#1d4ed8"
                    />
                    {"  "}Service type
                    {errors.service ? (
                      <Text style={{ color: "#ef4444" }}> — {errors.service}</Text>
                    ) : null}
                  </Text>
                  <View style={styles.presetGrid}>
                    {SERVICE_PRESETS.map((p) => {
                      const active = serviceType === p.label;
                      return (
                        <TouchableOpacity
                          key={p.label}
                          style={[
                            styles.presetChip,
                            active && styles.presetChipActive,
                          ]}
                          onPress={() => {
                            setServiceType(p.label);
                            setErrors((e) => ({ ...e, service: null }));
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={p.icon}
                            size={14}
                            color={active ? "#1d4ed8" : COLORS.textSecondary}
                          />
                          <Text
                            style={[
                              styles.presetText,
                              active && styles.presetTextActive,
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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

                  <View style={{ height: 20 }} />
                </>
              ) : (
                <>
                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Review your booking</Text>
                    <View style={styles.summaryRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#1d4ed8"
                      />
                      <Text style={styles.summaryTxt}>
                        {dayLabel(DAYS[selectedDayIdx], selectedDayIdx)} ·{" "}
                        {DAYS[selectedDayIdx].getDate()}{" "}
                        {MONTH_SHORT[DAYS[selectedDayIdx].getMonth()]} ·{" "}
                        {selectedTimeSlot !== null
                          ? TIME_SLOTS[selectedTimeSlot].label
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <MaterialCommunityIcons
                        name="wrench-outline"
                        size={14}
                        color="#1d4ed8"
                      />
                      <Text style={styles.summaryTxt}>
                        {serviceType === "Other"
                          ? customService.trim()
                          : serviceType}
                      </Text>
                    </View>
                  </View>

                  {/* Vehicle */}
                  {vehicles.length > 0 && (
                    <>
                      <Text style={styles.label}>
                        <Ionicons name="car-outline" size={13} color="#1d4ed8" />
                        {"  "}Vehicle (optional)
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.hScroll}
                        contentContainerStyle={{ gap: 6, paddingRight: 8 }}
                      >
                        {vehicles.map((v) => {
                          const active = selectedVehicle?._id === v._id;
                          return (
                            <TouchableOpacity
                              key={v._id}
                              style={[
                                styles.vChip,
                                active && styles.vChipActive,
                              ]}
                              onPress={() =>
                                setSelectedVehicle(active ? null : v)
                              }
                              activeOpacity={0.85}
                            >
                              <Ionicons
                                name="car"
                                size={13}
                                color={active ? COLORS.white : "#1d4ed8"}
                              />
                              <Text
                                style={[
                                  styles.vChipText,
                                  active && styles.vChipTextActive,
                                ]}
                              >
                                {v.vehicleBrand} {v.vehicleModel}
                                {v.vehicleRegisterNo
                                  ? ` · ${v.vehicleRegisterNo}`
                                  : ""}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </>
                  )}

                  {/* Notes */}
                  <Text style={styles.label}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={13}
                      color="#1d4ed8"
                    />
                    {"  "}Additional notes (optional)
                  </Text>
                  <TextInput
                    style={[styles.textInput, { height: 84, textAlignVertical: "top" }]}
                    placeholder="Any special instructions or details..."
                    placeholderTextColor={COLORS.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={{ height: 20 }} />
                </>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.sheetFooter}>
              {step === 2 ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back" size={16} color="#1d4ed8" />
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
                    onPress={handleBook}
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#1d4ed8", "#3b82f6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryBtnInner}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="send" size={16} color="#fff" />
                          <Text style={styles.primaryBtnText}>Send request</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { flex: 1 },
                    !canProceed1 && { opacity: 0.5 },
                  ]}
                  onPress={() => {
                    if (!validate()) return;
                    setStep(2);
                  }}
                  disabled={!canProceed1}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#1d4ed8", "#3b82f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnInner}
                  >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function CustomerBookingsScreen({ navigation }) {
  const { user } = useSelector((x) => x.auth);
  const tabBarH  = useBottomTabBarHeight();
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [vehicles,   setVehicles]   = useState([]);
  const [garageInfo, setGarageInfo] = useState(null);
  const [filter,     setFilter]     = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, gRes] = await Promise.allSettled([
        getMyBookings(),
        axiosClient.get("/customer/vehicles"),
        axiosClient.get("/customer/garage-info"),
      ]);
      if (bRes.status === "fulfilled")
        setBookings(bRes.value?.bookings || []);
      if (vRes.status === "fulfilled")
        setVehicles(vRes.value?.data?.data?.vehicles || []);
      if (gRes.status === "fulfilled")
        setGarageInfo(gRes.value?.data?.data?.garage || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCancel = (id) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setBookings((prev) =>
              prev.map((b) =>
                b._id === id ? { ...b, status: "cancelled" } : b,
              ),
            );
            try {
              await cancelMyBooking(id);
            } catch (err) {
              load();
              Alert.alert(
                "Error",
                err.displayMessage || "Could not cancel booking.",
              );
            }
          },
        },
      ],
    );
  };

  const garageName = garageInfo?.garageName || "Your Garage";
  const firstName  = user?.fullName?.split(" ")[0] || "there";

  const stats = useMemo(
    () => ({
      upcoming:  bookings.filter((b) => ["pending", "confirmed"].includes(b.status)).length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  const visible = useMemo(() => {
    if (filter === "all") return bookings;
    if (filter === "upcoming")
      return bookings.filter((b) =>
        ["pending", "confirmed"].includes(b.status),
      );
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const FILTERS = [
    { key: "all",       label: "All",       count: bookings.length },
    { key: "upcoming",  label: "Upcoming",  count: stats.upcoming },
    { key: "completed", label: "Completed", count: stats.completed },
    { key: "cancelled", label: "Cancelled", count: stats.cancelled },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <NavBar
        title="My Bookings"
        subtitle={
          stats.upcoming > 0
            ? `${stats.upcoming} upcoming appointment${stats.upcoming === 1 ? "" : "s"}`
            : "Plan and track your visits"
        }
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(b) => b._id}
          contentContainerStyle={[
            styles.list,
            visible.length === 0 && styles.listEmpty,
          ]}
          ListHeaderComponent={
            <>
              {/* Hero */}
              <LinearGradient
                colors={["#1d4ed8", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={[styles.heroDeco, { width: 170, height: 170, top: -50, right: -30 }]} />
                <View style={[styles.heroDeco, { width: 80, height: 80, bottom: -20, left: -10 }]} />

                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons
                      name="calendar-clear"
                      size={20}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroEyebrow}>{garageName}</Text>
                    <Text style={styles.heroTitle}>
                      {stats.upcoming > 0
                        ? `${stats.upcoming} visit${stats.upcoming === 1 ? "" : "s"} scheduled`
                        : `Ready when you are, ${firstName}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroSub}>
                  {stats.upcoming > 0
                    ? "Your upcoming appointments and booking history stay organized here."
                    : "Pick a convenient slot and send your next service request in a few taps."}
                </Text>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatVal}>{stats.upcoming}</Text>
                    <Text style={styles.heroStatLbl}>Upcoming</Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatVal}>{stats.completed}</Text>
                    <Text style={styles.heroStatLbl}>Completed</Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatVal}>{stats.cancelled}</Text>
                    <Text style={styles.heroStatLbl}>Cancelled</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() => setShowModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle" size={16} color="#1d4ed8" />
                  <Text style={styles.heroCtaText}>Book new appointment</Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Filters */}
              <View style={styles.filterRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: SIZES.screenPadding }}
                >
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() => setFilter(f.key)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.filterChipTxt,
                            active && styles.filterChipTxtActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                        <View
                          style={[
                            styles.filterCount,
                            active && styles.filterCountActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterCountTxt,
                              active && styles.filterCountTxtActive,
                            ]}
                          >
                            {f.count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Appointment timeline</Text>
                <Text style={styles.sectionSub}>
                  {visible.length > 0
                    ? `${visible.length} booking${visible.length === 1 ? "" : "s"}`
                    : "Nothing to show in this view"}
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              garageName={garageName}
              onCancel={handleCancel}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Empty
                icon="calendar-outline"
                title={filter === "all" ? "No bookings yet" : "No matching bookings"}
                sub={
                  filter === "all"
                    ? "Create your first appointment to reserve a service slot."
                    : "Try a different filter."
                }
                actionLabel={
                  filter === "all" ? "Book an appointment" : "Show all"
                }
                onAction={() =>
                  filter === "all" ? setShowModal(true) : setFilter("all")
                }
              />
            </View>
          }
          ListFooterComponent={<View style={{ height: tabBarH + 16 }} />}
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

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
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
    gap: 10,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEyebrow: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 2,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroSub: {
    marginTop: SIZES.sm,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 19,
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
    fontSize: SIZES.textLg,
    color: COLORS.white,
  },
  heroStatLbl: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.78)",
  },
  heroCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.sm,
  },
  heroCtaText: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: "#1d4ed8",
  },

  // Filter row
  filterRow: {
    marginTop: SIZES.md,
    marginHorizontal: -SIZES.screenPadding,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },
  filterChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  filterChipTxt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  filterChipTxtActive: { color: COLORS.white },
  filterCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
  },
  filterCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterCountTxt: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  filterCountTxtActive: { color: COLORS.white },

  sectionHead: {
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  sectionSub: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  list: { paddingBottom: 32 },
  listEmpty: { flex: 1 },

  // Card
  card: {
    flexDirection: "row",
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm + 4,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardAccent: { width: 4 },
  cardBody: {
    flex: 1,
    padding: SIZES.md,
    gap: 7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bookingNo: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  scheduleText: {
    marginTop: 3,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "#1d4ed8",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardRowText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
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
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
  },
  actionPillCancel: { marginLeft: "auto", backgroundColor: "#fee2e2" },
  actionPillText: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: 24,
  },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.55)" },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "94%",
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginBottom: SIZES.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SIZES.sm,
  },
  sheetEyebrow: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetTitle: {
    marginTop: 3,
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.bgSection,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: SIZES.md,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1d4ed8",
  },

  label: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  hScroll: { marginBottom: 4 },

  // Day chip
  dayChip: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 68,
    ...SHADOWS.sm,
  },
  dayChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  dayChipLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayChipLabelActive: { color: "rgba(255,255,255,0.85)" },
  dayChipDate: {
    marginTop: 3,
    fontFamily: FONTS.extrabold,
    fontSize: 20,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  dayChipDateActive: { color: COLORS.white },
  dayChipMonth: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  dayChipMonthActive: { color: "rgba(255,255,255,0.85)" },

  // Time chips
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 4,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  timeChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  timeChipTextActive: { color: COLORS.white },

  // Preset chips
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  presetChipActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#1d4ed8",
  },
  presetText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  presetTextActive: { color: "#1d4ed8" },

  // Text input
  textInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginTop: 6,
  },

  // Summary
  summaryCard: {
    backgroundColor: "#eff6ff",
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: SIZES.sm,
    gap: 7,
  },
  summaryTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textSm,
    color: "#1d4ed8",
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  summaryTxt: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "#1e3a8a",
    flex: 1,
  },

  // Vehicle chip
  vChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  vChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  vChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  vChipTextActive: { color: COLORS.white },

  // Footer
  sheetFooter: {
    flexDirection: "row",
    gap: 8,
    paddingTop: SIZES.sm,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  primaryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textBase,
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  secondaryBtnText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: "#1d4ed8",
  },
});
