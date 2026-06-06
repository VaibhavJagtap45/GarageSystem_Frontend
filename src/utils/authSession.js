export const parseSessionExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const hasSessionExpired = (expiresAt, now = Date.now()) => {
  const expiresAtMs = parseSessionExpiry(expiresAt);
  if (!expiresAtMs) return true;
  return expiresAtMs <= now;
};

export const getMsUntilSessionExpiry = (expiresAt, now = Date.now()) => {
  const expiresAtMs = parseSessionExpiry(expiresAt);
  if (!expiresAtMs) return 0;
  return Math.max(0, expiresAtMs - now);
};
