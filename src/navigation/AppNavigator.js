import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import Loader from "../components/ui/Loader";
import AuthStack from "./AuthStack";
import { COLORS, FONTS } from "../utils/constants";
import GarageTabs from "./GarageTabs";
import CustomerMemberTabs from "./CustomerMemberTabs";
import GarageDetails from "../screens/auth/GarageDetails";

// Theme fonts required by native-stack
const themeFonts = {
  regular: FONTS?.regular || "Inter_400Regular",
  medium: FONTS?.medium || "Inter_500Medium",
  bold: FONTS?.bold || "Inter_700Bold",
  heavy: FONTS?.extrabold || "Inter_800ExtraBold",
};

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, user, garage } = useSelector(
    (state) => state.auth,
  );

  if (loading) {
    return <Loader fullScreen text="Loading Garage System..." />;
  }

  // ── Determine which authenticated home to show ───────────────────────────
  // Owner whose garage profile isn't complete yet → onboarding
  const isOwner = user?.role === "owner";
  const needsOnboarding = isOwner && !garage?.isProfileComplete;

  // customer / member / vendor get a simplified home
  const isLimitedRole = ["customer", "member", "vendor"].includes(user?.role);

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.primary,
          background: COLORS.bg,
          card: COLORS.bgCard,
          text: COLORS.textPrimary,
          border: COLORS.borderLight,
          notification: COLORS.secondary,
        },
        fonts: themeFonts,
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {isLimitedRole ? (
              // ── Customer / Member / Vendor ───────────────────────────────
              <Stack.Screen name="App" component={CustomerMemberTabs} />
            ) : needsOnboarding ? (
              // ── Owner: first-time setup ──────────────────────────────────
              // GarageDetails is first (initial screen).
              // App is included so GarageDetails can call navigation.replace("App")
              // after save — no stack restructure needed, no flicker.
              <>
                <Stack.Screen name="GarageDetails" component={GarageDetails} />
                <Stack.Screen name="App" component={GarageTabs} />
              </>
            ) : (
              // ── Owner with complete profile ──────────────────────────────
              <>
                <Stack.Screen name="App" component={GarageTabs} />
                <Stack.Screen name="GarageDetails" component={GarageDetails} />
              </>
            )}
          </>
        ) : (
          // ── Unauthenticated ──────────────────────────────────────────────
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
