// Customer portal: tab navigator + stack navigators
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CTabBar from "../components/portal/CTabBar";
import CustomerHome          from "../screens/customer/CustomerHome";
import CustomerServices      from "../screens/customer/CustomerServices";
import CustomerOrders        from "../screens/customer/CustomerOrders";
import CustomerOrderDetail   from "../screens/customer/CustomerOrderDetail";
import CustomerInvoices      from "../screens/customer/CustomerInvoices";
import CustomerInvoiceDetail from "../screens/customer/CustomerInvoiceDetail";
import CustomerProfile           from "../screens/customer/CustomerProfile";
import CustomerBookingsScreen    from "../screens/customer/CustomerBookingsScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Home stack: Home → Bookings
function CHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CHomeMain"     component={CustomerHome} />
      <Stack.Screen name="CBookings"     component={CustomerBookingsScreen} />
    </Stack.Navigator>
  );
}

// ── Orders stack: Orders list → Order detail → Invoice detail
function COrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="COrdersList"    component={CustomerOrders} />
      <Stack.Screen name="COrderDetail"   component={CustomerOrderDetail} />
      <Stack.Screen name="CInvoiceDetail" component={CustomerInvoiceDetail} />
    </Stack.Navigator>
  );
}

// ── Invoices stack: Invoice list → Invoice detail
function CInvoicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CInvoicesList"  component={CustomerInvoices} />
      <Stack.Screen name="CInvoiceDetail" component={CustomerInvoiceDetail} />
    </Stack.Navigator>
  );
}

const TABS = [
  { label: "Home",     icon: "home-outline",     iconFilled: "home"      },
  { label: "Services", icon: "construct-outline", iconFilled: "construct" },
  { label: "Orders",   icon: "car-outline",       iconFilled: "car"       },
  { label: "Invoices", icon: "receipt-outline",   iconFilled: "receipt"   },
  { label: "Profile",  icon: "person-outline",    iconFilled: "person"    },
];

export default function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <CTabBar {...p} tabs={TABS} />}
    >
      <Tab.Screen name="Home"     component={CHomeStack} />
      <Tab.Screen name="Services" component={CustomerServices} />
      <Tab.Screen name="Orders"   component={COrdersStack} />
      <Tab.Screen name="Invoices" component={CInvoicesStack} />
      <Tab.Screen name="Profile"  component={CustomerProfile} />
    </Tab.Navigator>
  );
}
