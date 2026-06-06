import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SIZES, SHADOWS } from "../utils/constants";

import ServiceScreen from "../screens/services/ServiceScreen";
import CalendarScreen from "../screens/services/CalendarScreen";
import CounterSaleScreen from "../screens/services/CounterSaleScreen";
import InvoiceDetailScreen from "../screens/services/InvoiceDetailScreen";
import InvoiceListScreen from "../screens/services/InvoiceListScreen";
import CustomerRepairOrderScreen from "../screens/services/CustomerRepairOrderScreen";
import CreateCustomerVehicleScreen from "../screens/services/CreateCustomerVehicleScreen";
import OrdersScreen from "../screens/services/OrdersScreen";
import PaymentDueScreen from "../screens/services/PaymentDueScreen";
import PartsScreen from "../screens/parts/PartsScreen";
import InventoryAlertsScreen from "../screens/parts/InventoryAlertsScreen";
import PurchaseOrderScreen from "../screens/parts/PurchaseOrderScreen";
import StockInScreen from "../screens/parts/StockInScreen";
import AccountsScreen from "../screens/accounts/AccountsScreen";
import MoreScreen from "../screens/more/MoreScreen";
import MyCustomersScreen from "../screens/more/MyCustomersScreen";
import AddCustomerScreen from "../screens/more/AddCustomerScreen";
import MyVendorsScreen from "../screens/more/MyVendorsScreen";
import VendorDetailScreen from "../screens/more/VendorDetailScreen";
import SettingsScreen from "../screens/more/SettingsScreen";
import OrderSearchScreen from "../screens/more/OrderSearchScreen";
import ServiceFeedbackScreen from "../screens/more/ServiceFeedbackScreen";
import InsuranceDueScreen from "../screens/more/InsuranceDueScreen";
import ServiceRemindersScreen from "../screens/more/ServiceRemindersScreen";
import ReportsScreen from "../screens/more/ReportsScreen";
import MyGarageProfileScreen from "../screens/more/MyGarageProfileScreen";
import EditGarageScreen from "../screens/more/EditGarageScreen";
import GarageUsersScreen from "../screens/more/GarageUsersScreen";
import AddGarageUserScreen from "../screens/more/AddGarageUserScreen";
import ServicePartsScreen from "../screens/more/ServicePartsScreen";
import GaragePackagesScreen from "../screens/more/GaragePackagesScreen";
import TagsManagementScreen from "../screens/more/TagsManagementScreen";
import JobCardChecklistScreen from "../screens/more/JobCardChecklistScreen";
import CustomerProfileScreen from "../screens/more/CustomerProfileScreen";
import VehicleSearchScreen from "../screens/more/VehicleSearchScreen";
import CancelledOrdersScreen from "../screens/more/CancelledOrdersScreen";
import TallyExportScreen from "../screens/more/TallyExportScreen";
import IncomeExpenseReportScreen from "../screens/more/IncomeExpenseReportScreen";
import PaymentReportScreen from "../screens/more/PaymentReportScreen";
import DailyReportScreen from "../screens/more/DailyReportScreen";
import MonthlyReportScreen from "../screens/more/MonthlyReportScreen";
import BookingsScreen from "../screens/more/BookingsScreen";
import AccountsPayableScreen from "../screens/more/AccountsPayableScreen";
import StockInReportScreen from "../screens/more/StockInReportScreen";
import StockOutReportScreen from "../screens/more/StockOutReportScreen";
import PartsSalesReportScreen from "../screens/more/PartsSalesReportScreen";
import InventoryAgeingScreen from "../screens/more/InventoryAgeingScreen";
import GstReportScreen from "../screens/more/GstReportScreen";
import GeneralPreferencesScreen from "../screens/more/GeneralPreferencesScreen";
import ChangePasswordScreen from "../screens/auth/OtpScreen";
import InventoryTransfersScreen from "../screens/more/InventoryTransfersScreen";

const Tab = createBottomTabNavigator();
const ServiceStack = createNativeStackNavigator();
const PartsStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

function ServiceNav() {
  return (
    <ServiceStack.Navigator screenOptions={{ headerShown: false }}>
      <ServiceStack.Screen name="ServiceHome" component={ServiceScreen} />
      <ServiceStack.Screen name="CounterSale" component={CounterSaleScreen} />
      <ServiceStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
      />
      <ServiceStack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <ServiceStack.Screen
        name="CustomerRepairOrder"
        component={CustomerRepairOrderScreen}
      />
      <ServiceStack.Screen
        name="CreateCustomerVehicle"
        component={CreateCustomerVehicleScreen}
      />
      <ServiceStack.Screen name="Orders" component={OrdersScreen} />
      <ServiceStack.Screen name="PaymentDue" component={PaymentDueScreen} />
      <ServiceStack.Screen name="Calendar" component={CalendarScreen} />
    </ServiceStack.Navigator>
  );
}

function PartsNav() {
  return (
    <PartsStack.Navigator screenOptions={{ headerShown: false }}>
      <PartsStack.Screen name="PartsHome" component={PartsScreen} />
      <PartsStack.Screen
        name="InventoryAlerts"
        component={InventoryAlertsScreen}
      />
      <PartsStack.Screen name="PurchaseOrder" component={PurchaseOrderScreen} />
      <PartsStack.Screen name="StockIn" component={StockInScreen} />
      <PartsStack.Screen
        name="PartsCounterSale"
        component={CounterSaleScreen}
      />
      <PartsStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <PartsStack.Screen name="InvoiceList" component={InvoiceListScreen} />
    </PartsStack.Navigator>
  );
}

