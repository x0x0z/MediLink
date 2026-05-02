import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";

import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import { useScheduledMedications } from "@/src/prescription-flow/prescription-store";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 7;

export default function ScheduleReviewScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const medications = useScheduledMedications();

  return (
    <OnboardingStepShell
      step={7}
      totalSteps={TOTAL_STEPS}
      title="Schedule Review"
      description="Review loaded medications and continue to the full schedule tab."
      onBack={() => router.back()}
      primaryActionLabel="Go To Schedule"
      onPrimaryAction={() => router.replace("/(tabs)/schedule")}
    >
      <View
        style={{
          gap: theme.spacing.sm,
          paddingBottom: theme.spacing.xxl + theme.spacing.lg,
        }}
      >
        {medications.length === 0 ? (
          <EmptyState
            heading="No medications assigned yet"
            body="Complete the slot assignment step to populate this summary."
            icon="medkit-outline"
          />
        ) : (
          medications.slice(0, 4).map((medication) => (
            <Card
              key={medication.id}
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                gap: theme.spacing.xs,
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
                {medication.name}
              </Text>
              <Text
                selectable
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.family.secondary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.regular,
                }}
              >
                {medication.dosage} • {medication.frequency} • Slot{" "}
                {medication.slotLabel}
              </Text>
            </Card>
          ))
        )}
      </View>
    </OnboardingStepShell>
  );
}
