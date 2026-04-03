// Shared bottom-sheet modal styles used across customer & member portal screens
import { StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const M = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  box:        { backgroundColor: COLORS.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SIZES.xl, maxHeight: "88%" },
  title:      { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary, marginBottom: SIZES.lg },
  label:      { fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginBottom: 6, marginTop: SIZES.sm },
  picker:     { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SIZES.sm },
  pickerVal:  { flex: 1, fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  pickerPH:   { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted },
  noteInput:  { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary, height: 80, textAlignVertical: "top", marginBottom: SIZES.lg },
  fieldInput: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusSm, padding: SIZES.sm, borderWidth: 1, borderColor: COLORS.borderLight, fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  btns:       { flexDirection: "row", gap: SIZES.sm, marginTop: SIZES.sm },
  cancelBtn:  { flex: 1, padding: 12, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: "center" },
  cancelTxt:  { fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary },
  confirmBtn: { flex: 2, padding: 12, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary, alignItems: "center" },
  confirmTxt: { fontFamily: FONTS.bold, fontSize: SIZES.textBase, color: COLORS.white },
  vitem:      { flexDirection: "row", alignItems: "center", padding: SIZES.md, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SIZES.sm },
  vitemOn:    { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
});

export default M;
