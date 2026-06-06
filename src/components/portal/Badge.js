import { View, Text, StyleSheet } from "react-native";
import { FONTS } from "../../utils/constants";
import { STATUS_COLOR, STATUS_LABEL } from "../../utils/portalHelpers";

export default function Badge({ status }) {
  const c = STATUS_COLOR[status] || "#94a3b8";
  return (
    <View style={[s.wrap, { backgroundColor: c + "22", borderColor: c }]}>
      <View style={[s.dot, { backgroundColor: c }]} />
      <Text style={[s.txt, { color: c }]}>
        {STATUS_LABEL[status] || status}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  txt: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 0.2 },
});
