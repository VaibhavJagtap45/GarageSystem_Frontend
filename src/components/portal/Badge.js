import { View, Text, StyleSheet } from "react-native";
import { FONTS } from "../../utils/constants";
import { STATUS_COLOR, STATUS_LABEL } from "../../utils/portalHelpers";

export default function Badge({ status }) {
  const c = STATUS_COLOR[status] || "#94a3b8";
  return (
    <View style={[s.wrap, { backgroundColor: c + "22", borderColor: c }]}>
      <Text style={[s.txt, { color: c }]}>
        {STATUS_LABEL[status] || status}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  txt: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 0.3 },
});
