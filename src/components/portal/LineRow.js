import { View, Text } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function LineRow({ name, amt }) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
    }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1 }}>
        {name}
      </Text>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textSm, color: COLORS.textPrimary }}>
        {amt}
      </Text>
    </View>
  );
}
