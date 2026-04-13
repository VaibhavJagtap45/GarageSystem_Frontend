import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  REPAIR_ORDER_ENDPOINTS,
} from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import axiosClient from "../../api/axios";
import { useFontSizes } from "../../context/PreferencesContext";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/** Per-status dot colour on the calendar grid. */
const DOT_COLORS = {
  created:       "#EF4444", // red   — open, not started
  in_progress:   "#F59E0B", // amber — WIP
  vehicle_ready: "#22C55E", // green — ready for pickup
  completed:     "#22C55E", // green — done
  cancelled:     "#9CA3AF", // gray  — cancelled (shown dimly)
};

const STATUS_META = {
  created:       { color: COLORS.primary,   bg: COLORS.primaryLight, label: "Open" },
  in_progress:   { color: "#BA7517",        bg: "#FFFBEB",           label: "WIP" },
  vehicle_ready: { color: COLORS.success,   bg: COLORS.primaryLight, label: "Ready" },
  completed:     { color: COLORS.textMuted, bg: "#F3F4F6",           label: "Done" },
  cancelled:     { color: COLORS.error,     bg: COLORS.errorLight,   label: "Cancelled" },
};

/** Return YYYY-MM-DD in **local** time so grid cells match dates correctly. */
function toLocalDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

/** Start of week (Sunday) for a given Date. */
function weekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format HH:MM AM/PM from an ISO string. */
function fmtTime(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Today's date key YYYY-MM-DD. */
const TODAY_KEY = toLocalDateKey(new Date());

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** A single event card for a repair order. */
function OrderCard({ order, onPress, fs }) {
  const meta    = STATUS_META[order.status] ?? STATUS_META.created;
  const vehicle = order.vehicleId;
  const customer = order.customerId;

  const vehicleLabel = vehicle
    ? [vehicle.vehicleBrand, vehicle.vehicleModel].filter(Boolean).join(" ")
    : "—";

  const serviceNames = (order.services || [])
    .slice(0, 3)
    .map((s) => s.name || s.serviceName || "Service")
    .join(", ");

  const scheduledTime   = fmtTime(order.scheduledAt ?? order.createdAt);
  const estimatedTime   = fmtTime(order.estimatedDeliveryAt);

  return (
    <TouchableOpacity
      style={s.orderCard}
      activeOpacity={0.8}
      onPress={() => onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNo}`}
    >
      {/* Left accent bar */}
      <View style={[s.orderAccent, { backgroundColor: meta.color }]} />

      <View style={s.orderBody}>
        {/* Row 1: order number + status */}
        <View style={s.orderRow}>
          <Text style={[s.orderNo, { fontSize: fs.textSm }]}>{order.orderNo || "—"}</Text>
          <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[s.statusLabel, { color: meta.color, fontSize: fs.textXs }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        {/* Row 2: customer */}
        <View style={s.infoRow}>
          <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
          <Text style={[s.infoText, { fontSize: fs.textBase }]} numberOfLines={1}>
            {customer?.fullName || "Unknown Customer"}
          </Text>
          {customer?.phoneNo ? (
            <Text style={[s.phoneText, { fontSize: fs.textXs }]}>
              {customer.phoneNo}
            </Text>
          ) : null}
        </View>

        {/* Row 3: vehicle */}
        <View style={s.infoRow}>
          <Ionicons name="car-outline" size={13} color={COLORS.textMuted} />
          <Text style={[s.infoText, { fontSize: fs.textBase }]} numberOfLines={1}>
            {vehicleLabel}
          </Text>
          {vehicle?.vehicleRegisterNo ? (
            <View style={s.regPill}>
              <Text style={[s.regText, { fontSize: fs.textXs }]}>
                {vehicle.vehicleRegisterNo}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Row 4: services */}
        {serviceNames ? (
          <View style={s.infoRow}>
            <MaterialCommunityIcons name="wrench-outline" size={13} color={COLORS.textMuted} />
            <Text
              style={[s.infoText, { fontSize: fs.textSm, color: COLORS.textSecondary }]}
              numberOfLines={2}
            >
              {serviceNames}
            </Text>
          </View>
        ) : null}

        {/* Row 5: times */}
        <View style={s.timeRow}>
          {scheduledTime ? (
            <View style={s.timeChip}>
              <Ionicons name="time-outline" size={11} color={COLORS.primary} />
              <Text style={[s.timeText, { fontSize: fs.textXs }]}>
                In: {scheduledTime}
              </Text>
            </View>
          ) : null}
          {estimatedTime ? (
            <View style={[s.timeChip, { backgroundColor: "#FFFBEB" }]}>
              <Ionicons name="checkmark-circle-outline" size={11} color="#BA7517" />
              <Text style={[s.timeText, { color: "#BA7517", fontSize: fs.textXs }]}>
                Est: {estimatedTime}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Day column used in the weekly strip. */
function WeekDayCell({ date, dateKey, dots, isSelected, isToday, onPress }) {
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum  = date.getDate();

  return (
    <TouchableOpacity
      style={[s.weekCell, isSelected && s.weekCellActive]}
      onPress={() => onPress(dateKey)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${dayName} ${dayNum}`}
    >
      <Text
        style={[
          s.weekDayName,
          isSelected && s.weekDayNameActive,
          isToday && !isSelected && { color: COLORS.primary },
        ]}
      >
        {dayName}
      </Text>
      <View style={[
        s.weekDayCircle,
        isSelected && s.weekDayCircleActive,
        isToday && !isSelected && s.weekDayCircleToday,
      ]}>
        <Text style={[
          s.weekDayNum,
          isSelected && s.weekDayNumActive,
          isToday && !isSelected && { color: COLORS.primary },
        ]}>
          {dayNum}
        </Text>
      </View>
      <View style={s.weekDotRow}>
        {dots.length > 0
          ? dots.map((color, i) => (
              <View
                key={i}
                style={[s.weekDot, { backgroundColor: isSelected ? COLORS.white : color }]}
              />
            ))
          : <View style={s.weekDotPlaceholder} />
        }
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const navigation = useNavigation();
  const fs = useFontSizes();

  const today = new Date();
  const [viewMode, setViewMode]         = useState("monthly"); // "monthly" | "weekly"
  const [selectedKey, setSelectedKey]   = useState(TODAY_KEY);
  const [year,  setYear]                = useState(today.getFullYear());
  const [month, setMonth]               = useState(today.getMonth());      // 0-based
  const [weekOrigin, setWeekOrigin]     = useState(weekStart(today));       // first day of current week
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (yr, mo, wkOrigin, mode, silent = false) => {
    if (!silent) setLoading(true);
    try {
      let dateFrom, dateTo;
      if (mode === "monthly") {
        const firstDay = new Date(yr, mo, 1);
        const lastDay  = new Date(yr, mo + 1, 0);
        dateFrom = toLocalDateKey(firstDay);
        dateTo   = toLocalDateKey(lastDay);
      } else {
        // weekly — fetch 7 days from weekOrigin
        const end = new Date(wkOrigin);
        end.setDate(end.getDate() + 6);
        dateFrom = toLocalDateKey(wkOrigin);
        dateTo   = toLocalDateKey(end);
      }
      const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.CALENDAR, {
        params: { dateFrom, dateTo },
      });
      setOrders(res.data?.data?.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(year, month, weekOrigin, viewMode);
    }, [fetchOrders, year, month, weekOrigin, viewMode]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(year, month, weekOrigin, viewMode, true);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  /** Map: dateKey → [orders]
   *  Advance bookings are keyed by scheduledAt.
   *  Same-day walk-ins (scheduledAt is null) fall back to createdAt. */
  const ordersByDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = toLocalDateKey(o.scheduledAt ?? o.createdAt);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [orders]);

  const selectedOrders = useMemo(
    () => ordersByDay[selectedKey] ?? [],
    [ordersByDay, selectedKey],
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToPrev = () => {
    if (viewMode === "monthly") {
      const nm = month === 0 ? 11 : month - 1;
      const ny = month === 0 ? year - 1 : year;
      setMonth(nm);
      setYear(ny);
      fetchOrders(ny, nm, weekOrigin, "monthly");
    } else {
      const prev = new Date(weekOrigin);
      prev.setDate(prev.getDate() - 7);
      setWeekOrigin(prev);
      fetchOrders(year, month, prev, "weekly");
    }
  };

  const goToNext = () => {
    if (viewMode === "monthly") {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      setMonth(nm);
      setYear(ny);
      fetchOrders(ny, nm, weekOrigin, "monthly");
    } else {
      const next = new Date(weekOrigin);
      next.setDate(next.getDate() + 7);
      setWeekOrigin(next);
      fetchOrders(year, month, next, "weekly");
    }
  };

  const switchView = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    fetchOrders(year, month, weekOrigin, mode);
  };

  const handleDayPress = (key) => setSelectedKey(key);

  const handleOrderPress = (order) => {
    navigation.navigate("CustomerRepairOrder", { orderId: order._id });
  };

  // ── Monthly calendar cells ────────────────────────────────────────────────

  const monthlyGrid = useMemo(() => {
    const firstDay  = getFirstDayOfMonth(year, month);
    const totalDays = getDaysInMonth(year, month);
    const cells = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ type: "empty", key: `empty-${i}` });
    }
    // Day cells
    for (let d = 1; d <= totalDays; d++) {
      const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOrders = ordersByDay[k] || [];
      cells.push({
        type: "day",
        key: k,
        day: d,
        // one colour per order, capped at 5 dots so the cell doesn't overflow
        dots: dayOrders.slice(0, 5).map((o) => DOT_COLORS[o.status] ?? "#9CA3AF"),
        isToday: k === TODAY_KEY,
        isSelected: k === selectedKey,
      });
    }
    return cells;
  }, [year, month, ordersByDay, selectedKey]);

  // ── Weekly cells ─────────────────────────────────────────────────────────

  const weekCells = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d         = new Date(weekOrigin);
      d.setDate(d.getDate() + i);
      const key       = toLocalDateKey(d);
      const dayOrders = ordersByDay[key] || [];
      return {
        date: d,
        key,
        // cap at 3 dots for the narrower weekly strip cells
        dots: dayOrders.slice(0, 3).map((o) => DOT_COLORS[o.status] ?? "#9CA3AF"),
        isToday: key === TODAY_KEY,
        isSelected: key === selectedKey,
      };
    });
  }, [weekOrigin, ordersByDay, selectedKey]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekOrigin);
    end.setDate(end.getDate() + 6);
    const s = weekOrigin;
    if (s.getMonth() === end.getMonth()) {
      return `${s.getDate()}–${end.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
  }, [weekOrigin]);

  // ── Selected day display label ────────────────────────────────────────────

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return "";
    const d = new Date(`${selectedKey}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedKey]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const rightElement = (
    <View style={s.viewToggle}>
      <TouchableOpacity
        style={[s.toggleBtn, viewMode === "monthly" && s.toggleBtnActive]}
        onPress={() => switchView("monthly")}
        accessibilityRole="button"
        accessibilityLabel="Monthly view"
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={viewMode === "monthly" ? COLORS.primary : COLORS.textMuted}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.toggleBtn, viewMode === "weekly" && s.toggleBtnActive]}
        onPress={() => switchView("weekly")}
        accessibilityRole="button"
        accessibilityLabel="Weekly view"
      >
        <Ionicons
          name="calendar-number-outline"
          size={16}
          color={viewMode === "weekly" ? COLORS.primary : COLORS.textMuted}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <TopNav title="Calendar" rightElement={rightElement} />

      {/* ── Month / Week navigator ─────────────────────────────────────── */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.navArrow}
          onPress={goToPrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Previous"
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={[s.navTitle, { fontSize: fs.textMd }]}>
          {viewMode === "monthly"
            ? `${MONTH_NAMES[month]} ${year}`
            : weekLabel}
        </Text>

        <TouchableOpacity
          style={s.navArrow}
          onPress={goToNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : null}

      <FlatList
        data={selectedOrders}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Calendar grid ────────────────────────────────────────── */}
            <View style={s.calendarCard}>
              {viewMode === "monthly" ? (
                <>
                  {/* Day-of-week header */}
                  <View style={s.dayHeader}>
                    {DAY_NAMES.map((d) => (
                      <Text key={d} style={[s.dayHeaderText, { fontSize: fs.textXs }]}>
                        {d}
                      </Text>
                    ))}
                  </View>

                  {/* Day grid */}
                  <View style={s.monthGrid}>
                    {monthlyGrid.map((cell) => {
                      if (cell.type === "empty") {
                        return <View key={cell.key} style={s.dayCell} />;
                      }
                      return (
                        <TouchableOpacity
                          key={cell.key}
                          style={s.dayCell}
                          onPress={() => handleDayPress(cell.key)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Day ${cell.day}`}
                        >
                          <View style={[
                            s.dayCellInner,
                            cell.isSelected && s.dayCellSelected,
                            cell.isToday && !cell.isSelected && s.dayCellToday,
                          ]}>
                            <Text style={[
                              s.dayCellText,
                              { fontSize: fs.textSm },
                              cell.isSelected && s.dayCellTextSelected,
                              cell.isToday && !cell.isSelected && s.dayCellTextToday,
                            ]}>
                              {cell.day}
                            </Text>
                          </View>
                          {/* One dot per order, each coloured by status */}
                          <View style={s.dotRow}>
                            {cell.dots.map((color, i) => (
                              <View
                                key={i}
                                style={[
                                  s.eventDot,
                                  { backgroundColor: cell.isSelected ? "rgba(255,255,255,0.85)" : color },
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
                /* ── Weekly strip ──────────────────────────────────────── */
                <View style={s.weekStrip}>
                  {weekCells.map((cell) => (
                    <WeekDayCell
                      key={cell.key}
                      date={cell.date}
                      dateKey={cell.key}
                      dots={cell.dots}
                      isSelected={cell.isSelected}
                      isToday={cell.isToday}
                      onPress={handleDayPress}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Selected day label ────────────────────────────────────── */}
            <View style={s.dayLabelRow}>
              <Text style={[s.dayLabelText, { fontSize: fs.textBase }]}>
                {selectedLabel}
              </Text>
              {selectedOrders.length > 0 ? (
                <View style={s.countBadge}>
                  <Text style={[s.countBadgeText, { fontSize: fs.textXs }]}>
                    {selectedOrders.length}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={handleOrderPress}
            fs={fs}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyWrap}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={48}
                color={COLORS.borderLight}
              />
              <Text style={[s.emptyTitle, { fontSize: fs.textBase }]}>
                No scheduled orders
              </Text>
              <Text style={[s.emptySub, { fontSize: fs.textSm }]}>
                Repair orders with a scheduled date will appear here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: Platform.OS === "ios" ? 120 : 140 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // ── View toggle (top-right header buttons)
  viewToggle: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    padding: 3,
  },
  toggleBtn: {
    width: 32,
    height: 28,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },

  // ── Month/week nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm + 2,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  navTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  // ── Loading placeholder
  loadingWrap: {
    alignItems: "center",
    paddingVertical: SIZES.sm,
  },

  // ── Calendar card wrapper
  calendarCard: {
    marginHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },

  // ── Monthly: day-of-week header
  dayHeader: {
    flexDirection: "row",
    paddingTop: SIZES.sm + 2,
    paddingBottom: SIZES.xs,
    paddingHorizontal: SIZES.xs,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  // ── Monthly: day grid
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
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    backgroundColor: COLORS.primaryLight,
  },
  dayCellText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  dayCellTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.semibold,
  },
  dayCellTextToday: {
    color: COLORS.primary,
    fontFamily: FONTS.semibold,
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    alignItems: "center",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // ── Weekly strip
  weekStrip: {
    flexDirection: "row",
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
    gap: SIZES.xs,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusMd,
  },
  weekCellActive: {
    backgroundColor: COLORS.primaryLight,
  },
  weekDayName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  weekDayNameActive: {
    color: COLORS.primary,
  },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayCircleActive: {
    backgroundColor: COLORS.primary,
  },
  weekDayCircleToday: {
    backgroundColor: COLORS.primaryLight,
  },
  weekDayNum: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  weekDayNumActive: {
    color: COLORS.white,
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  weekDotActive: {
    backgroundColor: COLORS.white,
  },
  weekDotPlaceholder: {
    width: 7,
    height: 7,
  },

  // ── Day label below calendar
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    marginTop: SIZES.xs,
  },
  dayLabelText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },

  // ── Order card
  orderCard: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: "row",
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  orderAccent: {
    width: 4,
  },
  orderBody: {
    flex: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md - 2,
    gap: SIZES.xs + 1,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNo: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  statusPill: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  statusLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs + 1,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  phoneText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  regPill: {
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    gap: SIZES.xs,
    marginTop: 2,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },

  // ── Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: SIZES.xxl,
    paddingHorizontal: SIZES.screenPadding * 2,
    gap: SIZES.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: SIZES.sm,
  },
  emptySub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── FlatList content
  listContent: {
    gap: 0,
    paddingTop: SIZES.xs,
  },
});
