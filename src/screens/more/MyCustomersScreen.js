// import React, { useState, useMemo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Linking,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import AppInput from "../../components/ui/AppInput";
// import EmptyState from "../../components/ui/EmptyState";
// import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
// import Avatar from "../../components/ui/Avatar";

// const MOCK_CUSTOMERS = [
//   {
//     id: "1",
//     name: "Vaibhav Jagtap",
//     mobile: "9511871680",
//     regNo: "MH12AB1234",
//   },
//   { id: "2", name: "Rahul Sharma", mobile: "9876543210", regNo: "MH14CD5678" },
//   { id: "3", name: "Priya Desai", mobile: "9123456789", regNo: "MH01EF9012" },
// ];

// function CustomerCard({ customer, onKebab, onPress }) {
//   const handleWhatsApp = () => {
//     Linking.openURL(`whatsapp://send?phone=91${customer.mobile}`).catch(() =>
//       Alert.alert(
//         "WhatsApp not installed",
//         "Please install WhatsApp to use this feature.",
//       ),
//     );
//   };
//   const handleCall = () => Linking.openURL(`tel:${customer.mobile}`);

//   return (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={onPress}
//       activeOpacity={0.85}
//       accessibilityLabel={`Open profile of ${customer.name}`}
//       accessibilityRole="button"
//     >
//       <Avatar name={customer.name} size="md" />
//       <View style={styles.cardInfo}>
//         <Text style={styles.cardName} numberOfLines={1}>
//           {customer.name}
//         </Text>
//         <View style={styles.cardMeta}>
//           <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
//           <Text style={styles.cardMetaText}>{customer.mobile}</Text>
//           {customer.regNo && (
//             <>
//               <Text style={styles.cardMetaDot}>·</Text>
//               <Text style={styles.cardMetaText}>{customer.regNo}</Text>
//             </>
//           )}
//         </View>
//       </View>
//       <View style={styles.cardActions}>
//         <TouchableOpacity
//           style={[styles.actionBtn, styles.actionWhatsApp]}
//           onPress={handleWhatsApp}
//           activeOpacity={0.8}
//           accessibilityLabel={`WhatsApp ${customer.name}`}
//           accessibilityRole="button"
//         >
//           <Ionicons name="logo-whatsapp" size={14} color={COLORS.white} />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionBtn, styles.actionCall]}
//           onPress={handleCall}
//           activeOpacity={0.8}
//           accessibilityLabel={`Call ${customer.name}`}
//           accessibilityRole="button"
//         >
//           <Ionicons name="call" size={14} color={COLORS.white} />
//         </TouchableOpacity>
//         <TouchableOpacity
//           onPress={() => onKebab(customer)}
//           hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//           accessibilityLabel="More options"
//           accessibilityRole="button"
//         >
//           <Ionicons
//             name="ellipsis-vertical"
//             size={16}
//             color={COLORS.textMuted}
//           />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );
// }

// export default function MyCustomersScreen() {
//   const navigation = useNavigation();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [customers] = useState(MOCK_CUSTOMERS);
//   const [loading] = useState(false);

//   const filtered = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return customers;
//     return customers.filter(
//       (c) =>
//         c.name.toLowerCase().includes(q) ||
//         c.mobile.includes(q) ||
//         (c.regNo || "").toLowerCase().includes(q),
//     );
//   }, [customers, searchQuery]);

//   const handleKebab = (customer) => {
//     Alert.alert(customer.name, "What would you like to do?", [
//       { text: "Edit", onPress: () => {} },
//       { text: "Delete", style: "destructive", onPress: () => {} },
//       { text: "Cancel", style: "cancel" },
//     ]);
//   };

