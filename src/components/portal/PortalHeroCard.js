import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";

export default function PortalHeroCard({
  eyebrow,
  title,
  subtitle,
  icon = "sparkles-outline",
  colors = ["#1d4ed8", "#3b82f6"],
  stats = [],
  children,
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.hero}
    >
      <View style={[s.decoBubble, s.decoTop]} />
      <View style={[s.decoBubble, s.decoBottom]} />

      <View style={s.head}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={18} color={COLORS.white} />
        </View>
        <View style={s.copy}>
          {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {stats.length > 0 && (
        <View style={s.statsRow}>
          {stats.map((item) => (
            <View key={item.label} style={s.statCard}>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {children}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  hero: {
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  decoBubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  decoTop: {
    width: 124,
    height: 124,
    top: -34,
    right: -18,
  },
  decoBottom: {
    width: 72,
    height: 72,
    bottom: 18,
    left: -16,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm + 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.76)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    lineHeight: 19,
    color: "rgba(255,255,255,0.84)",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
    marginTop: SIZES.lg,
  },
  statCard: {
    minWidth: 96,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statValue: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textLg,
    color: COLORS.white,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: "rgba(255,255,255,0.72)",
  },
});
