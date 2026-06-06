import { useEffect, useRef } from "react";
import { AppState, View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./src/store";
import { restoreSession } from "./src/store/slices/authSlice";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/utils/constants";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import {
  hasSessionExpired,
  getMsUntilSessionExpiry,
} from "./src/utils/authSession";
import { endSession } from "./src/utils/session";
import {
  initPushNotifications,
  addNotificationListeners,
  canUseRemotePushNotifications,
} from "./src/utils/notifications";

// ─── Toast Styles ─────────────────────────────────────────────────────────────
const toastCardStyle = {
  width: "90%",
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 14,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 6,
};

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View
      style={{
        ...toastCardStyle,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_600SemiBold",
          color: COLORS.textPrimary,
        }}
      >
        {text1}
      </Text>
      {text2 ? (
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
            marginTop: 2,
            fontFamily: "Inter_400Regular",
          }}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View
      style={{
        ...toastCardStyle,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.error,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_600SemiBold",
          color: COLORS.textPrimary,
        }}
      >
        {text1}
      </Text>
      {text2 ? (
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
            marginTop: 2,
            fontFamily: "Inter_400Regular",
          }}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View
      style={{
        ...toastCardStyle,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_600SemiBold",
          color: COLORS.textPrimary,
        }}
      >
        {text1}
      </Text>
      {text2 ? (
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
            marginTop: 2,
            fontFamily: "Inter_400Regular",
          }}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  ),
};

SplashScreen.preventAutoHideAsync();

// ─── Inner App ─────────────────────────────────────────────────────────────────
// Must live inside <Provider> to use Redux hooks.
function AppContent() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const accessTokenExpiresAt = useSelector(
    (state) => state.auth.accessTokenExpiresAt,
  );
  const tokenRegistered = useRef(false); // guard: only register once per session
  const sessionTimerRef = useRef(null);

  // Restore persisted session from AsyncStorage on boot
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    if (!isAuthenticated || !accessTokenExpiresAt) {
      return undefined;
    }

    if (hasSessionExpired(accessTokenExpiresAt)) {
      void endSession();
      return undefined;
    }

    sessionTimerRef.current = setTimeout(() => {
      void endSession();
    }, getMsUntilSessionExpiry(accessTokenExpiresAt));

    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [isAuthenticated, accessTokenExpiresAt]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" &&
        isAuthenticated &&
        accessTokenExpiresAt &&
        hasSessionExpired(accessTokenExpiresAt)
      ) {
        void endSession();
      }
    });

    return () => appStateListener.remove();
  }, [isAuthenticated, accessTokenExpiresAt]);

  // Register for push notifications once the user is authenticated.
  // The ref guard prevents re-registering on every re-render.
  useEffect(() => {
    if (isAuthenticated && !tokenRegistered.current) {
      tokenRegistered.current = true;
      if (canUseRemotePushNotifications) {
        void initPushNotifications().catch((error) => {
          console.warn(
            "[Push] Failed to initialize push notifications:",
            error,
          );
        });
      } else {
        console.info(
          "[Push] Skipping remote push registration in Expo Go on Android. " +
            "Use a development build to test push notifications.",
        );
      }
    }
    // Reset guard on logout so the next login re-registers
    if (!isAuthenticated) {
      tokenRegistered.current = false;
    }
  }, [isAuthenticated]);

  // Set up foreground notification listeners for the app's lifetime
  useEffect(() => {
    const cleanup = addNotificationListeners({
      // Notification arrives while app is in foreground — show Toast
      onNotification: (notification) => {
        const { title, body } = notification.request.content;
        Toast.show({ type: "info", text1: title ?? "", text2: body ?? "" });
      },
      // User tapped a notification — data.type can drive navigation here
      onNotificationResponse: (response) => {
        const data = response.notification.request.content.data ?? {};
        // Navigation logic can be added here when a navigation ref is wired up
        console.log("[Push] Tapped notification:", data.type, data);
      },
    });
    return cleanup; // removes listeners when AppContent unmounts
  }, []);

  return <AppNavigator />;
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <PreferencesProvider>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: COLORS.bg }}
        >
          <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor={COLORS.bg} />
            <AppContent />
            <Toast config={toastConfig} position="top" topOffset={60} />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PreferencesProvider>
    </Provider>
  );
}
