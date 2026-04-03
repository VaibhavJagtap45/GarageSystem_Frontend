import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { clearStorage } from "../utils/storage";

export default function useLogout() {
  const dispatch = useDispatch();
  return () =>
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearStorage();
          dispatch(logout());
        },
      },
    ]);
}
