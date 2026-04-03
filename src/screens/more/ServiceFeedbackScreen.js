import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, FEEDBACK_ENDPOINTS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import Avatar from "../../components/ui/Avatar";
import axiosClient from "../../api/axios";

const TABS = [
  { id: "reviews", label: "REVIEWS" },
  { id: "scheduled", label: "SCHEDULED" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);
  const name  = review.customerId?.fullName ?? "Customer";
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={name} size="sm" />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewCustomer}>{name}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.reviewStars}>
          {stars.map((filled, i) => (
            <Ionicons
              key={i}
              name={filled ? "star" : "star-outline"}
              size={14}
              color={filled ? "#FBBF24" : COLORS.borderLight}
            />
          ))}
        </View>
      </View>
      {review.comment ? (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

function FeedbackEmpty({ message }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.borderLight} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export default function ServiceFeedbackScreen() {
  const [activeTab,    setActiveTab]    = useState("reviews");
  const [reviews,      setReviews]      = useState([]);
  const [avgRating,    setAvgRating]    = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading,      setLoading]      = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        try {
          const [listRes, statsRes] = await Promise.all([
            axiosClient.get(FEEDBACK_ENDPOINTS.LIST, { params: { limit: 100 } }),
            axiosClient.get(FEEDBACK_ENDPOINTS.STATS),
          ]);
          if (!active) return;
          setReviews(listRes.data?.data?.feedbacks ?? []);
          setAvgRating(statsRes.data?.data?.avgRating ?? 0);
          setTotalReviews(statsRes.data?.data?.totalReviews ?? 0);
        } catch {
          if (active) { setReviews([]); }
        } finally {
          if (active) setLoading(false);
        }
      }

      load();
      return () => { active = false; };
    }, []),
  );

  const tabData = activeTab === "reviews" ? reviews : [];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav title="Feedback" transparent={false} showBack />

      {/* Avg Rating Banner */}
      <View style={styles.ratingBanner}>
        <View style={styles.ratingLeft}>
          <Text style={styles.ratingLabel}>Avg Rating : </Text>
          <Ionicons name="star" size={16} color="#FBBF24" />
          <Text style={styles.ratingValue}>
            {avgRating > 0 ? ` ${avgRating.toFixed(1)}` : ""}
          </Text>
        </View>
        <Text style={styles.ratingReviews}>
          {totalReviews > 0 ? `${totalReviews} Reviews` : "#Reviews"}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === "reviews" ? totalReviews : 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : tabData.length === 0 ? (
        <FeedbackEmpty
          message={
            activeTab === "reviews"
              ? "No reviews yet"
              : "No scheduled requests found"
          }
        />
      ) : (
        <FlatList
          data={tabData}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  ratingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  ratingLeft:   { flexDirection: "row", alignItems: "center" },
  ratingLabel:  { fontFamily: FONTS.regular, fontSize: SIZES.textBase, color: COLORS.textSecondary },
  ratingValue:  { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  ratingReviews:{ fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textSecondary },

  tabsBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSection,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive:         { borderBottomColor: COLORS.primary },
  tabText:           { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textMuted, letterSpacing: 0.4 },
  tabTextActive:     { color: COLORS.primary },
  tabCount:          { backgroundColor: COLORS.error, paddingHorizontal: 7, paddingVertical: 2, borderRadius: SIZES.radiusFull, minWidth: 22, alignItems: "center" },
  tabCountActive:    { backgroundColor: COLORS.error },
  tabCountText:      { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.white },
  tabCountTextActive:{ color: COLORS.white },

  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
  },

  listContent: { padding: SIZES.screenPadding, paddingBottom: 120 },

  reviewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  reviewHeader:  { flexDirection: "row", alignItems: "center", gap: SIZES.md, marginBottom: SIZES.sm },
  reviewInfo:    { flex: 1 },
  reviewCustomer:{ fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  reviewDate:    { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  reviewStars:   { flexDirection: "row", gap: 2 },
  reviewComment: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, lineHeight: 20 },
});
