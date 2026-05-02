import { useEffect, useMemo, useState } from "react";

export type AlertType =
  | "Dose Taken"
  | "Dose Missed"
  | "Snooze Triggered"
  | "Tamper Detected"
  | "Refill Low"
  | "Power Outage"
  | "Pattern Detected"
  | "Reminder Sent";

export type NotificationAlert = {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
  patternSummary?: string;
  suggestion?: string;
};

export type NotificationType =
  | "Dose Taken"
  | "Missed Dose"
  | "Snooze"
  | "Tamper"
  | "Refill"
  | "Power";

export type NotificationSettings = Record<NotificationType, boolean>;

export type CaregiverRole = "Primary" | "Secondary";

export type Caregiver = {
  id: string;
  name: string;
  role: CaregiverRole;
  invitedAt: string;
  contact?: string;
};

export type DevicePowerSource = "mains" | "battery backup";

export type DeviceStatus = {
  online: boolean;
  batteryLevel: number;
  powerSource: DevicePowerSource;
  lastSyncedAt: string;
};

export type DeviceProfile = {
  name: string;
  firmwareVersion: string;
  isPaired: boolean;
};

type AlertListener = (records: NotificationAlert[]) => void;
type CaregiverListener = (records: Caregiver[]) => void;
type NotificationSettingsListener = (settings: NotificationSettings) => void;
type RetentionDaysListener = (days: number) => void;
type DeviceStatusListener = (status: DeviceStatus) => void;
type DeviceProfileListener = (profile: DeviceProfile) => void;

type ReminderAlertPayload = {
  caregiverName: string;
  sentAt?: string;
  medicationName?: string;
  scheduledTime?: string;
  slotLabel?: string;
};

const alertListeners = new Set<AlertListener>();
const caregiverListeners = new Set<CaregiverListener>();
const notificationSettingsListeners = new Set<NotificationSettingsListener>();
const retentionDaysListeners = new Set<RetentionDaysListener>();
const deviceStatusListeners = new Set<DeviceStatusListener>();
const deviceProfileListeners = new Set<DeviceProfileListener>();

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  "Dose Taken": true,
  "Missed Dose": true,
  Snooze: true,
  Tamper: true,
  Refill: true,
  Power: true,
};

const seededAt = new Date().toISOString();

let alerts: NotificationAlert[] = buildInitialAlerts();
let caregivers: Caregiver[] = [
  {
    id: "caregiver-primary",
    name: "Alicia Rivera",
    role: "Primary",
    invitedAt: seededAt,
  },
  {
    id: "caregiver-2",
    name: "Jordan Lee",
    role: "Secondary",
    invitedAt: seededAt,
  },
  {
    id: "caregiver-3",
    name: "Marcus Chen",
    role: "Secondary",
    invitedAt: seededAt,
  },
];
let notificationSettings: NotificationSettings = {
  ...DEFAULT_NOTIFICATION_SETTINGS,
};
let retentionDays = 30;
let deviceStatus: DeviceStatus = {
  online: true,
  batteryLevel: 82,
  powerSource: "mains",
  lastSyncedAt: seededAt,
};
let deviceProfile: DeviceProfile = {
  name: "Medi Dispenser A1",
  firmwareVersion: "v2.8.4",
  isPaired: true,
};

