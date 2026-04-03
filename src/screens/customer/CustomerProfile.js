import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Toast from "react-native-toast-message";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  customerGetProfile, customerUpdateProfile,
  customerGetVehicles, customerAddVehicle,
} from "../../api/portal";
import M from "../../components/portal/modalStyles";
import useLogout from "../../hooks/useLogout";

// ─── Editable field row ───────────────────────────────────────────────────────
function FieldRow({ icon, label, value, editable, onChange, multiline, last }) {
  return (
    <View style={[fr.row, !last && fr.border]}>
      <View style={fr.iconWrap}>
        <Ionicons name={icon} size={15} color="#3b82f6" />
      </View>
      <View style={fr.body}>
        <Text style={fr.label}>{label}</Text>
        {editable ? (
          <TextInput
            style={[fr.input, multiline && { height: 60, textAlignVertical: "top" }]}
            value={value}
            onChangeText={onChange}
            multiline={multiline}
            placeholderTextColor={COLORS.textMuted}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <Text style={fr.value}>{value || "—"}</Text>
        )}
      </View>
    </View>
  );
}

const fr = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "flex-start", padding: SIZES.md, gap: SIZES.sm },
  border:  { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  iconWrap:{
    width: 32, height: 32, borderRadius: SIZES.radiusSm,
    backgroundColor: "#dbeafe",
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  body:    { flex: 1 },
  label:   { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 2 },
  value:   { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  input:   {
    fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary,
    borderBottomWidth: 1.5, borderBottomColor: "#3b82f6",
    paddingBottom: 4, paddingTop: 0,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const doLogout  = useLogout();
  const tabBarH   = useBottomTabBarHeight();

  const [user,     setUser]     = useState(null);
  const [editing,  setEdit]     = useState(false);
  const [form,     setForm]     = useState({ fullName: "", address: "", state: "" });
  const [saving,   setSaving]   = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vModal,   setVModal]   = useState(false);
  const [vf,       setVf]       = useState({ vehicleBrand: "", vehicleModel: "", vehicleRegisterNo: "", vehicleVariant: "" });
  const [addingV,  setAddingV]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, v] = await Promise.all([customerGetProfile(), customerGetVehicles()]);
      const usr = u.data?.data?.user;
      setUser(usr || {});
      setVehicles(v.data?.data?.vehicles || []);
      setForm({ fullName: usr?.fullName || "", address: usr?.address || "", state: usr?.state || "" });
    } catch {
      setUser({});
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    setSaving(true);
    try {
      await customerUpdateProfile(form);
      await load();
      setEdit(false);
      Toast.show({ type: "success", text1: "Profile updated!" });
    } catch (e) {
      Toast.show({ type: "error", text1: e?.displayMessage || "Failed." });
    } finally {
      setSaving(false);
    }
  };

  const addVehicle = async () => {
    if (!vf.vehicleBrand || !vf.vehicleModel || !vf.vehicleRegisterNo) {
      Toast.show({ type: "error", text1: "Brand, Model and Reg No are required." });
      return;
    }
    setAddingV(true);
    try {
      await customerAddVehicle(vf);
      await load();
      setVModal(false);
      setVf({ vehicleBrand: "", vehicleModel: "", vehicleRegisterNo: "", vehicleVariant: "" });
      Toast.show({ type: "success", text1: "Vehicle added!" });
    } catch (e) {
      Toast.show({ type: "error", text1: e?.displayMessage || "Failed." });
    } finally {
      setAddingV(false);
    }
  };

  if (user === null) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const initials = (user.fullName || user.phoneNo || "C")
    .split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarH + 24 }}
      >
        {/* ── Gradient hero ── */}
        <LinearGradient
          colors={["#1d4ed8", "#3b82f6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Top bar */}
          <View style={s.heroBar}>
            <Text style={s.heroTitle}>My Profile</Text>
            <TouchableOpacity
              style={s.editIconBtn}
              onPress={() => setEdit(!editing)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={editing ? "close" : "create-outline"}
                size={18}
                color="#3b82f6"
              />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </View>
            <View style={s.rolePill}>
              <Ionicons name="person-outline" size={11} color="#3b82f6" />
              <Text style={s.roleTxt}>Customer</Text>
            </View>
          </View>

          <Text style={s.heroName}>{user.fullName || user.phoneNo || "—"}</Text>
          {user.phoneNo ? (
            <Text style={s.heroPhone}>{user.phoneNo}</Text>
          ) : null}
        </LinearGradient>

        {/* ── Profile fields ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Info</Text>
          <View style={s.card}>
            <FieldRow
              icon="person-outline" label="Full Name"
              value={form.fullName} editable={editing}
              onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
            />
            <FieldRow icon="call-outline"  label="Phone Number" value={user.phoneNo}        editable={false} />
            <FieldRow icon="mail-outline"  label="Email"        value={user.emailId || "—"} editable={false} />
            <FieldRow
              icon="location-outline" label="Address"
              value={form.address} editable={editing}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
              multiline
            />
            <FieldRow
              icon="map-outline" label="State"
              value={form.state} editable={editing}
              onChange={(v) => setForm((p) => ({ ...p, state: v }))}
              last
            />
          </View>
        </View>

        {/* ── Save button ── */}
        {editing && (
          <View style={s.section}>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={save}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : (
                  <>
                    <Ionicons name="checkmark-outline" size={18} color={COLORS.white} />
                    <Text style={s.saveTxt}>Save Changes</Text>
                  </>
                )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── My Vehicles ── */}
        <View style={[s.section, { marginTop: editing ? SIZES.sm : SIZES.lg }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>My Vehicles</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setVModal(true)}>
              <Ionicons name="add" size={14} color={COLORS.white} />
              <Text style={s.addTxt}>Add</Text>
            </TouchableOpacity>
          </View>
          {vehicles.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="car-outline" size={28} color={COLORS.textMuted} />
              <Text style={s.emptyTxt}>No vehicles yet. Add one to book services.</Text>
            </View>
          ) : (
            vehicles.map((v) => (
              <View key={v._id} style={s.vcard}>
                <View style={s.vIconWrap}>
                  <Ionicons name="car-sport-outline" size={18} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.vname}>{v.vehicleBrand} {v.vehicleModel}</Text>
                  <Text style={s.vreg}>{v.vehicleRegisterNo}</Text>
                  {v.vehicleVariant ? <Text style={s.vvariant}>{v.vehicleVariant}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </View>
            ))
          )}
        </View>

        {/* ── Logout ── */}
        <View style={[s.section, { marginTop: SIZES.sm }]}>
          <TouchableOpacity style={s.logoutBtn} onPress={doLogout} activeOpacity={0.8}>
            <View style={s.logoutIcon}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={s.logoutTxt}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.error} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Add Vehicle Modal ── */}
      <Modal visible={vModal} animationType="slide" transparent onRequestClose={() => setVModal(false)}>
        <View style={M.overlay}>
          <View style={M.box}>
            <Text style={M.title}>Add Vehicle</Text>
            {[
              { k: "vehicleBrand",      lbl: "Brand *",  ph: "e.g. Honda",      caps: "words"      },
              { k: "vehicleModel",      lbl: "Model *",  ph: "e.g. Activa",     caps: "words"      },
              { k: "vehicleRegisterNo", lbl: "Reg No *", ph: "e.g. MH12AB1234", caps: "characters" },
              { k: "vehicleVariant",    lbl: "Variant",  ph: "optional",        caps: "words"      },
            ].map((f) => (
              <View key={f.k} style={{ marginBottom: SIZES.sm }}>
                <Text style={M.label}>{f.lbl}</Text>
                <TextInput
                  style={M.fieldInput}
                  placeholder={f.ph}
                  placeholderTextColor={COLORS.textMuted}
                  value={vf[f.k]}
                  onChangeText={(v) => setVf((p) => ({ ...p, [f.k]: v }))}
                  autoCapitalize={f.caps}
                />
              </View>
            ))}
            <View style={M.btns}>
              <TouchableOpacity style={M.cancelBtn} onPress={() => setVModal(false)}>
                <Text style={M.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={M.confirmBtn} onPress={addVehicle} disabled={addingV}>
                {addingV
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={M.confirmTxt}>Add Vehicle</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Hero
  hero: {
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xxl,
    paddingHorizontal: SIZES.screenPadding,
    alignItems: "center",
    gap: SIZES.sm,
  },
  heroBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    width: "100%", marginBottom: SIZES.sm,
  },
  heroTitle:   { fontFamily: FONTS.extrabold, fontSize: SIZES.textXl, color: COLORS.white },
  editIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    ...SHADOWS.sm,
  },
  avatarWrap: { alignItems: "center", gap: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  avatarTxt: { fontFamily: FONTS.extrabold, fontSize: 32, color: COLORS.white },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleTxt:   { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: "#3b82f6" },
  heroName:  { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.white, marginTop: 4 },
  heroPhone: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: "rgba(255,255,255,0.85)" },

  // Sections
  section:      { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  sectionRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.sm },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.borderLight,
    overflow: "hidden", ...SHADOWS.sm,
  },

  // Save
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#3b82f6", borderRadius: SIZES.radiusFull,
    paddingVertical: 14, gap: 8, ...SHADOWS.sm,
  },
  saveTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },

  // Add vehicle
  addBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#3b82f6", borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
  },
  addTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.white },

  // Empty vehicles
  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyTxt: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center" },

  // Vehicle cards
  vcard: {
    flexDirection: "row", alignItems: "center", gap: SIZES.sm,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.sm,
    borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  vIconWrap: {
    width: 40, height: 40, borderRadius: SIZES.radiusSm,
    backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center",
  },
  vname:    { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  vreg:     { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2 },
  vvariant: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: SIZES.sm,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.error + "30",
    padding: SIZES.md, ...SHADOWS.sm,
  },
  logoutIcon: {
    width: 36, height: 36, borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.errorLight, alignItems: "center", justifyContent: "center",
  },
  logoutTxt: { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.error, flex: 1 },
});
