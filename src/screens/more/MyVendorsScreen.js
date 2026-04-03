// import React, { useState, useMemo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Modal,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
// } from "react-native";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import AppInput from "../../components/ui/AppInput";
// import AppButton from "../../components/ui/AppButton";
// import EmptyState from "../../components/ui/EmptyState";
// import Avatar from "../../components/ui/Avatar";

// // ─── Mock data ────────────────────────────────────────────────────────────────
// const MOCK_VENDORS = [
//   {
//     id: "1",
//     name: "Ram",
//     phone: "9753434845",
//     email: "ram@gmail.com",
//     address: "",
//     gstin: "",
//     pan: "",
//     refId: "",
//   },
//   {
//     id: "2",
//     name: "Shyam",
//     phone: "9876500000",
//     email: "shyam@gmail.com",
//     address: "",
//     gstin: "",
//     pan: "",
//     refId: "",
//   },
// ];

// const EMPTY_VENDOR = {
//   name: "",
//   phone: "",
//   email: "",
//   address: "",
//   gstin: "",
//   pan: "",
//   refId: "",
// };

// // ─── Vendor Detail Modal ─────────────────────────────────────────────────────
// function VendorDetailModal({ visible, vendor, onClose, onSave }) {
//   const insets = useSafeAreaInsets();
//   const isEdit = !!vendor?.id;
//   const [form, setForm] = useState(vendor || EMPTY_VENDOR);
//   const [errors, setErrors] = useState({});

//   // Sync form when vendor changes
//   React.useEffect(() => {
//     setForm(vendor || EMPTY_VENDOR);
//     setErrors({});
//   }, [vendor]);

//   const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

//   const validate = () => {
//     const e = {};
//     if (!form.name.trim()) e.name = "Vendor name is required";
//     if (!form.phone.trim()) e.phone = "Phone number is required";
//     else if (!/^\d{10}$/.test(form.phone.trim()))
//       e.phone = "Enter a valid 10-digit number";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleSave = () => {
//     if (!validate()) return;
//     onSave({ ...form, id: vendor?.id || Date.now().toString() });
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
//         {/* Modal Header */}
//         <View style={styles.modalHeader}>
//           <Text style={styles.modalTitle}>
//             {isEdit ? "Vendor Detail" : "Add Vendor"}
//           </Text>
//           <TouchableOpacity
//             onPress={onClose}
//             style={styles.modalClose}
//             accessibilityLabel="Close"
//             accessibilityRole="button"
//           >
//             <Ionicons name="close" size={22} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//         </View>

//         <KeyboardAvoidingView
//           style={{ flex: 1 }}
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//           <ScrollView
//             contentContainerStyle={[
//               styles.modalBody,
//               { paddingBottom: insets.bottom + 24 },
//             ]}
//             keyboardShouldPersistTaps="handled"
//             showsVerticalScrollIndicator={false}
//           >
//             <AppInput
//               label="Vendor name"
//               placeholder="Enter vendor name"
//               value={form.name}
//               onChangeText={set("name")}
//               error={errors.name}
//               autoCapitalize="words"
//               icon="storefront-outline"
//               accessibilityLabel="Vendor name"
//             />
//             <AppInput
//               label="Phone number"
//               placeholder="10-digit mobile number"
//               value={form.phone}
//               onChangeText={set("phone")}
//               error={errors.phone}
//               keyboardType="phone-pad"
//               maxLength={10}
//               icon="call-outline"
//               accessibilityLabel="Phone number"
//             />
//             <AppInput
//               label="Email"
//               placeholder="vendor@email.com"
//               value={form.email}
//               onChangeText={set("email")}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               icon="mail-outline"
//               accessibilityLabel="Email"
//             />
//             <AppInput
//               label="Address"
//               placeholder="Full address"
//               value={form.address}
//               onChangeText={set("address")}
//               multiline
//               numberOfLines={3}
//               icon="location-outline"
//               accessibilityLabel="Address"
//             />

//             {/* Financial Info */}
//             <View style={styles.fieldDivider}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerLabel}>Financial Info</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             <AppInput
//               label="GSTIN"
//               placeholder="22AAAAA0000A1Z5"
//               value={form.gstin}
//               onChangeText={set("gstin")}
//               autoCapitalize="characters"
//               maxLength={15}
//               icon="receipt-outline"
//               accessibilityLabel="GSTIN"
//             />
//             <AppInput
//               label="PAN"
//               placeholder="ABCDE1234F"
//               value={form.pan}
//               onChangeText={set("pan")}
//               autoCapitalize="characters"
//               maxLength={10}
//               icon="card-outline"
//               accessibilityLabel="PAN"
//             />
//             <AppInput
//               label="Vendor Reference ID"
//               placeholder="Internal reference (optional)"
//               value={form.refId}
//               onChangeText={set("refId")}
//               icon="bookmark-outline"
//               accessibilityLabel="Vendor Reference ID"
//             />

