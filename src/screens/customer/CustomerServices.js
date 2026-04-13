import { useState, useCallback, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, FlatList, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  customerGetServices,
  customerGetVehicles,
  customerCreateOrder,
} from "../../api/portal";
import { inr } from "../../utils/portalHelpers";
import NavBar from "../../components/portal/NavBar";
import Empty from "../../components/portal/Empty";
import M from "../../components/portal/modalStyles";

// ─── Date / Time helpers ────────────────────────────────────────────────────
const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildDays(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function buildTimeSlots() {
  const slots = [];
  for (let h = 8; h < 19; h++) {
    [0, 30].forEach((m) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12  = h % 12 || 12;
      slots.push({ h, m, label: `${h12}:${m.toString().padStart(2, "0")} ${ampm}` });
    });
  }
  return slots;
}

const DAYS       = buildDays();
const TIME_SLOTS = buildTimeSlots();

/** Round current time up to the next 30-min working slot (defaults to 8:00 AM if before/after hours). */
function defaultTimeSlot() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const next = Math.ceil((mins + 1) / 30) * 30;
  return TIME_SLOTS.find((s) => s.h * 60 + s.m >= next) ?? TIME_SLOTS[0];
}

function fmtDayChip(date) {
  const isToday = date.toDateString() === new Date().toDateString();
  return {
    day:  isToday ? "Today" : DAY_NAMES[date.getDay()],
    date: `${date.getDate()} ${MON_SHORT[date.getMonth()]}`,
  };
}

// ────────────────────────────────────────────────────────────────────────────

