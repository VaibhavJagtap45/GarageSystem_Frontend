// import { Dimensions } from "react-native";

// // ─── FONTS ──────────────────────────────────────────────────────────────────
// export const FONTS = {
//   light: "Inter_300Light",
//   regular: "Inter_400Regular",
//   medium: "Inter_500Medium",
//   semibold: "Inter_600SemiBold",
//   bold: "Inter_700Bold",
//   extrabold: "Inter_800ExtraBold",
// };

// export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
//   Dimensions.get("window");

// // ─── API ─────────────────────────────────────────────────────────────────────

// export const AUTH_ENDPOINTS = {
//   REQUEST_OTP: "/auth/request-otp",
//   VERIFY_OTP: "/auth/verify-otp",
//   UPDATE_PROFILE: "/auth/update-garage-profile",
//   RESEND_OTP: "/auth/resend-otp",
// };

// export const STORAGE_KEYS = {
//   TOKEN: "@access_token",
//   USER: "@user",
//   GARAGE: "@garage",
// };

// // ─── RAW PALETTE ─────────────────────────────────────────────────────────────
// export const PALETTE = {
//   // Primary — Forest Green
//   primary: "#1D9E75",
//   primaryDark: "#2e6a5bff",
//   primarySoft: "#E1F5EE",

//   // Neutrals
//   neutral900: "#111827",
//   neutral700: "#374151",
//   neutral600: "#4B5563",
//   neutral400: "#9CA3AF",
//   neutral300: "#D1D5DB",
//   neutral200: "#E5E7EB",
//   neutral100: "#F3F4F6",
//   neutral50: "#F9FAFB",

//   // Semantic
//   error: "#E24B4A",
//   errorLight: "#FEF2F2",
//   warning: "#BA7517",
//   warningLight: "#FFFBEB",
//   success: "#1D9E75",
//   successLight: "#E1F5EE",
//   info: "#3B82F6",
//   infoLight: "#EFF6FF",

//   white: "#FFFFFF",
//   black: "#000000",
// };

// // ─── COLORS (semantic aliases) ───────────────────────────────────────────────
// export const COLORS = {
//   // Brand
//   primary: PALETTE.primary,
//   primaryLight: PALETTE.primarySoft,
//   primaryDark: PALETTE.primaryDark,
//   secondary: PALETTE.warning,
//   secondaryLight: PALETTE.warningLight,

//   // Backgrounds
//   bg: PALETTE.neutral50,
//   bgCard: PALETTE.white,
//   bgInput: PALETTE.neutral100,
//   bgSection: PALETTE.neutral100,
//   neutral50: PALETTE.neutral50,

//   // Text
//   textPrimary: PALETTE.neutral900,
//   textSecondary: PALETTE.neutral600,
//   textMuted: PALETTE.neutral400,
//   textAccent: PALETTE.primary,

//   // Borders
//   border: PALETTE.neutral300,
//   borderLight: PALETTE.neutral200,

//   // Semantic
//   success: PALETTE.success,
//   successLight: PALETTE.successLight,
//   warning: PALETTE.warning,
//   warningLight: PALETTE.warningLight,
//   error: PALETTE.error,
//   errorLight: PALETTE.errorLight,
//   live: PALETTE.error,
//   liveLight: PALETTE.errorLight,

//   // Gradients
//   gradPrimary: [PALETTE.primary, PALETTE.primaryDark],
//   gradPrimaryReverse: [PALETTE.primaryDark, PALETTE.primary],
//   gradCard: [PALETTE.white, PALETTE.neutral50],
//   gradGold: ["#BA7517", "#D9940A"],
//   gradRoyal: [PALETTE.primary, PALETTE.warning],
//   gradSuccess: [PALETTE.primary, "#34D399"],
//   gradDeep: [PALETTE.primaryDark, PALETTE.primary],

//   white: PALETTE.white,
//   black: PALETTE.black,
// };

// // ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
// export const TYPOGRAPHY = {
//   display: { fontSize: 32, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
//   h1: { fontSize: 26, fontFamily: FONTS.bold, letterSpacing: -0.3 },
//   h2: { fontSize: 20, fontFamily: FONTS.semibold, letterSpacing: -0.2 },
//   h3: { fontSize: 17, fontFamily: FONTS.semibold, letterSpacing: 0 },
//   body: { fontSize: 15, fontFamily: FONTS.regular, lineHeight: 24 },
//   caption: { fontSize: 13, fontFamily: FONTS.regular },
//   label: { fontSize: 12, fontFamily: FONTS.medium, letterSpacing: 0.4 },
// };

// // ─── SHADOWS / ELEVATION ─────────────────────────────────────────────────────
// export const SHADOWS = {
//   sm: {
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.06,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   md: {
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   lg: {
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.1,
//     shadowRadius: 24,
//     elevation: 8,
//   },
// };

// // ─── SIZES / SPACING (8px grid) ───────────────────────────────────────────────
// export const SIZES = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 48,

//   // Border Radii
//   radiusSm: 8,
//   radiusMd: 12,
//   radiusLg: 16,
//   radiusXl: 24,
//   radiusFull: 999,

//   // Typography
//   textXs: 11,
//   textSm: 13,
//   textBase: 15,
//   textMd: 17,
//   textLg: 20,
//   textXl: 24,
//   textH: 26,

//   screenPadding: 20,

//   // Interactive element heights
//   inputHeight: 56,
//   btnHeightLg: 52,
//   btnHeightMd: 44,
//   btnHeightSm: 36,
//   tabBarHeight: 64,
// };

import { Dimensions } from "react-native";

// ─── FONTS ──────────────────────────────────────────────────────────────────
export const FONTS = {
  light: "Inter_300Light",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
};

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

export const AUTH_ENDPOINTS = {
  REGISTER:        "/auth/register",
  LOGIN:           "/auth/login",
  CHANGE_PASSWORD: "/auth/change-password",
  UPDATE_PROFILE:  "/auth/update-garage-profile",
  UPLOAD_IMAGE:    "/auth/upload-image",
  REFRESH:         "/auth/refresh",
  LOGOUT:          "/auth/logout",
  GARAGE:          "/auth/garage",
  PREFERENCES:     "/auth/preferences",
};

export const USER_ENDPOINTS = {
  GET_PROFILE:  "/user/get-profile",
  ADD_USER:     "/user/add-user",
  PUSH_TOKEN:   "/user/push-token",  // POST { token: "ExponentPushToken[...]" }
  MEMBERS_LIST: "/members",
  VENDORS_LIST: "/vendors",
  VENDOR_DETAIL: (id) => `/vendors/${id}`,
};

export const CUSTOMER_ENDPOINTS = {
  LIST: "/customers",
  DETAIL: (id) => `/customers/${id}`,
};

export const VEHICLE_ENDPOINTS = {
  ADD: "/vehicle/add",
  BY_CUSTOMER: (customerId) => `/vehicle/customer/${customerId}`,
  UPDATE: (vehicleId) => `/vehicle/${vehicleId}`,
  BRANDS: "/vehicle/brands",
  MODELS: "/vehicle/models",
};

// export const SERVICE_ENDPOINTS = {
//   LIST: "/garage-services", // GET (list) / POST (add)
//   DETAIL: (id) => `/garage-services/${id}`, // PUT / DELETE
//   CATEGORIES: "/garage-services/categories", // GET
//   BULK_CSV: "/garage-services/bulk-csv", // POST multipart
// };

// Unified Services & Parts Catalog
export const CATALOG_ENDPOINTS = {
  LIST:            "/catalog",
  DETAIL:          (id) => `/catalog/${id}`,
  CATEGORIES:      "/catalog/categories",
  BULK_UPLOAD:     "/catalog/bulk-upload",
  INVENTORY_STATS: "/catalog/inventory-stats",
};

// Legacy - kept for backward compat
export const SERVICE_ENDPOINTS = {
  LIST: "/garage-services",
  DETAIL: (id) => `/garage-services/${id}`,
  CATEGORIES: "/garage-services/categories",
  BULK_CSV: "/garage-services/bulk-csv",
};

// ─── Repair Orders ────────────────────────────────────────────────────────────
export const REPAIR_ORDER_ENDPOINTS = {
  SEARCH_CUSTOMERS: "/repair-orders/search-customers", // GET ?q= (name/phone/reg)
  SEARCH_VEHICLE: "/repair-orders/search-vehicle",     // GET ?regNo=
  LIST: "/repair-orders",                               // GET / POST
  DETAIL: (id) => `/repair-orders/${id}`,               // GET / PUT / DELETE
  CANCELLED: "/repair-orders/cancelled",                // GET paginated cancelled orders
  TALLY_EXPORT: "/repair-orders/tally-export",          // GET ?dateFrom&dateTo
  CALENDAR: "/repair-orders/calendar",                  // GET ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const PURCHASE_ORDER_ENDPOINTS = {
  LIST:        "/purchase-orders",
  DETAIL:      (id) => `/purchase-orders/${id}`,
  VENDORS_DUE: "/purchase-orders/vendors-due",
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const INVOICE_ENDPOINTS = {
  LIST:   "/invoices",
  STATS:  "/invoices/stats",
  DETAIL: (id) => `/invoices/${id}`,
};

export const STOCK_IN_ENDPOINTS = {
  LIST:   "/stock-in",
  STATS:  "/stock-in/stats",
  CREATE: "/stock-in",
  DELETE: (id) => `/stock-in/${id}`,
};

export const EXPENSE_ENDPOINTS = {
  LIST:   "/expenses",
  STATS:  "/expenses/stats",
  CREATE: "/expenses",
  DELETE: (id) => `/expenses/${id}`,
};

export const SERVICE_REMINDER_ENDPOINTS = {
  LIST:      "/service-reminders",
  CREATE:    "/service-reminders",
  MARK_DONE: (id) => `/service-reminders/${id}/done`,
  DELETE:    (id) => `/service-reminders/${id}`,
};

export const FEEDBACK_ENDPOINTS = {
  LIST:   "/feedbacks",
  STATS:  "/feedbacks/stats",
  CREATE: "/feedbacks",
  DELETE: (id) => `/feedbacks/${id}`,
};

export const TAG_ENDPOINTS = {
  LIST: "/tags",       // GET ?type=invoice|repair_order|both|all
  CREATE: "/tags",     // POST
  UPDATE: (id) => `/tags/${id}`, // PUT
  DELETE: (id) => `/tags/${id}`, // DELETE
};
// ─── Bookings ─────────────────────────────────────────────────────────────────
export const BOOKING_ENDPOINTS = {
  LIST:          "/bookings",
  CREATE:        "/bookings",
  DETAIL:        (id) => `/bookings/${id}`,
  STATUS:        (id) => `/bookings/${id}/status`,
  CONVERT:       (id) => `/bookings/${id}/convert`,
  MY_BOOKINGS:   "/customer/bookings",
  MY_CREATE:     "/customer/bookings",
  MY_CANCEL:     (id) => `/customer/bookings/${id}/cancel`,
  LINK_RO:       (id) => `/bookings/${id}/link-ro`,
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const REPORTS_ENDPOINTS = {
  ACCOUNTS_PAYABLE:  "/reports/accounts-payable",
  STOCK_IN:          "/reports/stock-in",
  STOCK_OUT:         "/reports/stock-out",
  PARTS_SALES:       "/reports/parts-sales",
  INVENTORY_AGEING:  "/reports/inventory-ageing",
  GST:               "/reports/gst",
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN:            "@access_token",
  TOKEN_EXPIRES_AT: "@access_token_expires_at",
  USER:             "@user",
  GARAGE:           "@garage",
  PREFERENCES:      "@app_preferences",
};

// ─── RAW PALETTE ─────────────────────────────────────────────────────────────
export const PALETTE = {
  // Primary — Forest Green
  primary: "#1D9E75",
  primaryDark: "#2e6a5bff",
  primarySoft: "#E1F5EE",

  // Neutrals
  neutral900: "#111827",
  neutral700: "#374151",
  neutral600: "#4B5563",
  neutral400: "#9CA3AF",
  neutral300: "#D1D5DB",
  neutral200: "#E5E7EB",
  neutral100: "#F3F4F6",
  neutral50: "#F9FAFB",

  // Semantic
  error: "#E24B4A",
  errorLight: "#FEF2F2",
  warning: "#BA7517",
  warningLight: "#FFFBEB",
  success: "#1D9E75",
  successLight: "#E1F5EE",
  info: "#3B82F6",
  infoLight: "#EFF6FF",

  white: "#FFFFFF",
  black: "#000000",
};

// ─── COLORS (semantic aliases) ───────────────────────────────────────────────
export const COLORS = {
  // Brand
  primary: PALETTE.primary,
  primaryLight: PALETTE.primarySoft,
  primaryDark: PALETTE.primaryDark,
  secondary: PALETTE.warning,
  secondaryLight: PALETTE.warningLight,

  // Backgrounds
  bg: PALETTE.neutral50,
  bgCard: PALETTE.white,
  bgInput: PALETTE.neutral100,
  bgSection: PALETTE.neutral100,
  neutral50: PALETTE.neutral50,

  // Text
  textPrimary: PALETTE.neutral900,
  textSecondary: PALETTE.neutral600,
  textMuted: PALETTE.neutral400,
  textAccent: PALETTE.primary,

  // Borders
  border: PALETTE.neutral300,
  borderLight: PALETTE.neutral200,

  // Semantic
  success: PALETTE.success,
  successLight: PALETTE.successLight,
  warning: PALETTE.warning,
  warningLight: PALETTE.warningLight,
  error: PALETTE.error,
  errorLight: PALETTE.errorLight,
  live: PALETTE.error,
  liveLight: PALETTE.errorLight,

  // Gradients
  gradPrimary: [PALETTE.primary, PALETTE.primaryDark],
  gradPrimaryReverse: [PALETTE.primaryDark, PALETTE.primary],
  gradCard: [PALETTE.white, PALETTE.neutral50],
  gradGold: ["#BA7517", "#D9940A"],
  gradRoyal: [PALETTE.primary, PALETTE.warning],
  gradSuccess: [PALETTE.primary, "#34D399"],
  gradDeep: [PALETTE.primaryDark, PALETTE.primary],

  white: PALETTE.white,
  black: PALETTE.black,
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  display: { fontSize: 32, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontFamily: FONTS.bold, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontFamily: FONTS.semibold, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontFamily: FONTS.semibold, letterSpacing: 0 },
  body: { fontSize: 15, fontFamily: FONTS.regular, lineHeight: 24 },
  caption: { fontSize: 13, fontFamily: FONTS.regular },
  label: { fontSize: 12, fontFamily: FONTS.medium, letterSpacing: 0.4 },
};

// ─── SHADOWS / ELEVATION ─────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── SIZES / SPACING (8px grid) ───────────────────────────────────────────────
export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Border Radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 999,

  // Typography
  textXs: 11,
  textSm: 13,
  textBase: 15,
  textMd: 17,
  textLg: 20,
  textXl: 24,
  textH: 26,

  screenPadding: 20,

  // Interactive element heights
  inputHeight: 56,
  btnHeightLg: 52,
  btnHeightMd: 44,
  btnHeightSm: 36,
  tabBarHeight: 64,
};
