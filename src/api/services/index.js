import axiosClient from "../axios";
import { CATALOG_ENDPOINTS, VEHICLE_ENDPOINTS } from "../../utils/constants";

export const getCatalogItems = async (itemType, params = {}) => {
  const response = await axiosClient.get(CATALOG_ENDPOINTS.LIST, {
    params: { itemType, limit: 200, ...params },
  });
  return response.data;
};

export const getCatalogCategories = async (itemType) => {
  const response = await axiosClient.get(CATALOG_ENDPOINTS.CATEGORIES, {
    params: { itemType },
  });
  return response.data;
};

export const createCatalogItem = async (data) => {
  const response = await axiosClient.post(CATALOG_ENDPOINTS.LIST, data);
  return response.data;
};

export const updateCatalogItem = async (id, itemType, data) => {
  const response = await axiosClient.put(CATALOG_ENDPOINTS.DETAIL(id), data, {
    params: { itemType },
  });
  return response.data;
};

export const deleteCatalogItem = async (id, itemType) => {
  const response = await axiosClient.delete(CATALOG_ENDPOINTS.DETAIL(id), {
    params: { itemType },
  });
  return response.data;
};

export const bulkUploadCatalog = async (itemType, fileUri, fileName) => {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const mimeType =
    ext === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : ext === "xls"
        ? "application/vnd.ms-excel"
        : "text/csv";

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName || `upload.${ext}`,
    type: mimeType,
  });

  const response = await axiosClient.post(
    CATALOG_ENDPOINTS.BULK_UPLOAD,
    formData,
    {
      params: { itemType },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const getVehicleBrands = async () => {
  const response = await axiosClient.get(VEHICLE_ENDPOINTS.BRANDS);
  return response.data;
};

export const getVehicleModels = async (brand) => {
  const response = await axiosClient.get(VEHICLE_ENDPOINTS.MODELS, {
    params: { brand },
  });
  return response.data;
};
