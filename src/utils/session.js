import Toast from "react-native-toast-message";
import store from "../store";
import { logout } from "../store/slices/authSlice";
import { clearStorage, getToken } from "./storage";

let sessionEndInFlight = false;

export const endSession = async ({
  message = "Session expired. Please login again.",
  showToast = true,
  toastType = "info",
} = {}) => {
  const hasToken = !!(await getToken());
  const isAuthenticated = store.getState().auth.isAuthenticated;

  if ((!hasToken && !isAuthenticated) || sessionEndInFlight) {
    return;
  }

  sessionEndInFlight = true;

  try {
    await clearStorage();
    store.dispatch(logout());

    if (showToast && message) {
      Toast.show({ type: toastType, text1: message });
    }
  } finally {
    sessionEndInFlight = false;
  }
};
