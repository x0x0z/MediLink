import React from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StepProgressIndicator } from "@/components/step-progress-indicator";

import { useAppTheme } from "@/src/theme/theme-provider";

type OnboardingStepShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionDisabled?: boolean;
  postAction?: React.ReactNode;
  children: React.ReactNode;
};

export function OnboardingStepShell({
  step,
  totalSteps,
  title,
  description,
  onBack,
  backLabel = "Back",
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  postAction,
  children,
}: OnboardingStepShellProps) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {onBack ? (
            <Button
              label={backLabel}
              onPress={onBack}
              variant="ghost"
              size="sm"
            />
          ) : (
            <View />
          )}
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Step {step} of {totalSteps}
          </Text>
        </View>

        <StepProgressIndicator currentStep={step} totalSteps={totalSteps} />

        <View style={{ gap: theme.spacing.xs }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.xl,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {title}
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
            {description}
          </Text>
        </View>
      </View>

      <Card
        padding="lg"
        style={{ gap: theme.spacing.md, flex: 1, minHeight: "70%" }}
      >
        {children}

        <Button
          label={primaryActionLabel}
          disabled={primaryActionDisabled}
          onPress={onPrimaryAction}
          size="md"
          variant="primary"
          style={{ marginTop: theme.spacing.md }}
        />
        {postAction ? (
          <View style={{ marginTop: theme.spacing.md }}>{postAction}</View>
        ) : null}
      </Card>
    </ScrollView>
  );
}
