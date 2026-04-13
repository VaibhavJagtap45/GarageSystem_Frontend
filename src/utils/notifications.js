// ─── src/utils/notifications.js ──────────────────────────────────────────────
//  Handles all Expo push notification setup for the app:
//   1. Request permissions
//   2. Get the device's Expo push token
//   3. Save it to the backend
//   4. Handle foreground + tap-to-open listeners
// ─────────────────────────────────────────────────────────────────────────────

import * as Notifications from "expo-notifications";
import * as Device        from "expo-device";
import Constants          from "expo-constants";
import { Platform }       from "react-native";
import axiosClient        from "../api/axios";
import { USER_ENDPOINTS } from "./constants";

// ── Configure foreground notification behaviour ───────────────────────────────
//  By default Expo suppresses alerts/sounds while the app is open.
//  This overrides that so the user always sees notifications.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Android: create default notification channel ──────────────────────────────
//  Must exist before the first notification arrives on Android 8+.
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name:             "Default",
    importance:       Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       "#22C55E",
    sound:            "default",
    enableVibrate:    true,
    showBadge:        true,
  });
}

// ── registerForPushNotificationsAsync ────────────────────────────────────────
//  Requests notification permissions and returns the Expo push token string,
//  or null if on a simulator / permission denied.
// ─────────────────────────────────────────────────────────────────────────────
export async function registerForPushNotificationsAsync() {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    console.warn("[Push] Push notifications require a physical device.");
    return null;
  }

  // Check existing permission status before requesting
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Notification permission denied.");
    return null;
  }

  // projectId is required by Expo SDK ≥ 49 to scope tokens per project
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.error(
      "[Push] projectId missing from app.json extra.eas.projectId. " +
      "Push notifications will not work.",
    );
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token; // "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  } catch (err) {
    console.error("[Push] Failed to get push token:", err.message);
    return null;
  }
}

// ── savePushTokenToBackend ────────────────────────────────────────────────────
//  Sends the token to the backend so the server can send targeted notifications.
//  Silently swallows errors — a missing token just means no push notifications,
//  which is acceptable (app still works fully without them).
// ─────────────────────────────────────────────────────────────────────────────
export async function savePushTokenToBackend(token) {
  if (!token) return;
  try {
    await axiosClient.post(USER_ENDPOINTS.PUSH_TOKEN, { token });
  } catch (err) {
    // Non-critical — log but don't surface to user
    console.warn(
      "[Push] Failed to save token to backend:",
      err.displayMessage ?? err.message,
    );
  }
}

// ── initPushNotifications ─────────────────────────────────────────────────────
//  One-shot setup: register → get token → save to backend.
//  Call this once after the user is authenticated.
// ─────────────────────────────────────────────────────────────────────────────
export async function initPushNotifications() {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushTokenToBackend(token);
  }
  return token;
}

// ── addNotificationListeners ──────────────────────────────────────────────────
//  Registers two listeners:
//   • onNotification        — fires when a notification arrives while app is open
//   • onNotificationResponse — fires when user taps a notification
//
//  Returns a cleanup function — call it in useEffect's return.
// ─────────────────────────────────────────────────────────────────────────────
export function addNotificationListeners({
  onNotification,
  onNotificationResponse,
} = {}) {
  const foregroundSub = Notifications.addNotificationReceivedListener(
    (notification) => {
      onNotification?.(notification);
    },
  );

  const tapSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onNotificationResponse?.(response);
    },
  );

  // Return cleanup so callers can remove listeners in useEffect teardown
  return () => {
    foregroundSub.remove();
    tapSub.remove();
  };
}