function notifyAlerts() {
  const snapshot = [...alerts];

  alertListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyCaregivers() {
  const snapshot = [...caregivers];

  caregiverListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyNotificationSettings() {
  const snapshot = { ...notificationSettings };

  notificationSettingsListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyRetentionDays() {
  retentionDaysListeners.forEach((listener) => {
    listener(retentionDays);
  });
}

function notifyDeviceStatus() {
  const snapshot = { ...deviceStatus };

  deviceStatusListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyDeviceProfile() {
  const snapshot = { ...deviceProfile };

  deviceProfileListeners.forEach((listener) => {
    listener(snapshot);
  });
}

export function getAlerts() {
  return [...alerts];
}

export function getUnreadAlertsCount() {
  return alerts.filter((alert) => !alert.isRead).length;
}

export function dismissAlert(alertId: string) {
  const previousCount = alerts.length;

  alerts = alerts.filter((alert) => alert.id !== alertId);

  if (alerts.length === previousCount) {
    return false;
  }

  notifyAlerts();
  return true;
}

export function markAlertAsRead(alertId: string) {
  let didUpdate = false;

  alerts = alerts.map((alert) => {
    if (alert.id !== alertId || alert.isRead) {
      return alert;
    }

    didUpdate = true;

    return {
      ...alert,
      isRead: true,
    };
  });

  if (!didUpdate) {
    return false;
  }

  notifyAlerts();
  return true;
}

export function markAllAlertsAsRead() {
  if (alerts.every((alert) => alert.isRead)) {
    return false;
  }

  alerts = alerts.map((alert) => ({
    ...alert,
    isRead: true,
  }));

  notifyAlerts();
  return true;
}

export function logReminderAlert({
  caregiverName,
  sentAt,
  medicationName,
  scheduledTime,
  slotLabel,
}: ReminderAlertPayload) {
  const timestamp = sentAt ?? new Date().toISOString();
  const trimmedCaregiverName = caregiverName.trim() || "Primary caregiver";
  const title = medicationName
    ? `Reminder sent for ${medicationName}`
    : "General reminder sent";
  const body = buildReminderAlertBody({
    caregiverName: trimmedCaregiverName,
    medicationName,
    scheduledTime,
    slotLabel,
    timestamp,
  });

  const record: NotificationAlert = {
    id: `alert-reminder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: "Reminder Sent",
    title,
    body,
    receivedAt: timestamp,
    isRead: false,
  };

  alerts = [record, ...alerts];
  notifyAlerts();

  return record;
}

export function subscribeAlerts(listener: AlertListener) {
  alertListeners.add(listener);

  return () => {
    alertListeners.delete(listener);
  };
}

export function useAlerts() {
  const [records, setRecords] = useState<NotificationAlert[]>(() =>
    getAlerts()
  );

  useEffect(() => {
    return subscribeAlerts(setRecords);
  }, []);

  return records;
}

export function useUnreadAlertsCount() {
  const records = useAlerts();

  return useMemo(() => {
    return records.filter((alert) => !alert.isRead).length;
  }, [records]);
}

export function getCaregivers() {
  return [...caregivers];
}

export function addCaregiver({
  name,
  role,
  contact,
}: {
  name: string;
  role?: CaregiverRole;
  contact?: string;
}) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return null;
  }

  const normalizedContact = contact?.trim();
  const entry: Caregiver = {
    id: `caregiver-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: trimmedName,
    role: role ?? inferNextCaregiverRole(),
    invitedAt: new Date().toISOString(),
    ...(normalizedContact ? { contact: normalizedContact } : {}),
  };

  caregivers = [...caregivers, entry];
  notifyCaregivers();

  return entry;
}

export function setPrimaryCaregiverProfile({
  name,
  contact,
}: {
  name?: string;
  contact?: string;
}) {
  const normalizedName = name?.trim() ?? "";
  const normalizedContact = contact?.trim() ?? "";
  let didUpdate = false;

  caregivers = caregivers.map((caregiver) => {
    if (caregiver.role !== "Primary") {
      return caregiver;
    }

    const nextName = normalizedName || caregiver.name;
    const nextContact = normalizedContact || caregiver.contact;

    if (nextName === caregiver.name && nextContact === caregiver.contact) {
      return caregiver;
    }

    didUpdate = true;

    return {
      ...caregiver,
      name: nextName,
      ...(nextContact ? { contact: nextContact } : {}),
    };
  });

  if (
    !caregivers.some((caregiver) => caregiver.role === "Primary") &&
    normalizedName
  ) {
    caregivers = [
      {
        id: `caregiver-primary-${Date.now()}`,
        name: normalizedName,
        role: "Primary",
        invitedAt: new Date().toISOString(),
        ...(normalizedContact ? { contact: normalizedContact } : {}),
      },
      ...caregivers,
    ];
    didUpdate = true;
  }

  if (!didUpdate) {
    return false;
  }

  notifyCaregivers();
  return true;
}

export function hasElderlyProfileInfo() {
  const primaryCaregiver = caregivers.find(
    (caregiver) => caregiver.role === "Primary"
  );

  return Boolean(primaryCaregiver?.contact?.trim());
}

export function removeCaregiver(caregiverId: string) {
  const candidate = caregivers.find(
    (caregiver) => caregiver.id === caregiverId
  );

  if (!candidate || candidate.role === "Primary") {
    return false;
  }

  caregivers = caregivers.filter((caregiver) => caregiver.id !== caregiverId);
  notifyCaregivers();

  return true;
}

export function subscribeCaregivers(listener: CaregiverListener) {
  caregiverListeners.add(listener);

  return () => {
    caregiverListeners.delete(listener);
  };
}

export function useCaregivers() {
  const [records, setRecords] = useState<Caregiver[]>(() => getCaregivers());

  useEffect(() => {
    return subscribeCaregivers(setRecords);
  }, []);

  return records;
}

export function getNotificationSettings() {
  return { ...notificationSettings };
}

export function setNotificationSetting(
  type: NotificationType,
  enabled: boolean
) {
  if (notificationSettings[type] === enabled) {
    return false;
  }

  notificationSettings = {
    ...notificationSettings,
    [type]: enabled,
  };

  notifyNotificationSettings();
  return true;
}

export function subscribeNotificationSettings(
  listener: NotificationSettingsListener
) {
  notificationSettingsListeners.add(listener);

  return () => {
    notificationSettingsListeners.delete(listener);
  };
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );

  useEffect(() => {
    return subscribeNotificationSettings(setSettings);
  }, []);

  return settings;
}

export function getRetentionDays() {
  return retentionDays;
}

export function setRetentionDays(days: number) {
  const normalized = Math.max(1, Math.round(days));

  if (retentionDays === normalized) {
    return false;
  }

  retentionDays = normalized;
  notifyRetentionDays();

  return true;
}

export function subscribeRetentionDays(listener: RetentionDaysListener) {
  retentionDaysListeners.add(listener);

  return () => {
    retentionDaysListeners.delete(listener);
  };
}

export function useRetentionDays() {
  const [days, setDays] = useState(() => getRetentionDays());

  useEffect(() => {
    return subscribeRetentionDays(setDays);
  }, []);

  return days;
}

export function getDeviceStatus() {
  return { ...deviceStatus };
}

export function getDeviceProfile() {
  return { ...deviceProfile };
}

export function setDeviceName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName || deviceProfile.name === normalizedName) {
    return false;
  }

  deviceProfile = {
    ...deviceProfile,
    name: normalizedName,
  };

  notifyDeviceProfile();
  return true;
}

export function setDevicePaired(isPaired: boolean) {
  if (deviceProfile.isPaired === isPaired) {
    return false;
  }

  deviceProfile = {
    ...deviceProfile,
    isPaired,
    name: isPaired ? deviceProfile.name : "No device paired",
  };

  deviceStatus = {
    ...deviceStatus,
    online: isPaired,
    powerSource: isPaired ? "mains" : "battery backup",
  };

  notifyDeviceProfile();
  notifyDeviceStatus();
  return true;
}

export function recordDeviceSync(syncAt = new Date().toISOString()) {
  if (!deviceProfile.isPaired) {
    deviceStatus = {
      ...deviceStatus,
      online: false,
      powerSource: "battery backup",
    };

    notifyDeviceStatus();
    return;
  }

  deviceStatus = {
    ...deviceStatus,
    online: true,
    powerSource: "mains",
    lastSyncedAt: syncAt,
  };

  notifyDeviceStatus();
}

export function subscribeDeviceStatus(listener: DeviceStatusListener) {
  deviceStatusListeners.add(listener);

  return () => {
    deviceStatusListeners.delete(listener);
  };
}

export function subscribeDeviceProfile(listener: DeviceProfileListener) {
  deviceProfileListeners.add(listener);

  return () => {
    deviceProfileListeners.delete(listener);
  };
}

export function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus>(() => getDeviceStatus());

  useEffect(() => {
    return subscribeDeviceStatus(setStatus);
  }, []);

  return status;
}

