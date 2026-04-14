import { AUTH_ENDPOINTS } from "../../utils/constants";
import axiosClient from "../axios";

const {
  REGISTER,
  LOGIN,
  CHANGE_PASSWORD,
  UPDATE_PROFILE,
  UPLOAD_IMAGE,
} = AUTH_ENDPOINTS;

// ── Auth ──────────────────────────────────────────────────────────

export const register = async (data) => {
  const response = await axiosClient.post(REGISTER, data);
  return response.data;
};

export const login = async (data) => {
  const response = await axiosClient.post(LOGIN, data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosClient.patch(CHANGE_PASSWORD, data);
  return response.data;
};

// ── Profile & Garage ──────────────────────────────────────────────

export const updateProfile = async (data) => {
  const response = await axiosClient.post(UPDATE_PROFILE, data);
  return response.data;
};

export const uploadImage = async (uri) => {
  const filename = uri.split("/").pop() || "upload.jpg";
  const ext = filename.split(".").pop().toLowerCase() || "jpg";
  const mimeMap = { png: "image/png", gif: "image/gif", webp: "image/webp" };
  const type = mimeMap[ext] || "image/jpeg";

  const formData = new FormData();
  formData.append("file", { uri, name: filename, type });

  const response = await axiosClient.post(UPLOAD_IMAGE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data.url;
};
