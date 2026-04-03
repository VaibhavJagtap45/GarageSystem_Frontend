import { useEffect } from "react";
import { View, Text } from "react-native";
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
import { Provider, useDispatch } from "react-redux";
import store from "./src/store";
import { restoreSession } from "./src/store/slices/authSlice";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/utils/constants";

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
      style={{ ...toastCardStyle, borderLeftWidth: 4, borderLeftColor: COLORS.success }}
    >
      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: COLORS.textPrimary }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: "Inter_400Regular" }}>
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View
      style={{ ...toastCardStyle, borderLeftWidth: 4, borderLeftColor: COLORS.error }}
    >
      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: COLORS.textPrimary }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: "Inter_400Regular" }}>
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View
      style={{ ...toastCardStyle, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}
    >
      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: COLORS.textPrimary }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: "Inter_400Regular" }}>
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

  useEffect(() => {
    // Restores token/user/garage from AsyncStorage into Redux on boot
    dispatch(restoreSession());
  }, [dispatch]);

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
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={COLORS.bg} />
          <AppContent />
          <Toast config={toastConfig} position="top" topOffset={60} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
