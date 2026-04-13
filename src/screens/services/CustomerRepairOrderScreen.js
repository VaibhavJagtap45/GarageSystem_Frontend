// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   Modal,
//   KeyboardAvoidingView,
//   TextInput,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
// import TopNav from "../../components/ui/TopNav";
// import AppInput from "../../components/ui/AppInput";
// import AppButton from "../../components/ui/AppButton";
// import AppToggle from "../../components/ui/AppToggle";
// import axiosClient from "../../api/axios";
// import {
//   REPAIR_ORDER_ENDPOINTS,
//   CATALOG_ENDPOINTS,
// } from "../../utils/constants";

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const fmt = (n) => (n > 0 ? `₹${parseFloat(n).toFixed(2)}` : "");
// const calcLineTotal = (price, qty, disc, tax) => {
//   const base = (parseFloat(price) || 0) * (parseInt(qty) || 1);
//   const afterDisc = base - (parseFloat(disc) || 0);
//   const taxAmt = afterDisc * ((parseFloat(tax) || 0) / 100);
//   return +(afterDisc + taxAmt).toFixed(2);
// };

// // ─── Search Phase ─────────────────────────────────────────────────────────────
// function SearchPhase({ onFound }) {
//   const [regNo, setRegNo] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleSearch = async () => {
//     const q = regNo.trim().toUpperCase();
//     if (!q) {
//       setError("Please enter a registration number");
//       return;
//     }
//     setError(null);
//     setLoading(true);
//     try {
//       const res = await axiosClient.get(REPAIR_ORDER_ENDPOINTS.SEARCH_VEHICLE, {
//         params: { regNo: q },
//       });
//       onFound(res.data.data);
//     } catch (e) {
//       setError(
//         e.response?.data?.message || e.displayMessage || "Vehicle not found.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.searchPhase}>
//       <View style={styles.searchCard}>
//         <Ionicons
//           name="car-outline"
//           size={40}
//           color={COLORS.primary}
//           style={{ marginBottom: SIZES.md }}
//         />
//         <Text style={styles.searchTitle}>Find Customer Vehicle</Text>
//         <Text style={styles.searchSubtitle}>
//           Enter the vehicle registration number to load customer details
//         </Text>
//         <AppInput
//           label="Registration Number"
//           icon="id-card-outline"
//           placeholder="MH12AB1234"
//           value={regNo}
//           onChangeText={(t) => {
//             setRegNo(t);
//             setError(null);
//           }}
//           autoCapitalize="characters"
//           error={error}
//         />
//         <AppButton
//           title={loading ? "Searching…" : "Search Vehicle"}
//           variant="gradient"
//           size="lg"
//           onPress={handleSearch}
//           disabled={loading}
//           leftIcon="search-outline"
//         />
//       </View>
//       <Text style={styles.orText}>— or —</Text>
//       <AppButton
//         title="Create New Customer + Vehicle"
//         variant="outline"
//         size="lg"
//         onPress={() => Alert.alert("Coming soon", "Customer creation flow.")}
//       />
//     </View>
//   );
// }

// // ─── Editable field inline ────────────────────────────────────────────────────
// function InlineEdit({ value, onSave, placeholder, style }) {
//   const [editing, setEditing] = useState(false);
//   const [local, setLocal] = useState(value);
//   if (editing) {
//     return (
//       <TextInput
//         style={[styles.inlineInput, style]}
//         value={local}
//         onChangeText={setLocal}
//         autoFocus
//         onBlur={() => {
//           setEditing(false);
//           onSave(local);
//         }}
//         placeholder={placeholder}
//         placeholderTextColor={COLORS.textMuted}
//       />
//     );
//   }
//   return (
//     <TouchableOpacity
//       style={styles.inlineRow}
//       onPress={() => setEditing(true)}
//       activeOpacity={0.7}
//     >
//       <Text
//         style={[styles.inlineValue, !value && styles.inlinePlaceholder, style]}
//       >
//         {value || placeholder}
//       </Text>
//       <Ionicons name="create-outline" size={14} color={COLORS.textMuted} />
//     </TouchableOpacity>
//   );
// }

// // ─── Customer + Vehicle header card ──────────────────────────────────────────
// function CustomerVehicleCard({
//   customer,
//   vehicle,
//   onChangeVehicle,
//   form,
//   setFormField,
// }) {
//   return (
//     <View style={styles.cvCard}>
//       {/* Left — customer */}
//       <View style={styles.cvLeft}>
//         <Text style={styles.cvName}>{customer?.fullName || "—"}</Text>
//         <Text style={styles.cvPhone}>{customer?.phoneNo || "—"}</Text>
//       </View>
//       {/* Divider */}
//       <View style={styles.cvDivider} />
//       {/* Right — vehicle */}
//       <View style={styles.cvRight}>
//         <TouchableOpacity
//           onPress={onChangeVehicle}
//           style={styles.cvVehicleRow}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.cvVehicle}>
//             {vehicle?.vehicleBrand} {vehicle?.vehicleModel}
//           </Text>
//           <Ionicons name="create-outline" size={13} color={COLORS.textMuted} />
//         </TouchableOpacity>
//         {/* Variant editable */}
//         <InlineEdit
//           value={form.vehicleVariant}
//           onSave={setFormField("vehicleVariant")}
//           placeholder="Variant"
//           style={{ fontSize: SIZES.textXs, color: COLORS.textMuted }}
//         />
//         {/* Odometer editable */}
//         <TouchableOpacity
//           style={styles.inlineRow}
//           onPress={() => {}}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.odometerLabel}>Odometer: </Text>
//           <InlineEdit
//             value={form.odometerReading ? String(form.odometerReading) : ""}
//             onSave={(v) =>
//               setFormField("odometerReading")(v ? parseInt(v, 10) : null)
//             }
//             placeholder="KMs"
//             style={{ fontSize: SIZES.textXs }}
//           />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// // ─── Section block (services / parts / images / tags etc.) ────────────────────
// function SectionBlock({ label, onAdd, children }) {
//   return (
//     <View style={styles.sectionBlock}>
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionLabel}>{label}</Text>
//         <TouchableOpacity
//           style={styles.addChip}
//           onPress={onAdd}
//           activeOpacity={0.8}
//         >
//           <Ionicons name="add-circle" size={15} color={COLORS.white} />
//           <Text style={styles.addChipText}>Add</Text>
//         </TouchableOpacity>
//       </View>
//       {children}
//     </View>
//   );
// }

// // ─── Service line row ─────────────────────────────────────────────────────────
// function ServiceLineRow({ item, index, onRemove, onChange, applyDiscount }) {
//   return (
//     <View style={styles.lineRow}>
//       <View style={{ flex: 3, paddingRight: 4 }}>
//         <Text style={styles.lineName} numberOfLines={1}>
//           {item.name}
//         </Text>
//         {applyDiscount && (
//           <Text style={styles.lineDisc}>Disc: ₹{item.discount || 0}</Text>
//         )}
//       </View>
//       <Text style={styles.linePrice}>₹{item.price || 0}</Text>
//       <TouchableOpacity
//         onPress={() => onRemove(index)}
//         style={styles.lineRemove}
//       >
//         <Ionicons name="close-circle" size={18} color={COLORS.error} />
//       </TouchableOpacity>
//     </View>
//   );
// }

// // ─── Part line row ────────────────────────────────────────────────────────────
// function PartLineRow({ item, index, onRemove, applyDiscount }) {
//   return (
//     <View style={styles.lineRow}>
//       <View style={{ flex: 3, paddingRight: 4 }}>
//         <Text style={styles.lineName} numberOfLines={1}>
//           {item.name}
//         </Text>
//         <Text style={styles.lineSub}>
//           Qty: {item.quantity} ₹{item.unitPrice}
//         </Text>
//         {applyDiscount && (
//           <Text style={styles.lineDisc}>Disc: ₹{item.discount || 0}</Text>
//         )}
//       </View>
//       <Text style={styles.linePrice}>₹{item.lineTotal || 0}</Text>
//       <TouchableOpacity
//         onPress={() => onRemove(index)}
//         style={styles.lineRemove}
//       >
//         <Ionicons name="close-circle" size={18} color={COLORS.error} />
//       </TouchableOpacity>
//     </View>
//   );
// }

