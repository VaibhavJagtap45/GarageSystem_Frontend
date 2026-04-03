// api/portal.js — Customer & Member portal API calls
import axiosClient from "./axios";

// ─── Customer ─────────────────────────────────────────────────────────────────

export const customerGetGarageInfo = () =>
  axiosClient.get("/customer/garage-info");

export const customerGetServices = (params = {}) =>
  axiosClient.get("/customer/services", { params });

export const customerGetVehicles = () => axiosClient.get("/customer/vehicles");

export const customerAddVehicle = (data) =>
  axiosClient.post("/customer/vehicles", data);

export const customerGetOrders = (params = {}) =>
  axiosClient.get("/customer/orders", { params });

export const customerGetOrderDetail = (id) =>
  axiosClient.get(`/customer/orders/${id}`);

export const customerCreateOrder = (data) =>
  axiosClient.post("/customer/orders", data);

export const customerGetInvoices = (params = {}) =>
  axiosClient.get("/customer/invoices", { params });

export const customerGetInvoiceDetail = (id) =>
  axiosClient.get(`/customer/invoices/${id}`);

export const customerGetProfile = () => axiosClient.get("/customer/profile");

export const customerUpdateProfile = (data) =>
  axiosClient.put("/customer/profile", data);

// ─── Member ───────────────────────────────────────────────────────────────────

export const memberGetDashboard = () => axiosClient.get("/member/dashboard");

export const memberGetOrders = (params = {}) =>
  axiosClient.get("/member/orders", { params });

export const memberGetOrderDetail = (id) =>
  axiosClient.get(`/member/orders/${id}`);

export const memberAcceptOrder = (id) =>
  axiosClient.put(`/member/orders/${id}/accept`);

export const memberRejectOrder = (id) =>
  axiosClient.put(`/member/orders/${id}/reject`);

export const memberUpdateStatus = (id, status) =>
  axiosClient.put(`/member/orders/${id}/status`, { status });

export const memberUpdateParts = (id, parts) =>
  axiosClient.put(`/member/orders/${id}/parts`, { parts });

export const memberGetInventory = (params = {}) =>
  axiosClient.get("/member/inventory", { params });

export const memberGetProfile = () => axiosClient.get("/member/profile");

export const memberUpdateProfile = (data) =>
  axiosClient.put("/member/profile", data);
