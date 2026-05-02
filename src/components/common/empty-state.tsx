import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import GlassPanel from "@/components/glass-panel";
import { Button } from "@/components/button";
import { useAppTheme } from "@/src/theme/theme-provider";

type EmptyStateProps = {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  heading: string;
  body: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  icon = "information-circle-outline",
  heading,
  body,
  ctaLabel,
  onCtaPress,
  style,
}: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <GlassPanel
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.glassBorder ?? theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        style as any,
      ]}
      stops={
        theme.mode === "dark"
          ? [theme.colors.glassTint, "transparent"]
          : [theme.colors.glassTint, "transparent"]
      }
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
            flex: 1,
          }}
        >
          {heading}
        </Text>
      </View>

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
        {body}
      </Text>

      {ctaLabel && onCtaPress ? (
        <Button
          label={ctaLabel}
          onPress={onCtaPress}
          variant="ghost"
          size="sm"
        />
      ) : null}
    </GlassPanel>
  );
}