// // ─── Add Service/Part picker modal ────────────────────────────────────────────
// function CatalogPickerModal({ visible, itemType, onClose, onSelect }) {
//   const [items, setItems] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
//         params: { itemType, search: search || undefined, limit: 100 },
//       });
//       setItems(res.data?.data?.items || []);
//     } catch {
//       setItems([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [itemType, search]);

//   React.useEffect(() => {
//     if (visible) load();
//   }, [visible, load]);

//   const isPart = itemType === "part";

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
//         <View style={styles.pickerHeader}>
//           <Text style={styles.pickerTitle}>
//             {isPart ? "Add Part" : "Add Service"}
//           </Text>
//           <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
//             <Ionicons name="close" size={20} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.pickerSearch}>
//           <AppInput
//             icon="search-outline"
//             placeholder={`Search ${isPart ? "parts" : "services"}…`}
//             value={search}
//             onChangeText={setSearch}
//           />
//         </View>
//         {loading ? (
//           <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
//         ) : (
//           <ScrollView
//             contentContainerStyle={{
//               padding: SIZES.screenPadding,
//               gap: SIZES.sm,
//             }}
//           >
//             {items.map((item) => (
//               <TouchableOpacity
//                 key={item._id}
//                 style={styles.pickerItem}
//                 onPress={() => {
//                   onSelect(item);
//                   onClose();
//                 }}
//                 activeOpacity={0.7}
//               >
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.pickerItemName}>{item.name}</Text>
//                   {item.category ? (
//                     <Text style={styles.pickerItemSub}>{item.category}</Text>
//                   ) : null}
//                 </View>
//                 <Text style={styles.pickerItemPrice}>
//                   {item.mrp > 0 ? `₹${item.mrp}` : "Free"}
//                 </Text>
//                 <Ionicons
//                   name="add-circle-outline"
//                   size={22}
//                   color={COLORS.primary}
//                 />
//               </TouchableOpacity>
//             ))}
//             {!loading && items.length === 0 && (
//               <Text style={styles.pickerEmpty}>
//                 No {isPart ? "parts" : "services"} found.
//               </Text>
//             )}
//           </ScrollView>
//         )}
//       </SafeAreaView>
//     </Modal>
//   );
// }

// // ─── Total row ────────────────────────────────────────────────────────────────
// function TotalRow({ label, value, highlight }) {
//   return (
//     <View style={[styles.totalRow, highlight && styles.totalRowHL]}>
//       <Text style={[styles.totalLabel, highlight && styles.totalLabelHL]}>
//         {label}
//       </Text>
//       <View style={[styles.totalValueBox, highlight && styles.totalValueBoxHL]}>
//         {value !== null && value !== "" && (
//           <Text style={styles.totalRupee}>₹</Text>
//         )}
//         <Text style={[styles.totalValue, highlight && styles.totalValueHL]}>
//           {value !== null && value !== "" ? parseFloat(value).toFixed(2) : ""}
//         </Text>
//       </View>
//     </View>
//   );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function CustomerRepairOrderScreen() {
//   const navigation = useNavigation();

//   // Phase: "search" | "order"
//   const [phase, setPhase] = useState("search");
//   const [customer, setCustomer] = useState(null);
//   const [vehicle, setVehicle] = useState(null);

//   // Form state
//   const [form, setForm] = useState({
//     vehicleVariant: "",
//     odometerReading: null,
//     services: [],
//     applyDiscountToAllServices: false,
//     parts: [],
//     applyDiscountToAllParts: false,
//     images: [],
//     tags: [],
//     customerRemarks: [],
//     estimatedDeliveryAt: new Date(
//       Date.now() + 6 * 60 * 60 * 1000,
//     ).toISOString(),
//     notifyCustomer: false,
//   });

//   const setFormField = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

//   // Pickers
//   const [showServicePicker, setShowServicePicker] = useState(false);
//   const [showPartPicker, setShowPartPicker] = useState(false);

//   // Saving
//   const [saving, setSaving] = useState(false);

//   // ── Handle vehicle found ──────────────────────────────────────────
//   const handleFound = ({ vehicle: v, customer: c }) => {
//     setVehicle(v);
//     setCustomer(c);
//     setPhase("order");
//   };

//   // ── Remove helpers ────────────────────────────────────────────────
//   const removeService = (i) =>
//     setFormField("services")(form.services.filter((_, idx) => idx !== i));
//   const removePart = (i) =>
//     setFormField("parts")(form.parts.filter((_, idx) => idx !== i));
//   const removeRemark = (i) =>
//     setFormField("customerRemarks")(
//       form.customerRemarks.filter((_, idx) => idx !== i),
//     );

//   // ── Catalog select ────────────────────────────────────────────────
//   const onSelectService = (item) => {
//     setFormField("services")([
//       ...form.services,
//       {
//         catalogId: item._id,
//         name: item.name,
//         price: item.mrp || 0,
//         discount: 0,
//         taxPercent: 0,
//         lineTotal: item.mrp || 0,
//       },
//     ]);
//   };

//   const onSelectPart = (item) => {
//     setFormField("parts")([
//       ...form.parts,
//       {
//         inventoryId: item._id,
//         partCode: item.no || null,
//         name: item.name,
//         quantity: 1,
//         unitPrice: item.mrp || 0,
//         discount: 0,
//         taxPercent: item.taxPercent || 0,
//         lineTotal: item.mrp || 0,
//       },
//     ]);
//   };

//   // ── Computed totals ───────────────────────────────────────────────
//   const laborTotal = form.services.reduce(
//     (sum, s) => sum + (s.lineTotal || 0),
//     0,
//   );
//   const partsTotal = form.parts.reduce((sum, p) => sum + (p.lineTotal || 0), 0);
//   const total = laborTotal + partsTotal;

//   // ── Submit ────────────────────────────────────────────────────────
//   const handleContinue = async () => {
//     if (!vehicle?._id || !customer?._id) return;
//     setSaving(true);
//     try {
//       await axiosClient.post(REPAIR_ORDER_ENDPOINTS.LIST, {
//         customerId: customer._id,
//         vehicleId: vehicle._id,
//         vehicleVariant: form.vehicleVariant,
//         odometerReading: form.odometerReading,
//         services: form.services,
//         applyDiscountToAllServices: form.applyDiscountToAllServices,
//         parts: form.parts,
//         applyDiscountToAllParts: form.applyDiscountToAllParts,
//         images: form.images,
//         laborTotal,
//         partsTotal,
//         totalAmount: total,
//         tags: form.tags,
//         customerRemarks: form.customerRemarks,
//         estimatedDeliveryAt: form.estimatedDeliveryAt,
//         notifyCustomer: form.notifyCustomer,
//       });
//       Alert.alert("Success", "Repair order created successfully.", [
//         { text: "OK", onPress: () => navigation.goBack() },
//       ]);
//     } catch (e) {
//       Alert.alert(
//         "Error",
//         e.displayMessage || "Could not create repair order.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleReset = () => {
//     setPhase("search");
//     setCustomer(null);
//     setVehicle(null);
//     setForm({
//       vehicleVariant: "",
//       odometerReading: null,
//       services: [],
//       applyDiscountToAllServices: false,
//       parts: [],
//       applyDiscountToAllParts: false,
//       images: [],
//       tags: [],
//       customerRemarks: [],
//       estimatedDeliveryAt: new Date(
//         Date.now() + 6 * 60 * 60 * 1000,
//       ).toISOString(),
//       notifyCustomer: false,
//     });
//   };

//   // ── Estimated delivery display ────────────────────────────────────
//   const deliveryDisplay = form.estimatedDeliveryAt
//     ? new Date(form.estimatedDeliveryAt).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "";

