import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <OnboardingStepShell
      step={1}
      totalSteps={TOTAL_STEPS}
      title="Welcome to Medi"
      description="Let's set up your account, pair your dispenser, and invite caregivers in a few guided steps."
      primaryActionLabel="Begin Setup"
      onPrimaryAction={() => router.push("/onboarding/account-type")}
    >
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
          Calm onboarding, built for clarity.
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.regular,
            lineHeight: 24,
          }}
        >
          We will collect basic profile information, scan your device QR code,
          and add caregiver contacts.
        </Text>
      </View>
    </OnboardingStepShell>
  );
}