//             <AppButton
//               title={isEdit ? "Update Vendor" : "Save Vendor"}
//               variant="primary"
//               size="lg"
//               onPress={handleSave}
//               style={styles.saveBtn}
//             />

//             {isEdit && (
//               <AppButton
//                 title="Delete Vendor"
//                 variant="destructive"
//                 size="md"
//                 onPress={() =>
//                   Alert.alert("Delete Vendor", `Remove ${form.name}?`, [
//                     { text: "Cancel", style: "cancel" },
//                     {
//                       text: "Delete",
//                       style: "destructive",
//                       onPress: () => onClose(),
//                     },
//                   ])
//                 }
//                 style={styles.deleteBtn}
//               />
//             )}
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </Modal>
//   );
// }

// // ─── Vendor card ──────────────────────────────────────────────────────────────
// function VendorCard({ vendor, onViewDetails }) {
//   const initial = vendor.name?.[0]?.toUpperCase() ?? "V";

//   return (
//     <View style={styles.card}>
//       {/* Left — avatar + info */}
//       <View style={styles.cardLeft}>
//         <Avatar name={vendor.name} size="md" />
//         <View style={styles.cardInfo}>
//           <View style={styles.cardNameRow}>
//             <Text style={styles.cardName} numberOfLines={1}>
//               {vendor.name}
//             </Text>
//             <Text style={styles.cardPhone}> ({vendor.phone})</Text>
//           </View>
//           {vendor.email ? (
//             <View style={styles.cardMeta}>
//               <Ionicons
//                 name="mail-outline"
//                 size={12}
//                 color={COLORS.textMuted}
//               />
//               <Text style={styles.cardMetaText} numberOfLines={1}>
//                 {vendor.email}
//               </Text>
//             </View>
//           ) : null}
//           {vendor.gstin ? (
//             <View style={styles.cardMeta}>
//               <Ionicons
//                 name="receipt-outline"
//                 size={12}
//                 color={COLORS.textMuted}
//               />
//               <Text style={styles.cardMetaText}>GST: {vendor.gstin}</Text>
//             </View>
//           ) : null}
//         </View>
//       </View>

//       {/* Right — view details */}
//       <TouchableOpacity
//         onPress={() => onViewDetails(vendor)}
//         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//         accessibilityLabel={`View details for ${vendor.name}`}
//         accessibilityRole="button"
//       >
//         <Text style={styles.viewDetails}>View Details</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// // ─── Screen ───────────────────────────────────────────────────────────────────
// export default function MyVendorsScreen() {
//   const navigation = useNavigation();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [vendors, setVendors] = useState(MOCK_VENDORS);
//   const [loading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedVendor, setSelectedVendor] = useState(null);

//   const filtered = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return vendors;
//     return vendors.filter(
//       (v) =>
//         v.name.toLowerCase().includes(q) ||
//         v.phone.includes(q) ||
//         (v.email || "").toLowerCase().includes(q),
//     );
//   }, [vendors, searchQuery]);

//   const openAdd = () => {
//     setSelectedVendor(null);
//     setModalVisible(true);
//   };

//   const openDetail = (vendor) => {
//     setSelectedVendor(vendor);
//     setModalVisible(true);
//   };

//   const handleSave = (updated) => {
//     if (vendors.find((v) => v.id === updated.id)) {
//       setVendors((prev) =>
//         prev.map((v) => (v.id === updated.id ? updated : v)),
//       );
//     } else {
//       setVendors((prev) => [...prev, updated]);
//     }
//     setModalVisible(false);
//   };

//   // Right nav element
//   const rightElement = (
//     <TouchableOpacity
//       onPress={() =>
//         Alert.alert("View All Due", "Showing vendors with pending payments")
//       }
//       accessibilityLabel="View all due vendors"
//       accessibilityRole="button"
//     >
//       <Text style={styles.viewAllDue}>VIEW ALL DUE</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.safe} edges={["bottom"]}>
//       <TopNav
//         title="My Vendors"
//         transparent={false}
//         rightElement={rightElement}
//       />

//       <View style={styles.content}>
//         {/* Search */}
//         <AppInput
//           icon="search-outline"
//           placeholder="Search by name, phone or email"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           style={styles.searchInput}
//           accessibilityLabel="Search vendors"
//         />

//         {/* Count badge */}
//         {vendors.length > 0 && (
//           <View style={styles.countRow}>
//             <View style={styles.countPill}>
//               <Text style={styles.countText}>
//                 {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
//               </Text>
//             </View>
//           </View>
//         )}

