import axios from "axios";
import Constants from "expo-constants";
import { AUTH_ENDPOINTS } from "../utils/constants";
import { hasSessionExpired } from "../utils/authSession";
import { endSession } from "../utils/session";
import { getToken, getTokenExpiry } from "../utils/storage";

// Resolution order:
//   1. EXPO_PUBLIC_API_BASE_URL — local/staging override (inlined by Expo at build time).
//   2. app.json -> expo.extra.apiBaseUrl — production source of truth, baked into the
//      native binary so EAS builds never depend on a .env file being present.
const extra =
  Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || "";

const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "") + "/";

const hasApiBaseUrl = API_BASE_URL.length > 1;

if (!hasApiBaseUrl) {
  // In __DEV__ this surfaces the misconfig immediately; in production the
  // response interceptor below converts it into a user-facing displayMessage.
  console.error(
    "[axios] API base URL is not configured. Set expo.extra.apiBaseUrl in app.json " +
      "or EXPO_PUBLIC_API_BASE_URL in .env, then rebuild the APK.",
  );
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Render free tier cold start can take ~50s
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    const tokenExpiresAt = await getTokenExpiry();
    const isPublicAuthRequest =
      config.url === AUTH_ENDPOINTS.LOGIN ||
      config.url === AUTH_ENDPOINTS.REGISTER;

    if (token && !isPublicAuthRequest && hasSessionExpired(tokenExpiresAt)) {
      await endSession();
      const sessionError = new Error("Session expired. Please login again.");
      sessionError.displayMessage = "Session expired. Please login again.";
      sessionError.code = "SESSION_EXPIRED";
      return Promise.reject(sessionError);
    }

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
    // Use the server's own message when available — it's always more specific
    // than a generic fallback. Only fall back to generic text when the server
    // sends no message at all (network errors, malformed responses, etc.).
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.response?.data?.errors?.[0]?.msg ||
      null;

    error.displayMessage = !hasApiBaseUrl
      ? "App setup is incomplete. Rebuild the APK with API_BASE_URL configured."
      : isTimeout
        ? "Server is waking up, please wait a moment and try again."
        : isNetworkError
          ? "Unable to reach the server. Check your internet connection and API URL."
          : serverMessage ||
            (status === 401
              ? "Session expired. Please login again."
              : status === 403
                ? "Access denied."
                : status === 404
                  ? "Not found."
                  : status === 500
                    ? "Server error. Try again later."
                    : "Something went wrong.");

    // Only clear storage on 401 when the user is already authenticated.
    // During login/register there is no token yet, so skip the wipe.
    if (status === 401) {
      const token = await getToken();
      if (token) {
        await endSession({
          message: serverMessage || "Session expired. Please login again.",
        });
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
