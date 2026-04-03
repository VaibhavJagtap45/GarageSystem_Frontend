import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function PField({ label, value, editable, onChange, multiline, last }) {
  return (
    <View style={[s.row, !last && s.sep]}>
      <Text style={s.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={[s.input, multiline && s.multi]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
          placeholderTextColor={COLORS.textMuted}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={s.val}>{value || "—"}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row:   { paddingVertical: SIZES.md },
  sep:   { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { fontFamily: FONTS.semibold, fontSize: SIZES.textXs, color: COLORS.textMuted, marginBottom: 4 },
  val:   { fontFamily: FONTS.medium, fontSize: SIZES.textBase, color: COLORS.textPrimary },
  input: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2,
  },
  multi: { height: 64, textAlignVertical: "top" },
});