export default function CustomerServices({ navigation }) {
  const [services, setServices]     = useState([]);
  const [cats, setCats]             = useState([]);
  const [selCat, setSelCat]         = useState(null);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [picked, setPicked]         = useState([]);
  const [bookModal, setBookModal]   = useState(false);
  const [vehicles, setVehicles]     = useState([]);
  const [selVeh, setSelVeh]         = useState(null);
  const [vModal, setVModal]         = useState(false);
  const [note, setNote]             = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selDate, setSelDate]       = useState(DAYS[0]);
  const [selTime, setSelTime]       = useState(TIME_SLOTS[0]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selCat) params.category = selCat;
      if (search.trim()) params.search = search.trim();
      const r = await customerGetServices(params);
      setServices(r.data?.data?.services || []);
      if (!selCat) setCats(r.data?.data?.categories || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [selCat, search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const toggle = (svc) =>
    setPicked((p) =>
      p.some((x) => x._id === svc._id)
        ? p.filter((x) => x._id !== svc._id)
        : [...p, svc],
    );

  const openBook = async () => {
    // Reset date/time defaults each time modal opens
    setSelDate(DAYS[0]);
    setSelTime(defaultTimeSlot());
    const r = await customerGetVehicles().catch(() => null);
    setVehicles(r?.data?.data?.vehicles || []);
    setBookModal(true);
  };

  const submit = async () => {
    if (!selVeh) {
      Toast.show({ type: "error", text1: "Select a vehicle." });
      return;
    }
    try {
      setSubmitting(true);

      // Build scheduledAt from selected (or defaulted) date + time slot
      const scheduledAt = new Date(selDate);
      scheduledAt.setHours(selTime.h, selTime.m, 0, 0);

      await customerCreateOrder({
        vehicleId:    selVeh._id,
        customerNote: note.trim() || null,
        scheduledAt:  scheduledAt.toISOString(),
        services: picked.map((svc) => ({
          catalogId: svc._id,
          name:      svc.name,
          price:     svc.mrp || 0,
        })),
      });
      Toast.show({ type: "success", text1: "Service request submitted!" });
      setBookModal(false);
      setPicked([]);
      setSelVeh(null);
      setNote("");
      setSelDate(DAYS[0]);
      setSelTime(TIME_SLOTS[0]);
      navigation.navigate("Orders");
    } catch (e) {
      Toast.show({ type: "error", text1: e?.displayMessage || "Failed to submit." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <NavBar title="Services" />

      {/* Search */}
      <View style={s.srow}>
        <View style={s.sbox}>
          <Ionicons name="search-outline" size={15} color={COLORS.textMuted} />
          <TextInput
            style={s.sinput}
            placeholder="Search services…"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
          />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44 }}
        contentContainerStyle={{ paddingHorizontal: SIZES.screenPadding, gap: 8, alignItems: "center" }}
      >
        {[null, ...cats].map((c) => (
          <TouchableOpacity
            key={String(c)}
            style={[s.chip, selCat === c && s.chipOn]}
            onPress={() => setSelCat(c)}
          >
            <Text style={[s.chipTxt, selCat === c && s.chipTxtOn]}>{c || "All"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : services.length === 0 ? (
        <Empty icon="construct-outline" title="No services found" sub="Try a different search" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SIZES.screenPadding, paddingBottom: picked.length ? 100 : 24 }}
        >
          {services.map((svc) => {
            const sel = picked.some((x) => x._id === svc._id);
            return (
              <TouchableOpacity
                key={svc._id}
                style={[s.card, sel && s.cardOn]}
                onPress={() => toggle(svc)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.sname}>{svc.name}</Text>
                  <Text style={s.scat}>{svc.category}</Text>
                  {svc.applicableBrands?.length > 0 && (
                    <Text style={s.applicable} numberOfLines={1}>
                      For: {svc.applicableBrands.join(", ")}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={s.smrp}>{inr(svc.mrp)}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Book FAB */}
      {picked.length > 0 && (
        <View style={s.fab}>
          <TouchableOpacity style={s.fabBtn} onPress={openBook} activeOpacity={0.9}>
            <Ionicons name="calendar-outline" size={17} color={COLORS.white} />
            <Text style={s.fabTxt}>
              Book {picked.length} Service{picked.length > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Confirm Booking bottom sheet ─────────────────────────────────── */}
      <Modal visible={bookModal} animationType="slide" transparent onRequestClose={() => setBookModal(false)}>
        <View style={M.overlay}>
          <View style={[M.box, { paddingBottom: 0 }]}>
            <Text style={M.title}>Confirm Booking</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: SIZES.xl }}
            >
              {/* Selected services */}
              {picked.map((svc) => (
                <View key={svc._id} style={s.svcRow}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                  <Text style={s.svcName}>{svc.name}</Text>
                  <Text style={s.svcPrice}>{inr(svc.mrp)}</Text>
                </View>
              ))}

              {/* ── Date picker ─────────────────────────────────────────── */}
              <Text style={s.dtLabel}>Preferred Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                style={{ marginBottom: SIZES.sm }}
              >
                {DAYS.map((d) => {
                  const { day, date } = fmtDayChip(d);
                  const active = d.toDateString() === selDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      style={[s.dayChip, active && s.dayChipOn]}
                      onPress={() => setSelDate(d)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.dayName, active && { color: COLORS.primary }]}>{day}</Text>
                      <Text style={[s.dayNum,  active && s.dayNumOn]}>{date}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Time picker ─────────────────────────────────────────── */}
              <Text style={s.dtLabel}>Preferred Time</Text>
              <View style={s.tslotWrap}>
                {TIME_SLOTS.map((slot) => {
                  const active = slot.h === selTime.h && slot.m === selTime.m;
                  return (
                    <TouchableOpacity
                      key={slot.label}
                      style={[s.tslot, active && s.tslotOn]}
                      onPress={() => setSelTime(slot)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.tslotTxt, active && s.tslotTxtOn]}>{slot.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Vehicle picker ──────────────────────────────────────── */}
              <Text style={M.label}>Vehicle</Text>
              <TouchableOpacity style={M.picker} onPress={() => setVModal(true)}>
                <Text style={selVeh ? M.pickerVal : M.pickerPH}>
                  {selVeh
                    ? `${selVeh.vehicleBrand} ${selVeh.vehicleModel} · ${selVeh.vehicleRegisterNo}`
                    : "Choose vehicle…"}
                </Text>
                <Ionicons name="chevron-down" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>

              {/* ── Note / complaint ────────────────────────────────────── */}
              <Text style={M.label}>Note / Complaint (optional)</Text>
              <TextInput
                style={M.noteInput}
                placeholder="Describe the issue…"
                placeholderTextColor={COLORS.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Sticky action buttons */}
            <View style={[M.btns, { paddingBottom: SIZES.lg, paddingTop: SIZES.sm }]}>
              <TouchableOpacity style={M.cancelBtn} onPress={() => setBookModal(false)}>
                <Text style={M.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={M.confirmBtn} onPress={submit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={M.confirmTxt}>Submit Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Vehicle picker modal ─────────────────────────────────────────── */}
      <Modal visible={vModal} animationType="slide" transparent onRequestClose={() => setVModal(false)}>
        <View style={M.overlay}>
          <View style={M.box}>
            <Text style={M.title}>Select Vehicle</Text>
            {vehicles.length === 0 ? (
              <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center", paddingVertical: 16 }}>
                No vehicles registered. Add one from Profile.
              </Text>
            ) : (
              vehicles.map((v) => (
                <TouchableOpacity
                  key={v._id}
                  style={[M.vitem, selVeh?._id === v._id && M.vitemOn]}
                  onPress={() => { setSelVeh(v); setVModal(false); }}
                >
                  <Ionicons name="car-outline" size={17} color={COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary }}>
                      {v.vehicleBrand} {v.vehicleModel}
                    </Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted }}>
                      {v.vehicleRegisterNo}
                    </Text>
                  </View>
                  {selVeh?._id === v._id && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={M.cancelBtn} onPress={() => setVModal(false)}>
              <Text style={M.cancelTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // ── Service list ──────────────────────────────────────────────────────────
  srow:       { paddingHorizontal: SIZES.screenPadding, paddingVertical: SIZES.sm },
  sbox:       { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.borderLight, gap: 8 },
  sinput:     { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  chip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgCard },
  chipOn:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt:    { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  chipTxtOn:  { color: COLORS.white },
  card:       { flexDirection: "row", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, borderWidth: 1.5, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  cardOn:     { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
  sname:      { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  scat:       { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  applicable: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.primary, marginTop: 2 },
  smrp:       { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.primary },
  fab:        { position: "absolute", bottom: 16, left: SIZES.screenPadding, right: SIZES.screenPadding },
  fabBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, padding: 14, gap: 8, ...SHADOWS.md },
  fabTxt:     { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },
  // ── Confirm booking modal — service row ───────────────────────────────────
  svcRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  svcName:    { flex: 1, fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  svcPrice:   { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.primary },
  // ── Date / Time picker ────────────────────────────────────────────────────
  dtLabel:    { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginBottom: 6, marginTop: SIZES.sm },
  dayChip:    { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgCard, minWidth: 60 },
  dayChipOn:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  dayName:    { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted, marginBottom: 2 },
  dayNum:     { fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  dayNumOn:   { color: COLORS.primary },
  tslotWrap:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SIZES.sm },
  tslot:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgCard },
  tslotOn:    { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  tslotTxt:   { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  tslotTxtOn: { color: COLORS.primary, fontFamily: FONTS.semibold },
});
