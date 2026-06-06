import { BOOKING_ENDPOINTS } from "../../utils/constants";
import axiosClient from "../axios";

export const listBookings = async (params = {}) => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.LIST, { params });
  return response.data;
};

export const createBooking = async (data) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.CREATE, data);
  return response.data;
};

export const getBookingDetail = async (id) => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.DETAIL(id));
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.STATUS(id), { status });
  return response.data;
};

export const convertBookingToRO = async (id) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.CONVERT(id));
  return response.data;
};

export const getMyBookings = async () => {
  const response = await axiosClient.get(BOOKING_ENDPOINTS.MY_BOOKINGS);
  return response.data;
};

export const createMyBooking = async (data) => {
  const response = await axiosClient.post(BOOKING_ENDPOINTS.MY_CREATE, data);
  return response.data;
};

export const cancelMyBooking = async (id) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.MY_CANCEL(id));
  return response.data;
};

export const linkRepairOrder = async (bookingId, repairOrderId) => {
  const response = await axiosClient.patch(BOOKING_ENDPOINTS.LINK_RO(bookingId), {
    repairOrderId,
  });
  return response.data;
};
