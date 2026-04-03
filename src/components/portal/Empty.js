import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

export default function Empty({ icon, title, sub }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 }}>
      <Ionicons name={icon} size={52} color={COLORS.textMuted} />
      <Text style={{ fontFamily: FONTS.semibold, fontSize: SIZES.textBase, color: COLORS.textSecondary, textAlign: "center" }}>
        {title}
      </Text>
      {sub ? (
        <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: "center" }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
