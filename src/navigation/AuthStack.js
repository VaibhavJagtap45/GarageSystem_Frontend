import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import GetStarted from "../screens/auth/GetStarted";
import TermsOfService from "../screens/auth/TermsOfService";
import PrivacyPolicy from "../screens/auth/PrivacyPolicy";
import { COLORS } from "../utils/constants";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="GetStarted"    component={GetStarted} />
      <Stack.Screen name="Login"         component={LoginScreen} />
      <Stack.Screen name="OtpScreen"     component={OtpScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfService} />
      <Stack.Screen name="PrivacyPolicy"  component={PrivacyPolicy} />
    </Stack.Navigator>
  );
}
