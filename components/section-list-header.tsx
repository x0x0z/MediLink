import React from "react";
import { Text, View } from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";

type SectionListHeaderProps = {
  label: string;
  subtitle?: string;
};

export function SectionListHeader({ label, subtitle }: SectionListHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 2 }}>
      <Text
        selectable
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        }}
      >
        {label}
      </Text>

      {subtitle ? (
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.regular,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
