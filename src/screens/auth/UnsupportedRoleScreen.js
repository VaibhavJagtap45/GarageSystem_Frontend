// screens/auth/UnsupportedRoleScreen.js
// Shown when a logged-in user has a role that the mobile app doesn't
// have a portal for (vendors today; future unknown roles too). Lets
// them log out without crashing the navigator.
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import useLogout from "../../hooks/useLogout";
import useAuth from "../../hooks/useAuth";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function UnsupportedRoleScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <View style={[styles.root, { paddingTop: insets.top + SIZES.xl }]}>
      <Text style={styles.title}>This account can't sign in here.</Text>
      <Text style={styles.body}>
        Your account role ({user?.role ?? "unknown"}) is managed from the web
        admin. Please log in there, or contact your garage owner if you think
        this is a mistake.
      </Text>
      <AppButton title="Log out" onPress={logout} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SIZES.screenPadding,
    gap: SIZES.md,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textMd,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  btn: { marginTop: SIZES.lg },
});
