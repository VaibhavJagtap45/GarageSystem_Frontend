import { BOOKING_ENDPOINTS } from "../../utils/constants";
import axiosClient from "../axios";

// ── Owner: list bookings ──────────────────────────────────────────────────────
// GET /api/v1/bookings?status=&date=&search=&page=&limit=
export const listBookings = async (params = {}) => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.LIST, { params });
  return response.data;
};

// ── Owner: create booking on behalf of customer ───────────────────────────────
// POST /api/v1/bookings
export const createBooking = async (data) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.CREATE, data);
  return response.data;
};

// ── Owner: get booking detail ─────────────────────────────────────────────────
// GET /api/v1/bookings/:id
export const getBookingDetail = async (id) => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.DETAIL(id));
  return response.data;
};

// ── Owner: update booking status ──────────────────────────────────────────────
// PATCH /api/v1/bookings/:id/status
export const updateBookingStatus = async (id, status) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.STATUS(id), { status });
  return response.data;
};

// ── Owner: convert booking to repair order ────────────────────────────────────
// POST /api/v1/bookings/:id/convert
export const convertBookingToRO = async (id) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.CONVERT(id));
  return response.data;
};

// ── Owner: retry Google Calendar sync for confirmed booking ───────────────────
// POST /api/v1/bookings/:id/calendar-sync
export const syncBookingCalendar = async (id) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.SYNC_CALENDAR(id));
  return response.data;
};

// ── Customer: list my bookings ────────────────────────────────────────────────
// GET /api/v1/customer/bookings
export const getMyBookings = async () => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.MY_BOOKINGS);
  return response.data;
};

// ── Customer: create booking ──────────────────────────────────────────────────
// POST /api/v1/customer/bookings
export const createMyBooking = async (data) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.MY_CREATE, data);
  return response.data;
};

// ── Customer: cancel booking ──────────────────────────────────────────────────
// PATCH /api/v1/customer/bookings/:id/cancel
export const cancelMyBooking = async (id) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.MY_CANCEL(id));
  return response.data;
};

// ── Owner: link repair order to booking after RO form submission ───────────────
// PATCH /api/v1/bookings/:id/link-ro
export const linkRepairOrder = async (bookingId, repairOrderId) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.LINK_RO(bookingId), {
    repairOrderId,
  });
  return response.data;
};
