import Svg, { Circle, Polyline } from "react-native-svg";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { StatusChip } from "@/components/status-chip";
import GlassPanel from "@/components/glass-panel";

import { useScheduledDoses } from "@/src/prescription-flow/prescription-store";
import type { DoseStatus, ScheduledDose } from "@/src/prescription-flow/types";
import { useAppTheme } from "@/src/theme/theme-provider";

type LogsTab = "compliance" | "vitals";
type ComplianceView = "daily" | "weekly";
type VitalsView = "connected" | "empty";

type ConnectedDevice = {
  id: string;
  name: string;
  lastReading: string;
  measuredAt: string;
  points: number[];
};

const CONNECTED_DEVICE_CARDS: ConnectedDevice[] = [
  {
    id: "watch",
    name: "Apple Watch",
    lastReading: "72 bpm",
    measuredAt: "8m ago",
    points: [63, 66, 67, 71, 70, 74, 72],
  },
  {
    id: "bp",
    name: "Blood Pressure Monitor",
    lastReading: "118/76 mmHg",
    measuredAt: "1h ago",
    points: [120, 122, 118, 117, 121, 119, 118],
  },
  {
    id: "glucose",
    name: "Glucose Meter",
    lastReading: "108 mg/dL",
    measuredAt: "3h ago",
    points: [104, 101, 106, 109, 111, 107, 108],
  },
];

