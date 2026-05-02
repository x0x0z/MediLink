import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { BadgeChip } from "@/components/badge-chip";
import { Button } from "@/components/button";
import { Card } from "@/components/card";

import {
  formatRecordingDate,
  formatRecordingTime,
  getRecordingById,
} from "@/src/recordings/recording-library";
import { useAppTheme } from "@/src/theme/theme-provider";

export default function RecordingDetailScreen() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ recordingId?: string }>();

  const recording = useMemo(() => {
    if (!params.recordingId) {
      return null;
    }

    return getRecordingById(params.recordingId);
  }, [params.recordingId]);

  const [isReviewed, setIsReviewed] = useState(recording?.reviewed ?? false);

  if (!recording) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.lg,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          Recording not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen
        options={{
          title: `Recording ${formatRecordingTime(recording.capturedAt)}`,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: { color: theme.colors.textPrimary },
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <View
          style={{
            minHeight: 280,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.xs,
          }}
        >
          <View
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={28} color={theme.colors.primary} />
          </View>
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Video player placeholder
          </Text>
        </View>

        <Card style={{ gap: theme.spacing.sm }}>
          <DetailRow label="Medication" value={recording.medicationName} />
          <DetailRow
            label="Time"
            value={`${formatRecordingDate(
              recording.capturedAt
            )} · ${formatRecordingTime(recording.capturedAt)}`}
          />
          <DetailRow label="Dose slot" value={recording.slotLabel} />
          <DetailRow label="Dose event" value={recording.doseEventLabel} />
          <DetailRow label="Caregiver" value={recording.caregiverName} />
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
              Review status
            </Text>
            <BadgeChip
              label={isReviewed ? "Reviewed" : "Pending review"}
              variant={isReviewed ? "green" : "amber"}
            />
          </View>

          <Button
            label={isReviewed ? "Marked as Reviewed" : "Mark as Reviewed"}
            onPress={() => setIsReviewed(true)}
            disabled={isReviewed}
            variant={isReviewed ? "ghost" : "primary"}
          />
        </Card>

        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.regular,
            lineHeight: 18,
          }}
        >
          Retention: Recording is kept for {recording.retentionDays} days from
          capture before automatic deletion.
        </Text>
      </ScrollView>
    </View>
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