//   return (
//     <SafeAreaView style={styles.safe} edges={["bottom"]}>
//       <TopNav
//         title="Repair Order"
//         transparent={false}
//         rightElement={
//           phase === "order" ? (
//             <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
//               <Text style={styles.resetText}>RESET</Text>
//             </TouchableOpacity>
//           ) : null
//         }
//       />

//       {phase === "search" ? (
//         <SearchPhase onFound={handleFound} />
//       ) : (
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.orderScroll}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Customer + Vehicle card */}
//           <CustomerVehicleCard
//             customer={customer}
//             vehicle={vehicle}
//             onChangeVehicle={handleReset}
//             form={form}
//             setFormField={setFormField}
//           />

//           {/* Package / AMC quick actions */}
//           <View style={styles.quickRow}>
//             <TouchableOpacity
//               style={styles.quickChip}
//               activeOpacity={0.8}
//               onPress={() => Alert.alert("Packages", "Coming soon.")}
//             >
//               <Ionicons
//                 name="bookmark-outline"
//                 size={14}
//                 color={COLORS.white}
//               />
//               <Text style={styles.quickChipText}>Choose From Packages</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.quickChip, styles.quickChipAlt]}
//               activeOpacity={0.8}
//               onPress={() => Alert.alert("AMC", "Coming soon.")}
//             >
//               <Ionicons name="attach-outline" size={14} color={COLORS.white} />
//               <Text style={styles.quickChipText}>Attach AMC</Text>
//             </TouchableOpacity>
//           </View>

//           {/* SERVICES section */}
//           <SectionBlock
//             label="SERVICES"
//             onAdd={() => setShowServicePicker(true)}
//           >
//             {form.services.length === 0 ? (
//               <View style={styles.emptyLines}>
//                 <Text style={styles.emptyLinesText}>No services added yet</Text>
//               </View>
//             ) : (
//               form.services.map((s, i) => (
//                 <ServiceLineRow
//                   key={i}
//                   item={s}
//                   index={i}
//                   onRemove={removeService}
//                   applyDiscount={form.applyDiscountToAllServices}
//                 />
//               ))
//             )}
//             <View style={styles.discountToggleRow}>
//               <AppToggle
//                 label="Apply discount to all"
//                 value={form.applyDiscountToAllServices}
//                 onChange={setFormField("applyDiscountToAllServices")}
//               />
//             </View>
//           </SectionBlock>

//           {/* PARTS section */}
//           <SectionBlock label="PARTS" onAdd={() => setShowPartPicker(true)}>
//             {form.parts.length === 0 ? (
//               <View style={styles.emptyLines}>
//                 <Text style={styles.emptyLinesText}>No parts added yet</Text>
//               </View>
//             ) : (
//               form.parts.map((p, i) => (
//                 <PartLineRow
//                   key={i}
//                   item={p}
//                   index={i}
//                   onRemove={removePart}
//                   applyDiscount={form.applyDiscountToAllParts}
//                 />
//               ))
//             )}
//             <View style={styles.discountToggleRow}>
//               <AppToggle
//                 label="Apply discount to all"
//                 value={form.applyDiscountToAllParts}
//                 onChange={setFormField("applyDiscountToAllParts")}
//               />
//             </View>
//           </SectionBlock>

//           {/* IMAGES section */}
//           <SectionBlock
//             label="IMAGES"
//             onAdd={() => Alert.alert("Images", "Image upload coming soon.")}
//           >
//             {form.images.length === 0 && (
//               <View style={styles.emptyLines}>
//                 <Text style={styles.emptyLinesText}>No images attached</Text>
//               </View>
//             )}
//           </SectionBlock>

//           {/* Totals block */}
//           <View style={styles.totalsBlock}>
//             <TotalRow
//               label="Labor Total"
//               value={laborTotal > 0 ? laborTotal : ""}
//             />
//             <View style={styles.totalsDivider} />
//             <TotalRow
//               label="Parts Total"
//               value={partsTotal > 0 ? partsTotal : ""}
//             />
//             <View style={styles.totalsDivider} />
//             <TotalRow label="TOTAL (Inclusive Taxes)" value={total} highlight />
//             <View style={styles.totalsDivider} />
//             <TotalRow label="Applicable discount" value={0} />
//           </View>

//           {/* TAGS section */}
//           <SectionBlock
//             label="TAGS"
//             onAdd={() => Alert.alert("Tags", "Tag picker coming soon.")}
//           >
//             {form.tags.length === 0 && (
//               <View style={styles.emptyLines}>
//                 <Text style={styles.emptyLinesText}>No tags added</Text>
//               </View>
//             )}
//           </SectionBlock>

//           {/* CUSTOMER REMARKS section */}
//           <SectionBlock
//             label="CUSTOMER REMARKS"
//             onAdd={() =>
//               setFormField("customerRemarks")([...form.customerRemarks, ""])
//             }
//           >
//             {form.customerRemarks.map((remark, i) => (
//               <View key={i} style={styles.remarkRow}>
//                 <TextInput
//                   style={styles.remarkInput}
//                   value={remark}
//                   placeholder="Customer Remark"
//                   placeholderTextColor={COLORS.textMuted}
//                   onChangeText={(t) => {
//                     const updated = [...form.customerRemarks];
//                     updated[i] = t;
//                     setFormField("customerRemarks")(updated);
//                   }}
//                 />
//                 <TouchableOpacity
//                   onPress={() => removeRemark(i)}
//                   style={{ padding: 4 }}
//                 >
//                   <Ionicons name="close" size={18} color={COLORS.error} />
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </SectionBlock>

//           {/* Estimated delivery + notify */}
//           <View style={styles.deliveryRow}>
//             <Text style={styles.deliveryLabel}>Estimated delivery time</Text>
//             <TouchableOpacity
//               onPress={() =>
//                 Alert.alert("Delivery time", "Date picker coming soon.")
//               }
//               activeOpacity={0.8}
//             >
//               <Text style={styles.deliveryValue}>{deliveryDisplay}</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.notifyRow}>
//             <AppToggle
//               label="Notify Customer (SMS & e-mail)?"
//               icon="notifications-outline"
//               value={form.notifyCustomer}
//               onChange={setFormField("notifyCustomer")}
//             />
//           </View>

//           {/* Continue button */}
//           <AppButton
//             title={saving ? "Saving…" : "Continue"}
//             variant="gradient"
//             size="lg"
//             onPress={handleContinue}
//             disabled={saving}
//             style={styles.continueBtn}
//           />
//         </ScrollView>
//       )}

//       {/* Catalog pickers */}
//       <CatalogPickerModal
//         visible={showServicePicker}
//         itemType="service"
//         onClose={() => setShowServicePicker(false)}
//         onSelect={onSelectService}
//       />
//       <CatalogPickerModal
//         visible={showPartPicker}
//         itemType="part"
//         onClose={() => setShowPartPicker(false)}
//         onSelect={onSelectPart}
//       />
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.bg },

//   resetBtn: { paddingHorizontal: SIZES.sm },
//   resetText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//     letterSpacing: 0.3,
//   },

//   // Search phase
//   searchPhase: {
//     flex: 1,
//     padding: SIZES.screenPadding,
//     paddingTop: SIZES.lg,
//     gap: SIZES.sm,
//   },
//   searchCard: {
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusLg,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     padding: SIZES.lg,
//     alignItems: "center",
//     gap: SIZES.sm,
//     ...SHADOWS.sm,
//   },
//   searchTitle: {
//     fontFamily: FONTS.bold,
//     fontSize: SIZES.textMd,
//     color: COLORS.textPrimary,
//     textAlign: "center",
//   },
//   searchSubtitle: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//     textAlign: "center",
//     marginBottom: SIZES.sm,
//   },
//   orText: {
//     textAlign: "center",
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//   },

//   // Order scroll
//   orderScroll: { paddingBottom: 60 },

