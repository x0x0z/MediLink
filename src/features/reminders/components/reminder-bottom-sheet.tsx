import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { BottomSheet, Button, EmptyState, StatusChip } from "@/components";
import {
  sendDoseReminder,
  sendGeneralReminder,
  useScheduledDoses,
} from "@/src/prescription-flow/prescription-store";
import type { ScheduledDose } from "@/src/prescription-flow/types";
import { useAppTheme } from "@/src/theme/theme-provider";

type ReminderBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  elderlyName: string;
  caregiverName: string;
};

export function ReminderBottomSheet({
  visible,
  onClose,
  elderlyName,
  caregiverName,
}: ReminderBottomSheetProps) {
  const { theme } = useAppTheme();
  const doses = useScheduledDoses();
  const [clock, setClock] = useState(() => new Date());
  const [generalReminderSentAt, setGeneralReminderSentAt] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setClock(new Date());

    const interval = setInterval(() => {
      setClock(new Date());
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setGeneralReminderSentAt(null);
    }
  }, [visible]);

  const upcomingDoses = useMemo(() => {
    const now = clock;
    const todayKey = toDateKey(now);

    return doses
      .filter((dose) => {
        if (dose.dateKey !== todayKey) {
          return false;
        }

        if (dose.status === "Taken" || dose.status === "Missed") {
          return false;
        }

        const scheduledAt = toDoseDateTime(dose);
        return (
          scheduledAt.getTime() >= now.getTime() || dose.status === "Snoozed"
        );
      })
      .sort((left, right) => left.time.localeCompare(right.time));
  }, [clock, doses]);

  const handleDoseReminder = (dose: ScheduledDose) => {
    sendDoseReminder({
      doseId: dose.id,
      caregiverName,
    });
  };

  const handleGeneralReminder = () => {
    const sentAt = sendGeneralReminder({ caregiverName });
    setGeneralReminderSentAt(sentAt);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.xs }}>
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.lg,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          Send Reminder
        </Text>

        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {elderlyName}
        </Text>

        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatClockLabel(clock)}
        </Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          gap: theme.spacing.sm,
          paddingBottom: theme.spacing.xs,
        }}
      >
        {upcomingDoses.length === 0 ? (
          <EmptyState
            heading="No upcoming doses today"
            body="All scheduled doses for today are already completed or no longer pending."
            icon="calendar-outline"
          />
        ) : (
          upcomingDoses.map((dose) => {
            const reminderSent = Boolean(dose.lastReminderSentAt);

            return (
              <View
                key={dose.id}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.sm,
                  gap: theme.spacing.xs,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.spacing.sm,
                  }}
                >
                  <Text
                    selectable
                    numberOfLines={1}
                    style={{
                      flex: 1,
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
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {formatDoseTime(dose.time)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.spacing.sm,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.family.secondary,
                      fontSize: theme.typography.size.xs,
                      fontWeight: theme.typography.weight.medium,
                    }}
                  >
                    Slot {dose.slotLabel}
                  </Text>

                  <StatusChip status={dose.status} />
                </View>

                {reminderSent ? (
                  <Text
                    selectable
                    style={{
                      color: theme.colors.primary,
                      fontFamily: theme.typography.family.secondary,
                      fontSize: theme.typography.size.xs,
                      fontWeight: theme.typography.weight.semibold,
                    }}
                  >
                    Reminder sent ✓{" "}
                    {formatReminderSentLabel(dose.lastReminderSentAt)}
                  </Text>
                ) : (
                  <Button
                    label="Send Reminder"
                    onPress={() => handleDoseReminder(dose)}
                    variant="secondary"
                    size="sm"
                  />
                )}
              </View>
            );
          })
        )}

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: theme.spacing.sm,
            gap: theme.spacing.xs,
          }}
        >
          <Button
            label="Send General Reminder"
            onPress={handleGeneralReminder}
            variant="primary"
          />

          {generalReminderSentAt ? (
            <Text
              selectable
              style={{
                color: theme.colors.primary,
                fontFamily: theme.typography.family.secondary,
                fontSize: theme.typography.size.xs,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              General reminder sent ✓{" "}
              {formatReminderSentLabel(generalReminderSentAt)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
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
  const date = fromDateKey(dose.dateKey);
  const [hours, minutes] = dose.time
    .split(":")
    .map((entry) => Number.parseInt(entry, 10));

  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatClockLabel(value: Date) {
  return value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDoseTime(value: string) {
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

function formatReminderSentLabel(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