export function useDeviceProfile() {
  const [profile, setProfile] = useState<DeviceProfile>(() =>
    getDeviceProfile()
  );

  useEffect(() => {
    return subscribeDeviceProfile(setProfile);
  }, []);

  return profile;
}

function inferNextCaregiverRole(): CaregiverRole {
  return caregivers.some((caregiver) => caregiver.role === "Primary")
    ? "Secondary"
    : "Primary";
}

function buildInitialAlerts() {
  return [
    {
      id: "alert-1",
      type: "Dose Missed",
      title: "Evening dose was missed",
      body: "Metformin 500mg in slot B was not confirmed within the grace period.",
      receivedAt: buildTimestamp(0, 20, 25),
      isRead: false,
    },
    {
      id: "alert-2",
      type: "Pattern Detected",
      title: "Adherence pattern detected",
      body: "Late-night doses are frequently delayed by 30 to 45 minutes.",
      receivedAt: buildTimestamp(0, 17, 10),
      isRead: false,
      patternSummary: "Late evening doses are delayed on 5 of the last 7 days.",
      suggestion:
        "Move the 9:00 PM dose to 9:30 PM and add a reminder at 9:20 PM.",
    },
    {
      id: "alert-3",
      type: "Dose Taken",
      title: "Dose confirmed",
      body: "Morning dose was dispensed and confirmed by the resident.",
      receivedAt: buildTimestamp(0, 8, 4),
      isRead: true,
    },
    {
      id: "alert-4",
      type: "Tamper Detected",
      title: "Tamper event detected",
      body: "Unauthorized access attempt was detected on the dispenser front panel.",
      receivedAt: buildTimestamp(1, 22, 12),
      isRead: false,
    },
    {
      id: "alert-5",
      type: "Refill Low",
      title: "Refill running low",
      body: "Amlodipine supply is estimated to run out in 2 days.",
      receivedAt: buildTimestamp(1, 9, 30),
      isRead: false,
    },
    {
      id: "alert-6",
      type: "Snooze Triggered",
      title: "Dose snoozed by caregiver",
      body: "Noon dose reminder was snoozed for 20 minutes.",
      receivedAt: buildTimestamp(2, 12, 2),
      isRead: true,
    },
    {
      id: "alert-7",
      type: "Power Outage",
      title: "Power outage detected",
      body: "Primary power was interrupted. Device switched to battery backup.",
      receivedAt: buildTimestamp(4, 5, 43),
      isRead: true,
    },
    {
      id: "alert-8",
      type: "Dose Taken",
      title: "Caregiver-assisted confirmation",
      body: "Dose marked as taken after remote caregiver review.",
      receivedAt: buildTimestamp(6, 14, 20),
      isRead: false,
    },
  ] satisfies NotificationAlert[];
}

