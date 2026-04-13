import { AUTH_ENDPOINTS } from "../../utils/constants";
import axiosClient from "../axios";
const { REQUEST_OTP, VERIFY_OTP, UPDATE_PROFILE, RESEND_OTP, UPLOAD_IMAGE } = AUTH_ENDPOINTS;

export const requestOtp = async (data) => {
  try {
    const response = await axiosClient.post(REQUEST_OTP, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const resendOtp = async (data) => {
  try {
    const response = await axiosClient.post(RESEND_OTP, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (data) => {
  try {
    const response = await axiosClient.post(VERIFY_OTP, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (data) => {
  try {
    const response = await axiosClient.post(UPDATE_PROFILE, data);
    return response.data;
  } catch (error) {
    throw error;
  }
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
