import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

const ACTIVE_GRADIENT = ["#1d4ed8", "#3b82f6"];

function TabItem({ tab, focused, onPress }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.92,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <TouchableOpacity
      style={s.item}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[s.activeWrap, { opacity, transform: [{ scale }] }]}>
        <LinearGradient
          colors={ACTIVE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.activePill}
        >
          <Ionicons name={tab.iconFilled} size={18} color={COLORS.white} />
          <Text style={s.activeLabel} numberOfLines={1}>
            {tab.label}
          </Text>
        </LinearGradient>
      </Animated.View>

      {!focused && (
        <View style={s.inactiveWrap}>
          <Ionicons name={tab.icon} size={22} color={COLORS.textMuted} />
          <Text style={s.inactiveLabel}>{tab.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CTabBar({ state, navigation, tabs }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 6);

  return (
    <View style={[s.wrap, { paddingBottom: bottomPad }]}>
      {/* subtle top glow */}
      <View style={s.topGlow} pointerEvents="none" />

      <View style={s.bar}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const t = tabs[i];
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TabItem
              key={route.key}
              tab={t}
              focused={focused}
              onPress={onPress}
            />
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
    borderTopColor: "rgba(15, 23, 42, 0.06)",
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(59, 130, 246, 0.18)",
  },
  bar: {
    flexDirection: "row",
    paddingHorizontal: SIZES.sm,
    alignItems: "center",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
  },
  activeWrap: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    ...SHADOWS.md,
    shadowColor: "#1d4ed8",
    shadowOpacity: 0.35,
  },
  activeLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 0.1,
  },
  inactiveWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  inactiveLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
});