//   const rightElement = (
//     <View style={styles.navRight}>
//       <View style={styles.countBadge}>
//         <Text style={styles.countText}>{customers.length}</Text>
//       </View>
//       <TouchableOpacity
//         style={styles.addBtn}
//         activeOpacity={0.8}
//         onPress={() => navigation.navigate("AddCustomer")}
//         accessibilityLabel="Add customer"
//         accessibilityRole="button"
//       >
//         <Ionicons name="add" size={16} color={COLORS.primary} />
//         <Text style={styles.addBtnText}>Add</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe} edges={["bottom"]}>
//       <TopNav
//         title="My Customers"
//         transparent={false}
//         rightElement={rightElement}
//       />
//       <View style={styles.content}>
//         <AppInput
//           icon="search-outline"
//           placeholder="Search by name, mobile or reg no"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           style={styles.searchInput}
//           accessibilityLabel="Search customers"
//         />
//         {loading ? (
//           <View>
//             {[0, 1, 2].map((i) => (
//               <SkeletonListItem key={i} style={styles.skeleton} />
//             ))}
//           </View>
//         ) : filtered.length === 0 ? (
//           <EmptyState
//             emoji="👥"
//             title="No customers found"
//             description={
//               searchQuery
//                 ? "Try a different search term"
//                 : "Tap Add to register your first customer"
//             }
//             ctaLabel={!searchQuery ? "Add Customer" : undefined}
//             onCtaPress={() => navigation.navigate("AddCustomer")}
//           />
//         ) : (
//           <FlatList
//             data={filtered}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <CustomerCard
//                 customer={item}
//                 onKebab={handleKebab}
//                 onPress={() =>
//                   navigation.navigate("CustomerProfile", { customer: item })
//                 }
//               />
//             )}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContent}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.bg },
//   navRight: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
//   countBadge: {
//     backgroundColor: COLORS.bgSection,
//     borderRadius: SIZES.radiusFull,
//     paddingHorizontal: SIZES.sm + 2,
//     paddingVertical: 3,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   countText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.textSecondary,
//   },
//   addBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//     borderWidth: 1.5,
//     borderColor: COLORS.primary,
//     borderRadius: SIZES.radiusFull,
//     paddingHorizontal: SIZES.sm + 2,
//     paddingVertical: 5,
//   },
//   addBtnText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.primary,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: SIZES.screenPadding,
//     paddingTop: SIZES.md,
//   },
//   searchInput: { marginBottom: SIZES.md },
//   listContent: { paddingBottom: 120 },
//   separator: { height: SIZES.sm },
//   skeleton: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     marginBottom: SIZES.sm,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.md,
//     gap: SIZES.md,
//     ...SHADOWS.sm,
//   },
//   cardInfo: { flex: 1 },
//   cardName: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//     marginBottom: 4,
//   },
//   cardMeta: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     flexWrap: "wrap",
//   },
//   cardMetaText: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//   },
//   cardMetaDot: { color: COLORS.textMuted, fontSize: SIZES.textXs },
//   cardActions: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
//   actionBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   actionWhatsApp: { backgroundColor: "#25D366" },
//   actionCall: { backgroundColor: COLORS.primary },
// });

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import Avatar from "../../components/ui/Avatar";
import { getCustomers } from "../../api/user";

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onKebab, onPress }) {
  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=91${customer.phoneNo}`).catch(() =>
      Alert.alert(
        "WhatsApp not installed",
        "Please install WhatsApp to use this feature.",
      ),
    );
  };
  const handleCall = () => Linking.openURL(`tel:${customer.phoneNo}`);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Open profile of ${customer.fullName}`}
      accessibilityRole="button"
    >
      <Avatar name={customer.fullName} size="md" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {customer.fullName || "—"}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.cardMetaText}>{customer.phoneNo || "—"}</Text>
          {customer.emailId ? (
            <>
              <Text style={styles.cardMetaDot}>·</Text>
              <Text style={styles.cardMetaText} numberOfLines={1}>
                {customer.emailId}
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionWhatsApp]}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
          accessibilityLabel={`WhatsApp ${customer.fullName}`}
          accessibilityRole="button"
        >
          <Ionicons name="logo-whatsapp" size={14} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionCall]}
          onPress={handleCall}
          activeOpacity={0.8}
          accessibilityLabel={`Call ${customer.fullName}`}
          accessibilityRole="button"
        >
          <Ionicons name="call" size={14} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onKebab(customer)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MyCustomersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getCustomers();
      setCustomers(res.data?.users ?? []);
    } catch (err) {
      setError(err.displayMessage || "Failed to load customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Re-fetch when returning from AddCustomer
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchCustomers());
    return unsub;
  }, [navigation, fetchCustomers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.phoneNo || "").includes(q) ||
        (c.emailId || "").toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  const handleKebab = (customer) => {
    Alert.alert(customer.fullName, "What would you like to do?", [
      { text: "Edit", onPress: () => {} },
      { text: "Delete", style: "destructive", onPress: () => {} },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const rightElement = (
    <View style={styles.navRight}>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{customers.length}</Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AddCustomer")}
        accessibilityLabel="Add customer"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={16} color={COLORS.primary} />
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View>
          {[0, 1, 2].map((i) => (
            <SkeletonListItem key={i} style={styles.skeleton} />
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCtaPress={() => fetchCustomers()}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <EmptyState
          emoji="👥"
          title="No customers found"
          description={
            searchQuery
              ? "Try a different search term"
              : "Tap Add to register your first customer"
          }
          ctaLabel={!searchQuery ? "Add Customer" : undefined}
          onCtaPress={() => navigation.navigate("AddCustomer")}
        />
      );
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onKebab={handleKebab}
            onPress={() =>
              navigation.navigate("CustomerProfile", { customer: item })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchCustomers(true)}
        refreshing={refreshing}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="My Customers"
        transparent={false}
        rightElement={rightElement}
      />
      <View style={styles.content}>
        <AppInput
          icon="search-outline"
          placeholder="Search by name, mobile or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          accessibilityLabel="Search customers"
        />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  navRight: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  countBadge: {
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 5,
  },
  addBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },
  searchInput: { marginBottom: SIZES.md },
  listContent: { paddingBottom: 120 },
  separator: { height: SIZES.sm },
  skeleton: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
    ...SHADOWS.sm,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  cardMetaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  cardMetaDot: { color: COLORS.textMuted, fontSize: SIZES.textXs },
  cardActions: { flexDirection: "row", alignItems: "center", gap: SIZES.sm },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionWhatsApp: { backgroundColor: "#25D366" },
  actionCall: { backgroundColor: COLORS.primary },
});
