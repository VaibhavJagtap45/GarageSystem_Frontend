import axios from "axios";
import { API_BASE_URL } from "@env";
import { getToken, clearStorage } from "../utils/storage";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    // Attach a friendly displayMessage for UI components and screens
    // eslint-disable-next-line no-param-reassign
    error.displayMessage =
      error?.response?.data?.msg ||
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0]?.msg ||
      (status === 401
        ? "Session expired. Please login again."
        : status === 403
          ? "Access denied."
          : status === 404
            ? "Not found."
            : status === 500
              ? "Server error. Try again later."
              : !error.response
                ? "No internet connection."
                : "Something went wrong.");

    if (status === 401) {
      await clearStorage();
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
