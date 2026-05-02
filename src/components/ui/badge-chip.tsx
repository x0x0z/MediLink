import React from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

type ChipVariant = "green" | "red" | "amber" | "teal" | "gray";
type ChipSize = "sm" | "md";

type BadgeChipProps = {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftAdornment?: React.ReactNode;
};

type ChipPalette = {
  text: string;
  border: string;
  background: string;
};

export function BadgeChip({
  label,
  variant = "gray",
  size = "sm",
  style,
  textStyle,
  leftAdornment,
}: BadgeChipProps) {
  const { theme } = useAppTheme();
  const palette = resolveChipPalette(variant, theme.colors, theme.mode);
  const dimensions =
    size === "md"
      ? { px: theme.spacing.sm, py: 6, fontSize: theme.typography.size.sm }
      : { px: theme.spacing.xs, py: 3, fontSize: theme.typography.size.xs };

  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.background,
          borderRadius: 999,
          paddingHorizontal: dimensions.px,
          paddingVertical: dimensions.py,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xxs,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {leftAdornment}
      <Text
        selectable
        style={[
          {
            color: palette.text,
            fontFamily: theme.typography.family.primary,
            fontSize: dimensions.fontSize,
            fontWeight: theme.typography.weight.semibold,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function resolveChipPalette(
  variant: ChipVariant,
  colors: {
    textSecondary: string;
    alert: string;
    success: string;
    warning: string;
    info: string;
  },
  mode: "light" | "dark"
): ChipPalette {
  if (variant === "green") {
    return buildTone(colors.success, mode);
  }

  if (variant === "red") {
    return buildTone(colors.alert, mode);
  }

  if (variant === "amber") {
    return buildTone(colors.warning, mode);
  }

  if (variant === "teal") {
    return buildTone(colors.info, mode);
  }

  return mode === "dark"
    ? {
        text: colors.textSecondary,
        border: withAlpha(colors.textSecondary, 0.42),
        background: withAlpha(colors.textSecondary, 0.2),
      }
    : {
        text: colors.textSecondary,
        border: withAlpha(colors.textSecondary, 0.34),
        background: withAlpha(colors.textSecondary, 0.12),
      };
}

function buildTone(color: string, mode: "light" | "dark"): ChipPalette {
  return mode === "dark"
    ? {
        text: color,
        border: withAlpha(color, 0.48),
        background: withAlpha(color, 0.2),
      }
    : {
        text: color,
        border: withAlpha(color, 0.34),
        background: withAlpha(color, 0.12),
      };
}
