import axios from "axios";
import { API_BASE_URL } from "@env";
import { getToken, clearStorage } from "../utils/storage";

const hasApiBaseUrl = typeof API_BASE_URL === "string" && API_BASE_URL.trim().length > 0;

if (!hasApiBaseUrl) {
  console.error("[axios] API_BASE_URL is not defined. Rebuild the APK with the .env file present.");
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const isTimeout = error?.code === "ECONNABORTED";
    const isNetworkError = error?.code === "ERR_NETWORK" || !error?.response;

    // Attach a friendly displayMessage for UI components and screens
    // eslint-disable-next-line no-param-reassign
    error.displayMessage =
      !hasApiBaseUrl
        ? "App setup is incomplete. Rebuild the APK with API_BASE_URL configured."
        : isTimeout
          ? "Server is taking too long to respond. Please try again."
          : isNetworkError
            ? "Unable to reach the server. Check your internet connection and API URL."
            : (
              error?.response?.data?.msg ||
              error?.response?.data?.message ||
              error?.response?.data?.errors?.[0]?.msg ||
              (status === 401
                ? "Session expired. Please login again."
                : status === 403
                  ? "Access denied."
                  : status === 404
                    ? "Not found."
                    : status === 500
                      ? "Server error. Try again later."
                      : "Something went wrong.")
            );

    if (status === 401) {
      await clearStorage();
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
