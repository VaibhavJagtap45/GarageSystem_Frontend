import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { customerGetOrders } from "../../api/portal";
import { getMyBookings } from "../../api/booking";
import NavBar from "../../components/portal/NavBar";
import { inr } from "../../utils/portalHelpers";

// ─── Constants ──────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DOT_COLORS = {
  // orders
  created:       "#f59e0b",
  in_progress:   "#6366f1",
  vehicle_ready: "#0ea5e9",
  completed:     "#22c55e",
  cancelled:     "#9ca3af",
  // bookings
  pending:       "#f59e0b",
  confirmed:     "#0ea5e9",
};

const STATUS_META = {
  created:       { color: "#f59e0b", bg: "#fef3c7", label: "Requested" },
  in_progress:   { color: "#6366f1", bg: "#e0e7ff", label: "In Progress" },
  vehicle_ready: { color: "#0ea5e9", bg: "#e0f2fe", label: "Ready" },
  completed:     { color: "#22c55e", bg: "#dcfce7", label: "Completed" },
  cancelled:     { color: "#9ca3af", bg: "#f3f4f6", label: "Cancelled" },
  pending:       { color: "#f59e0b", bg: "#fef3c7", label: "Pending" },
  confirmed:     { color: "#0ea5e9", bg: "#e0f2fe", label: "Confirmed" },
};

function toLocalDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

function weekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const TODAY_KEY = toLocalDateKey(new Date());

