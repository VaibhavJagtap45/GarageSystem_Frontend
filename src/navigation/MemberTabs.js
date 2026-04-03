// Member portal: tab navigator + stack navigators
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CTabBar from "../components/portal/CTabBar";
import MemberHome        from "../screens/member/MemberHome";
import MemberWork        from "../screens/member/MemberWork";
import MemberOrderDetail from "../screens/member/MemberOrderDetail";
import MemberInventory   from "../screens/member/MemberInventory";
import MemberHistory     from "../screens/member/MemberHistory";
import MemberProfile     from "../screens/member/MemberProfile";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Work stack: Work list → Order detail (with parts management)
function MWorkStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MWorkList"    component={MemberWork} />
      <Stack.Screen name="MOrderDetail" component={MemberOrderDetail} />
    </Stack.Navigator>
  );
}

// ── History stack: History list → Order detail
function MHistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MHistoryList" component={MemberHistory} />
      <Stack.Screen name="MOrderDetail" component={MemberOrderDetail} />
    </Stack.Navigator>
  );
}

const TABS = [
  { label: "Home",      icon: "home-outline",           iconFilled: "home"           },
  { label: "Work",      icon: "hammer-outline",         iconFilled: "hammer"         },
  { label: "Inventory", icon: "cube-outline",           iconFilled: "cube"           },
  { label: "History",   icon: "checkmark-done-outline", iconFilled: "checkmark-done" },
  { label: "Profile",   icon: "person-outline",         iconFilled: "person"         },
];

export default function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <CTabBar {...p} tabs={TABS} />}
    >
      <Tab.Screen name="Home"      component={MemberHome} />
      <Tab.Screen name="Work"      component={MWorkStack} />
      <Tab.Screen name="Inventory" component={MemberInventory} />
      <Tab.Screen name="History"   component={MHistoryStack} />
      <Tab.Screen name="Profile"   component={MemberProfile} />
    </Tab.Navigator>
  );
}
