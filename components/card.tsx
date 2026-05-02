import React from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";
import GlassPanel from "@/components/glass-panel";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: React.ReactNode;
  title?: string;
  bordered?: boolean;
  elevated?: boolean;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export function Card({
  children,
  title,
  bordered = true,
  elevated = false,
  padding = "md",
  style,
  titleStyle,
}: CardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        {
          borderRadius: theme.radius.md,
          overflow: "hidden",
          alignSelf: "stretch",
          width: "100%",
        },
        style,
      ]}
    >
      <GlassPanel
        style={{
          borderWidth: bordered ? 1 : 0,
          borderColor: theme.colors.glassBorder ?? theme.colors.border,
          borderRadius: theme.radius.md,
          padding: resolvePadding(padding, theme.spacing),
          gap: theme.spacing.sm,
        }}
        stops={
          theme.mode === "dark"
            ? [theme.colors.glassTint, "transparent"]
            : [theme.colors.glassTint, "transparent"]
        }
      >
        {title ? (
          <Text
            selectable
            style={[
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.md,
                fontWeight: theme.typography.weight.semibold,
                marginBottom: theme.spacing.xs,
              },
              titleStyle,
            ]}
          >
            {title}
          </Text>
        ) : null}
        {children}
      </GlassPanel>
    </View>
  );
}

function resolvePadding(
  value: CardPadding,
  spacing: { sm: number; md: number; lg: number }
) {
  if (value === "none") {
    return 0;
  }

  if (value === "sm") {
    return spacing.sm;
  }

  if (value === "lg") {
    return spacing.lg;
  }

  return spacing.md;
}