//         {/* List */}
//         {loading ? (
//           <View style={styles.skeletonWrap}>
//             {[0, 1, 2].map((i) => (
//               <View key={i} style={styles.skeletonCard} />
//             ))}
//           </View>
//         ) : filtered.length === 0 ? (
//           <EmptyState
//             emoji="🏪"
//             title="No vendors found"
//             description={
//               searchQuery
//                 ? "Try a different search term"
//                 : "Tap Add Vendor to register your first vendor"
//             }
//             ctaLabel={!searchQuery ? "Add Vendor" : undefined}
//             onCtaPress={openAdd}
//           />
//         ) : (
//           <FlatList
//             data={filtered}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <VendorCard vendor={item} onViewDetails={openDetail} />
//             )}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContent}
//           />
//         )}
//       </View>

//       {/* Add Vendor sticky button */}
//       <View style={styles.addWrap}>
//         <AppButton
//           title="Add Vendor"
//           variant="primary"
//           size="lg"
//           onPress={openAdd}
//           leftIcon="add-outline"
//         />
//       </View>

//       {/* Vendor Detail Modal */}
//       <VendorDetailModal
//         visible={modalVisible}
//         vendor={selectedVendor}
//         onClose={() => setModalVisible(false)}
//         onSave={handleSave}
//       />
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.bg },

//   content: {
//     flex: 1,
//     paddingHorizontal: SIZES.screenPadding,
//     paddingTop: SIZES.md,
//   },

//   searchInput: { marginBottom: SIZES.sm },

//   countRow: { marginBottom: SIZES.sm },
//   countPill: {
//     alignSelf: "flex-start",
//     backgroundColor: COLORS.bgSection,
//     borderRadius: SIZES.radiusFull,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   countText: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textXs,
//     color: COLORS.textSecondary,
//   },

//   listContent: { paddingBottom: 100 },
//   separator: { height: SIZES.sm },

//   skeletonWrap: { gap: SIZES.sm },
//   skeletonCard: {
//     height: 72,
//     borderRadius: SIZES.radiusMd,
//     backgroundColor: COLORS.bgSection,
//   },

//   // ── Vendor card
//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.md,
//     ...SHADOWS.sm,
//     gap: SIZES.sm,
//   },
//   cardLeft: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: SIZES.md,
//   },
//   cardInfo: { flex: 1 },
//   cardNameRow: {
//     flexDirection: "row",
//     alignItems: "baseline",
//     flexWrap: "wrap",
//   },
//   cardName: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },
//   cardPhone: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//   },
//   cardMeta: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginTop: 3,
//   },
//   cardMetaText: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//     flex: 1,
//   },
//   viewDetails: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.primary,
//   },

//   // ── Add button
//   addWrap: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingHorizontal: SIZES.screenPadding,
//     paddingVertical: SIZES.md,
//     backgroundColor: COLORS.bg,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.borderLight,
//   },

//   // ── VIEW ALL DUE
//   viewAllDue: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.primary,
//   },

//   // ─── Modal ────────────────────────────────────────────────────────────────
//   modalSafe: { flex: 1, backgroundColor: COLORS.bgCard },
//   modalHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: SIZES.screenPadding,
//     paddingVertical: SIZES.md,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//     backgroundColor: COLORS.bgCard,
//   },
//   modalTitle: {
//     fontFamily: FONTS.bold,
//     fontSize: SIZES.textLg,
//     color: COLORS.textPrimary,
//     letterSpacing: -0.2,
//   },
//   modalClose: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: COLORS.bgSection,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   modalBody: {
//     padding: SIZES.screenPadding,
//     gap: 0,
//   },

//   fieldDivider: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: SIZES.md,
//     gap: SIZES.sm,
//   },
//   dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
//   dividerLabel: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//   },