//   // Customer + Vehicle card
//   cvCard: {
//     flexDirection: "row",
//     backgroundColor: COLORS.bgCard,
//     margin: SIZES.screenPadding,
//     marginBottom: SIZES.sm,
//     borderRadius: SIZES.radiusLg,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     overflow: "hidden",
//     ...SHADOWS.sm,
//   },
//   cvLeft: { flex: 1, padding: SIZES.md, justifyContent: "center" },
//   cvDivider: { width: 1, backgroundColor: COLORS.borderLight },
//   cvRight: { flex: 1.4, padding: SIZES.md },
//   cvName: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },
//   cvPhone: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//     marginTop: 2,
//   },
//   cvVehicleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginBottom: 2,
//   },
//   cvVehicle: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//     flex: 1,
//   },
//   inlineRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//     paddingVertical: 1,
//   },
//   inlineValue: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//   },
//   inlinePlaceholder: { color: COLORS.textMuted },
//   inlineInput: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.primary,
//     paddingVertical: 2,
//     minWidth: 60,
//   },
//   odometerLabel: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//   },

//   // Quick action chips
//   quickRow: {
//     flexDirection: "row",
//     gap: SIZES.sm,
//     paddingHorizontal: SIZES.screenPadding,
//     marginBottom: SIZES.sm,
//   },
//   quickChip: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 5,
//     backgroundColor: COLORS.textPrimary,
//     borderRadius: SIZES.radiusFull,
//     paddingVertical: SIZES.sm + 2,
//   },
//   quickChipAlt: { backgroundColor: COLORS.textPrimary },
//   quickChipText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.white,
//   },

//   // Section block
//   sectionBlock: {
//     marginHorizontal: SIZES.screenPadding,
//     marginBottom: SIZES.sm,
//     borderRadius: SIZES.radiusMd,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     backgroundColor: COLORS.bgCard,
//     overflow: "hidden",
//     ...SHADOWS.sm,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm + 2,
//   },
//   sectionLabel: {
//     fontFamily: FONTS.bold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//     letterSpacing: 0.5,
//   },
//   addChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     backgroundColor: COLORS.primary,
//     borderRadius: SIZES.radiusFull,
//     paddingHorizontal: SIZES.sm + 2,
//     paddingVertical: 4,
//   },
//   addChipText: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textXs,
//     color: COLORS.white,
//   },

//   // Line rows
//   emptyLines: { padding: SIZES.md, alignItems: "center" },
//   emptyLinesText: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//   },
//   lineRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   lineName: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//   },
//   lineSub: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//   },
//   lineDisc: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.warning,
//   },
//   linePrice: {
//     width: 60,
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//     textAlign: "right",
//   },
//   lineRemove: { width: 28, alignItems: "center" },
//   discountToggleRow: {
//     paddingHorizontal: SIZES.sm,
//     paddingVertical: SIZES.sm,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.borderLight,
//   },

//   // Totals
//   totalsBlock: {
//     marginHorizontal: SIZES.screenPadding,
//     marginBottom: SIZES.sm,
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//     overflow: "hidden",
//     ...SHADOWS.sm,
//   },
//   totalRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm + 2,
//   },
//   totalRowHL: { backgroundColor: COLORS.bgSection },
//   totalLabel: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textSecondary,
//   },
//   totalLabelHL: { fontFamily: FONTS.semibold, color: COLORS.textPrimary },
//   totalValueBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.bgInput,
//     borderRadius: SIZES.radiusSm,
//     paddingHorizontal: SIZES.sm,
//     paddingVertical: SIZES.xs,
//     minWidth: 100,
//     justifyContent: "flex-end",
//   },
//   totalValueBoxHL: { backgroundColor: COLORS.bgInput },
//   totalRupee: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//     marginRight: 2,
//   },
//   totalValue: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },
//   totalValueHL: { color: COLORS.primary },
//   totalsDivider: { height: 1, backgroundColor: COLORS.borderLight },

//   // Remarks
//   remarkRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: SIZES.md,
//     paddingVertical: SIZES.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   remarkInput: {
//     flex: 1,
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },

//   // Delivery + notify
//   deliveryRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginHorizontal: SIZES.screenPadding,
//     marginBottom: SIZES.sm,
//     paddingBottom: SIZES.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//   },
//   deliveryLabel: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textSm,
//     color: COLORS.textMuted,
//   },
//   deliveryValue: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.textPrimary,
//   },
//   notifyRow: { paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },

//   // Continue
//   continueBtn: {
//     marginHorizontal: SIZES.screenPadding,
//     marginBottom: SIZES.xl,
//   },

//   // Catalog picker modal
//   pickerHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: SIZES.screenPadding,
//     paddingVertical: SIZES.md,
//   },
//   pickerTitle: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textLg,
//     color: COLORS.textPrimary,
//   },
//   pickerClose: {
//     width: 34,
//     height: 34,
//     borderRadius: SIZES.radiusFull,
//     backgroundColor: COLORS.bgSection,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   pickerSearch: {
//     paddingHorizontal: SIZES.screenPadding,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//     paddingBottom: SIZES.sm,
//   },
//   pickerItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: SIZES.sm,
//     backgroundColor: COLORS.bgCard,
//     borderRadius: SIZES.radiusMd,
//     padding: SIZES.md,
//     borderWidth: 1,
//     borderColor: COLORS.borderLight,
//   },
//   pickerItemName: {
//     fontFamily: FONTS.medium,
//     fontSize: SIZES.textBase,
//     color: COLORS.textPrimary,
//   },
//   pickerItemSub: {
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textXs,
//     color: COLORS.textMuted,
//   },
//   pickerItemPrice: {
//     fontFamily: FONTS.semibold,
//     fontSize: SIZES.textSm,
//     color: COLORS.primary,
//     marginRight: 4,
//   },
//   pickerEmpty: {
//     textAlign: "center",
//     fontFamily: FONTS.regular,
//     fontSize: SIZES.textBase,
//     color: COLORS.textMuted,
//     marginTop: 40,
//   },
// });

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppToggle from "../../components/ui/AppToggle";
import axiosClient from "../../api/axios";
import { linkRepairOrder } from "../../api/booking";
import {
  REPAIR_ORDER_ENDPOINTS,
  CATALOG_ENDPOINTS,
  TAG_ENDPOINTS,
} from "../../utils/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n > 0 ? `₹${parseFloat(n).toFixed(2)}` : "");
const calcLineTotal = (price, qty, disc, tax) => {
  const base = (parseFloat(price) || 0) * (parseInt(qty) || 1);
  const afterDisc = base - (parseFloat(disc) || 0);
  const taxAmt = afterDisc * ((parseFloat(tax) || 0) / 100);
  return +(afterDisc + taxAmt).toFixed(2);
};

