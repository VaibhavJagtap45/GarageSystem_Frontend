import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

export default function CTabBar({ state, navigation, tabs }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 6);

  return (
    <View style={[s.wrap, { paddingBottom: bottomPad }]}>
      <View style={s.bar}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const t = tabs[i];
          return (
            <TouchableOpacity
              key={route.key}
              style={s.item}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.75}
            >
              <View style={[s.iconWrap, focused && s.iconWrapOn]}>
                <Ionicons
                  name={focused ? t.iconFilled : t.icon}
                  size={22}
                  color={focused ? COLORS.white : COLORS.textMuted}
                />
              </View>
              <Text style={[s.lbl, focused && s.lblOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    ...SHADOWS.md,
  },
  bar: {
    flexDirection: "row",
    paddingHorizontal: SIZES.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 46,
    height: 34,
    borderRadius: SIZES.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOn: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  lbl: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  lblOn: {
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});
