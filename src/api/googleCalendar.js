import { GOOGLE_CALENDAR_ENDPOINTS } from "../utils/constants";
import axiosClient from "./axios";

export const getGoogleCalendarStatus = async () => {
  const response = await axiosClient.get(GOOGLE_CALENDAR_ENDPOINTS.STATUS);
  return response.data;
};

export const getGoogleCalendarConnectUrl = async (appRedirectUri) => {
  const response = await axiosClient.get(GOOGLE_CALENDAR_ENDPOINTS.CONNECT_URL, {
    params: { appRedirectUri },
  });
  return response.data;
};

export const disconnectGoogleCalendar = async () => {
  const response = await axiosClient.delete(GOOGLE_CALENDAR_ENDPOINTS.DISCONNECT);
  return response.data;
};