//   saveBtn: { marginTop: SIZES.md },
//   deleteBtn: { marginTop: SIZES.sm },
// });

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonListItem } from "../../components/ui/SkeletonLoader";
import Avatar from "../../components/ui/Avatar";
import { getVendors, addUser } from "../../api/user";

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────
function AddVendorModal({ visible, onClose, onSaved }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    fullName: "",
    phoneNo: "",
    emailId: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForm({ fullName: "", phoneNo: "", emailId: "", address: "" });
    setErrors({});
  };

  const set = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vendor name is required";
    if (!form.phoneNo.trim()) e.phoneNo = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phoneNo.trim()))
      e.phoneNo = "Enter a valid 10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = {
        fullName: form.fullName.trim(),
        phoneNo: form.phoneNo.trim(),
        role: "vendor",
        ...(form.emailId.trim() && { emailId: form.emailId.trim() }),
        ...(form.address.trim() && { address: form.address.trim() }),
      };
      await addUser(payload);
      reset();
      onSaved();
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Failed to add vendor.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Vendor</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.modalClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              styles.modalBody,
              { paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppInput
              label="Vendor name *"
              placeholder="Enter vendor name"
              value={form.fullName}
              onChangeText={set("fullName")}
              error={errors.fullName}
              autoCapitalize="words"
              icon="storefront-outline"
              accessibilityLabel="Vendor name"
            />
            <AppInput
              label="Phone number *"
              placeholder="10-digit mobile number"
              value={form.phoneNo}
              onChangeText={set("phoneNo")}
              error={errors.phoneNo}
              keyboardType="phone-pad"
              maxLength={10}
              icon="call-outline"
              accessibilityLabel="Phone number"
            />
            <AppInput
              label="Email"
              placeholder="vendor@email.com"
              value={form.emailId}
              onChangeText={set("emailId")}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              accessibilityLabel="Email"
            />
            <AppInput
              label="Address"
              placeholder="Full address"
              value={form.address}
              onChangeText={set("address")}
              multiline
              numberOfLines={3}
              icon="location-outline"
              accessibilityLabel="Address"
            />

            <AppButton
              title="Save Vendor"
              variant="primary"
              size="lg"
              onPress={handleSave}
              loading={loading}
              style={styles.saveBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────
function VendorCard({ vendor, onViewDetails }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Avatar name={vendor.fullName} size="md" />
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {vendor.fullName}
            </Text>
            <Text style={styles.cardPhone}> ({vendor.phoneNo})</Text>
          </View>
          {vendor.emailId ? (
            <View style={styles.cardMeta}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={COLORS.textMuted}
              />
              <Text style={styles.cardMetaText} numberOfLines={1}>
                {vendor.emailId}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onViewDetails(vendor)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`View details for ${vendor.fullName}`}
        accessibilityRole="button"
      >
        <Text style={styles.viewDetails}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MyVendorsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchVendors = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getVendors();
      setVendors(res.data?.users ?? []);
    } catch (err) {
      setError(err.displayMessage || "Failed to load vendors.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchVendors());
    return unsub;
  }, [navigation, fetchVendors]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        (v.fullName || "").toLowerCase().includes(q) ||
        (v.phoneNo || "").includes(q) ||
        (v.emailId || "").toLowerCase().includes(q),
    );
  }, [vendors, searchQuery]);

  const rightElement = (
    <TouchableOpacity
      onPress={() =>
        Alert.alert("View All Due", "Showing vendors with pending payments")
      }
      accessibilityLabel="View all due vendors"
      accessibilityRole="button"
    >
      <Text style={styles.viewAllDue}>VIEW ALL DUE</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => (
            <SkeletonListItem key={i} style={styles.skeletonCard} />
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
          onCtaPress={() => fetchVendors()}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <EmptyState
          emoji="🏪"
          title="No vendors found"
          description={
            searchQuery
              ? "Try a different search term"
              : "Tap Add Vendor to register your first vendor"
          }
          ctaLabel={!searchQuery ? "Add Vendor" : undefined}
          onCtaPress={() => setModalVisible(true)}
        />
      );
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VendorCard vendor={item} onViewDetails={() => {}} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchVendors(true)}
        refreshing={refreshing}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title="My Vendors"
        transparent={false}
        rightElement={rightElement}
      />

      <View style={styles.content}>
        <AppInput
          icon="search-outline"
          placeholder="Search by name, phone or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          accessibilityLabel="Search vendors"
        />
        <View style={styles.addWrap}>
          <AppButton
            title="Add Vendor"
            variant="primary"
            size="lg"
            onPress={() => setModalVisible(true)}
            leftIcon="add-outline"
          />
        </View>

        {vendors.length > 0 && (
          <View style={styles.countRow}>
            <View style={styles.countPill}>
              <Text style={styles.countText}>
                {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}

        {renderContent()}
      </View>
      {/* <View style={styles.addWrap}>
        <AppButton
          title="Add Vendor"
          variant="primary"
          size="lg"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
        />
      </View> */}

      <AddVendorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          fetchVendors();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },
  searchInput: { marginBottom: SIZES.sm },
  countRow: { marginBottom: SIZES.sm },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  listContent: { paddingBottom: 100 },
  separator: { height: SIZES.sm },
  skeletonWrap: { gap: SIZES.sm },
  skeletonCard: {
    height: 72,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgSection,
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
    ...SHADOWS.sm,
    gap: SIZES.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
  },
  cardInfo: { flex: 1 },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  cardName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  cardPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  cardMetaText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    flex: 1,
  },
  viewDetails: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  addWrap: {
    marginTop: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  viewAllDue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
  modalSafe: { flex: 1, backgroundColor: COLORS.bgCard },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: SIZES.screenPadding, gap: 0 },
  saveBtn: { marginTop: SIZES.md },
});