function buildTimestamp(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildReminderAlertBody({
  caregiverName,
  medicationName,
  scheduledTime,
  slotLabel,
  timestamp,
}: {
  caregiverName: string;
  medicationName?: string;
  scheduledTime?: string;
  slotLabel?: string;
  timestamp: string;
}) {
  const sentTimeLabel = formatTimestampTime(timestamp);

  if (!medicationName) {
    return `${caregiverName} sent a general reminder at ${sentTimeLabel}.`;
  }

  const slotSuffix = slotLabel ? ` (slot ${slotLabel})` : "";
  const scheduledTimeLabel = scheduledTime
    ? ` scheduled for ${formatDoseTimeLabel(scheduledTime)}`
    : "";

  return `${caregiverName} sent a reminder for ${medicationName}${slotSuffix} at ${sentTimeLabel}${scheduledTimeLabel}.`;
}

function formatTimestampTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "the current time";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDoseTimeLabel(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function resetAppStateForTests() {
  alerts = buildInitialAlerts();
  caregivers = [
    {
      id: "caregiver-primary",
      name: "Alicia Rivera",
      role: "Primary",
      invitedAt: seededAt,
    },
    {
      id: "caregiver-2",
      name: "Jordan Lee",
      role: "Secondary",
      invitedAt: seededAt,
    },
    {
      id: "caregiver-3",
      name: "Marcus Chen",
      role: "Secondary",
      invitedAt: seededAt,
    },
  ];
  notificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
  retentionDays = 30;
  deviceStatus = {
    online: true,
    batteryLevel: 82,
    powerSource: "mains",
    lastSyncedAt: seededAt,
  };
  deviceProfile = {
    name: "Medi Dispenser A1",
    firmwareVersion: "v2.8.4",
    isPaired: true,
  };

  notifyAlerts();
  notifyCaregivers();
  notifyNotificationSettings();
  notifyRetentionDays();
  notifyDeviceStatus();
  notifyDeviceProfile();
}
