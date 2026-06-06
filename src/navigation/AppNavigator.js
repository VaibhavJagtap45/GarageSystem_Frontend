import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import Loader from "../components/ui/Loader";
import AuthStack from "./AuthStack";
import { COLORS, FONTS } from "../utils/constants";
import GarageTabs from "./GarageTabs";
import CustomerTabs from "./CustomerTabs";
import MemberTabs from "./MemberTabs";
import GarageDetails from "../screens/auth/GarageDetails";
import UnsupportedRoleScreen from "../screens/auth/UnsupportedRoleScreen";
import { getPortal } from "../utils/role";

// Theme fonts required by native-stack
const themeFonts = {
  regular: FONTS?.regular || "Inter_400Regular",
  medium: FONTS?.medium || "Inter_500Medium",
  bold: FONTS?.bold || "Inter_700Bold",
  heavy: FONTS?.extrabold || "Inter_800ExtraBold",
};

const Stack = createNativeStackNavigator();

// Portal → root component. Centralizing this avoids the previous bug
// where vendors silently landed on CustomerTabs because the old
// "isLimitedRole" check lumped them in with customers.
const PORTAL_COMPONENT = {
  garage: GarageTabs,
  customer: CustomerTabs,
  member: MemberTabs,
  unsupported: UnsupportedRoleScreen,
};

export default function AppNavigator() {
  const { isAuthenticated, loading, user, garage } = useSelector(
    (state) => state.auth,
  );

  if (loading) {
    return <Loader fullScreen text="Loading Aapno Garage..." />;
  }

  const portal = getPortal(user?.role);
  const PortalRoot = PORTAL_COMPONENT[portal] ?? UnsupportedRoleScreen;

  // Owners with an incomplete garage profile must finish onboarding
  // first. We only enforce this for the garage portal — customer /
  // member / vendor screens don't depend on the garage profile.
  const needsOnboarding =
    portal === "garage" &&
    user?.role === "owner" &&
    !garage?.isProfileComplete;

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
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : needsOnboarding ? (
          // First-time setup — GarageDetails is the initial screen.
          // "App" is registered so GarageDetails can replace into it
          // after save without rebuilding the stack.
          <>
            <Stack.Screen name="GarageDetails" component={GarageDetails} />
            <Stack.Screen name="App" component={PortalRoot} />
          </>
        ) : (
          <>
            <Stack.Screen name="App" component={PortalRoot} />
            {portal === "garage" && (
              <Stack.Screen name="GarageDetails" component={GarageDetails} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