// ─── Search Phase ─────────────────────────────────────────────────────────────
function SearchPhase({ onFound, onNavigate, onNewCustomer }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  // Live search — fires 400 ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosClient.get(
          REPAIR_ORDER_ENDPOINTS.SEARCH_CUSTOMERS,
          { params: { q } },
        );
        setResults(res.data?.data?.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = ({ customer, vehicle }) => {
    if (!vehicle) {
      // Customer exists but no vehicle — go create one
      onNavigate("CreateCustomerVehicle", {
        prefillCustomer: customer,
        onSuccess: onNewCustomer,
      });
    } else {
      onFound({ customer, vehicle });
    }
  };

  return (
    <View style={styles.searchPhase}>
      {/* ── Search box ── */}
      <View style={styles.searchCard}>
        <Ionicons
          name="car-outline"
          size={36}
          color={COLORS.primary}
          style={{ marginBottom: SIZES.md }}
        />
        <Text style={styles.searchTitle}>Find Customer</Text>
        <Text style={styles.searchSubtitle}>
          Type a customer name, phone number, or vehicle registration number
        </Text>

        <View style={styles.liveSearchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.liveSearchInput}
            placeholder="Name, phone or reg no…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSearched(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : query.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
                setSearched(false);
              }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Results list ── */}
      {results.length > 0 && (
        <View style={styles.resultsCard}>
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.resultSep} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {/* Customer avatar */}
                <View style={styles.resultAvatar}>
                  <Text style={styles.resultAvatarText}>
                    {(item.customer?.fullName ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Customer + Vehicle info */}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.customer?.fullName ?? "Unknown"}
                  </Text>
                  <Text style={styles.resultPhone}>
                    {item.customer?.phoneNo ?? ""}
                  </Text>
                  {item.vehicle ? (
                    <View style={styles.resultVehicleRow}>
                      <Ionicons
                        name="car-outline"
                        size={12}
                        color={COLORS.primary}
                      />
                      <Text style={styles.resultVehicle}>
                        {item.vehicle.vehicleBrand} {item.vehicle.vehicleModel}
                        {item.vehicle.vehicleRegisterNo
                          ? `  ·  ${item.vehicle.vehicleRegisterNo}`
                          : ""}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.resultNoVehicle}>
                      No vehicle — tap to add
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── No results ── */}
      {searched && results.length === 0 && query.trim().length >= 2 && (
        <View style={styles.notFoundCard}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={COLORS.warning}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.notFoundTitle}>No results found</Text>
            <Text style={styles.notFoundSub}>
              No customer or vehicle matched "{query}".{"\n"}Is this a new
              customer?
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.orText}>— or —</Text>
      <AppButton
        title="Create New Customer + Vehicle"
        variant="outline"
        size="lg"
        onPress={() =>
          onNavigate("CreateCustomerVehicle", { onSuccess: onNewCustomer })
        }
      />
    </View>
  );
}

// ─── Editable field inline ────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder, style }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  if (editing) {
    return (
      <TextInput
        style={[styles.inlineInput, style]}
        value={local}
        onChangeText={setLocal}
        autoFocus
        onBlur={() => {
          setEditing(false);
          onSave(local);
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
      />
    );
  }
  return (
    <TouchableOpacity
      style={styles.inlineRow}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.inlineValue, !value && styles.inlinePlaceholder, style]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="create-outline" size={14} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Customer + Vehicle header card ──────────────────────────────────────────
function CustomerVehicleCard({
  customer,
  vehicle,
  onChangeVehicle,
  form,
  setFormField,
}) {
  return (
    <View style={styles.cvCard}>
      {/* Left — customer */}
      <View style={styles.cvLeft}>
        <Text style={styles.cvName}>{customer?.fullName || "—"}</Text>
        <Text style={styles.cvPhone}>{customer?.phoneNo || "—"}</Text>
      </View>
      {/* Divider */}
      <View style={styles.cvDivider} />
      {/* Right — vehicle */}
      <View style={styles.cvRight}>
        <TouchableOpacity
          onPress={onChangeVehicle}
          style={styles.cvVehicleRow}
          activeOpacity={0.7}
        >
          <Text style={styles.cvVehicle}>
            {vehicle?.vehicleBrand} {vehicle?.vehicleModel}
          </Text>
          <Ionicons name="create-outline" size={13} color={COLORS.textMuted} />
        </TouchableOpacity>
        {/* Variant editable */}
        <InlineEdit
          value={form.vehicleVariant}
          onSave={setFormField("vehicleVariant")}
          placeholder="Variant"
          style={{ fontSize: SIZES.textXs, color: COLORS.textMuted }}
        />
        {/* Odometer editable */}
        <TouchableOpacity
          style={styles.inlineRow}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Text style={styles.odometerLabel}>Odometer: </Text>
          <InlineEdit
            value={form.odometerReading ? String(form.odometerReading) : ""}
            onSave={(v) =>
              setFormField("odometerReading")(v ? parseInt(v, 10) : null)
            }
            placeholder="KMs"
            style={{ fontSize: SIZES.textXs }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Section block (services / parts / images / tags etc.) ────────────────────
function SectionBlock({ label, onAdd, children }) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.addChip}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={15} color={COLORS.white} />
          <Text style={styles.addChipText}>Add</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

// ─── Service line row ─────────────────────────────────────────────────────────
function ServiceLineRow({ item, index, onRemove, onChange, applyDiscount }) {
  return (
    <View style={styles.lineRow}>
      <View style={{ flex: 3, paddingRight: 4 }}>
        <Text style={styles.lineName} numberOfLines={1}>
          {item.name}
        </Text>
        {applyDiscount && (
          <Text style={styles.lineDisc}>Disc: ₹{item.discount || 0}</Text>
        )}
      </View>
      <Text style={styles.linePrice}>₹{item.price || 0}</Text>
      <TouchableOpacity
        onPress={() => onRemove(index)}
        style={styles.lineRemove}
      >
        <Ionicons name="close-circle" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Part line row ────────────────────────────────────────────────────────────
function PartLineRow({ item, index, onRemove, applyDiscount }) {
  return (
    <View style={styles.lineRow}>
      <View style={{ flex: 3, paddingRight: 4 }}>
        <Text style={styles.lineName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.lineSub}>
          Qty: {item.quantity} ₹{item.unitPrice}
        </Text>
        {applyDiscount && (
          <Text style={styles.lineDisc}>Disc: ₹{item.discount || 0}</Text>
        )}
      </View>
      <Text style={styles.linePrice}>₹{item.lineTotal || 0}</Text>
      <TouchableOpacity
        onPress={() => onRemove(index)}
        style={styles.lineRemove}
      >
        <Ionicons name="close-circle" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Add Service/Part picker modal ────────────────────────────────────────────
function CatalogPickerModal({ visible, itemType, onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
        params: { itemType, search: search || undefined, limit: 100 },
      });
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [itemType, search]);

  React.useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const isPart = itemType === "part";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>
            {isPart ? "Add Part" : "Add Service"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.pickerSearch}>
          <AppInput
            icon="search-outline"
            placeholder={`Search ${isPart ? "parts" : "services"}…`}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: SIZES.screenPadding,
              gap: SIZES.sm,
            }}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.pickerItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  {item.category ? (
                    <Text style={styles.pickerItemSub}>{item.category}</Text>
                  ) : null}
                </View>
                <Text style={styles.pickerItemPrice}>
                  {item.mrp > 0 ? `₹${item.mrp}` : "Free"}
                </Text>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))}
            {!loading && items.length === 0 && (
              <Text style={styles.pickerEmpty}>
                No {isPart ? "parts" : "services"} found.
              </Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Tag Picker Modal ─────────────────────────────────────────────────────────
function TagPickerModal({ visible, onClose, selectedTags, onConfirm }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (visible) {
      setSelected(selectedTags ?? []);
      setLoading(true);
      axiosClient
        .get(TAG_ENDPOINTS.LIST)
        .then((res) => {
          const all = res.data?.data?.tags ?? res.data?.data ?? [];
          setTags(
            all.filter(
              (t) => t.tagType === "repair_order" || t.tagType === "both",
            ),
          );
        })
        .catch(() => setTags([]))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const toggle = (name) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const LIGHT_HEX = new Set(["#FFEB3B", "#CDDC39"]);
  const displayHex = (hex) =>
    LIGHT_HEX.has(hex) ? "#B8860B" : hex || COLORS.primary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Tags</Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: COLORS.borderLight }} />
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : tags.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
            <Ionicons
              name="pricetag-outline"
              size={40}
              color={COLORS.borderLight}
            />
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: SIZES.textBase,
                color: COLORS.textMuted,
                textAlign: "center",
                paddingHorizontal: 24,
              }}
            >
              No tags found. Create tags in Settings → Tags.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: SIZES.screenPadding,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: SIZES.sm,
            }}
          >
            {tags.map((tag) => {
              const hex = displayHex(tag.color);
              const isSelected = selected.includes(tag.name);
              return (
                <TouchableOpacity
                  key={tag._id}
                  style={[
                    styles.tagPickerChip,
                    {
                      borderColor: hex,
                      backgroundColor: isSelected ? hex + "22" : COLORS.bgCard,
                    },
                  ]}
                  onPress={() => toggle(tag.name)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.tagPickerDot, { backgroundColor: hex }]}
                  />
                  <Text style={[styles.tagPickerLabel, { color: hex }]}>
                    {tag.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={13} color={hex} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <View style={{ padding: SIZES.screenPadding, paddingTop: SIZES.sm }}>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: SIZES.radiusMd,
              paddingVertical: 13,
              alignItems: "center",
            }}
            onPress={() => {
              onConfirm(selected);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: FONTS.semibold,
                fontSize: SIZES.textBase,
                color: COLORS.white,
              }}
            >
              Done ({selected.length} selected)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Total row ────────────────────────────────────────────────────────────────
function TotalRow({ label, value, highlight }) {
  return (
    <View style={[styles.totalRow, highlight && styles.totalRowHL]}>
      <Text style={[styles.totalLabel, highlight && styles.totalLabelHL]}>
        {label}
      </Text>
      <View style={[styles.totalValueBox, highlight && styles.totalValueBoxHL]}>
        {value !== null && value !== "" && (
          <Text style={styles.totalRupee}>₹</Text>
        )}
        <Text style={[styles.totalValue, highlight && styles.totalValueHL]}>
          {value !== null && value !== "" ? parseFloat(value).toFixed(2) : ""}
        </Text>
      </View>
    </View>
  );
}

// ─── Delivery Date/Time Picker Modal ─────────────────────────────────────────
const DT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DT_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DT_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});
const DT_TIME_SLOTS = (() => {
  const slots = [];
  for (let min = 8 * 60; min <= 21 * 60; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push({
      label: `${dh}:${String(m).padStart(2, "0")} ${ampm}`,
      hours: h,
      minutes: m,
    });
  }
  return slots;
})();

