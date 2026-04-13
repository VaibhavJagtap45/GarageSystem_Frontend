import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import TopNav from "../../components/ui/TopNav";
import { COLORS, FONTS, SIZES, SHADOWS } from "../../utils/constants";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
} from "../../api/googleCalendar";

WebBrowser.maybeCompleteAuthSession?.();

function formatDateTime(value) {
  if (!value) return "Not yet";
  const d = new Date(value);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function StatusPill({ connected }) {
  return (
    <View
      style={[
        styles.statusPill,
        connected ? styles.statusConnected : styles.statusDisconnected,
      ]}
    >
      <Ionicons
        name={connected ? "checkmark-circle-outline" : "alert-circle-outline"}
        size={15}
        color={connected ? COLORS.success : COLORS.warning}
      />
      <Text
        style={[
          styles.statusPillText,
          { color: connected ? COLORS.success : COLORS.warning },
        ]}
      >
        {connected ? "Connected" : "Not connected"}
      </Text>
    </View>
  );
}

export default function GoogleCalendarSettingsScreen() {
  const navigation = useNavigation();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGoogleCalendarStatus();
      const status = res.data?.integration || null;
      setIntegration(status);
      return status;
    } catch (err) {
      Alert.alert("Error", err.displayMessage || "Could not load Calendar status.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const appRedirectUri = "apnogarage://google-calendar";
      const res = await getGoogleCalendarConnectUrl(appRedirectUri);
      const authUrl = res.data?.authUrl;
      if (!authUrl) throw new Error("Google connect URL was not returned.");

      // Open browser — result.type may be "cancel" or "dismiss" on Android
      // even after a successful connect, so we always check the server after
      await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

      // Check actual connection status from backend
      const status = await load();
      if (status?.connected) {
        Alert.alert("Connected", "Google Calendar auto-sync is ready.");
      }
    } catch (err) {
      Alert.alert("Error", err.displayMessage || err.message || "Could not connect Google Calendar.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Google Calendar",
      "Future accepted bookings will stop syncing to Google Calendar.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(true);
            try {
              const res = await disconnectGoogleCalendar();
              setIntegration(res.data?.integration || null);
              Alert.alert("Disconnected", "Google Calendar sync is turned off.");
            } catch (err) {
              Alert.alert("Error", err.displayMessage || "Could not disconnect Google Calendar.");
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ],
    );
  };

  const connected = Boolean(integration?.connected);
  const configured = integration?.configured !== false;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopNav title="Google Calendar" transparent={false} />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="calendar-sync-outline"
                size={28}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>Automatic appointment sync</Text>
            <Text style={styles.subtitle}>
              When a customer booking is confirmed, an event is created in the
              owner's Google Calendar from the backend.
            </Text>
            <StatusPill connected={connected} />
          </View>

          {!configured ? (
            <View style={styles.notice}>
              <Ionicons name="settings-outline" size={18} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Backend setup required</Text>
                <Text style={styles.noticeText}>
                  Add Google OAuth credentials to the backend .env file before
                  connecting Calendar.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoCard}>
            <InfoRow
              label="Calendar"
              value={integration?.calendarId || "primary"}
              icon="calendar-outline"
            />
            <InfoRow
              label="Connected"
              value={formatDateTime(integration?.connectedAt)}
              icon="link-outline"
            />
            <InfoRow
              label="Last sync"
              value={formatDateTime(integration?.lastSyncedAt)}
              icon="cloud-done-outline"
            />
            {integration?.lastError ? (
              <InfoRow
                label="Last issue"
                value={integration.lastError}
                icon="alert-circle-outline"
                danger
              />
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!configured || connecting) && styles.disabledBtn,
            ]}
            onPress={handleConnect}
            disabled={!configured || connecting}
            activeOpacity={0.85}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {connected ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleDisconnect}
              disabled={disconnecting}
              activeOpacity={0.85}
            >
              {disconnecting ? (
                <ActivityIndicator color={COLORS.error} size="small" />
              ) : (
                <>
                  <Ionicons name="unlink-outline" size={18} color={COLORS.error} />
                  <Text style={styles.secondaryBtnText}>Disconnect</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.bookingsBtn}
            onPress={() => navigation.navigate("Bookings")}
          >
            <Text style={styles.bookingsBtnText}>View bookings</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon, danger }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={16}
          color={danger ? COLORS.error : COLORS.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, danger && { color: COLORS.error }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    padding: SIZES.screenPadding,
    gap: SIZES.md,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    gap: SIZES.sm,
    ...SHADOWS.sm,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textLg,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusConnected: { backgroundColor: COLORS.successLight },
  statusDisconnected: { backgroundColor: COLORS.warningLight },
  statusPillText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textXs,
  },
  notice: {
    flexDirection: "row",
    gap: SIZES.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  noticeTitle: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.warning,
  },
  noticeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SIZES.sm,
  },
  primaryBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textBase,
    color: "#fff",
  },
  disabledBtn: { opacity: 0.6 },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.errorLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  secondaryBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.error,
  },
  bookingsBtn: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: SIZES.sm,
  },
  bookingsBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.textSm,
    color: COLORS.primary,
  },
});