function MoreNav() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="MyCustomers" component={MyCustomersScreen} />
      <MoreStack.Screen name="AddCustomer" component={AddCustomerScreen} />
      <MoreStack.Screen name="MyVendors" component={MyVendorsScreen} />
      <MoreStack.Screen name="VendorDetail" component={VendorDetailScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="OrderSearch" component={OrderSearchScreen} />
      <MoreStack.Screen
        name="ServiceFeedbacks"
        component={ServiceFeedbackScreen}
      />
      <MoreStack.Screen name="InsuranceDue" component={InsuranceDueScreen} />
      <MoreStack.Screen
        name="ServiceReminders"
        component={ServiceRemindersScreen}
      />
      <MoreStack.Screen name="Reports" component={ReportsScreen} />
      <MoreStack.Screen
        name="MyGarageProfile"
        component={MyGarageProfileScreen}
      />
      <MoreStack.Screen name="EditGarage" component={EditGarageScreen} />
      <MoreStack.Screen name="GarageUsers" component={GarageUsersScreen} />
      <MoreStack.Screen name="AddGarageUser" component={AddGarageUserScreen} />
      <MoreStack.Screen name="ServiceParts" component={ServicePartsScreen} />
      <MoreStack.Screen
        name="GaragePackages"
        component={GaragePackagesScreen}
      />
      <MoreStack.Screen
        name="TagsManagement"
        component={TagsManagementScreen}
      />
      <MoreStack.Screen
        name="JobCardChecklist"
        component={JobCardChecklistScreen}
      />
      <MoreStack.Screen
        name="CustomerProfile"
        component={CustomerProfileScreen}
      />
      <MoreStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <MoreStack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <MoreStack.Screen name="VehicleSearch" component={VehicleSearchScreen} />
      <MoreStack.Screen
        name="CustomerRepairOrder"
        component={CustomerRepairOrderScreen}
      />
      <MoreStack.Screen
        name="CreateCustomerVehicle"
        component={CreateCustomerVehicleScreen}
      />
      <MoreStack.Screen
        name="CancelledOrders"
        component={CancelledOrdersScreen}
      />
      <MoreStack.Screen name="TallyExport" component={TallyExportScreen} />
      <MoreStack.Screen
        name="IncomeExpenseReport"
        component={IncomeExpenseReportScreen}
      />
      <MoreStack.Screen name="PaymentReport" component={PaymentReportScreen} />
      <MoreStack.Screen name="DailyReport" component={DailyReportScreen} />
      <MoreStack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <MoreStack.Screen name="Bookings" component={BookingsScreen} />
      <MoreStack.Screen
        name="AccountsPayable"
        component={AccountsPayableScreen}
      />
      <MoreStack.Screen name="StockInReport" component={StockInReportScreen} />
      <MoreStack.Screen
        name="StockOutReport"
        component={StockOutReportScreen}
      />
      <MoreStack.Screen
        name="PartsSalesReport"
        component={PartsSalesReportScreen}
      />
      <MoreStack.Screen
        name="InventoryAgeing"
        component={InventoryAgeingScreen}
      />
      <MoreStack.Screen name="GstReport" component={GstReportScreen} />
      <MoreStack.Screen
        name="GeneralPreferences"
        component={GeneralPreferencesScreen}
      />
      <MoreStack.Screen
        name="InventoryTransfers"
        component={InventoryTransfersScreen}
      />
      <MoreStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </MoreStack.Navigator>
  );
}

const TAB_CONFIG = [
  {
    name: "Service",
    label: "Service",
    icon: "construct",
    iconOut: "construct-outline",
  },
  { name: "Parts", label: "Parts", icon: "layers", iconOut: "layers-outline" },
  {
    name: "Accounts",
    label: "Accounts",
    icon: "calculator",
    iconOut: "calculator-outline",
  },
  { name: "More", label: "More", icon: "grid", iconOut: "grid-outline" },
];

const SCREENS = {
  Service: ServiceNav,
  Parts: PartsNav,
  Accounts: AccountsScreen,
  More: MoreNav,
};

function TabItem({ route, index, state, navigation, tabConfig }) {
  const focused = state.index === index;
  const scale = useRef(new Animated.Value(1)).current;
  const { icon, iconOut, label } = tabConfig;

  const onPress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.15,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
    ]).start();
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <TouchableOpacity
      key={route.key}
      onPress={onPress}
      activeOpacity={1}
      style={styles.tabItem}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        {focused && <View style={styles.activePill} />}
        <Ionicons
          name={focused ? icon : iconOut}
          size={22}
          color={focused ? COLORS.primary : COLORS.textMuted}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.outerWrap,
        {
          paddingBottom: Math.max(
            insets.bottom,
            Platform.OS === "android" ? 12 : 8,
          ),
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => (
          <TabItem
            key={route.key}
            route={route}
            index={index}
            state={state}
            navigation={navigation}
            tabConfig={TAB_CONFIG[index]}
          />
        ))}
      </View>
    </View>
  );
}

export default function GarageTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map(({ name }) => (
        <Tab.Screen key={name} name={name} component={SCREENS[name]} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "space-around",
    ...SHADOWS.md,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activePill: {
    position: "absolute",
    width: 36,
    height: 28,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  tabLabelActive: { fontFamily: FONTS.semibold, color: COLORS.primary },
  activeDot: {
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
