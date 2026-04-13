import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import { useFontSizes } from "../../context/PreferencesContext";

/**
 * TopNav
 * Props:
 *   title        — override route name
 *   showBack     — show back chevron (default true)
 *   onBackPress  — custom back handler
 *   rightElement — optional JSX for right side
 *   transparent  — remove background / shadow (default true)
 *   dark         — use dark status bar text (default true)
 */
function TopNav({
  title,
  showBack = true,
  onBackPress,
  rightElement,
  transparent = true,
  dark = true,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const pageTitle = title || route.name;
  const fs = useFontSizes();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar
        barStyle={dark ? "dark-content" : "light-content"}
        backgroundColor="transparent"
        translucent
      />
      <View
        style={[
          styles.wrapper,
          { paddingTop: insets.top + 4 },
          !transparent && styles.solid,
        ]}
      >
        <View style={styles.container}>
          {/* Left — back button + title */}
          <View style={styles.side}>
            {showBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={transparent ? COLORS.textPrimary : COLORS.primary}
                />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { fontSize: fs.textLg }]} numberOfLines={1}>
              {pageTitle}
            </Text>
          </View>

          {/* Right — optional slot */}
          <View style={[styles.side, styles.sideRight]}>
            {rightElement ?? null}
          </View>
        </View>

        {/* Divider when not transparent */}
        {!transparent && <View style={styles.divider} />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
    zIndex: 100,
  },
  solid: {
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },
  container: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.screenPadding,
  },
});

export default TopNav;
