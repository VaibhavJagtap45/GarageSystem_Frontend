// utils/role.js
// ─────────────────────────────────────────────────────────────────
//  Single source of truth for role → portal routing.
//
//  Backend roles (User.model.js):
//    superAdmin, franchiseAdmin, franchiseOwner,
//    owner, manager, staff,
//    member, customer, vendor
//
//  Mobile portals available:
//    "garage"   → GarageTabs   (owner-style admin UI)
//    "member"   → MemberTabs   (mechanic shopfloor UI)
//    "customer" → CustomerTabs (vehicle-owner self-service)
//    "unsupported" → friendly "use the web admin" screen
//
//  Note: routing managers to the garage portal is intentional — they
//  legitimately need most of it. The backend is the real authority
//  for what they can write; this UI just needs to hide actions they
//  can't perform. Use `useRoleCaps()` for that.
// ─────────────────────────────────────────────────────────────────

export const ROLE_PORTAL = {
  superAdmin: "garage",
  franchiseAdmin: "garage",
  franchiseOwner: "garage",
  owner: "garage",
  manager: "garage",
  staff: "garage",
  member: "member",
  customer: "customer",
  // Vendors don't have a mobile portal — they're managed by garages
  // from the web admin. Route them somewhere safe rather than
  // accidentally exposing customer or owner screens.
  vendor: "unsupported",
};

export function getPortal(role) {
  return ROLE_PORTAL[role] ?? "unsupported";
}

// Capability flags driven by role. Backend remains the source of
// truth for authorization; this helper exists so screens can hide
// buttons / tabs the user cannot actually use.
export function getRoleCaps(role) {
  switch (role) {
    case "owner":
    case "franchiseOwner":
    case "franchiseAdmin":
    case "superAdmin":
      return {
        canManageGarage: true,
        canManageUsers: true,
        canManageInventory: true,
        canIssueInvoice: true,
        canViewReports: true,
        canDeleteOrders: true,
      };
    case "manager":
      return {
        canManageGarage: false, // owner-only on backend
        canManageUsers: false, // owner-only on backend
        canManageInventory: true,
        canIssueInvoice: true,
        canViewReports: true,
        canDeleteOrders: false,
      };
    case "staff":
      return {
        canManageGarage: false,
        canManageUsers: false,
        canManageInventory: false,
        canIssueInvoice: true,
        canViewReports: false,
        canDeleteOrders: false,
      };
    default:
      return {
        canManageGarage: false,
        canManageUsers: false,
        canManageInventory: false,
        canIssueInvoice: false,
        canViewReports: false,
        canDeleteOrders: false,
      };
  }
}

