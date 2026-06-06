import { View, Text } from "react-native";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function LineRow({ name, amt }) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
      gap: SIZES.sm,
    }}>
      <Text style={{ fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, flex: 1, lineHeight: 18 }}>
        {name}
      </Text>
      <Text style={{ fontFamily: FONTS.bold, fontSize: SIZES.textSm, color: COLORS.textPrimary }}>
        {amt}
      </Text>
    </View>
  );
}
