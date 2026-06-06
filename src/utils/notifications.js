import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axiosClient from "../api/axios";
import { USER_ENDPOINTS } from "./constants";

const isAndroidExpoGo = Platform.OS === "android" && Boolean(Constants.expoGoConfig);

export const canUseRemotePushNotifications = !isAndroidExpoGo;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidNotificationChannelAsync() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn("[Push] Failed to configure the Android notification channel:", error);
  }
}

export async function registerForPushNotificationsAsync() {
  if (isAndroidExpoGo) {
    console.warn(
      "[Push] Android remote push notifications are not available in Expo Go on SDK 53+. " +
        "Use a development build to test push notifications.",
    );
    return null;
  }

  // Push notifications only work on real devices.
  if (!Device.isDevice) {
    console.warn("[Push] Push notifications require a physical device.");
    return null;
  }

  try {
    await ensureAndroidNotificationChannelAsync();

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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.error(
        "[Push] projectId missing from app config. Push notifications will not work.",
      );
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (error) {
    console.error("[Push] Failed to register for push notifications:", error);
    return null;
  }
}

export async function savePushTokenToBackend(token) {
  if (!token) return;

  try {
    await axiosClient.post(USER_ENDPOINTS.PUSH_TOKEN, { token });
  } catch (error) {
    // Non-critical - log but don't surface to the user.
    console.warn(
      "[Push] Failed to save token to backend:",
      error?.displayMessage ?? error?.message ?? error,
    );
  }
}

export async function initPushNotifications() {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushTokenToBackend(token);
  }
  return token;
}

export function addNotificationListeners({
  onNotification,
  onNotificationResponse,
} = {}) {
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotification?.(notification);
  });

  const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationResponse?.(response);
  });

  return () => {
    foregroundSub.remove();
    tapSub.remove();
  };
}