// ─── Event card ─────────────────────────────────────────────────────────────
function EventCard({ event, onPress }) {
  const meta = STATUS_META[event.status] ?? STATUS_META.created;
  const isBooking = event.kind === "booking";

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => onPress(event)}
    >
      <View style={[s.cardAccent, { backgroundColor: meta.color }]} />
      <View style={s.cardBody}>
        <View style={s.cardTopRow}>
          <View style={s.cardKindRow}>
            <View style={[s.cardKindIcon, { backgroundColor: meta.bg }]}>
              <Ionicons
                name={isBooking ? "calendar-clear-outline" : "car-sport-outline"}
                size={14}
                color={meta.color}
              />
            </View>
            <Text style={s.cardNo}>
              {isBooking ? event.bookingNo || "Booking" : event.orderNo || "Order"}
            </Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[s.statusLabel, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        {event.vehicle && (
          <View style={s.cardInfoRow}>
            <Ionicons name="car-outline" size={13} color={COLORS.textMuted} />
            <Text style={s.cardInfoTxt} numberOfLines={1}>
              {event.vehicle.vehicleBrand} {event.vehicle.vehicleModel}
              {event.vehicle.vehicleRegisterNo
                ? `  ·  ${event.vehicle.vehicleRegisterNo}`
                : ""}
            </Text>
          </View>
        )}

        {event.serviceSummary && (
          <View style={s.cardInfoRow}>
            <MaterialCommunityIcons
              name="wrench-outline"
              size={13}
              color={COLORS.textMuted}
            />
            <Text
              style={[s.cardInfoTxt, { color: COLORS.textSecondary }]}
              numberOfLines={2}
            >
              {event.serviceSummary}
            </Text>
          </View>
        )}

        <View style={s.cardFooterRow}>
          {event.time && (
            <View style={s.timeChip}>
              <Ionicons name="time-outline" size={11} color="#2563eb" />
              <Text style={s.timeChipTxt}>{event.time}</Text>
            </View>
          )}
          {event.amount > 0 && (
            <Text style={s.cardAmount}>{inr(event.amount)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Week day cell ──────────────────────────────────────────────────────────
function WeekDayCell({ date, dateKey, dots, isSelected, isToday, onPress }) {
  const dayName = DAY_NAMES[date.getDay()];
  return (
    <TouchableOpacity
      style={[s.weekCell, isSelected && s.weekCellActive]}
      onPress={() => onPress(dateKey)}
      activeOpacity={0.75}
    >
      <Text
        style={[
          s.weekDayName,
          isSelected && { color: COLORS.white },
          isToday && !isSelected && { color: "#2563eb" },
        ]}
      >
        {dayName}
      </Text>
      <View
        style={[
          s.weekDayCircle,
          isSelected && s.weekDayCircleActive,
          isToday && !isSelected && s.weekDayCircleToday,
        ]}
      >
        <Text
          style={[
            s.weekDayNum,
            isSelected && { color: "#1d4ed8" },
            isToday && !isSelected && { color: "#1d4ed8" },
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
      <View style={s.weekDotRow}>
        {dots.length > 0 ? (
          dots.map((c, i) => (
            <View
              key={i}
              style={[
                s.weekDot,
                { backgroundColor: isSelected ? COLORS.white : c },
              ]}
            />
          ))
        ) : (
          <View style={s.weekDotPlaceholder} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function CustomerCalendar({ navigation }) {
  const tabBarH = useBottomTabBarHeight();
  const today = new Date();
  const [viewMode, setViewMode] = useState("monthly");
  const [selectedKey, setSelectedKey] = useState(TODAY_KEY);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekOrigin, setWeekOrigin] = useState(weekStart(today));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ordersRes, bookingsRes] = await Promise.allSettled([
        customerGetOrders({ limit: 100 }),
        getMyBookings(),
      ]);

      const orderEvents =
        ordersRes.status === "fulfilled"
          ? (ordersRes.value?.data?.data?.orders || []).map((o) => ({
              kind: "order",
              _id: o._id,
              orderNo: o.orderNo,
              status: o.status,
              date: o.scheduledAt ?? o.createdAt,
              time: fmtTime(o.scheduledAt ?? o.createdAt),
              vehicle: o.vehicleId,
              amount: o.totalAmount,
              serviceSummary: (o.services || [])
                .slice(0, 3)
                .map((s) => s.name)
                .join(", "),
            }))
          : [];

      const bookingEvents =
        bookingsRes.status === "fulfilled"
          ? (bookingsRes.value?.bookings || []).map((b) => ({
              kind: "booking",
              _id: b._id,
              bookingNo: b.bookingNo,
              status: b.status,
              date: b.scheduledAt,
              time: fmtTime(b.scheduledAt),
              vehicle: b.vehicle,
              amount: 0,
              serviceSummary: b.serviceType || b.notes || "",
            }))
          : [];

      setEvents([...bookingEvents, ...orderEvents]);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const k = toLocalDateKey(e.date);
      if (!k) return;
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = useMemo(
    () => eventsByDay[selectedKey] ?? [],
    [eventsByDay, selectedKey],
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const goPrev = () => {
    if (viewMode === "monthly") {
      const nm = month === 0 ? 11 : month - 1;
      const ny = month === 0 ? year - 1 : year;
      setMonth(nm);
      setYear(ny);
    } else {
      const prev = new Date(weekOrigin);
      prev.setDate(prev.getDate() - 7);
      setWeekOrigin(prev);
    }
  };
  const goNext = () => {
    if (viewMode === "monthly") {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      setMonth(nm);
      setYear(ny);
    } else {
      const next = new Date(weekOrigin);
      next.setDate(next.getDate() + 7);
      setWeekOrigin(next);
    }
  };
  const jumpToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekOrigin(weekStart(today));
    setSelectedKey(TODAY_KEY);
  };

  const onEventPress = (ev) => {
    if (ev.kind === "order") {
      navigation.navigate("Orders", {
        screen: "COrderDetail",
        params: { orderId: ev._id },
      });
    } else {
      navigation.navigate("CBookings");
    }
  };

  // ── Grid data ────────────────────────────────────────────────────────────
  const monthlyGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(year, month);
    const totalDays = getDaysInMonth(year, month);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push({ type: "empty", key: `e-${i}` });
    for (let d = 1; d <= totalDays; d++) {
      const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = eventsByDay[k] || [];
      cells.push({
        type: "day",
        key: k,
        day: d,
        dots: dayEvents.slice(0, 4).map((o) => DOT_COLORS[o.status] ?? "#94a3b8"),
        count: dayEvents.length,
        isToday: k === TODAY_KEY,
        isSelected: k === selectedKey,
      });
    }
    return cells;
  }, [year, month, eventsByDay, selectedKey]);

  const weekCells = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekOrigin);
        d.setDate(d.getDate() + i);
        const key = toLocalDateKey(d);
        const dayEvents = eventsByDay[key] || [];
        return {
          date: d,
          key,
          dots: dayEvents.slice(0, 3).map((o) => DOT_COLORS[o.status] ?? "#94a3b8"),
          isToday: key === TODAY_KEY,
          isSelected: key === selectedKey,
        };
      }),
    [weekOrigin, eventsByDay, selectedKey],
  );

  const weekLabel = useMemo(() => {
    const end = new Date(weekOrigin);
    end.setDate(end.getDate() + 6);
    const st = weekOrigin;
    if (st.getMonth() === end.getMonth()) {
      return `${st.getDate()}–${end.getDate()} ${MONTH_NAMES[st.getMonth()]} ${st.getFullYear()}`;
    }
    return `${st.getDate()} ${MONTH_NAMES[st.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
  }, [weekOrigin]);

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return "";
    const d = new Date(`${selectedKey}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedKey]);

  const rightElement = (
    <TouchableOpacity style={s.todayBtn} onPress={jumpToToday} activeOpacity={0.8}>
      <Ionicons name="today-outline" size={14} color="#2563eb" />
      <Text style={s.todayBtnTxt}>Today</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <NavBar
        title="Calendar"
        onBack={() => navigation.goBack()}
        right={rightElement}
      />

      <FlatList
        data={selectedEvents}
        keyExtractor={(item) => `${item.kind}-${item._id}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={["#2563eb"]}
          />
        }
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: tabBarH + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Gradient hero + view toggle */}
            <LinearGradient
              colors={["#1d4ed8", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              <View style={[s.heroDeco, { width: 150, height: 150, top: -40, right: -30 }]} />
              <View style={[s.heroDeco, { width: 80, height: 80, bottom: -20, left: -10 }]} />

              <View style={s.heroTop}>
                <View>
                  <Text style={s.heroEyebrow}>Your schedule</Text>
                  <Text style={s.heroTitle}>
                    {viewMode === "monthly"
                      ? `${MONTH_NAMES[month]} ${year}`
                      : weekLabel}
                  </Text>
                </View>
                <View style={s.viewToggle}>
                  <TouchableOpacity
                    style={[s.toggleBtn, viewMode === "monthly" && s.toggleBtnActive]}
                    onPress={() => setViewMode("monthly")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={viewMode === "monthly" ? "#1d4ed8" : "rgba(255,255,255,0.85)"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.toggleBtn, viewMode === "weekly" && s.toggleBtnActive]}
                    onPress={() => setViewMode("weekly")}
                  >
                    <Ionicons
                      name="calendar-number-outline"
                      size={15}
                      color={viewMode === "weekly" ? "#1d4ed8" : "rgba(255,255,255,0.85)"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.heroNavRow}>
                <TouchableOpacity style={s.heroNavBtn} onPress={goPrev}>
                  <Ionicons name="chevron-back" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <View style={s.heroCountPill}>
                  <Ionicons name="sparkles" size={11} color="#1d4ed8" />
                  <Text style={s.heroCountTxt}>
                    {events.length} event{events.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <TouchableOpacity style={s.heroNavBtn} onPress={goNext}>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Calendar card */}
            <View style={s.calendarCard}>
              {viewMode === "monthly" ? (
                <>
                  <View style={s.dayHeader}>
                    {DAY_NAMES.map((d) => (
                      <Text key={d} style={s.dayHeaderText}>
                        {d}
                      </Text>
                    ))}
                  </View>
                  <View style={s.monthGrid}>
                    {monthlyGrid.map((cell) => {
                      if (cell.type === "empty")
                        return <View key={cell.key} style={s.dayCell} />;
                      return (
                        <TouchableOpacity
                          key={cell.key}
                          style={s.dayCell}
                          onPress={() => setSelectedKey(cell.key)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              s.dayCellInner,
                              cell.isSelected && s.dayCellSelected,
                              cell.isToday && !cell.isSelected && s.dayCellToday,
                            ]}
                          >
                            <Text
                              style={[
                                s.dayCellText,
                                cell.isSelected && { color: COLORS.white, fontFamily: FONTS.bold },
                                cell.isToday && !cell.isSelected && { color: "#1d4ed8", fontFamily: FONTS.bold },
                              ]}
                            >
                              {cell.day}
                            </Text>
                          </View>
                          <View style={s.dotRow}>
                            {cell.dots.map((c, i) => (
                              <View
                                key={i}
                                style={[
                                  s.eventDot,
                                  {
                                    backgroundColor: cell.isSelected
                                      ? "rgba(255,255,255,0.9)"
                                      : c,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={s.weekStrip}>
                  {weekCells.map((cell) => (
                    <WeekDayCell
                      key={cell.key}
                      date={cell.date}
                      dateKey={cell.key}
                      dots={cell.dots}
                      isSelected={cell.isSelected}
                      isToday={cell.isToday}
                      onPress={setSelectedKey}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Legend */}
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={s.legendTxt}>Requested</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#6366f1" }]} />
                <Text style={s.legendTxt}>In Progress</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#0ea5e9" }]} />
                <Text style={s.legendTxt}>Ready/Booked</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: "#22c55e" }]} />
                <Text style={s.legendTxt}>Completed</Text>
              </View>
            </View>

            {/* Day label row */}
            <View style={s.dayLabelRow}>
              <View>
                <Text style={s.dayLabelTitle}>{selectedLabel}</Text>
                <Text style={s.dayLabelSub}>
                  {selectedEvents.length === 0
                    ? "No scheduled events"
                    : `${selectedEvents.length} scheduled event${selectedEvents.length === 1 ? "" : "s"}`}
                </Text>
              </View>
              {selectedEvents.length > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{selectedEvents.length}</Text>
                </View>
              )}
            </View>

            {loading && !refreshing && (
              <ActivityIndicator
                size="small"
                color="#2563eb"
                style={{ marginVertical: 12 }}
              />
            )}
          </>
        }
        renderItem={({ item }) => (
          <EventCard event={item} onPress={onEventPress} />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={36}
                  color="#94a3b8"
                />
              </View>
              <Text style={s.emptyTitle}>No events this day</Text>
              <Text style={s.emptySub}>
                Bookings and scheduled services appear here with full details.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Today button
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: "#dbeafe",
  },
  todayBtnTxt: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: "#2563eb",
  },

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
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroEyebrow: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.76)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: SIZES.radiusFull,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 32,
    height: 28,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
  },
  heroNavRow: {
    marginTop: SIZES.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
  },
  heroNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  heroCountTxt: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "#1d4ed8",
  },

  // Calendar card
  calendarCard: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },

  dayHeader: {
    flexDirection: "row",
    paddingTop: SIZES.sm + 2,
    paddingBottom: SIZES.xs,
    paddingHorizontal: SIZES.xs,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SIZES.xs,
    paddingBottom: SIZES.sm,
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: SIZES.xs / 2,
    gap: 2,
  },
  dayCellInner: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: "#1d4ed8",
    ...SHADOWS.md,
    shadowColor: "#1d4ed8",
  },
  dayCellToday: {
    backgroundColor: "#dbeafe",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  dayCellText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    alignItems: "center",
  },
  eventDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
  },

  // Weekly strip
  weekStrip: {
    flexDirection: "row",
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
    gap: SIZES.xs,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
  },
  weekCellActive: {
    backgroundColor: "#1d4ed8",
  },
  weekDayName: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekDayCircle: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayCircleActive: {
    backgroundColor: COLORS.white,
  },
  weekDayCircleToday: {
    backgroundColor: "#dbeafe",
  },
  weekDayNum: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  weekDotRow: {
    flexDirection: "row",
    gap: 3,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekDotPlaceholder: {
    width: 6,
    height: 6,
  },

  // Legend
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendTxt: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },

  // Day label
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  dayLabelTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  dayLabelSub: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontFamily: FONTS.extrabold,
    fontSize: 11,
    color: COLORS.white,
  },

  // Event cards
  listContent: {
    paddingTop: SIZES.xs,
  },
  card: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm + 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: "row",
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: SIZES.md,
    gap: 7,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardKindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardKindIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cardNo: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  statusLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardInfoTxt: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dbeafe",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeChipTxt: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: "#1d4ed8",
  },
  cardAmount: {
    marginLeft: "auto",
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: "#1d4ed8",
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: SIZES.xl,
    paddingHorizontal: SIZES.screenPadding * 2,
    gap: SIZES.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 6,
  },
  emptySub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
});