export default function LogsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const doses = useScheduledDoses();
  const [activeTab, setActiveTab] = useState<LogsTab>("compliance");
  const [complianceView, setComplianceView] = useState<ComplianceView>("daily");
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );
  const [selectedDose, setSelectedDose] = useState<ScheduledDose | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [vitalsView, setVitalsView] = useState<VitalsView>("connected");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 900);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const currentWeek = useMemo(
    () => buildCurrentWeek(selectedDateKey),
    [selectedDateKey]
  );

  const scoredDosesByDate = useMemo(() => {
    const grouped = new Map<string, ScheduledDose[]>();

    doses.forEach((dose) => {
      if (
        dose.status !== "Taken" &&
        dose.status !== "Missed" &&
        dose.status !== "Snoozed"
      ) {
        return;
      }

      const existing = grouped.get(dose.dateKey) ?? [];
      existing.push(dose);
      grouped.set(dose.dateKey, existing);
    });

    grouped.forEach((entries, key) => {
      grouped.set(
        key,
        [...entries].sort((left, right) => left.time.localeCompare(right.time))
      );
    });

    return grouped;
  }, [doses]);

  const dailyEvents = useMemo(() => {
    return scoredDosesByDate.get(selectedDateKey) ?? [];
  }, [scoredDosesByDate, selectedDateKey]);

  const weeklyEvents = useMemo(() => {
    return currentWeek.map((day) => {
      const events = scoredDosesByDate.get(day.dateKey) ?? [];

      return {
        ...day,
        events,
      };
    });
  }, [currentWeek, scoredDosesByDate]);

  const connectedDevices =
    vitalsView === "connected" ? CONNECTED_DEVICE_CARDS : [];
  const openDoseDetails = useCallback((dose: ScheduledDose) => {
    setSelectedDose(dose);
  }, []);

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
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <SegmentButton
            label="Compliance Log"
            active={activeTab === "compliance"}
            onPress={() => setActiveTab("compliance")}
          />
          <SegmentButton
            label="Vitals Log"
            active={activeTab === "vitals"}
            onPress={() => setActiveTab("vitals")}
          />
        </View>

        {activeTab === "compliance" ? (
          <>
            <Card title="Compliance view">
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <SegmentButton
                  label="Daily"
                  active={complianceView === "daily"}
                  onPress={() => setComplianceView("daily")}
                />
                <SegmentButton
                  label="Weekly"
                  active={complianceView === "weekly"}
                  onPress={() => setComplianceView("weekly")}
                />
              </View>

              {complianceView === "daily" ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: theme.spacing.sm }}
                >
                  <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
                    {currentWeek.map((day) => {
                      const isActive = day.dateKey === selectedDateKey;

                      return (
                        <Pressable
                          key={day.dateKey}
                          accessibilityRole="button"
                          onPress={() => setSelectedDateKey(day.dateKey)}
                          style={{
                            minWidth: 62,
                            borderWidth: 1,
                            borderColor: isActive
                              ? theme.colors.primary
                              : theme.colors.border,
                            borderRadius: theme.radius.md,
                            backgroundColor: isActive
                              ? theme.colors.primaryMuted
                              : theme.colors.surface,
                            alignItems: "center",
                            gap: 2,
                            paddingHorizontal: theme.spacing.xs,
                            paddingVertical: theme.spacing.xs,
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
                            {day.shortLabel}
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
                            {day.dayOfMonth}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : null}
            </Card>

            {complianceView === "daily" ? (
              <Card title="Daily dose events">
                {isInitialLoading ? (
                  <View style={{ gap: theme.spacing.sm }}>
                    <SkeletonLoader variant="list-item" />
                    <SkeletonLoader variant="list-item" />
                    <SkeletonLoader variant="list-item" />
                  </View>
                ) : dailyEvents.length === 0 ? (
                  <EmptyState
                    heading="No events for this day"
                    body="Taken, missed, and snoozed doses will appear here."
                    icon="calendar-outline"
                  />
                ) : (
                  <View style={{ gap: theme.spacing.sm }}>
                    {dailyEvents.map((dose) => {
                      return (
                        <DoseEventRow
                          key={dose.id}
                          dose={dose}
                          onPress={openDoseDetails}
                        />
                      );
                    })}
                  </View>
                )}
              </Card>
            ) : (
              <Card title="Weekly compliance grid">
                {isInitialLoading ? (
                  <View style={{ gap: theme.spacing.sm }}>
                    <SkeletonLoader variant="card" height={150} />
                    <SkeletonLoader variant="card" height={150} />
                  </View>
                ) : weeklyEvents.every((day) => day.events.length === 0) ? (
                  <EmptyState
                    heading="No weekly compliance events"
                    body="Complete doses to populate this grid."
                    icon="stats-chart-outline"
                  />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View
                      style={{ flexDirection: "row", gap: theme.spacing.sm }}
                    >
                      {weeklyEvents.map((day) => (
                        <View
                          key={day.dateKey}
                          style={{
                            width: 112,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.md,
                            backgroundColor: theme.colors.surface,
                            padding: theme.spacing.sm,
                            gap: theme.spacing.xs,
                          }}
                        >
                          <Text
                            selectable
                            style={{
                              color: theme.colors.textPrimary,
                              fontFamily: theme.typography.family.primary,
                              fontSize: theme.typography.size.sm,
                              fontWeight: theme.typography.weight.semibold,
                            }}
                          >
                            {day.shortLabel}
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
                            {day.dayOfMonth}
                          </Text>

                          <View
                            style={{
                              minHeight: 86,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              borderRadius: theme.radius.sm,
                              backgroundColor: theme.colors.surfaceRaised,
                              padding: theme.spacing.xs,
                              flexDirection: "row",
                              flexWrap: "wrap",
                              alignContent: "flex-start",
                              gap: theme.spacing.xs,
                            }}
                          >
                            {day.events.length === 0 ? (
                              <Text
                                selectable
                                style={{
                                  color: theme.colors.textSecondary,
                                  fontFamily: theme.typography.family.secondary,
                                  fontSize: theme.typography.size.xs,
                                  fontWeight: theme.typography.weight.regular,
                                }}
                              >
                                --
                              </Text>
                            ) : (
                              day.events.map((event) => (
                                <Pressable
                                  key={event.id}
                                  accessibilityRole="button"
                                  onPress={() => openDoseDetails(event)}
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 999,
                                    backgroundColor: statusDotColor(
                                      event.status,
                                      theme.colors
                                    ),
                                  }}
                                />
                              ))
                            )}
                          </View>

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
                            {day.events.length} doses
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    gap: theme.spacing.sm,
                    flexWrap: "wrap",
                    marginTop: theme.spacing.md,
                  }}
                >
                  <LegendDot color={theme.colors.success} label="Taken" />
                  <LegendDot color={theme.colors.alert} label="Missed" />
                  <LegendDot color={theme.colors.warning} label="Snoozed" />
                </View>
              </Card>
            )}
          </>
        ) : (
          <>
            <Card title="Vitals source">
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <SegmentButton
                  label="Connected Devices"
                  active={vitalsView === "connected"}
                  onPress={() => setVitalsView("connected")}
                />
                <SegmentButton
                  label="No Device Connected"
                  active={vitalsView === "empty"}
                  onPress={() => setVitalsView("empty")}
                />
              </View>
            </Card>

            <Card title="Vitals log">
              {isInitialLoading ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <SkeletonLoader variant="card" height={108} />
                  <SkeletonLoader variant="card" height={108} />
                  <SkeletonLoader variant="card" height={108} />
                </View>
              ) : connectedDevices.length === 0 ? (
                <EmptyState
                  heading="No device connected"
                  body="Connect a wearable or monitor to track health readings in this log."
                  icon="watch-outline"
                  ctaLabel="Connect a Device"
                  onCtaPress={() => {}}
                />
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {connectedDevices.map((device) => (
                    <ConnectedDeviceCard key={device.id} device={device} />
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>

      <DoseDetailModal
        dose={selectedDose}
        onClose={() => setSelectedDose(null)}
        onOpenRecordings={() => {
          setSelectedDose(null);
          router.push("/recordings");
        }}
      />
    </View>
  );
}

type SegmentButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

type DoseEventRowProps = {
  dose: ScheduledDose;
  onPress: (dose: ScheduledDose) => void;
};

const DoseEventRow = React.memo(function DoseEventRow({
  dose,
  onPress,
}: DoseEventRowProps) {
  const { theme } = useAppTheme();
  const caregiverAttribution = getCaregiverAttribution(dose);
  const reminderAnnotation = getManualReminderAnnotation(dose);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(dose)}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
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
          {formatDisplayTime(dose.time)}
        </Text>
      </View>

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
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.regular,
          }}
        >
          Slot {dose.slotLabel}
        </Text>

        <StatusChip status={dose.status} />
      </View>

      {caregiverAttribution ? (
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          Caregiver: {caregiverAttribution}
        </Text>
      ) : null}

      {reminderAnnotation ? (
        <Text
          selectable
          style={{
            color: theme.colors.primary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          {reminderAnnotation}
        </Text>
      ) : null}
    </Pressable>
  );
});

type ConnectedDeviceCardProps = {
  device: ConnectedDevice;
};

const ConnectedDeviceCard = React.memo(function ConnectedDeviceCard({
  device,
}: ConnectedDeviceCardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
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
            {device.name}
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
            Last reading: {device.measuredAt}
          </Text>
        </View>

        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            fontVariant: ["tabular-nums"],
          }}
        >
          {device.lastReading}
        </Text>
      </View>

      <Sparkline points={device.points} />
    </View>
  );
});

function SegmentButton({ label, active, onPress }: SegmentButtonProps) {
  return (
    <Button
      label={label}
      onPress={onPress}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      fullWidth
      textStyle={{ fontSize: 12 }}
    />
  );
}

type LegendDotProps = {
  color: string;
  label: string;
};

function LegendDot({ color, label }: LegendDotProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
      <Text
        selectable
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.family.secondary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

type SparklineProps = {
  points: number[];
};

function Sparkline({ points }: SparklineProps) {
  const { theme } = useAppTheme();
  const width = 124;
  const height = 42;
  const padding = 4;

  if (points.length === 0) {
    return null;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index * (width - padding * 2)) / Math.max(1, points.length - 1);
    const y =
      height - padding - ((point - min) / range) * (height - padding * 2);

    return `${x},${y}`;
  });

  const lastCoordinate = coordinates[coordinates.length - 1]
    ?.split(",")
    .map(Number) ?? [0, 0];

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceRaised,
        padding: theme.spacing.xs,
      }}
    >
      <Svg width={width} height={height}>
        <Polyline
          points={coordinates.join(" ")}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle
          cx={lastCoordinate[0] ?? 0}
          cy={lastCoordinate[1] ?? 0}
          r={3}
          fill={theme.colors.primary}
        />
      </Svg>
    </View>
  );
}

