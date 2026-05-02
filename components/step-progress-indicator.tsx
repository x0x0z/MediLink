import React from "react";
import { Text, View } from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";

type StepProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  showNumbers?: boolean;
};

export function StepProgressIndicator({
  currentStep,
  totalSteps,
  showNumbers = false,
}: StepProgressIndicatorProps) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <View
            key={`step-dot-${stepNumber}`}
            style={{
              flex: 1,
              minHeight: 6,
              borderRadius: 999,
              borderWidth: isCurrent ? 1 : 0,
              borderColor: theme.colors.primary,
              backgroundColor:
                isComplete || isCurrent
                  ? theme.colors.primary
                  : theme.colors.border,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: showNumbers ? 4 : 0,
            }}
          >
            {showNumbers ? (
              <Text
                selectable
                style={{
                  color:
                    isComplete || isCurrent
                      ? theme.colors.surfaceRaised
                      : theme.colors.textSecondary,
                  fontFamily: theme.typography.family.primary,
                  fontSize: theme.typography.size.xs,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {stepNumber}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
