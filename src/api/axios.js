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

// Host:port portion for diagnostics, e.g. "192.168.1.17:4000". A regex is used
// instead of `new URL()` to avoid depending on a URL polyfill in the RN runtime.
export const API_HOST = (API_BASE_URL.match(/^https?:\/\/([^/]+)/) || [])[1] || "the server";

// Origin (scheme + host) for the unauthenticated health-check ping. The backend
// health route lives at the root ("/"), not under the /api/v1 prefix.
const API_ORIGIN = (API_BASE_URL.match(/^(https?:\/\/[^/]+)/) || [])[1] || "";
export const HEALTH_URL = API_ORIGIN ? `${API_ORIGIN}/` : "";

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

    // Surface the *real* reason — including which host we tried to reach — so
    // connectivity problems are diagnosable instead of a generic "went wrong".
    if (__DEV__ && (isNetworkError || isTimeout)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[axios] ${isTimeout ? "Timeout" : "Network error"} reaching ${API_BASE_URL} ` +
          `(${error?.code || error?.message || "unknown"})`,
      );
    }

    if (!hasApiBaseUrl) {
      error.displayMessage =
        "App setup is incomplete. Rebuild the APK with API_BASE_URL configured.";
      error.displayDetail = null;
    } else if (isTimeout) {
      error.displayMessage = `Server at ${API_HOST} isn't responding.`;
      error.displayDetail = "It may be starting up — wait a moment and try again.";
    } else if (isNetworkError) {
      error.displayMessage = `Can't reach the server at ${API_HOST}.`;
      error.displayDetail =
        "Check the backend is running and your phone is on the same Wi-Fi as the server.";
    } else {
      error.displayMessage =
        serverMessage ||
        (status === 401
          ? "Session expired. Please login again."
          : status === 403
            ? "Access denied."
            : status === 404
              ? "Not found."
              : status >= 500
                ? `Server error (${status}). Try again later.`
                : `Request failed (${status || "unknown"}).`);
      error.displayDetail = null;
    }

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

// ─────────────────────────────────────────────────────────────────
//  checkConnection — lightweight reachability probe for the login screen.
//  Pings the backend health endpoint directly: no auth header, no API
//  version prefix, and treats any HTTP response as "server reachable".
//  Never throws — always resolves to a plain result object.
// ─────────────────────────────────────────────────────────────────
export async function checkConnection(timeoutMs = 8000) {
  if (!HEALTH_URL) {
    return { ok: false, host: API_HOST, reason: "API URL isn't configured in this build." };
  }

  const startedAt = Date.now();
  try {
    const res = await axios.get(HEALTH_URL, {
      timeout: timeoutMs,
      headers: { Accept: "application/json" },
      validateStatus: () => true, // any response means the server answered
    });
    const durationMs = Date.now() - startedAt;

    if (res.status === 200) {
      return { ok: true, host: API_HOST, url: HEALTH_URL, status: 200, durationMs };
    }
    // Server is reachable but replied unexpectedly — still useful to know.
    return {
      ok: false,
      host: API_HOST,
      url: HEALTH_URL,
      status: res.status,
      durationMs,
      reason: `Reached ${API_HOST}, but it replied HTTP ${res.status}.`,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const isTimeout = err?.code === "ECONNABORTED";
    return {
      ok: false,
      host: API_HOST,
      url: HEALTH_URL,
      durationMs,
      reason: isTimeout
        ? `No response from ${API_HOST} — timed out after ${Math.round(timeoutMs / 1000)}s.`
        : `Can't reach ${API_HOST} (${err?.code || "network error"}). Same Wi-Fi? Backend running?`,
    };
  }
}

export default axiosClient;
