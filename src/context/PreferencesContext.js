/**
 * PreferencesContext
 *
 * Provides app-wide preferences (font size, notifications, WA automation)
 * to every component via usePreferences() hook.
 *
 * Load order:
 *  1. AsyncStorage  → instant render with last-known values
 *  2. Backend (PATCH /auth/preferences) → authoritative sync on app focus
 *
 * updatePref(key, value) — optimistic update + persists to both AsyncStorage
 *                          and backend. Returns a rollback function.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../api/axios";
import { AUTH_ENDPOINTS, STORAGE_KEYS } from "../utils/constants";

// ─── Font scale map ───────────────────────────────────────────────────────────
export const FONT_SCALE = {
  small:  0.88,
  medium: 1.0,
  large:  1.14,
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  notificationsEnabled: true,
  autoUpdates:          true,
  autoWaNotification:   false,
  fontSize:             "medium",
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PreferencesContext = createContext({
  prefs:      DEFAULT_PREFS,
  fontScale:  1.0,
  loaded:     false,
  updatePref: async () => {},
  notify:     (title, msg, buttons) => Alert.alert(title, msg, buttons),
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PreferencesProvider({ children }) {
  const [prefs,  setPrefs]  = useState(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  // Keep a ref to latest prefs for the notify closure (avoids stale closure)
  const prefsRef = useRef(DEFAULT_PREFS);

  // ── Boot: load from AsyncStorage (sync) → then backend ─────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1. Immediate: use cached prefs
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
        if (raw && alive) {
          const cached = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
          setPrefs(cached);
          prefsRef.current = cached;
        }
      } catch { /* ignore parse errors */ } finally {
        if (alive) setLoaded(true);
      }

      try {
        // 2. Authoritative: sync from backend (non-blocking)
        const res = await axiosClient.get(AUTH_ENDPOINTS.GARAGE);
        const serverPrefs = res.data?.data?.garage?.preferences;
        if (serverPrefs && alive) {
          const merged = { ...DEFAULT_PREFS, ...serverPrefs };
          setPrefs(merged);
          prefsRef.current = merged;
          await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(merged));
        }
      } catch { /* network errors are non-fatal */ }
    })();
    return () => { alive = false; };
  }, []);

  // ── updatePref — optimistic with rollback on backend failure ───────────────
  const updatePref = useCallback(async (key, value) => {
    const previous = prefsRef.current;
    const updated  = { ...previous, [key]: value };

    // Optimistic update
    setPrefs(updated);
    prefsRef.current = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));

    try {
      await axiosClient.patch(AUTH_ENDPOINTS.PREFERENCES, { [key]: value });
    } catch {
      // Rollback
      setPrefs(previous);
      prefsRef.current = previous;
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(previous));
      Alert.alert("Save Failed", "Could not save preference. Please try again.");
    }
  }, []);

  // ── notify — gated Alert that respects the notifications toggle ────────────
  // force: true bypasses the toggle (for destructive confirmations)
  const notify = useCallback((title, msg, buttons, opts = {}) => {
    if (!prefsRef.current.notificationsEnabled && !opts.force) return;
    Alert.alert(title, msg, buttons);
  }, []);

  const fontScale = FONT_SCALE[prefs.fontSize] ?? 1.0;

  return (
    <PreferencesContext.Provider
      value={{ prefs, fontScale, loaded, updatePref, notify }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePreferences() {
  return useContext(PreferencesContext);
}

/**
 * Returns SIZES.text* values scaled by current fontScale preference.
 * Usage:  const fs = useFontSizes();  → fs.textBase, fs.textSm, etc.
 */
export function useFontSizes() {
  const { fontScale } = usePreferences();
  return {
    textXs:   Math.round(11 * fontScale),
    textSm:   Math.round(13 * fontScale),
    textBase: Math.round(15 * fontScale),
    textMd:   Math.round(17 * fontScale),
    textLg:   Math.round(20 * fontScale),
    textXl:   Math.round(24 * fontScale),
    textH:    Math.round(26 * fontScale),
  };
}
