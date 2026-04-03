import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import TopNav from "../../components/ui/TopNav";
import AppButton from "../../components/ui/AppButton";
import EmptyState from "../../components/ui/EmptyState";

export default function InventoryAlertsScreen() {
  const [alerts] = useState([]); // replace with real data
  const [selectedAll, setSelectedAll] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleSelectAll = () => {
    if (selectedAll) {
      setSelected([]);
      setSelectedAll(false);
    } else {
      setSelected(alerts.map((a) => a.id));
      setSelectedAll(true);
    }
  };

  const toggleItem = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const rightElement = (
    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
      <Ionicons name="filter" size={20} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <TopNav
        title="Inventory Alerts"
        transparent={false}
        rightElement={rightElement}
      />

      <View style={styles.content}>
        {/* Purchase Order Button */}
        <AppButton
          title="Purchase Order"
          onPress={() => {}}
          variant="gradient"
          size="sm"
          leftIcon="add"
          fullWidth={false}
          style={styles.purchaseBtn}
        />

        {/* Select All Row */}
        <TouchableOpacity
          style={styles.selectAllRow}
          onPress={handleSelectAll}
          activeOpacity={0.8}
        >
          <View
            style={[styles.checkbox, selectedAll && styles.checkboxChecked]}
          >
            {selectedAll && (
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>

        {/* Column Headers */}
        <View style={styles.columnHeader}>
          <Text style={[styles.colHeader, { flex: 2 }]}>(P No.) Name</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: "center" }]}>
            Stock
          </Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: "center" }]}>
            Min Qty
          </Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: "center" }]}>
            Max Qty
          </Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: "right" }]}>
            Order Qty
          </Text>
        </View>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="No inventory alerts"
            subtitle="All stock levels are within range"
          />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <AlertRow
                item={item}
                isSelected={selected.includes(item.id)}
                onToggle={() => toggleItem(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function AlertRow({ item, isSelected, onToggle }) {
  return (
    <TouchableOpacity
      style={styles.alertRow}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
        {isSelected && (
          <Ionicons name="checkmark" size={14} color={COLORS.white} />
        )}
      </View>
      <Text style={[styles.cellText, { flex: 2 }]}>
        ({item.partNo}) {item.name}
      </Text>
      <Text style={[styles.cellText, { flex: 1, textAlign: "center" }]}>
        {item.stock}
      </Text>
      <Text style={[styles.cellText, { flex: 1, textAlign: "center" }]}>
        {item.minQty}
      </Text>
      <Text style={[styles.cellText, { flex: 1, textAlign: "center" }]}>
        {item.maxQty}
      </Text>
      <Text style={[styles.cellText, { flex: 1, textAlign: "right" }]}>
        {item.orderQty}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },
  purchaseBtn: {
    marginBottom: SIZES.md,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  selectAllText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textBase,
    color: COLORS.textPrimary,
  },
  columnHeader: {
    flexDirection: "row",
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SIZES.xs,
  },
  colHeader: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  cellText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
  },
  iconBtn: {
    padding: 4,
  },
});