type DoseDetailModalProps = {
  dose: ScheduledDose | null;
  onClose: () => void;
  onOpenRecordings: () => void;
};

function DoseDetailModal({
  dose,
  onClose,
  onOpenRecordings,
}: DoseDetailModalProps) {
  const { theme } = useAppTheme();

  if (!dose) {
    return null;
  }

  const notes = buildDoseNotes(dose);
  const caregiverAttribution =
    getCaregiverAttribution(dose) ?? "No remote caregiver action";

  return (
    <Modal animationType="slide" transparent visible>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <GlassPanel
          intensity={80}
          style={{ position: "absolute", inset: 0 }}
          stops={
            theme.mode === "dark"
              ? [theme.colors.glassTint, "transparent"]
              : [theme.colors.glassTint, "transparent"]
          }
        >
          {null}
        </GlassPanel>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={{ flex: 1, backgroundColor: theme.colors.overlay }}
        />
        <View
          style={{
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceRaised,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Dose detail
          </Text>

          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.primaryMuted,
              height: 140,
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.xs,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.primary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weight.bold,
              }}
            >
              ▶
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.family.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              Dispensing video thumbnail
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <DetailRow label="Medication" value={dose.medicationName} />
            <DetailRow label="Status" value={dose.status} />
            <DetailRow label="Timestamp" value={formatDoseTimestamp(dose)} />
            <DetailRow label="Caregiver" value={caregiverAttribution} />
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.sm,
              gap: 2,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              Caregiver notes
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.family.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.regular,
                lineHeight: 20,
              }}
            >
              {notes}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenRecordings}
              style={{
                flex: 1,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primaryMuted,
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.typography.family.primary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                View Recordings
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{
                flex: 1,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.textInverse,
                  fontFamily: theme.typography.family.primary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  const { theme } = useAppTheme();

  return (
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
        style={{
          color: theme.colors.textSecondary,
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
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
          textAlign: "right",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function statusDotColor(
  status: DoseStatus,
  colors: { success: string; alert: string; warning: string }
) {
  if (status === "Taken") {
    return colors.success;
  }

  if (status === "Missed") {
    return colors.alert;
  }

  return colors.warning;
}

function getCaregiverAttribution(dose: ScheduledDose) {
  if (dose.source === "proposal-approved") {
    return "Primary caregiver";
  }

  if (dose.source === "manual") {
    return "Remote caregiver";
  }

  return null;
}

function getManualReminderAnnotation(dose: ScheduledDose) {
  if (!dose.lastReminderSentAt) {
    return null;
  }

  const actor = dose.lastReminderSentBy ?? "caregiver";
  return `Reminder sent ✓ ${actor} at ${formatReminderTime(
    dose.lastReminderSentAt
  )}`;
}

function formatReminderTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown time";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildDoseNotes(dose: ScheduledDose) {
  if (dose.status === "Missed") {
    return "Dose window elapsed before confirmation. Follow-up reminder sent to caregiver channel.";
  }

  if (dose.status === "Snoozed") {
    return "Dose was snoozed to avoid overlap with mealtime. Reminder will re-trigger at next interval.";
  }

  if (dose.source === "manual") {
    return "Remote caregiver confirmed the dose after reviewing the dispensing clip.";
  }

  if (dose.source === "proposal-approved") {
    return "Dose time adjustment was approved and logged by the primary caregiver.";
  }

  return "Automated dispenser event captured with no caregiver override.";
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

function buildCurrentWeek(selectedDateKey: string) {
  const selectedDate = fromDateKey(selectedDateKey);
  const dayOfWeek = selectedDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);

    return {
      dateKey: toDateKey(day),
      shortLabel: day.toLocaleDateString([], { weekday: "short" }),
      dayOfMonth: `${day.getDate()}`,
    };
  });
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

function formatDoseTimestamp(dose: ScheduledDose) {
  const date = fromDateKey(dose.dateKey);
  const [hours, minutes] = dose.time
    .split(":")
    .map((entry) => Number.parseInt(entry, 10));

  date.setHours(hours || 0, minutes || 0, 0, 0);

  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