function DeliveryDatePickerModal({ visible, current, onClose, onConfirm }) {
  // Derive initial selection from the `current` ISO string
  const init = () => {
    const d = current
      ? new Date(current)
      : new Date(Date.now() + 6 * 60 * 60 * 1000);
    const dayIdx = DT_DAYS.findIndex(
      (day) =>
        day.getDate() === d.getDate() &&
        day.getMonth() === d.getMonth() &&
        day.getFullYear() === d.getFullYear(),
    );
    const timeIdx = DT_TIME_SLOTS.findIndex(
      (s) => s.hours === d.getHours() && s.minutes === d.getMinutes(),
    );
    return {
      dayIdx: dayIdx >= 0 ? dayIdx : 0,
      timeIdx: timeIdx >= 0 ? timeIdx : 0,
    };
  };

  const [dayIdx, setDayIdx] = useState(() => init().dayIdx);
  const [timeIdx, setTimeIdx] = useState(() => init().timeIdx);

  // Re-sync when modal opens with a new `current`
  useEffect(() => {
    if (visible) {
      const { dayIdx: d, timeIdx: t } = init();
      setDayIdx(d);
      setTimeIdx(t);
    }
  }, [visible]);

  const handleConfirm = () => {
    const d = new Date(DT_DAYS[dayIdx]);
    d.setHours(
      DT_TIME_SLOTS[timeIdx].hours,
      DT_TIME_SLOTS[timeIdx].minutes,
      0,
      0,
    );
    onConfirm(d.toISOString());
  };

  const dayLabel = (d, idx) =>
    idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : DT_DAY_NAMES[d.getDay()];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={dtStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={dtStyles.sheet}>
            <View style={dtStyles.handle} />
            <View style={dtStyles.header}>
              <Text style={dtStyles.title}>Estimated Delivery</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Day chips */}
            <Text style={dtStyles.sectionLabel}>Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}
              contentContainerStyle={{
                paddingHorizontal: SIZES.screenPadding,
                gap: 6,
              }}
            >
              {DT_DAYS.map((d, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[dtStyles.dayChip, dayIdx === idx && dtStyles.chipOn]}
                  onPress={() => setDayIdx(idx)}
                >
                  <Text
                    style={[
                      dtStyles.dayName,
                      dayIdx === idx && dtStyles.textOn,
                    ]}
                  >
                    {dayLabel(d, idx)}
                  </Text>
                  <Text
                    style={[
                      dtStyles.dayDate,
                      dayIdx === idx && dtStyles.textOnSub,
                    ]}
                  >
                    {d.getDate()} {DT_MONTH_SHORT[d.getMonth()]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time grid */}
            <Text style={dtStyles.sectionLabel}>Time</Text>
            <ScrollView
              style={{ maxHeight: 160 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={dtStyles.timeGrid}
            >
              {DT_TIME_SLOTS.map((slot, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    dtStyles.timeChip,
                    timeIdx === idx && dtStyles.chipOn,
                  ]}
                  onPress={() => setTimeIdx(idx)}
                >
                  <Text
                    style={[
                      dtStyles.timeText,
                      timeIdx === idx && dtStyles.textOn,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Confirm */}
            <TouchableOpacity
              style={dtStyles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />
              <Text style={dtStyles.confirmBtnText}>Set Delivery Time</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const dtStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: COLORS.bgPrimary || COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
  },
  dayChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 66,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  dayDate: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  textOn: { color: "#fff", fontFamily: FONTS.semibold },
  textOnSub: { color: "rgba(255,255,255,0.8)" },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 4,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.md,
  },
  confirmBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textMd,
    color: "#fff",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CustomerRepairOrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // When navigated from BookingsScreen, booking data is pre-filled
  const fromBooking = route.params?.fromBooking ?? null;

  // Phase: "search" | "order"
  const [phase, setPhase] = useState(fromBooking ? "order" : "search");
  const [customer, setCustomer] = useState(fromBooking?.customer ?? null);
  const [vehicle, setVehicle] = useState(fromBooking?.vehicle ?? null);

  // Called when returning from CreateCustomerVehicleScreen with a new customer+vehicle
  const handleNewCustomerVehicle = useCallback(
    ({ customer: c, vehicle: v }) => {
      setCustomer(c);
      setVehicle(v);
      setPhase("order");
    },
    [],
  );

  // Form state — pre-fill customerRemarks from booking if present
  const bookingRemarks = fromBooking
    ? [fromBooking.serviceType, fromBooking.notes].filter(Boolean)
    : [];
  const [form, setForm] = useState({
    vehicleVariant: "",
    odometerReading: null,
    services: [],
    applyDiscountToAllServices: false,
    parts: [],
    applyDiscountToAllParts: false,
    images: [],
    tags: [],
    customerRemarks: bookingRemarks,
    // scheduledAt: when the vehicle is expected to arrive (advance booking date).
    // Pre-fill from booking or customer order's scheduledAt if provided.
    scheduledAt: fromBooking?.scheduledAt
      ? new Date(fromBooking.scheduledAt).toISOString()
      : null,
    estimatedDeliveryAt: fromBooking?.scheduledAt
      ? new Date(fromBooking.scheduledAt).toISOString()
      : new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    notifyCustomer: false,
  });

  const setFormField = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  // Pickers
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScheduledPicker, setShowScheduledPicker] = useState(false);

  // Saving
  const [saving, setSaving] = useState(false);

  // ── Handle vehicle found ──────────────────────────────────────────
  const handleFound = ({ vehicle: v, customer: c }) => {
    setVehicle(v);
    setCustomer(c);
    setPhase("order");
  };

  // ── Remove helpers ────────────────────────────────────────────────
  const removeService = (i) =>
    setFormField("services")(form.services.filter((_, idx) => idx !== i));
  const removePart = (i) =>
    setFormField("parts")(form.parts.filter((_, idx) => idx !== i));
  const removeRemark = (i) =>
    setFormField("customerRemarks")(
      form.customerRemarks.filter((_, idx) => idx !== i),
    );

  // ── Catalog select ────────────────────────────────────────────────
  const onSelectService = (item) => {
    setFormField("services")([
      ...form.services,
      {
        catalogId: item._id,
        name: item.name,
        price: item.mrp || 0,
        discount: 0,
        taxPercent: 0,
        lineTotal: item.mrp || 0,
      },
    ]);
  };

  const onSelectPart = (item) => {
    setFormField("parts")([
      ...form.parts,
      {
        inventoryId: item._id,
        partCode: item.no || null,
        name: item.name,
        quantity: 1,
        unitPrice: item.mrp || 0,
        discount: 0,
        taxPercent: item.taxPercent || 0,
        lineTotal: item.mrp || 0,
      },
    ]);
  };

  // ── Computed totals ───────────────────────────────────────────────
  const laborTotal = form.services.reduce(
    (sum, s) => sum + (s.lineTotal || 0),
    0,
  );
  const partsTotal = form.parts.reduce((sum, p) => sum + (p.lineTotal || 0), 0);
  const total = laborTotal + partsTotal;

  // ── Submit ────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!vehicle?._id || !customer?._id) return;
    setSaving(true);
    try {
      const roRes = await axiosClient.post(REPAIR_ORDER_ENDPOINTS.LIST, {
        customerId: customer._id,
        vehicleId: vehicle._id,
        vehicleVariant: form.vehicleVariant,
        odometerReading: form.odometerReading,
        services: form.services,
        applyDiscountToAllServices: form.applyDiscountToAllServices,
        parts: form.parts,
        applyDiscountToAllParts: form.applyDiscountToAllParts,
        images: form.images,
        laborTotal,
        partsTotal,
        totalAmount: total,
        tags: form.tags,
        customerRemarks: form.customerRemarks,
        scheduledAt: form.scheduledAt || null,
        estimatedDeliveryAt: form.estimatedDeliveryAt,
        notifyCustomer: form.notifyCustomer,
      });
      // If created from a booking, link the RO back silently
      if (fromBooking?._id) {
        try {
          await linkRepairOrder(fromBooking._id, roRes.data?.data?.order?._id);
        } catch {
          // non-blocking — RO is already created
        }
      }
      Alert.alert(
        "Success",
        fromBooking
          ? `Repair order created and linked to booking ${fromBooking.bookingNo || ""}.`
          : "Repair order created successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert(
        "Error",
        e.displayMessage || "Could not create repair order.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPhase("search");
    setCustomer(null);
    setVehicle(null);
    setForm({
      vehicleVariant: "",
      odometerReading: null,
      services: [],
      applyDiscountToAllServices: false,
      parts: [],
      applyDiscountToAllParts: false,
      // images: [],
      tags: [],
      customerRemarks: [],
      scheduledAt: null,
      estimatedDeliveryAt: new Date(
        Date.now() + 6 * 60 * 60 * 1000,
      ).toISOString(),
      notifyCustomer: false,
    });
  };

  // ── Scheduled / Advance Booking date display ──────────────────────
  const scheduledDisplay = form.scheduledAt
    ? new Date(form.scheduledAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isAdvanceBooking =
    form.scheduledAt && new Date(form.scheduledAt) > new Date();

  // ── Estimated delivery display ────────────────────────────────────
  const deliveryDisplay = form.estimatedDeliveryAt
    ? new Date(form.estimatedDeliveryAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopNav
        title={
          fromBooking
            ? `Booking ${fromBooking.bookingNo || ""}`
            : "Repair Order"
        }
        transparent={false}
        rightElement={
          phase === "order" && !fromBooking ? (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetText}>RESET</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      {fromBooking && (
        <View style={styles.bookingBanner}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.bookingBannerText}>
            Advance RO from booking {fromBooking.bookingNo || ""}
            {fromBooking.serviceType ? ` · ${fromBooking.serviceType}` : ""}
          </Text>
        </View>
      )}

      {phase === "search" ? (
        <SearchPhase
          onFound={handleFound}
          onNavigate={navigation.navigate}
          onNewCustomer={handleNewCustomerVehicle}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.orderScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer + Vehicle card */}
          <CustomerVehicleCard
            customer={customer}
            vehicle={vehicle}
            onChangeVehicle={handleReset}
            form={form}
            setFormField={setFormField}
          />

          {/* Package / AMC quick actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickChip}
              activeOpacity={0.8}
              onPress={() => Alert.alert("Packages", "Coming soon.")}
            >
              <Ionicons
                name="bookmark-outline"
                size={14}
                color={COLORS.white}
              />
              <Text style={styles.quickChipText}>Choose From Packages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickChip, styles.quickChipAlt]}
              activeOpacity={0.8}
              onPress={() => Alert.alert("AMC", "Coming soon.")}
            >
              <Ionicons name="attach-outline" size={14} color={COLORS.white} />
              <Text style={styles.quickChipText}>Attach AMC</Text>
            </TouchableOpacity>
          </View>

          {/* SERVICES section */}
          <SectionBlock
            label="SERVICES"
            onAdd={() => setShowServicePicker(true)}
          >
            {form.services.length === 0 ? (
              <View style={styles.emptyLines}>
                <Text style={styles.emptyLinesText}>No services added yet</Text>
              </View>
            ) : (
              form.services.map((s, i) => (
                <ServiceLineRow
                  key={i}
                  item={s}
                  index={i}
                  onRemove={removeService}
                  applyDiscount={form.applyDiscountToAllServices}
                />
              ))
            )}
            <View style={styles.discountToggleRow}>
              <AppToggle
                label="Apply discount to all"
                value={form.applyDiscountToAllServices}
                onChange={setFormField("applyDiscountToAllServices")}
              />
            </View>
          </SectionBlock>

          {/* PARTS section */}
          <SectionBlock label="PARTS" onAdd={() => setShowPartPicker(true)}>
            {form.parts.length === 0 ? (
              <View style={styles.emptyLines}>
                <Text style={styles.emptyLinesText}>No parts added yet</Text>
              </View>
            ) : (
              form.parts.map((p, i) => (
                <PartLineRow
                  key={i}
                  item={p}
                  index={i}
                  onRemove={removePart}
                  applyDiscount={form.applyDiscountToAllParts}
                />
              ))
            )}
            <View style={styles.discountToggleRow}>
              <AppToggle
                label="Apply discount to all"
                value={form.applyDiscountToAllParts}
                onChange={setFormField("applyDiscountToAllParts")}
              />
            </View>
          </SectionBlock>

          {/* IMAGES section */}
          {/* <SectionBlock
            label="IMAGES"
            onAdd={() => Alert.alert("Images", "Image upload coming soon.")}
          >
            {form.images.length === 0 && (
              <View style={styles.emptyLines}>
                <Text style={styles.emptyLinesText}>No images attached</Text>
              </View>
            )}
          </SectionBlock> */}

          {/* Totals block */}
          <View style={styles.totalsBlock}>
            <TotalRow
              label="Labor Total"
              value={laborTotal > 0 ? laborTotal : ""}
            />
            <View style={styles.totalsDivider} />
            <TotalRow
              label="Parts Total"
              value={partsTotal > 0 ? partsTotal : ""}
            />
            <View style={styles.totalsDivider} />
            <TotalRow label="TOTAL (Inclusive Taxes)" value={total} highlight />
            <View style={styles.totalsDivider} />
            <TotalRow label="Applicable discount" value={0} />
          </View>

          {/* TAGS section */}
          <SectionBlock label="TAGS" onAdd={() => setShowTagPicker(true)}>
            {form.tags.length === 0 ? (
              <View style={styles.emptyLines}>
                <Text style={styles.emptyLinesText}>No tags added</Text>
              </View>
            ) : (
              <View style={styles.tagChipRow}>
                {form.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFormField("tags")(form.tags.filter((t) => t !== tag))
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={13} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </SectionBlock>

          {/* CUSTOMER REMARKS section */}
          <SectionBlock
            label="CUSTOMER REMARKS"
            onAdd={() =>
              setFormField("customerRemarks")([...form.customerRemarks, ""])
            }
          >
            {form.customerRemarks.map((remark, i) => (
              <View key={i} style={styles.remarkRow}>
                <TextInput
                  style={styles.remarkInput}
                  value={remark}
                  placeholder="Customer Remark"
                  placeholderTextColor={COLORS.textMuted}
                  onChangeText={(t) => {
                    const updated = [...form.customerRemarks];
                    updated[i] = t;
                    setFormField("customerRemarks")(updated);
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeRemark(i)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </SectionBlock>

          {/* ── Scheduled Date (Advance Booking) ────────────────────── */}
          <View
            style={[
              styles.deliveryRow,
              isAdvanceBooking && styles.advScheduledSection,
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={[
                  styles.deliveryLabel,
                  isAdvanceBooking && { color: "#D97706" },
                ]}
              >
                Scheduled Date
              </Text>
              {isAdvanceBooking && (
                <View style={styles.advBannerPill}>
                  <Ionicons name="time-outline" size={10} color="#92400E" />
                  <Text style={styles.advBannerPillTxt}>Advance Booking</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowScheduledPicker(true)}
              activeOpacity={0.8}
              style={[
                styles.deliveryPickerBtn,
                isAdvanceBooking && styles.advPickerBtn,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isAdvanceBooking ? "#D97706" : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.deliveryValue,
                  isAdvanceBooking && { color: "#D97706" },
                ]}
              >
                {scheduledDisplay ?? "Not scheduled (walk-in)"}
              </Text>
              <Ionicons
                name="chevron-down-outline"
                size={13}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            {form.scheduledAt && (
              <TouchableOpacity
                onPress={() => setFormField("scheduledAt")(null)}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={COLORS.textMuted}
                />
                <Text style={styles.clearBtnTxt}>Clear (walk-in)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Estimated delivery + notify */}
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>Estimated delivery time</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
              style={styles.deliveryPickerBtn}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.deliveryValue}>{deliveryDisplay}</Text>
              <Ionicons
                name="chevron-down-outline"
                size={13}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.notifyRow}>
            <AppToggle
              label="Notify Customer (SMS & e-mail)?"
              icon="notifications-outline"
              value={form.notifyCustomer}
              onChange={setFormField("notifyCustomer")}
            />
          </View>

          {/* Continue button */}
          <AppButton
            title={saving ? "Saving…" : "Continue"}
            variant="gradient"
            size="lg"
            onPress={handleContinue}
            disabled={saving}
            style={styles.continueBtn}
          />
        </ScrollView>
      )}

      {/* Catalog pickers */}
      <CatalogPickerModal
        visible={showServicePicker}
        itemType="service"
        onClose={() => setShowServicePicker(false)}
        onSelect={onSelectService}
      />
      <CatalogPickerModal
        visible={showPartPicker}
        itemType="part"
        onClose={() => setShowPartPicker(false)}
        onSelect={onSelectPart}
      />
      <TagPickerModal
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        selectedTags={form.tags}
        onConfirm={(tags) => setFormField("tags")(tags)}
      />
      <DeliveryDatePickerModal
        visible={showDatePicker}
        current={form.estimatedDeliveryAt}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(iso) => {
          setFormField("estimatedDeliveryAt")(iso);
          setShowDatePicker(false);
        }}
      />
      {/* Reuse the same date-time picker for the scheduled (advance) date */}
      <DeliveryDatePickerModal
        visible={showScheduledPicker}
        current={form.scheduledAt ?? new Date().toISOString()}
        onClose={() => setShowScheduledPicker(false)}
        onConfirm={(iso) => {
          setFormField("scheduledAt")(iso);
          setShowScheduledPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  bookingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + "30",
  },
  bookingBannerText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
    flex: 1,
  },

  resetBtn: { paddingHorizontal: SIZES.sm },
  resetText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },

  // Search phase
  searchPhase: {
    flex: 1,
    padding: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    gap: SIZES.sm,
  },
  searchCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.lg,
    alignItems: "center",
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  searchTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  searchSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SIZES.sm,
  },
  orText: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },

  // Not-found state
  notFoundCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: `${COLORS.warning}40`,
    padding: SIZES.md,
  },
  notFoundTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.warning,
  },
  notFoundSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  notFoundReg: { fontFamily: FONTS.bold, color: COLORS.textPrimary },

  // Live search
  liveSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgSection,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    width: "100%",
  },
  liveSearchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    padding: 0,
  },
  resultsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  resultSep: { height: 1, backgroundColor: COLORS.borderLight },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  resultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textBase,
    color: COLORS.primary,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  resultPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  resultVehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  resultVehicle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  resultNoVehicle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 3,
    fontStyle: "italic",
  },

  // Order scroll
  orderScroll: { paddingBottom: 60 },

  // Customer + Vehicle card
  cvCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    margin: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cvLeft: { flex: 1, padding: SIZES.md, justifyContent: "center" },
  cvDivider: { width: 1, backgroundColor: COLORS.borderLight },
  cvRight: { flex: 1.4, padding: SIZES.md },
  cvName: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  cvPhone: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cvVehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  cvVehicle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    flex: 1,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 1,
  },
  inlineValue: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  inlinePlaceholder: { color: COLORS.textMuted },
  inlineInput: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2,
    minWidth: 60,
  },
  odometerLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  // Quick action chips
  quickRow: {
    flexDirection: "row",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
  },
  quickChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: COLORS.textPrimary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.sm + 2,
  },
  quickChipAlt: { backgroundColor: COLORS.textPrimary },
  quickChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },

  // Section block
  sectionBlock: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
  },
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 4,
  },
  addChipText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
    color: COLORS.white,
  },

  // Line rows
  emptyLines: { padding: SIZES.md, alignItems: "center" },
  emptyLinesText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lineName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  lineSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  lineDisc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.warning,
  },
  linePrice: {
    width: 60,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  lineRemove: { width: 28, alignItems: "center" },
  discountToggleRow: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  // Totals
  totalsBlock: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
  },
  totalRowHL: { backgroundColor: COLORS.bgSection },
  totalLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textSecondary,
  },
  totalLabelHL: { fontFamily: FONTS.semibold, color: COLORS.textPrimary },
  totalValueBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    minWidth: 100,
    justifyContent: "flex-end",
  },
  totalValueBoxHL: { backgroundColor: COLORS.bgInput },
  totalRupee: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    marginRight: 2,
  },
  totalValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  totalValueHL: { color: COLORS.primary },
  totalsDivider: { height: 1, backgroundColor: COLORS.borderLight },

  // Remarks
  remarkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  remarkInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },

  // Delivery + notify
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.sm,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  deliveryLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
  },
  deliveryValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  deliveryPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primaryLight || "#EFF6FF",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },

  // ── Advance booking styles ─────────────────────────────────────────
  advScheduledSection: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
    marginHorizontal: 0,
    backgroundColor: "#FFFBEB",
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
    borderBottomWidth: 1,
    borderBottomColor: "#FCD34D",
    marginBottom: SIZES.sm,
    gap: 6,
  },
  advBannerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  advBannerPillTxt: {
    fontFamily: FONTS.semibold,
    fontSize: 9,
    color: "#92400E",
  },
  advPickerBtn: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  clearBtnTxt: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },

  notifyRow: { paddingHorizontal: SIZES.screenPadding, marginBottom: SIZES.md },

  // Continue
  continueBtn: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.xl,
  },

  // Catalog picker modal
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  pickerTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
  },
  pickerClose: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgSection,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerSearch: {
    paddingHorizontal: SIZES.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SIZES.sm,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pickerItemName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  pickerItemSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  pickerItemPrice: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
    marginRight: 4,
  },
  pickerEmpty: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: SIZES.textBase,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  // Tag chips (selected tags display)
  tagChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.xs,
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
  },
  tagChipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.primary,
  },
  // Tag picker modal chips
  tagPickerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: 7,
  },
  tagPickerDot: { width: 8, height: 8, borderRadius: 4 },
  tagPickerLabel: { fontFamily: FONTS.semibold, fontSize: SIZES.textSm },
});
