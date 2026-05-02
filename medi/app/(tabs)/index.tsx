import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { BadgeChip } from "@/components/badge-chip";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ReminderBottomSheet } from "@/components/reminder-bottom-sheet";
import { SkeletonLoader } from "@/components/skeleton-loader";

import { useAlerts, useDeviceStatus } from "@/src/app-state/app-state-store";
import {
  useScheduledDoses,
  useScheduledMedications,
} from "@/src/prescription-flow/prescription-store";
import type { ScheduledDose } from "@/src/prescription-flow/types";
import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

const LOW_FILL_THRESHOLD = 30;
const ELDERLY_USER_NAME = "Marina Rivera";
const CAREGIVER_NAME = "Alicia Rivera";

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const medications = useScheduledMedications();
  const doses = useScheduledDoses();
  const alerts = useAlerts();
  const deviceStatus = useDeviceStatus();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReminderSheetVisible, setIsReminderSheetVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const todayKey = toDateKey(new Date());

  const todayDoses = useMemo(() => {
    return doses
      .filter((dose) => dose.dateKey === todayKey)
      .sort((left, right) => left.time.localeCompare(right.time));
  }, [doses, todayKey]);

  const compliance = useMemo(() => {
    const taken = todayDoses.filter((dose) => dose.status === "Taken").length;
    const missed = todayDoses.filter((dose) => dose.status === "Missed").length;
    const totalScored = taken + missed;
    const adherencePercentage =
      totalScored === 0 ? 0 : Math.round((taken / totalScored) * 100);

    return {
      taken,
      missed,
      adherencePercentage,
    };
  }, [todayDoses]);

  const upcomingDoses = useMemo(() => {
    const now = new Date();

    return doses
      .map((dose) => ({
        ...dose,
        dateTime: toDoseDateTime(dose),
      }))
      .filter((dose) => {
        if (dose.status === "Taken" || dose.status === "Missed") {
          return false;
        }

        return (
          dose.dateTime.getTime() >= now.getTime() || dose.status === "Snoozed"
        );
      })
      .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime())
      .slice(0, 3);
  }, [doses]);

  const slotFillLevels = useMemo(() => {
    return medications.map((medication) => {
      const fillLevel = deriveFillLevel(medication.id, medication.slotLabel);

      return {
        id: medication.id,
        medicationName: medication.name,
        slotLabel: medication.slotLabel,
        fillLevel,
        isLow: fillLevel < LOW_FILL_THRESHOLD,
      };
    });
  }, [medications]);

  const recentAlerts = useMemo(() => {
    return [...alerts]
      .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
      .slice(0, 3);
  }, [alerts]);

  const openLiveCamera = useCallback(() => {
    router.push("/live-camera");
  }, [router]);

  const openSendReminder = useCallback(() => {
    setIsReminderSheetVisible(true);
  }, []);

  const openHealthReport = useCallback(() => {
    router.push("/health-report");
  }, [router]);

  const slotKeyExtractor = useCallback(
    (slot: (typeof slotFillLevels)[number]) => slot.id,
    []
  );

  const renderSlotItem = useCallback(
    ({ item: slot }: { item: (typeof slotFillLevels)[number] }) => (
      <View
        style={{
          width: 210,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              flex: 1,
            }}
          >
            {slot.medicationName}
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Slot {slot.slotLabel}
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceRaised,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${slot.fillLevel}%`,
              height: "100%",
              backgroundColor: slot.isLow
                ? theme.colors.alert
                : theme.colors.primary,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              fontVariant: ["tabular-nums"],
            }}
          >
            {slot.fillLevel}% filled
          </Text>

          {slot.isLow ? <BadgeChip label="Low fill" variant="amber" /> : null}
        </View>
      </View>
    ),
    [theme]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <Card title="Device status">
          {isInitialLoading ? (
            <View style={{ gap: theme.spacing.sm }}>
              <SkeletonLoader variant="custom" width="40%" height={14} />
              <SkeletonLoader variant="custom" width="100%" height={10} />
              <SkeletonLoader variant="custom" width="56%" height={12} />
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <BadgeChip
                  label={deviceStatus.online ? "Online" : "Offline"}
                  variant={deviceStatus.online ? "green" : "red"}
                />
                <Text
                  selectable
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.family.secondary,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.medium,
                  }}
                >
                  Power: {deviceStatus.powerSource}
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.medium,
                    }}
                  >
                    Battery level
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {deviceStatus.batteryLevel}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${deviceStatus.batteryLevel}%`,
                      height: "100%",
                      backgroundColor:
                        deviceStatus.batteryLevel < 30
                          ? theme.colors.alert
                          : theme.colors.primary,
                    }}
                  />
                </View>
              </View>

              <Text
                selectable
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.family.secondary,
                  fontSize: theme.typography.size.xs,
                  fontWeight: theme.typography.weight.regular,
                }}
              >
                Last synced {formatRelativeSyncLabel(deviceStatus.lastSyncedAt)}
              </Text>
            </View>
          )}
        </Card>

        <Card title="Today's compliance summary">
          {isInitialLoading ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: theme.spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: theme.spacing.sm }}>
                <SkeletonLoader variant="custom" width="72%" height={12} />
                <SkeletonLoader variant="custom" width="54%" height={12} />
                <SkeletonLoader variant="custom" width="78%" height={12} />
              </View>
              <View
                style={{
                  width: 102,
                  height: 102,
                  borderRadius: 999,
                  backgroundColor: theme.colors.surface,
                }}
              />
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: theme.spacing.md,
              }}
            >
              <View
                style={{ flex: 1, flexDirection: "row", gap: theme.spacing.sm }}
              >
                <StatPill label="Taken" value={compliance.taken} tone="good" />
                <StatPill
                  label="Missed"
                  value={compliance.missed}
                  tone="danger"
                />
              </View>
              <AdherenceRing percentage={compliance.adherencePercentage} />
            </View>
          )}
        </Card>

        <Card title="Upcoming doses">
          {isInitialLoading ? (
            <View style={{ gap: theme.spacing.sm }}>
              <SkeletonLoader variant="list-item" />
              <SkeletonLoader variant="list-item" />
              <SkeletonLoader variant="list-item" />
            </View>
          ) : upcomingDoses.length === 0 ? (
            <EmptyState
              heading="No upcoming doses"
              body="No upcoming doses found. Add doses in Schedule to populate this list."
              icon="calendar-outline"
            />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {upcomingDoses.map((dose) => (
                <View
                  key={dose.id}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      selectable
                      style={{
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.family.primary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.semibold,
                      }}
                    >
                      {dose.medicationName}
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.family.secondary,
                        fontSize: theme.typography.size.xs,
                        fontWeight: theme.typography.weight.regular,
                      }}
                    >
                      Slot {dose.slotLabel}
                    </Text>
                  </View>

                  <Text
                    selectable
                    style={{
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {formatDisplayTime(dose.time)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card title="Slot fill levels">
          {isInitialLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                {Array.from({ length: 3 }, (_, index) => (
                  <View
                    key={`slot-skeleton-${index}`}
                    style={{
                      width: 188,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.md,
                      gap: theme.spacing.sm,
                    }}
                  >
                    <SkeletonLoader variant="custom" width="64%" height={12} />
                    <SkeletonLoader variant="custom" width="92%" height={10} />
                    <SkeletonLoader variant="custom" width="40%" height={10} />
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : slotFillLevels.length === 0 ? (
            <EmptyState
              heading="No slot assignments"
              body="No slot assignments yet. Add medications to see dispenser fill levels."
              icon="apps-outline"
            />
          ) : (
            <FlatList
              horizontal
              data={slotFillLevels}
              keyExtractor={slotKeyExtractor}
              renderItem={renderSlotItem}
              contentContainerStyle={{ gap: theme.spacing.sm }}
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews
              initialNumToRender={4}
              maxToRenderPerBatch={8}
              windowSize={5}
            />
          )}
        </Card>

        <Card title="Recent alerts">
          {isInitialLoading ? (
            <View style={{ gap: theme.spacing.sm }}>
              <SkeletonLoader variant="list-item" />
              <SkeletonLoader variant="list-item" />
              <SkeletonLoader variant="list-item" />
            </View>
          ) : recentAlerts.length === 0 ? (
            <EmptyState
              heading="No recent alerts"
              body="No recent alert activity."
              icon="notifications-off-outline"
            />
          ) : (
            <View style={{ gap: theme.spacing.xs }}>
              {recentAlerts.map((alert) => (
                <View
                  key={alert.id}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      selectable
                      style={{
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.family.primary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.semibold,
                      }}
                    >
                      {alert.title}
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.family.secondary,
                        fontSize: theme.typography.size.xs,
                        fontWeight: theme.typography.weight.regular,
                      }}
                    >
                      {alert.type}
                    </Text>
                  </View>

                  <Text
                    selectable
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.family.secondary,
                      fontSize: theme.typography.size.xs,
                      fontWeight: theme.typography.weight.regular,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {formatTimestamp(alert.receivedAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card title="Quick actions">
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              flexWrap: "wrap",
            }}
          >
            <Button
              label="View Live Camera"
              onPress={openLiveCamera}
              variant="secondary"
              size="sm"
              style={{ flexBasis: "48%", flexGrow: 1 }}
            />
            <Button
              label="Send Reminder"
              onPress={openSendReminder}
              variant="secondary"
              size="sm"
              style={{ flexBasis: "48%", flexGrow: 1 }}
            />
            <Button
              label="Open Health Report"
              onPress={openHealthReport}
              variant="secondary"
              size="sm"
              style={{ flexBasis: "48%", flexGrow: 1 }}
            />
          </View>
        </Card>
      </ScrollView>

      <ReminderBottomSheet
        visible={isReminderSheetVisible}
        onClose={() => setIsReminderSheetVisible(false)}
        elderlyName={ELDERLY_USER_NAME}
        caregiverName={CAREGIVER_NAME}
      />
    </View>
  );
}

type AdherenceRingProps = {
  percentage: number;
};

function AdherenceRing({ percentage }: AdherenceRingProps) {
  const { theme } = useAppTheme();
  const size = 102;
  const strokeWidth = 10;
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.primaryMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <Text
        selectable
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.semibold,
          fontVariant: ["tabular-nums"],
        }}
      >
        {clamped}%
      </Text>
      <Text
        selectable
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.family.secondary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        Adherence
      </Text>
    </View>
  );
}

type StatPillProps = {
  label: string;
  value: number;
  tone: "good" | "danger";
};

function StatPill({ label, value, tone }: StatPillProps) {
  const { theme } = useAppTheme();
  const palette =
    tone === "good"
      ? {
          text: theme.colors.success,
          border: withAlpha(theme.colors.success, 0.35),
          background: withAlpha(theme.colors.success, 0.12),
        }
      : {
          text: theme.colors.alert,
          border: withAlpha(theme.colors.alert, 0.35),
          background: withAlpha(theme.colors.alert, 0.12),
        };

  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.background,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        gap: 2,
      }}
    >
      <Text
        selectable
        style={{
          color: palette.text,
          fontFamily: theme.typography.family.secondary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: palette.text,
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.semibold,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map((entry) => Number.parseInt(entry, 10));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function toDoseDateTime(dose: ScheduledDose) {
  const [hours, minutes] = dose.time
    .split(":")
    .map((entry) => Number.parseInt(entry, 10));
  const date = fromDateKey(dose.dateKey);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatDisplayTime(time: string) {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeSyncLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const deltaMs = Date.now() - date.getTime();
  const deltaMinutes = Math.max(0, Math.round(deltaMs / 60000));

  if (deltaMinutes < 1) {
    return "just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const hours = Math.round(deltaMinutes / 60);
  return `${hours}h ago`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function deriveFillLevel(medicationId: string, slotLabel: string) {
  const seed = `${medicationId}-${slotLabel}`;
  let total = 0;

  for (let index = 0; index < seed.length; index += 1) {
    total += seed.charCodeAt(index);
  }

  return 20 + (total % 73);
}
