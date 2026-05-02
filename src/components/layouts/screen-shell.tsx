import React from "react";
import { ScrollView, Text } from "react-native";

import { Card } from "@/components/card";

import { useAppTheme } from "@/src/theme/theme-provider";

type ScreenShellProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function ScreenShell({
  title,
  description,
  children,
}: ScreenShellProps) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
        backgroundColor: theme.colors.background,
      }}
    >
      <Card padding="lg" style={{ gap: theme.spacing.sm }}>
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
      </Card>
      {children}
    </ScrollView>
  );
}
