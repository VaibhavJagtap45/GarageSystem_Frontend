import React, { useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS,
  FONTS,
  SCREEN_WIDTH,
  SIZES,
  SHADOWS,
} from "../../utils/constants";
import AppButton from "../../components/ui/AppButton";

const SLIDES = [
  {
    id: "1",
    emoji: "🔧",
    heading: "Manage Your Workshop",
    description:
      "Take full control of your garage operations from a single powerful platform built for modern workshops.",
  },
  {
    id: "2",
    emoji: "📋",
    heading: "Track Every Job Card",
    description:
      "Create, assign, and monitor job cards in real time. Never lose track of a vehicle or service request again.",
  },
  {
    id: "3",
    emoji: "📦",
    heading: "Smart Inventory",
    description:
      "Monitor spare parts, get low-stock alerts, and manage suppliers — all in one place.",
  },
  {
    id: "4",
    emoji: "📈",
    heading: "Grow Your Business",
    description:
      "Detailed reports, customer history, and insights that help you make smarter decisions every day.",
  },
];

function GetStarted({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleSkip = () => navigation.replace("Login");

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next });
      setActiveIndex(next);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.emojiCircle}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.textContent}>
        <Text style={styles.heading}>{item.heading}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Skip — top right, hidden on last slide */}
      {!isLast && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides — flex: 1 so it takes all space above the bottom bar */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.slider}
      />

      {/* Bottom bar — fixed height, never compressed by the slider */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Buttons — no flex on container or children, just natural height */}
        <View style={styles.btns}>
          <AppButton
            title={isLast ? "Get Started" : "Next"}
            variant="primary"
            size="md"
            onPress={isLast ? () => navigation.replace("Login") : handleNext}
            fullWidth={true}
            accessibilityLabel={isLast ? "Get started" : "Next slide"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default GetStarted;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.xxl,
  },
  emojiCircle: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: SCREEN_WIDTH * 0.275,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.xxl,
    borderWidth: 2,
    borderColor: `${COLORS.primary}25`,
  },
  emoji: {
    fontSize: SCREEN_WIDTH * 0.2,
  },
  textContent: {
    alignItems: "center",
  },
  heading: {
    fontFamily: FONTS.extrabold,
    fontSize: SIZES.textH,
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: SIZES.sm,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },

  // Skip — top right corner
  skipBtn: {
    position: "absolute",
    top: 52,
    right: SIZES.screenPadding,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },

  // Bottom bar — explicit padding, no flex so height is always content-driven
  bottom: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    paddingTop: SIZES.lg,
    backgroundColor: COLORS.bg,
    gap: SIZES.lg,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  btns: {
    flexDirection: "column",
    gap: SIZES.sm,
  },
});
