import {
  USER_ENDPOINTS,
  CUSTOMER_ENDPOINTS,
  VEHICLE_ENDPOINTS,
} from "../../utils/constants";
import axiosClient from "../axios";

const { ADD_USER, GET_PROFILE } = USER_ENDPOINTS;

//  GET PROFILE
//  GET /api/v1/user/get-profile
export const getProfile = async () => {
  try {
    const response = await axiosClient.get(GET_PROFILE);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  ADD USER  (customer | member | vendor)
//  POST /api/v1/user/add-user

export const addUser = async (data) => {
  try {
    const response = await axiosClient.post(ADD_USER, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  GET CUSTOMERS LIST
//  GET /api/v1/customers
export const getCustomers = async () => {
  try {
    const response = await axiosClient.get(CUSTOMER_ENDPOINTS.LIST);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  GET CUSTOMER DETAIL
//  GET /api/v1/customers/:id
export const getCustomerDetail = async (id) => {
  try {
    const response = await axiosClient.get(CUSTOMER_ENDPOINTS.DETAIL(id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  GET MEMBERS LIST
//  GET /api/v1/members
export const getMembers = async () => {
  try {
    const response = await axiosClient.get(USER_ENDPOINTS.MEMBERS_LIST);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  GET VENDORS LIST
//  GET /api/v1/vendors
export const getVendors = async () => {
  try {
    const response = await axiosClient.get(USER_ENDPOINTS.VENDORS_LIST);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  ADD VEHICLE TO CUSTOMER
//  POST /api/v1/vehicle/add

export const addVehicle = async (data) => {
  try {
    const response = await axiosClient.post(VEHICLE_ENDPOINTS.ADD, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  GET ALL VEHICLES FOR A CUSTOMER
//  GET /api/v1/vehicle/customer/:customerId
export const getVehiclesByCustomer = async (customerId) => {
  try {
    const response = await axiosClient.get(
      VEHICLE_ENDPOINTS.BY_CUSTOMER(customerId),
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVehicle = async (vehicleId, data) => {
  try {
    const response = await axiosClient.put(
      VEHICLE_ENDPOINTS.UPDATE(vehicleId),
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
