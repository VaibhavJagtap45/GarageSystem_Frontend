import { AUTH_ENDPOINTS } from "../../utils/constants";
import axiosClient from "../axios";
const { REQUEST_OTP, VERIFY_OTP, UPDATE_PROFILE, RESEND_OTP } = AUTH_ENDPOINTS;

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
