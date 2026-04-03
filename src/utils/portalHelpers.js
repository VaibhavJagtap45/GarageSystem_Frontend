// Shared helpers for customer & member portal screens

export function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const STATUS_COLOR = {
  created:       "#6366f1",
  in_progress:   "#f59e0b",
  vehicle_ready: "#3b82f6",
  completed:     "#22c55e",
  cancelled:     "#ef4444",
  draft:         "#94a3b8",
  sent:          "#3b82f6",
  paid:          "#22c55e",
  unpaid:        "#ef4444",
  partial:       "#f59e0b",
};

export const STATUS_LABEL = {
  created:       "Requested",
  in_progress:   "In Progress",
  vehicle_ready: "Ready",
  completed:     "Completed",
  cancelled:     "Cancelled",
  draft:         "Draft",
  sent:          "Sent",
  paid:          "Paid",
  unpaid:        "Unpaid",
  partial:       "Partial",
};
